-- Run once in Supabase → SQL Editor (SurfStar)
-- Team Academy access requests (approval-only plan)

create table if not exists public.organization_plan_requests (
  id uuid primary key default gen_random_uuid(),
  contact_name text not null,
  email text not null,
  organization_name text not null,
  coaches_count int,
  message text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  notes text
);

create index if not exists organization_plan_requests_status_idx
  on public.organization_plan_requests (status, created_at desc);

alter table public.organization_plan_requests enable row level security;

-- Anyone can submit (including anonymous via anon key if enabled); no public read
create or replace function public.submit_organization_plan_request(
  p_contact_name text,
  p_email text,
  p_organization_name text,
  p_coaches_count int default null,
  p_message text default null
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

  if exists (
    select 1
    from public.organization_plan_requests
    where lower(email) = v_email
      and status = 'pending'
      and created_at > now() - interval '7 days'
  ) then
    return jsonb_build_object('ok', false, 'error', 'A pending request already exists for this email.');
  end if;

  insert into public.organization_plan_requests (
    contact_name,
    email,
    organization_name,
    coaches_count,
    message
  )
  values (
    v_name,
    v_email,
    v_org,
    nullif(p_coaches_count, 0),
    nullif(trim(p_message), '')
  );

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.submit_organization_plan_request(text, text, text, int, text) to anon, authenticated;

-- After approval: activate org subscription manually, e.g.
-- select public.activate_organization_subscription_demo('organization', 'School Name');
