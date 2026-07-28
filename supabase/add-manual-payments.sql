-- Run once in Supabase → SQL Editor (SurfStar)
-- Manual payment workflow: all plans via admin approval + payment confirmation

-- Replace submit RPC (signature adds plan_id + billing_interval)
drop function if exists public.submit_organization_plan_request(text, text, text, int, text);

alter table public.organization_plan_requests
  add column if not exists plan_id text not null default 'organization',
  add column if not exists billing_interval text not null default 'monthly',
  add column if not exists payment_status text not null default 'unpaid',
  add column if not exists paid_at timestamptz,
  add column if not exists activated_at timestamptz;

alter table public.organization_plan_requests
  drop constraint if exists organization_plan_requests_plan_id_check;

alter table public.organization_plan_requests
  add constraint organization_plan_requests_plan_id_check
  check (plan_id in ('team', 'club', 'organization'));

alter table public.organization_plan_requests
  drop constraint if exists organization_plan_requests_billing_interval_check;

alter table public.organization_plan_requests
  add constraint organization_plan_requests_billing_interval_check
  check (billing_interval in ('monthly', 'annual'));

alter table public.organization_plan_requests
  drop constraint if exists organization_plan_requests_payment_status_check;

alter table public.organization_plan_requests
  add constraint organization_plan_requests_payment_status_check
  check (payment_status in ('unpaid', 'paid', 'waived'));

create index if not exists organization_plan_requests_email_status_idx
  on public.organization_plan_requests (lower(email), status, created_at desc);

-- Coach / public: submit a payment request for any plan
create or replace function public.submit_organization_plan_request(
  p_contact_name text,
  p_email text,
  p_organization_name text,
  p_coaches_count int default null,
  p_message text default null,
  p_plan_id text default 'organization',
  p_billing_interval text default 'monthly'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
  v_name text := trim(p_contact_name);
  v_org text := trim(p_organization_name);
  v_plan text := coalesce(nullif(trim(p_plan_id), ''), 'organization');
  v_interval text := coalesce(nullif(trim(p_billing_interval), ''), 'monthly');
begin
  if length(v_name) < 2 then
    return jsonb_build_object('ok', false, 'error', 'Enter your name.');
  end if;

  if v_email is null or length(v_email) < 5 or position('@' in v_email) = 0 then
    return jsonb_build_object('ok', false, 'error', 'Enter a valid email.');
  end if;

  if length(v_org) < 2 then
    return jsonb_build_object('ok', false, 'error', 'Enter your organization name.');
  end if;

  if v_plan not in ('team', 'club', 'organization') then
    return jsonb_build_object('ok', false, 'error', 'Invalid plan.');
  end if;

  if v_interval not in ('monthly', 'annual') then
    return jsonb_build_object('ok', false, 'error', 'Invalid billing interval.');
  end if;

  if exists (
    select 1
    from public.organization_plan_requests
    where lower(email) = v_email
      and status in ('pending', 'approved')
      and activated_at is null
      and created_at > now() - interval '30 days'
  ) then
    return jsonb_build_object('ok', false, 'error', 'A pending payment request already exists for this email.');
  end if;

  insert into public.organization_plan_requests (
    contact_name,
    email,
    organization_name,
    coaches_count,
    message,
    plan_id,
    billing_interval
  )
  values (
    v_name,
    v_email,
    v_org,
    nullif(p_coaches_count, 0),
    nullif(trim(p_message), ''),
    v_plan,
    v_interval
  );

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.submit_organization_plan_request(text, text, text, int, text, text, text) to anon, authenticated;

-- Logged-in coach: latest open payment request for their email
create or replace function public.fetch_coach_plan_request()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_email text;
  v_row public.organization_plan_requests%rowtype;
begin
  select lower(p.email) into v_email
  from public.profiles p
  where p.id = auth.uid() and p.role = 'treinador';

  if v_email is null then
    return jsonb_build_object('ok', false, 'error', 'Coach profile required.');
  end if;

  select * into v_row
  from public.organization_plan_requests r
  where lower(r.email) = v_email
    and r.status in ('pending', 'approved')
    and r.activated_at is null
  order by r.created_at desc
  limit 1;

  if not found then
    return jsonb_build_object('ok', true, 'request', null);
  end if;

  return jsonb_build_object(
    'ok', true,
    'request', jsonb_build_object(
      'id', v_row.id,
      'contact_name', v_row.contact_name,
      'email', v_row.email,
      'organization_name', v_row.organization_name,
      'coaches_count', v_row.coaches_count,
      'message', v_row.message,
      'status', v_row.status,
      'plan_id', v_row.plan_id,
      'billing_interval', v_row.billing_interval,
      'payment_status', v_row.payment_status,
      'created_at', v_row.created_at,
      'reviewed_at', v_row.reviewed_at,
      'notes', v_row.notes,
      'paid_at', v_row.paid_at,
      'activated_at', v_row.activated_at
    )
  );
end;
$$;

grant execute on function public.fetch_coach_plan_request() to authenticated;

-- Replace admin_activate_coach_plan (adds billing interval parameter)
drop function if exists public.admin_activate_coach_plan(uuid, text, text);

-- Admin: activate with billing interval support
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
    'plan_id', p_plan_id,
    'billing_interval', v_interval
  );
end;
$$;

grant execute on function public.admin_activate_coach_plan(uuid, text, text, text) to authenticated;

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
    )
  );
end;
$$;

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
          'plan_id', r.plan_id,
          'billing_interval', r.billing_interval,
          'payment_status', r.payment_status,
          'created_at', r.created_at,
          'reviewed_at', r.reviewed_at,
          'notes', r.notes,
          'paid_at', r.paid_at,
          'activated_at', r.activated_at,
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
        where
          case
            when p_status = 'awaiting_payment' then
              status = 'approved' and payment_status = 'unpaid' and activated_at is null
            when p_status = 'activated' then
              activated_at is not null
            when p_status is null then true
            else status = p_status and activated_at is null
          end
        order by created_at desc
        limit greatest(1, least(coalesce(p_limit, 100), 200))
      ) r
    )
  );
end;
$$;

-- Approve or reject without auto-activation (manual payment flow)
create or replace function public.admin_review_organization_plan_request(
  p_request_id uuid,
  p_action text,
  p_notes text default null,
  p_activate_plan boolean default false
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

  if not coalesce(p_activate_plan, false) then
    return jsonb_build_object(
      'ok', true,
      'status', 'approved',
      'message', 'Request approved. Send payment details to the customer, then confirm payment to activate.'
    );
  end if;

  return public.admin_activate_plan_request(p_request_id, 'paid', p_notes);
end;
$$;

-- Mark paid (or waived) and activate subscription
create or replace function public.admin_activate_plan_request(
  p_request_id uuid,
  p_payment_status text default 'paid',
  p_notes text default null
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
  v_payment text := coalesce(nullif(trim(p_payment_status), ''), 'paid');
begin
  perform public.admin_require_platform_admin();

  if v_payment not in ('paid', 'waived') then
    return jsonb_build_object('ok', false, 'error', 'Invalid payment status.');
  end if;

  select * into v_req from public.organization_plan_requests where id = p_request_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Request not found.');
  end if;

  if v_req.status = 'rejected' then
    return jsonb_build_object('ok', false, 'error', 'Cannot activate a rejected request.');
  end if;

  if v_req.activated_at is not null then
    return jsonb_build_object('ok', false, 'error', 'Request already activated.');
  end if;

  select p.id into v_coach_id
  from public.profiles p
  where lower(p.email) = lower(v_req.email) and p.role = 'treinador'
  limit 1;

  if v_coach_id is null then
    update public.organization_plan_requests
    set
      status = 'approved',
      reviewed_at = coalesce(reviewed_at, now()),
      notes = coalesce(nullif(trim(p_notes), ''), notes)
    where id = p_request_id;

    return jsonb_build_object(
      'ok', true,
      'status', 'approved',
      'activation', jsonb_build_object(
        'ok', false,
        'pending_signup', true,
        'message', 'Payment recorded. Coach must register with this email before the plan can be activated.'
      )
    );
  end if;

  v_activation := public.admin_activate_coach_plan(
    v_coach_id,
    v_req.organization_name,
    v_req.plan_id,
    v_req.billing_interval
  );

  if coalesce(v_activation->>'ok', 'false') <> 'true' then
    return jsonb_build_object('ok', false, 'error', coalesce(v_activation->>'error', 'Activation failed.'));
  end if;

  update public.organization_plan_requests
  set
    status = 'approved',
    reviewed_at = coalesce(reviewed_at, now()),
    payment_status = v_payment,
    paid_at = case when v_payment = 'paid' then now() else paid_at end,
    activated_at = now(),
    notes = coalesce(nullif(trim(p_notes), ''), notes)
  where id = p_request_id;

  return jsonb_build_object(
    'ok', true,
    'status', 'activated',
    'payment_status', v_payment,
    'activation', v_activation
  );
end;
$$;

grant execute on function public.admin_activate_plan_request(uuid, text, text) to authenticated;
