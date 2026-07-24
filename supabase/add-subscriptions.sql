-- Run once in Supabase → SQL Editor (SurfStar)
-- Subscription plans + coach subscriptions

create table if not exists public.subscription_plans (
  id text primary key,
  name text not null,
  price_cents int not null,
  currency text not null default 'EUR',
  max_athletes int,
  features jsonb not null default '[]'::jsonb
);

insert into public.subscription_plans (id, name, price_cents, currency, max_athletes, features)
values
  (
    'starter',
    'Starter',
    1900,
    'EUR',
    5,
    '["Até 5 atletas","Treino técnico e combos","Histórico de sessões","Gestão de spots"]'::jsonb
  ),
  (
    'team',
    'Team',
    3900,
    'EUR',
    20,
    '["Até 20 atletas","Team analytics","Pairing multi-treinador","Partilha de stats"]'::jsonb
  ),
  (
    'club',
    'Club',
    7900,
    'EUR',
    null,
    '["Atletas ilimitados","Heats e campeonato","Análise de mar","Suporte prioritário"]'::jsonb
  )
on conflict (id) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  max_athletes = excluded.max_athletes,
  features = excluded.features;

create table if not exists public.coach_subscriptions (
  coach_id uuid primary key references public.profiles(id) on delete cascade,
  plan_id text not null references public.subscription_plans(id),
  status text not null default 'active',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists coach_subscriptions_status_idx
  on public.coach_subscriptions (status);

alter table public.coach_subscriptions enable row level security;

drop policy if exists "coach_subscriptions_select_own" on public.coach_subscriptions;
create policy "coach_subscriptions_select_own"
  on public.coach_subscriptions for select
  using (coach_id = auth.uid());

drop policy if exists "coach_subscriptions_insert_own" on public.coach_subscriptions;
create policy "coach_subscriptions_insert_own"
  on public.coach_subscriptions for insert
  with check (coach_id = auth.uid());

drop policy if exists "coach_subscriptions_update_own" on public.coach_subscriptions;
create policy "coach_subscriptions_update_own"
  on public.coach_subscriptions for update
  using (coach_id = auth.uid());

-- Activate or update subscription after payment (MVP — replace with Stripe webhook later)
create or replace function public.activate_coach_subscription(p_plan_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coach_id uuid := auth.uid();
  v_period_end timestamptz := now() + interval '1 month';
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

grant execute on function public.activate_coach_subscription(text) to authenticated;
