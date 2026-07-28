-- Run once in Supabase → SQL Editor
-- Admin billing management: store billing cycle on subscriptions + renewal tools

alter table public.coach_subscriptions
  add column if not exists billing_interval text not null default 'monthly';

alter table public.organization_subscriptions
  add column if not exists billing_interval text not null default 'monthly';

alter table public.coach_subscriptions
  drop constraint if exists coach_subscriptions_billing_interval_check;

alter table public.coach_subscriptions
  add constraint coach_subscriptions_billing_interval_check
  check (billing_interval in ('monthly', 'annual'));

alter table public.organization_subscriptions
  drop constraint if exists organization_subscriptions_billing_interval_check;

alter table public.organization_subscriptions
  add constraint organization_subscriptions_billing_interval_check
  check (billing_interval in ('monthly', 'annual'));

-- Backfill billing interval from latest activated payment request
update public.coach_subscriptions cs
set billing_interval = coalesce(lr.billing_interval, cs.billing_interval)
from public.profiles p
left join lateral (
  select r.billing_interval
  from public.organization_plan_requests r
  where lower(r.email) = lower(p.email)
    and r.activated_at is not null
  order by r.activated_at desc
  limit 1
) lr on true
where cs.coach_id = p.id
  and lr.billing_interval is not null;

update public.organization_subscriptions os
set billing_interval = coalesce(lr.billing_interval, os.billing_interval)
from public.organization_members om
join public.profiles p on p.id = om.profile_id
left join lateral (
  select r.billing_interval
  from public.organization_plan_requests r
  where lower(r.email) = lower(p.email)
    and r.activated_at is not null
  order by r.activated_at desc
  limit 1
) lr on true
where os.organization_id = om.organization_id
  and om.role = 'owner'
  and om.status = 'active'
  and lr.billing_interval is not null;

create or replace function public.admin_activate_coach_plan(
  p_coach_id uuid,
  p_org_name text,
  p_plan_id text default 'organization',
  p_billing_interval text default 'monthly'
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
  v_interval text := coalesce(nullif(trim(p_billing_interval), ''), 'monthly');
  v_period_end timestamptz;
begin
  perform public.admin_require_platform_admin();

  if p_plan_id not in ('team', 'club', 'organization') then
    return jsonb_build_object('ok', false, 'error', 'Invalid plan.');
  end if;

  if v_interval not in ('monthly', 'annual') then
    return jsonb_build_object('ok', false, 'error', 'Invalid billing interval.');
  end if;

  v_period_end := case
    when v_interval = 'annual' then now() + interval '1 year'
    else now() + interval '1 month'
  end;

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

  insert into public.organization_subscriptions (
    organization_id, plan_id, status, billing_interval, current_period_end, updated_at
  )
  values (v_org_id, p_plan_id, 'active', v_interval, v_period_end, now())
  on conflict (organization_id) do update set
    plan_id = excluded.plan_id,
    status = 'active',
    billing_interval = excluded.billing_interval,
    current_period_end = excluded.current_period_end,
    updated_at = now();

  insert into public.coach_subscriptions (
    coach_id, plan_id, status, billing_interval, current_period_end, updated_at
  )
  values (p_coach_id, p_plan_id, 'active', v_interval, v_period_end, now())
  on conflict (coach_id) do update set
    plan_id = excluded.plan_id,
    status = 'active',
    billing_interval = excluded.billing_interval,
    current_period_end = excluded.current_period_end,
    updated_at = now();

  return jsonb_build_object(
    'ok', true,
    'coach_id', p_coach_id,
    'organization_id', v_org_id,
    'plan_id', p_plan_id,
    'billing_interval', v_interval,
    'current_period_end', v_period_end
  );
end;
$$;

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
      select count(*)::int from public.organization_plan_requests
      where status = 'pending' and activated_at is null
    ),
    'awaiting_payment', (
      select count(*)::int from public.organization_plan_requests
      where status = 'approved' and payment_status = 'unpaid' and activated_at is null
    ),
    'blocked_accounts', (
      select count(*)::int from public.profiles where blocked = true
    ),
    'active_subscriptions', (
      select count(*)::int
      from public.coach_subscriptions
      where status in ('active', 'trialing')
    ),
    'renewals_due_7d', (
      select count(*)::int
      from public.coach_subscriptions
      where status in ('active', 'trialing')
        and current_period_end is not null
        and current_period_end <= now() + interval '7 days'
        and current_period_end >= now()
    ),
    'renewals_overdue', (
      select count(*)::int
      from public.coach_subscriptions
      where status in ('active', 'trialing')
        and current_period_end is not null
        and current_period_end < now()
    ),
    'monthly_subscribers', (
      select count(*)::int
      from public.coach_subscriptions
      where status in ('active', 'trialing') and billing_interval = 'monthly'
    ),
    'annual_subscribers', (
      select count(*)::int
      from public.coach_subscriptions
      where status in ('active', 'trialing') and billing_interval = 'annual'
    )
  );
end;
$$;

create or replace function public.admin_list_billing_subscriptions(
  p_filter text default 'all',
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
    'subscriptions', (
      select coalesce(jsonb_agg(row order by row->>'current_period_end' asc nulls last), '[]'::jsonb)
      from (
        select jsonb_build_object(
          'coach_id', p.id,
          'name', p.name,
          'email', p.email,
          'tax_id', p.tax_id,
          'organization_name', o.name,
          'organization_id', o.id,
          'plan_id', coalesce(os.plan_id, cs.plan_id),
          'plan_status', coalesce(os.status, cs.status),
          'billing_interval', coalesce(os.billing_interval, cs.billing_interval, 'monthly'),
          'current_period_end', coalesce(os.current_period_end, cs.current_period_end),
          'blocked', p.blocked
        ) as row
        from public.profiles p
        left join public.organization_members om
          on om.profile_id = p.id and om.role = 'owner' and om.status = 'active'
        left join public.organizations o on o.id = om.organization_id
        left join public.organization_subscriptions os on os.organization_id = o.id
        left join public.coach_subscriptions cs on cs.coach_id = p.id
        where p.role = 'treinador'
          and not p.is_platform_admin
          and coalesce(os.status, cs.status) in ('active', 'trialing')
          and (
            p_filter = 'all'
            or (p_filter = 'monthly' and coalesce(os.billing_interval, cs.billing_interval) = 'monthly')
            or (p_filter = 'annual' and coalesce(os.billing_interval, cs.billing_interval) = 'annual')
            or (
              p_filter = 'due_7d'
              and coalesce(os.current_period_end, cs.current_period_end) is not null
              and coalesce(os.current_period_end, cs.current_period_end) <= now() + interval '7 days'
              and coalesce(os.current_period_end, cs.current_period_end) >= now()
            )
            or (
              p_filter = 'due_30d'
              and coalesce(os.current_period_end, cs.current_period_end) is not null
              and coalesce(os.current_period_end, cs.current_period_end) <= now() + interval '30 days'
              and coalesce(os.current_period_end, cs.current_period_end) >= now()
            )
            or (
              p_filter = 'overdue'
              and coalesce(os.current_period_end, cs.current_period_end) is not null
              and coalesce(os.current_period_end, cs.current_period_end) < now()
            )
          )
        order by coalesce(os.current_period_end, cs.current_period_end) asc nulls last
        limit greatest(1, least(coalesce(p_limit, 100), 200))
      ) sub
    )
  );
end;
$$;

create or replace function public.admin_confirm_subscription_renewal(
  p_coach_id uuid,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_interval text;
  v_org_id uuid;
  v_current timestamptz;
  v_next timestamptz;
  v_base timestamptz;
begin
  perform public.admin_require_platform_admin();

  select cs.billing_interval, cs.current_period_end
  into v_interval, v_current
  from public.coach_subscriptions cs
  where cs.coach_id = p_coach_id;

  if v_interval is null then
    return jsonb_build_object('ok', false, 'error', 'No active subscription found.');
  end if;

  select om.organization_id into v_org_id
  from public.organization_members om
  where om.profile_id = p_coach_id and om.status = 'active' and om.role = 'owner'
  limit 1;

  v_base := greatest(coalesce(v_current, now()), now());
  v_next := case
    when v_interval = 'annual' then v_base + interval '1 year'
    else v_base + interval '1 month'
  end;

  update public.coach_subscriptions
  set
    status = 'active',
    current_period_end = v_next,
    updated_at = now()
  where coach_id = p_coach_id;

  if v_org_id is not null then
    update public.organization_subscriptions
    set
      status = 'active',
      billing_interval = v_interval,
      current_period_end = v_next,
      updated_at = now()
    where organization_id = v_org_id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'coach_id', p_coach_id,
    'billing_interval', v_interval,
    'current_period_end', v_next,
    'notes', nullif(trim(p_notes), '')
  );
end;
$$;

grant execute on function public.admin_list_billing_subscriptions(text, int) to authenticated;
grant execute on function public.admin_confirm_subscription_renewal(uuid, text) to authenticated;

-- Enriched accounts list (plan cycle + renewal date + tax id)
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
          'tax_id', p.tax_id,
          'plan_id', coalesce(os.plan_id, cs.plan_id),
          'plan_status', coalesce(os.status, cs.status),
          'billing_interval', coalesce(os.billing_interval, cs.billing_interval, lr.billing_interval),
          'current_period_end', coalesce(os.current_period_end, cs.current_period_end),
          'organization_name', o.name,
          'organization_id', o.id,
          'requested_plan_id', lr.plan_id,
          'requested_billing_interval', lr.billing_interval,
          'requested_plan_status', lr.status,
          'requested_plan_payment_status', lr.payment_status,
          'requested_plan_activated_at', lr.activated_at
        ) as row
        from public.profiles p
        left join public.organization_members om
          on om.profile_id = p.id and om.status = 'active' and om.role = 'owner'
        left join public.organizations o on o.id = om.organization_id
        left join public.organization_subscriptions os on os.organization_id = o.id
        left join public.coach_subscriptions cs on cs.coach_id = p.id and p.role = 'treinador'
        left join lateral (
          select r.plan_id, r.billing_interval, r.status, r.payment_status, r.activated_at
          from public.organization_plan_requests r
          where lower(r.email) = lower(p.email)
          order by r.created_at desc
          limit 1
        ) lr on true
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
