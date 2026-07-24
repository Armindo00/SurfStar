-- Run after add-subscriptions.sql (SurfStar production hardening)
-- Secures subscriptions, adds pending flow, athlete limits, demo mode flag

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default 'false'::jsonb
);

insert into public.app_settings (key, value)
values ('demo_subscriptions', 'false'::jsonb)
on conflict (key) do nothing;

alter table public.app_settings enable row level security;

drop policy if exists "app_settings_select_authenticated" on public.app_settings;
create policy "app_settings_select_authenticated"
  on public.app_settings for select
  to authenticated
  using (true);

-- Coaches can only READ their subscription (no self-activation writes)
drop policy if exists "coach_subscriptions_insert_own" on public.coach_subscriptions;
drop policy if exists "coach_subscriptions_update_own" on public.coach_subscriptions;

-- Helper: count active athletes for a coach
create or replace function public.coach_active_athlete_count(p_coach_id uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.coach_athlete_links
  where coach_id = p_coach_id and status = 'active';
$$;

create or replace function public.coach_athlete_limit(p_coach_id uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select sp.max_athletes
  from public.coach_subscriptions cs
  join public.subscription_plans sp on sp.id = cs.plan_id
  where cs.coach_id = p_coach_id
    and cs.status in ('active', 'trialing');
$$;

-- Pending subscription before Stripe payment
create or replace function public.create_pending_coach_subscription(p_plan_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coach_id uuid := auth.uid();
  v_row public.coach_subscriptions%rowtype;
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

  insert into public.coach_subscriptions (coach_id, plan_id, status, updated_at)
  values (v_coach_id, p_plan_id, 'pending', now())
  on conflict (coach_id) do update set
    plan_id = excluded.plan_id,
    status = 'pending',
    updated_at = now()
  returning * into v_row;

  return jsonb_build_object(
    'ok', true,
    'coach_id', v_row.coach_id,
    'plan_id', v_row.plan_id,
    'status', v_row.status,
    'current_period_end', v_row.current_period_end
  );
end;
$$;

grant execute on function public.create_pending_coach_subscription(text) to authenticated;

-- Demo activation (disabled in production — set app_settings.demo_subscriptions = true for dev)
create or replace function public.activate_coach_subscription_demo(p_plan_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coach_id uuid := auth.uid();
  v_demo boolean;
  v_period_end timestamptz := now() + interval '1 month';
  v_row public.coach_subscriptions%rowtype;
begin
  select coalesce((value #>> '{}')::boolean, false)
  into v_demo
  from public.app_settings
  where key = 'demo_subscriptions';

  if not coalesce(v_demo, false) then
    return jsonb_build_object('ok', false, 'error', 'Demo subscriptions are disabled. Complete payment via Stripe.');
  end if;

  if v_coach_id is null then
    return jsonb_build_object('ok', false, 'error', 'Not authenticated');
  end if;

  if not exists (select 1 from public.profiles where id = v_coach_id and role = 'treinador') then
    return jsonb_build_object('ok', false, 'error', 'Only coaches can subscribe');
  end if;

  if not exists (select 1 from public.subscription_plans where id = p_plan_id) then
    return jsonb_build_object('ok', false, 'error', 'Invalid plan');
  end if;

  insert into public.coach_subscriptions (coach_id, plan_id, status, current_period_end, updated_at)
  values (v_coach_id, p_plan_id, 'active', v_period_end, now())
  on conflict (coach_id) do update set
    plan_id = excluded.plan_id,
    status = 'active',
    current_period_end = excluded.current_period_end,
    updated_at = now()
  returning * into v_row;

  return jsonb_build_object(
    'ok', true,
    'coach_id', v_row.coach_id,
    'plan_id', v_row.plan_id,
    'status', v_row.status,
    'current_period_end', v_row.current_period_end
  );
end;
$$;

grant execute on function public.activate_coach_subscription_demo(text) to authenticated;

-- Revoke insecure client activation (replaced by Stripe webhook + demo RPC)
revoke execute on function public.activate_coach_subscription(text) from authenticated;
revoke execute on function public.activate_coach_subscription(text) from anon;

-- Enforce athlete limit when athlete accepts pairing
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

  if p_accept then
    v_limit := public.coach_athlete_limit(link_row.coach_id);
    if v_limit is not null then
      v_count := public.coach_active_athlete_count(link_row.coach_id);
      if v_count >= v_limit then
        return json_build_object(
          'ok', false,
          'error', 'This coach has reached the athlete limit for their subscription plan.'
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

-- Enforce limit when coach requests pairing (pending slots)
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
  v_limit int;
  v_count int;
begin
  select * into coach from public.profiles where id = auth.uid();
  if not found or coach.role <> 'treinador' then
    return json_build_object('ok', false, 'error', 'Sign in as coach first.');
  end if;

  v_limit := public.coach_athlete_limit(coach.id);
  if v_limit is not null then
    v_count := public.coach_active_athlete_count(coach.id) + (
      select count(*)::int
      from public.coach_athlete_links
      where coach_id = coach.id and status = 'pending'
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

  select * into athlete_row
  from public.athletes
  where pairing_code = normalized;

  if not found then
    return json_build_object('ok', false, 'error', 'No athlete found with this code.');
  end if;

  select id, status
  into link_id, link_status
  from public.coach_athlete_links
  where coach_id = coach.id and athlete_id = athlete_row.id;

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

  insert into public.coach_athlete_links (coach_id, athlete_id, status, initiated_by)
  values (coach.id, athlete_row.id, 'pending', 'coach')
  on conflict (coach_id, athlete_id) do update
  set status = 'pending', initiated_by = 'coach', blocked = false
  returning id into link_id;

  return json_build_object(
    'ok', true,
    'link_id', link_id,
    'athlete_name', athlete_row.name,
    'status', 'pending'
  );
end;
$$;
