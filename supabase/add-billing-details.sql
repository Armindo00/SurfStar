-- Run once in Supabase → SQL Editor (SurfStar)
-- Billing details for invoicing: NIF + address on payment requests and coach profiles

alter table public.profiles
  add column if not exists tax_id text,
  add column if not exists billing_address text;

alter table public.organization_plan_requests
  add column if not exists tax_id text,
  add column if not exists billing_address text;

-- Replace submit RPC (adds tax_id + billing_address)
drop function if exists public.submit_organization_plan_request(text, text, text, int, text, text, text);

create or replace function public.submit_organization_plan_request(
  p_contact_name text,
  p_email text,
  p_organization_name text,
  p_coaches_count int default null,
  p_message text default null,
  p_plan_id text default 'organization',
  p_billing_interval text default 'monthly',
  p_tax_id text default null,
  p_billing_address text default null
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
  v_tax_id text := regexp_replace(coalesce(trim(p_tax_id), ''), '\s+', '', 'g');
  v_address text := trim(p_billing_address);
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

  if v_tax_id is null or length(v_tax_id) < 9 then
    return jsonb_build_object('ok', false, 'error', 'Enter a valid NIF (tax ID).');
  end if;

  if v_address is null or length(v_address) < 10 then
    return jsonb_build_object('ok', false, 'error', 'Enter your billing address.');
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
    billing_interval,
    tax_id,
    billing_address
  )
  values (
    v_name,
    v_email,
    v_org,
    nullif(p_coaches_count, 0),
    nullif(trim(p_message), ''),
    v_plan,
    v_interval,
    v_tax_id,
    v_address
  );

  -- Sync billing details onto coach profile when already registered
  update public.profiles
  set
    tax_id = v_tax_id,
    billing_address = v_address
  where lower(email) = v_email and role = 'treinador';

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.submit_organization_plan_request(text, text, text, int, text, text, text, text, text) to anon, authenticated;

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
      'tax_id', v_row.tax_id,
      'billing_address', v_row.billing_address,
      'created_at', v_row.created_at,
      'reviewed_at', v_row.reviewed_at,
      'notes', v_row.notes,
      'paid_at', v_row.paid_at,
      'activated_at', v_row.activated_at
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
          'tax_id', r.tax_id,
          'billing_address', r.billing_address,
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
