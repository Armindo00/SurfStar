-- Run once in Supabase → SQL Editor (SurfStar)
-- Platform admin: dashboard, Team Academy requests, block/unblock accounts

alter table public.profiles
  add column if not exists is_platform_admin boolean not null default false,
  add column if not exists blocked boolean not null default false;

create index if not exists profiles_platform_admin_idx
  on public.profiles (is_platform_admin)
  where is_platform_admin = true;

insert into public.app_settings (key, value)
values ('platform_admin_emails', '["armindo.j.costa@hotmail.com"]'::jsonb)
on conflict (key) do update set value = excluded.value;

-- Promote existing profiles whose email is in the bootstrap list
update public.profiles p
set is_platform_admin = true
where lower(p.email) in (
  select lower(jsonb_array_elements_text(s.value))
  from public.app_settings s
  where s.key = 'platform_admin_emails'
);

create or replace function public.is_platform_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select pr.is_platform_admin from public.profiles pr where pr.id = auth.uid()),
    false
  );
$$;

grant execute on function public.is_platform_admin() to authenticated;

create or replace function public.sync_platform_admin_bootstrap(p_profile_id uuid default auth.uid())
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_profile_id is null then
    return;
  end if;

  update public.profiles p
  set is_platform_admin = true
  where p.id = p_profile_id
    and lower(p.email) in (
      select lower(jsonb_array_elements_text(s.value))
      from public.app_settings s
      where s.key = 'platform_admin_emails'
    );
end;
$$;

grant execute on function public.sync_platform_admin_bootstrap(uuid) to authenticated;

create or replace function public.admin_require_platform_admin()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Admin access required';
  end if;
end;
$$;

-- Activate org subscription for a coach (admin only; bypasses demo flag)
create or replace function public.admin_activate_coach_plan(
  p_coach_id uuid,
  p_org_name text,
  p_plan_id text default 'organization'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
  v_org_id uuid;
  v_name text;
  v_period_end timestamptz := now() + interval '1 month';
begin
  perform public.admin_require_platform_admin();

  if p_plan_id not in ('team', 'club', 'organization') then
    return jsonb_build_object('ok', false, 'error', 'Invalid plan.');
  end if;

  select * into v_profile from public.profiles where id = p_coach_id;
  if not found or v_profile.role <> 'treinador' then
    return jsonb_build_object('ok', false, 'error', 'Coach profile not found.');
  end if;

  select om.organization_id into v_org_id
  from public.organization_members om
  where om.profile_id = p_coach_id and om.status = 'active'
  order by om.created_at
  limit 1;

  if v_org_id is null then
    v_name := coalesce(nullif(trim(p_org_name), ''), v_profile.name || '''s Team');
    insert into public.organizations (name, created_by)
    values (v_name, p_coach_id)
    returning id into v_org_id;

    insert into public.organization_members (organization_id, profile_id, role, status, accepted_at)
    values (v_org_id, p_coach_id, 'owner', 'active', now());
  elsif nullif(trim(p_org_name), '') is not null then
    update public.organizations set name = trim(p_org_name) where id = v_org_id;
  end if;

  insert into public.organization_subscriptions (organization_id, plan_id, status, current_period_end, updated_at)
  values (v_org_id, p_plan_id, 'active', v_period_end, now())
  on conflict (organization_id) do update set
    plan_id = excluded.plan_id,
    status = 'active',
    current_period_end = excluded.current_period_end,
    updated_at = now();

  insert into public.coach_subscriptions (coach_id, plan_id, status, current_period_end, updated_at)
  values (p_coach_id, p_plan_id, 'active', v_period_end, now())
  on conflict (coach_id) do update set
    plan_id = excluded.plan_id,
    status = 'active',
    current_period_end = excluded.current_period_end,
    updated_at = now();

  return jsonb_build_object(
    'ok', true,
    'coach_id', p_coach_id,
    'organization_id', v_org_id,
    'plan_id', p_plan_id
  );
end;
$$;

grant execute on function public.admin_activate_coach_plan(uuid, text, text) to authenticated;

create or replace function public.admin_get_dashboard_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.admin_require_platform_admin();

  return jsonb_build_object(
    'ok', true,
    'coaches', (select count(*)::int from public.profiles where role = 'treinador'),
    'athletes', (select count(*)::int from public.profiles where role = 'atleta'),
    'organizations', (select count(*)::int from public.organizations),
    'pending_requests', (
      select count(*)::int from public.organization_plan_requests where status = 'pending'
    ),
    'blocked_accounts', (
      select count(*)::int from public.profiles where blocked = true
    )
  );
end;
$$;

grant execute on function public.admin_get_dashboard_stats() to authenticated;

create or replace function public.admin_list_organization_plan_requests(
  p_status text default null,
  p_limit int default 100
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.admin_require_platform_admin();

  return jsonb_build_object(
    'ok', true,
    'requests', (
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'id', r.id,
          'contact_name', r.contact_name,
          'email', r.email,
          'organization_name', r.organization_name,
          'coaches_count', r.coaches_count,
          'message', r.message,
          'status', r.status,
          'created_at', r.created_at,
          'reviewed_at', r.reviewed_at,
          'notes', r.notes,
          'coach_registered', exists (
            select 1 from public.profiles p
            where lower(p.email) = lower(r.email) and p.role = 'treinador'
          )
        )
        order by r.created_at desc
      ), '[]'::jsonb)
      from (
        select *
        from public.organization_plan_requests
        where p_status is null or status = p_status
        order by created_at desc
        limit greatest(1, least(coalesce(p_limit, 100), 200))
      ) r
    )
  );
end;
$$;

grant execute on function public.admin_list_organization_plan_requests(text, int) to authenticated;

create or replace function public.admin_review_organization_plan_request(
  p_request_id uuid,
  p_action text,
  p_notes text default null,
  p_activate_plan boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req public.organization_plan_requests%rowtype;
  v_coach_id uuid;
  v_activation jsonb;
begin
  perform public.admin_require_platform_admin();

  if p_action not in ('approve', 'reject') then
    return jsonb_build_object('ok', false, 'error', 'Invalid action.');
  end if;

  select * into v_req from public.organization_plan_requests where id = p_request_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Request not found.');
  end if;

  if v_req.status <> 'pending' then
    return jsonb_build_object('ok', false, 'error', 'Request already reviewed.');
  end if;

  update public.organization_plan_requests
  set
    status = case when p_action = 'approve' then 'approved' else 'rejected' end,
    reviewed_at = now(),
    notes = nullif(trim(p_notes), '')
  where id = p_request_id;

  if p_action = 'reject' then
    return jsonb_build_object('ok', true, 'status', 'rejected');
  end if;

  select p.id into v_coach_id
  from public.profiles p
  where lower(p.email) = lower(v_req.email) and p.role = 'treinador'
  limit 1;

  if v_coach_id is null then
    return jsonb_build_object(
      'ok', true,
      'status', 'approved',
      'activation', jsonb_build_object(
        'ok', false,
        'pending_signup', true,
        'message', 'Approved. Coach must register with this email before the plan can be activated.'
      )
    );
  end if;

  if coalesce(p_activate_plan, true) then
    v_activation := public.admin_activate_coach_plan(
      v_coach_id,
      v_req.organization_name,
      'organization'
    );
    return jsonb_build_object('ok', true, 'status', 'approved', 'activation', v_activation);
  end if;

  return jsonb_build_object('ok', true, 'status', 'approved');
end;
$$;

grant execute on function public.admin_review_organization_plan_request(uuid, text, text, boolean) to authenticated;

create or replace function public.admin_list_accounts(
  p_role text default null,
  p_search text default null,
  p_blocked_only boolean default false,
  p_limit int default 100
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_search text := nullif(lower(trim(p_search)), '');
begin
  perform public.admin_require_platform_admin();

  return jsonb_build_object(
    'ok', true,
    'accounts', (
      select coalesce(jsonb_agg(row order by row->>'created_at' desc), '[]'::jsonb)
      from (
        select jsonb_build_object(
          'profile_id', p.id,
          'name', p.name,
          'email', p.email,
          'role', p.role,
          'blocked', p.blocked,
          'is_platform_admin', p.is_platform_admin,
          'created_at', p.created_at,
          'plan_id', coalesce(os.plan_id, cs.plan_id),
          'plan_status', coalesce(os.status, cs.status),
          'organization_name', o.name,
          'organization_id', o.id
        ) as row
        from public.profiles p
        left join public.organization_members om
          on om.profile_id = p.id and om.status = 'active' and om.role = 'owner'
        left join public.organizations o on o.id = om.organization_id
        left join public.organization_subscriptions os on os.organization_id = o.id
        left join public.coach_subscriptions cs on cs.coach_id = p.id and p.role = 'treinador'
        where (p_role is null or p.role = p_role)
          and (not p_blocked_only or p.blocked = true)
          and (
            v_search is null
            or lower(p.name) like '%' || v_search || '%'
            or lower(p.email) like '%' || v_search || '%'
          )
        order by p.created_at desc
        limit greatest(1, least(coalesce(p_limit, 100), 200))
      ) sub
    )
  );
end;
$$;

grant execute on function public.admin_list_accounts(text, text, boolean, int) to authenticated;

create or replace function public.admin_set_account_blocked(
  p_profile_id uuid,
  p_blocked boolean,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
begin
  perform public.admin_require_platform_admin();

  select * into v_profile from public.profiles where id = p_profile_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Profile not found.');
  end if;

  if v_profile.is_platform_admin then
    return jsonb_build_object('ok', false, 'error', 'Cannot block a platform admin.');
  end if;

  update public.profiles
  set blocked = p_blocked
  where id = p_profile_id;

  if v_profile.role = 'atleta' and v_profile.athlete_id is not null then
    update public.athletes set blocked = p_blocked where id = v_profile.athlete_id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'profile_id', p_profile_id,
    'blocked', p_blocked,
    'reason', nullif(trim(p_reason), '')
  );
end;
$$;

grant execute on function public.admin_set_account_blocked(uuid, boolean, text) to authenticated;

-- Refresh ensure_my_profile to apply admin bootstrap on signup
create or replace function public.ensure_my_profile()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  u auth.users%rowtype;
begin
  select * into u from auth.users where id = auth.uid();
  if not found then
    return;
  end if;

  insert into public.profiles (id, role, name, email, coach_id, athlete_id)
  values (
    u.id,
    coalesce(u.raw_user_meta_data->>'role', 'treinador'),
    coalesce(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
    lower(u.email),
    nullif(u.raw_user_meta_data->>'coach_id', '')::uuid,
    nullif(u.raw_user_meta_data->>'athlete_id', '')::uuid
  )
  on conflict (id) do nothing;

  perform public.sync_platform_admin_bootstrap(auth.uid());
end;
$$;
