-- Run once in Supabase → SQL Editor (SurfStar)
-- Organizations: shared athletes, sessions, spots & templates for up to 5 coaches

-- ---------------------------------------------------------------------------
-- Plan updates: remove starter, add organization (Team Academy)
-- ---------------------------------------------------------------------------

alter table public.subscription_plans
  add column if not exists max_coaches int not null default 1;

update public.subscription_plans set max_coaches = 1 where id in ('team', 'club');

insert into public.subscription_plans (id, name, price_cents, currency, max_athletes, max_coaches, features)
values (
  'organization',
  'Team Academy',
  14900,
  'EUR',
  null,
  5,
  '["Unlimited athletes","Up to 5 coaches","Custom training templates","Heats & championship","Sea analysis","Shared roster & data","Priority support"]'::jsonb
)
on conflict (id) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  max_athletes = excluded.max_athletes,
  max_coaches = excluded.max_coaches,
  features = excluded.features;

-- Migrate existing starter subscribers to team
update public.coach_subscriptions set plan_id = 'team' where plan_id = 'starter';

-- ---------------------------------------------------------------------------
-- Core organization tables
-- ---------------------------------------------------------------------------

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete cascade,
  role text not null check (role in ('owner', 'coach')),
  status text not null check (status in ('pending', 'active')),
  invited_email text,
  invited_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique (organization_id, profile_id)
);

create unique index if not exists organization_members_pending_email_idx
  on public.organization_members (organization_id, lower(invited_email))
  where status = 'pending' and invited_email is not null;

create index if not exists organization_members_profile_idx
  on public.organization_members (profile_id, status);

create table if not exists public.organization_subscriptions (
  organization_id uuid primary key references public.organizations (id) on delete cascade,
  plan_id text not null references public.subscription_plans (id),
  status text not null default 'active',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tenant column on shared data
alter table public.spots add column if not exists organization_id uuid references public.organizations (id) on delete cascade;
alter table public.coach_conditions add column if not exists organization_id uuid references public.organizations (id) on delete cascade;
alter table public.training_sessions add column if not exists organization_id uuid references public.organizations (id) on delete cascade;
alter table public.custom_training_templates add column if not exists organization_id uuid references public.organizations (id) on delete cascade;
alter table public.coach_athlete_links add column if not exists organization_id uuid references public.organizations (id) on delete cascade;

create index if not exists spots_organization_idx on public.spots (organization_id);
create index if not exists coach_conditions_organization_idx on public.coach_conditions (organization_id);
create index if not exists training_sessions_organization_idx on public.training_sessions (organization_id);
create index if not exists custom_templates_organization_idx on public.custom_training_templates (organization_id);
create index if not exists coach_athlete_links_organization_idx on public.coach_athlete_links (organization_id, status);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.get_my_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select om.organization_id
  from public.organization_members om
  where om.profile_id = auth.uid()
    and om.status = 'active'
  order by om.accepted_at nulls last, om.created_at
  limit 1;
$$;

create or replace function public.is_org_member(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = p_org_id
      and om.profile_id = auth.uid()
      and om.status = 'active'
  );
$$;

create or replace function public.is_org_owner(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = p_org_id
      and om.profile_id = auth.uid()
      and om.status = 'active'
      and om.role = 'owner'
  );
$$;

create or replace function public.org_active_coach_count(p_org_id uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.organization_members
  where organization_id = p_org_id
    and status in ('active', 'pending');
$$;

create or replace function public.org_coach_seat_limit(p_org_id uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sp.max_coaches, 1)
  from public.organization_subscriptions os
  join public.subscription_plans sp on sp.id = os.plan_id
  where os.organization_id = p_org_id
    and os.status in ('active', 'trialing');
$$;

create or replace function public.org_active_athlete_count(p_org_id uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.coach_athlete_links
  where organization_id = p_org_id and status = 'active';
$$;

create or replace function public.org_athlete_limit(p_org_id uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select sp.max_athletes
  from public.organization_subscriptions os
  join public.subscription_plans sp on sp.id = os.plan_id
  where os.organization_id = p_org_id
    and os.status in ('active', 'trialing');
$$;

-- Fallback: coach subscription → org limit during migration
create or replace function public.coach_athlete_limit(p_coach_id uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.org_athlete_limit(public.get_my_organization_id_for_coach(p_coach_id)),
    (
      select sp.max_athletes
      from public.coach_subscriptions cs
      join public.subscription_plans sp on sp.id = cs.plan_id
      where cs.coach_id = p_coach_id
        and cs.status in ('active', 'trialing')
    )
  );
$$;

create or replace function public.get_my_organization_id_for_coach(p_coach_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select om.organization_id
  from public.organization_members om
  where om.profile_id = p_coach_id
    and om.status = 'active'
  order by om.accepted_at nulls last, om.created_at
  limit 1;
$$;

create or replace function public.coach_active_athlete_count(p_coach_id uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.org_active_athlete_count(public.get_my_organization_id_for_coach(p_coach_id)),
    (
      select count(*)::int
      from public.coach_athlete_links
      where coach_id = p_coach_id and status = 'active'
    )
  );
$$;

-- ---------------------------------------------------------------------------
-- Backfill: one organization per existing coach
-- ---------------------------------------------------------------------------

do $$
declare
  r record;
  v_org_id uuid;
begin
  for r in
    select p.id as coach_id, p.name as coach_name
    from public.profiles p
    where p.role = 'treinador'
      and not exists (
        select 1 from public.organization_members om
        where om.profile_id = p.id and om.status = 'active'
      )
  loop
    insert into public.organizations (name, created_by)
    values (r.coach_name || '''s Team', r.coach_id)
    returning id into v_org_id;

    insert into public.organization_members (organization_id, profile_id, role, status, accepted_at)
    values (v_org_id, r.coach_id, 'owner', 'active', now());

    insert into public.organization_subscriptions (organization_id, plan_id, status, current_period_end, updated_at)
    select v_org_id, cs.plan_id, cs.status, cs.current_period_end, cs.updated_at
    from public.coach_subscriptions cs
    where cs.coach_id = r.coach_id
    on conflict (organization_id) do nothing;

    if not found then
      insert into public.organization_subscriptions (organization_id, plan_id, status)
      values (v_org_id, 'team', 'pending')
      on conflict do nothing;
    end if;

    update public.spots set organization_id = v_org_id where coach_id = r.coach_id and organization_id is null;
    update public.coach_conditions set organization_id = v_org_id where coach_id = r.coach_id and organization_id is null;
    update public.training_sessions set organization_id = v_org_id where coach_id = r.coach_id and organization_id is null;
    update public.custom_training_templates set organization_id = v_org_id where coach_id = r.coach_id and organization_id is null;
    update public.coach_athlete_links set organization_id = v_org_id where coach_id = r.coach_id and organization_id is null;
  end loop;
end $$;

-- Dedupe links: keep one link per org+athlete
delete from public.coach_athlete_links a
using public.coach_athlete_links b
where a.organization_id = b.organization_id
  and a.athlete_id = b.athlete_id
  and a.id > b.id;

-- Org-level unique constraint on athlete links
alter table public.coach_athlete_links drop constraint if exists coach_athlete_links_coach_id_athlete_id_key;
create unique index if not exists coach_athlete_links_org_athlete_idx
  on public.coach_athlete_links (organization_id, athlete_id)
  where organization_id is not null;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_subscriptions enable row level security;

drop policy if exists "organizations_select_member" on public.organizations;
create policy "organizations_select_member"
  on public.organizations for select
  using (public.is_org_member(id));

drop policy if exists "organizations_update_owner" on public.organizations;
create policy "organizations_update_owner"
  on public.organizations for update
  using (public.is_org_owner(id));

drop policy if exists "organization_members_select_member" on public.organization_members;
create policy "organization_members_select_member"
  on public.organization_members for select
  using (public.is_org_member(organization_id));

drop policy if exists "organization_subscriptions_select_member" on public.organization_subscriptions;
create policy "organization_subscriptions_select_member"
  on public.organization_subscriptions for select
  using (public.is_org_member(organization_id));

-- Spots / conditions / sessions / templates: org members
drop policy if exists "spots_coach_all" on public.spots;
create policy "spots_org_member_all"
  on public.spots for all
  using (
    organization_id is not null and public.is_org_member(organization_id)
    or coach_id = auth.uid()
  )
  with check (
    organization_id is not null and public.is_org_member(organization_id)
    or coach_id = auth.uid()
  );

drop policy if exists "coach_conditions_coach_all" on public.coach_conditions;
create policy "coach_conditions_org_member_all"
  on public.coach_conditions for all
  using (
    organization_id is not null and public.is_org_member(organization_id)
    or coach_id = auth.uid()
  )
  with check (
    organization_id is not null and public.is_org_member(organization_id)
    or coach_id = auth.uid()
  );

drop policy if exists "training_sessions_coach_all" on public.training_sessions;
create policy "training_sessions_org_member_all"
  on public.training_sessions for all
  using (
    organization_id is not null and public.is_org_member(organization_id)
    or coach_id = auth.uid()
  )
  with check (
    organization_id is not null and public.is_org_member(organization_id)
    or coach_id = auth.uid()
  );

drop policy if exists "custom_templates_coach_all" on public.custom_training_templates;
create policy "custom_templates_org_member_all"
  on public.custom_training_templates for all
  using (
    organization_id is not null and public.is_org_member(organization_id)
    or coach_id = auth.uid()
  )
  with check (
    organization_id is not null and public.is_org_member(organization_id)
    or coach_id = auth.uid()
  );

-- Athlete reads sessions from linked orgs
drop policy if exists "sessions_athlete_read" on public.training_sessions;
create policy "sessions_athlete_read"
  on public.training_sessions for select
  using (
    exists (
      select 1
      from public.coach_athlete_links cal
      where cal.athlete_id = public.get_my_athlete_id()
        and cal.status = 'active'
        and not cal.blocked
        and (
          cal.organization_id = training_sessions.organization_id
          or cal.coach_id = training_sessions.coach_id
        )
    )
  );

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

create or replace function public.get_my_organization_context()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_member public.organization_members%rowtype;
  v_org public.organizations%rowtype;
  v_sub public.organization_subscriptions%rowtype;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'Not authenticated');
  end if;

  select om.* into v_member
  from public.organization_members om
  where om.profile_id = v_uid and om.status = 'active'
  order by om.accepted_at nulls last, om.created_at
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'No organization');
  end if;

  select * into v_org from public.organizations where id = v_member.organization_id;
  select * into v_sub from public.organization_subscriptions where organization_id = v_member.organization_id;

  return jsonb_build_object(
    'ok', true,
    'organization_id', v_org.id,
    'organization_name', v_org.name,
    'role', v_member.role,
    'plan_id', coalesce(v_sub.plan_id, 'team'),
    'subscription_status', coalesce(v_sub.status, 'pending'),
    'current_period_end', v_sub.current_period_end,
    'max_coaches', (
      select sp.max_coaches from public.subscription_plans sp where sp.id = coalesce(v_sub.plan_id, 'team')
    )
  );
end;
$$;

grant execute on function public.get_my_organization_context() to authenticated;

create or replace function public.ensure_coach_organization(p_org_name text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coach_id uuid := auth.uid();
  v_org_id uuid;
  v_name text;
  v_profile public.profiles%rowtype;
begin
  if v_coach_id is null then
    return jsonb_build_object('ok', false, 'error', 'Not authenticated');
  end if;

  select public.get_my_organization_id() into v_org_id;
  if v_org_id is not null then
    return jsonb_build_object('ok', true, 'organization_id', v_org_id, 'created', false);
  end if;

  select * into v_profile from public.profiles where id = v_coach_id;
  v_name := coalesce(nullif(trim(p_org_name), ''), v_profile.name || '''s Team');

  insert into public.organizations (name, created_by)
  values (v_name, v_coach_id)
  returning id into v_org_id;

  insert into public.organization_members (organization_id, profile_id, role, status, accepted_at)
  values (v_org_id, v_coach_id, 'owner', 'active', now());

  return jsonb_build_object('ok', true, 'organization_id', v_org_id, 'created', true);
end;
$$;

grant execute on function public.ensure_coach_organization(text) to authenticated;

create or replace function public.list_organization_members()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_org_id uuid := public.get_my_organization_id();
begin
  if v_org_id is null then
    return jsonb_build_object('ok', false, 'error', 'No organization');
  end if;

  return jsonb_build_object(
    'ok', true,
    'members', (
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'id', om.id,
          'profile_id', om.profile_id,
          'role', om.role,
          'status', om.status,
          'invited_email', om.invited_email,
          'name', coalesce(p.name, om.invited_email),
          'email', coalesce(p.email, om.invited_email),
          'accepted_at', om.accepted_at,
          'created_at', om.created_at
        )
        order by om.created_at
      ), '[]'::jsonb)
      from public.organization_members om
      left join public.profiles p on p.id = om.profile_id
      where om.organization_id = v_org_id
    )
  );
end;
$$;

grant execute on function public.list_organization_members() to authenticated;

create or replace function public.invite_organization_coach(p_email text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid := public.get_my_organization_id();
  v_email text := lower(trim(p_email));
  v_limit int;
  v_count int;
  v_existing_profile uuid;
  v_member_id uuid;
begin
  if v_org_id is null then
    return jsonb_build_object('ok', false, 'error', 'No organization');
  end if;

  if not public.is_org_owner(v_org_id) then
    return jsonb_build_object('ok', false, 'error', 'Only the organization owner can invite coaches.');
  end if;

  if v_email is null or length(v_email) < 5 or position('@' in v_email) = 0 then
    return jsonb_build_object('ok', false, 'error', 'Enter a valid email.');
  end if;

  v_limit := public.org_coach_seat_limit(v_org_id);
  v_count := public.org_active_coach_count(v_org_id);
  if v_limit is not null and v_count >= v_limit then
    return jsonb_build_object('ok', false, 'error', 'Coach seat limit reached for your plan.');
  end if;

  select id into v_existing_profile from public.profiles where lower(email) = v_email and role = 'treinador';

  if v_existing_profile is not null then
    if exists (
      select 1 from public.organization_members
      where organization_id = v_org_id and profile_id = v_existing_profile and status = 'active'
    ) then
      return jsonb_build_object('ok', false, 'error', 'This coach is already on your team.');
    end if;
  end if;

  if exists (
    select 1 from public.organization_members
    where organization_id = v_org_id and lower(invited_email) = v_email and status = 'pending'
  ) then
    return jsonb_build_object('ok', false, 'error', 'An invite is already pending for this email.');
  end if;

  insert into public.organization_members (organization_id, profile_id, role, status, invited_email, invited_by)
  values (
    v_org_id,
    v_existing_profile,
    'coach',
    case when v_existing_profile is not null then 'active' else 'pending' end,
    v_email,
    auth.uid()
  )
  returning id into v_member_id;

  if v_existing_profile is not null then
    update public.organization_members
    set accepted_at = now()
    where id = v_member_id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'member_id', v_member_id,
    'status', case when v_existing_profile is not null then 'active' else 'pending' end
  );
end;
$$;

grant execute on function public.invite_organization_coach(text) to authenticated;

create or replace function public.remove_organization_member(p_member_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid := public.get_my_organization_id();
  v_member public.organization_members%rowtype;
begin
  if v_org_id is null then
    return jsonb_build_object('ok', false, 'error', 'No organization');
  end if;

  select * into v_member
  from public.organization_members
  where id = p_member_id and organization_id = v_org_id;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Member not found.');
  end if;

  if v_member.role = 'owner' then
    return jsonb_build_object('ok', false, 'error', 'Cannot remove the organization owner.');
  end if;

  if not public.is_org_owner(v_org_id) and v_member.profile_id <> auth.uid() then
    return jsonb_build_object('ok', false, 'error', 'Not allowed.');
  end if;

  delete from public.organization_members where id = p_member_id;
  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.remove_organization_member(uuid) to authenticated;

create or replace function public.accept_organization_invites()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_count int := 0;
begin
  select lower(email) into v_email from public.profiles where id = v_uid;

  update public.organization_members
  set profile_id = v_uid, status = 'active', accepted_at = now()
  where lower(invited_email) = v_email
    and status = 'pending'
    and profile_id is null;

  get diagnostics v_count = row_count;
  return jsonb_build_object('ok', true, 'accepted', v_count);
end;
$$;

grant execute on function public.accept_organization_invites() to authenticated;

create or replace function public.update_organization_name(p_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid := public.get_my_organization_id();
  v_name text := trim(p_name);
begin
  if v_org_id is null then
    return jsonb_build_object('ok', false, 'error', 'No organization');
  end if;

  if not public.is_org_owner(v_org_id) then
    return jsonb_build_object('ok', false, 'error', 'Only the owner can rename the organization.');
  end if;

  if length(v_name) < 2 then
    return jsonb_build_object('ok', false, 'error', 'Enter a valid name.');
  end if;

  update public.organizations set name = v_name where id = v_org_id;
  return jsonb_build_object('ok', true, 'name', v_name);
end;
$$;

grant execute on function public.update_organization_name(text) to authenticated;

-- Organization-scoped subscription RPCs
create or replace function public.create_pending_organization_subscription(p_plan_id text, p_org_name text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coach_id uuid := auth.uid();
  v_org_id uuid;
  v_ensure jsonb;
  v_row public.organization_subscriptions%rowtype;
begin
  if v_coach_id is null then
    return jsonb_build_object('ok', false, 'error', 'Not authenticated');
  end if;

  if not exists (select 1 from public.profiles where id = v_coach_id and role = 'treinador') then
    return jsonb_build_object('ok', false, 'error', 'Only coaches can subscribe');
  end if;

  if not exists (select 1 from public.subscription_plans where id = p_plan_id) then
    return jsonb_build_object('ok', false, 'error', 'Invalid plan');
  end if;

  v_ensure := public.ensure_coach_organization(p_org_name);
  if not (v_ensure->>'ok')::boolean then
    return v_ensure;
  end if;

  v_org_id := (v_ensure->>'organization_id')::uuid;

  insert into public.organization_subscriptions (organization_id, plan_id, status, updated_at)
  values (v_org_id, p_plan_id, 'pending', now())
  on conflict (organization_id) do update set
    plan_id = excluded.plan_id,
    status = 'pending',
    updated_at = now()
  returning * into v_row;

  -- Keep legacy coach_subscriptions in sync for compatibility
  insert into public.coach_subscriptions (coach_id, plan_id, status, updated_at)
  values (v_coach_id, p_plan_id, 'pending', now())
  on conflict (coach_id) do update set
    plan_id = excluded.plan_id,
    status = 'pending',
    updated_at = now();

  return jsonb_build_object(
    'ok', true,
    'organization_id', v_row.organization_id,
    'plan_id', v_row.plan_id,
    'status', v_row.status,
    'current_period_end', v_row.current_period_end
  );
end;
$$;

grant execute on function public.create_pending_organization_subscription(text, text) to authenticated;

create or replace function public.activate_organization_subscription_demo(p_plan_id text, p_org_name text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coach_id uuid := auth.uid();
  v_demo boolean;
  v_org_id uuid;
  v_ensure jsonb;
  v_period_end timestamptz := now() + interval '1 month';
  v_row public.organization_subscriptions%rowtype;
begin
  select coalesce((value #>> '{}')::boolean, false)
  into v_demo
  from public.app_settings
  where key = 'demo_subscriptions';

  if not coalesce(v_demo, false) then
    return jsonb_build_object('ok', false, 'error', 'Demo subscriptions are disabled.');
  end if;

  if v_coach_id is null then
    return jsonb_build_object('ok', false, 'error', 'Not authenticated');
  end if;

  v_ensure := public.ensure_coach_organization(p_org_name);
  if not (v_ensure->>'ok')::boolean then
    return v_ensure;
  end if;

  v_org_id := (v_ensure->>'organization_id')::uuid;

  insert into public.organization_subscriptions (organization_id, plan_id, status, current_period_end, updated_at)
  values (v_org_id, p_plan_id, 'active', v_period_end, now())
  on conflict (organization_id) do update set
    plan_id = excluded.plan_id,
    status = 'active',
    current_period_end = excluded.current_period_end,
    updated_at = now()
  returning * into v_row;

  insert into public.coach_subscriptions (coach_id, plan_id, status, current_period_end, updated_at)
  values (v_coach_id, p_plan_id, 'active', v_period_end, now())
  on conflict (coach_id) do update set
    plan_id = excluded.plan_id,
    status = 'active',
    current_period_end = excluded.current_period_end,
    updated_at = now();

  return jsonb_build_object(
    'ok', true,
    'organization_id', v_row.organization_id,
    'plan_id', v_row.plan_id,
    'status', v_row.status,
    'current_period_end', v_row.current_period_end
  );
end;
$$;

grant execute on function public.activate_organization_subscription_demo(text, text) to authenticated;

-- Pairing: org-scoped links
create or replace function public.coach_request_pairing(p_code text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  coach public.profiles%rowtype;
  athlete_row public.athletes%rowtype;
  normalized text;
  link_id uuid;
  link_status text;
  v_org_id uuid;
  v_limit int;
  v_count int;
begin
  select * into coach from public.profiles where id = auth.uid();
  if not found or coach.role <> 'treinador' then
    return json_build_object('ok', false, 'error', 'Sign in as coach first.');
  end if;

  v_org_id := public.get_my_organization_id();
  if v_org_id is null then
    return json_build_object('ok', false, 'error', 'No organization. Contact support.');
  end if;

  v_limit := public.org_athlete_limit(v_org_id);
  if v_limit is not null then
    v_count := public.org_active_athlete_count(v_org_id) + (
      select count(*)::int
      from public.coach_athlete_links
      where organization_id = v_org_id and status = 'pending'
    );
    if v_count >= v_limit then
      return json_build_object(
        'ok', false,
        'error', 'Athlete limit reached for your plan. Upgrade or remove an athlete first.'
      );
    end if;
  end if;

  normalized := upper(trim(p_code));
  if length(normalized) < 4 then
    return json_build_object('ok', false, 'error', 'Enter a valid athlete code.');
  end if;

  select * into athlete_row from public.athletes where pairing_code = normalized;
  if not found then
    return json_build_object('ok', false, 'error', 'No athlete found with this code.');
  end if;

  select id, status into link_id, link_status
  from public.coach_athlete_links
  where organization_id = v_org_id and athlete_id = athlete_row.id;

  if link_status = 'active' then
    return json_build_object('ok', false, 'error', 'This athlete is already on your team.');
  end if;

  if link_status = 'pending' then
    return json_build_object(
      'ok', true,
      'link_id', link_id,
      'athlete_name', athlete_row.name,
      'status', 'pending'
    );
  end if;

  insert into public.coach_athlete_links (coach_id, organization_id, athlete_id, status, initiated_by)
  values (coach.id, v_org_id, athlete_row.id, 'pending', 'coach')
  returning id into link_id;

  return json_build_object(
    'ok', true,
    'link_id', link_id,
    'athlete_name', athlete_row.name,
    'status', 'pending'
  );
end;
$$;

create or replace function public.respond_to_pairing(p_link_id uuid, p_accept boolean)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  prof public.profiles%rowtype;
  link_row public.coach_athlete_links%rowtype;
  v_limit int;
  v_count int;
begin
  select * into prof from public.profiles where id = auth.uid();
  if not found or prof.role <> 'atleta' or prof.athlete_id is null then
    return json_build_object('ok', false, 'error', 'Not allowed.');
  end if;

  select * into link_row
  from public.coach_athlete_links
  where id = p_link_id and athlete_id = prof.athlete_id;

  if not found then
    return json_build_object('ok', false, 'error', 'Request not found.');
  end if;

  if link_row.status <> 'pending' then
    return json_build_object('ok', false, 'error', 'This request is no longer pending.');
  end if;

  if p_accept and link_row.organization_id is not null then
    v_limit := public.org_athlete_limit(link_row.organization_id);
    if v_limit is not null then
      v_count := public.org_active_athlete_count(link_row.organization_id);
      if v_count >= v_limit then
        return json_build_object(
          'ok', false,
          'error', 'This organization has reached the athlete limit for their subscription plan.'
        );
      end if;
    end if;
  end if;

  update public.coach_athlete_links
  set status = case when p_accept then 'active' else 'revoked' end
  where id = p_link_id;

  return json_build_object('ok', true, 'status', case when p_accept then 'active' else 'revoked' end);
end;
$$;

-- Replace create_pending_coach_subscription to use org
create or replace function public.create_pending_coach_subscription(p_plan_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  return public.create_pending_organization_subscription(p_plan_id, null);
end;
$$;

create or replace function public.activate_coach_subscription_demo(p_plan_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  return public.activate_organization_subscription_demo(p_plan_id, null);
end;
$$;
