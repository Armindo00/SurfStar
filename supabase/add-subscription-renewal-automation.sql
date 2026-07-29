-- Run once in Supabase → SQL Editor
-- Automated subscription renewal reminders (5d, 1d, expired) + auto-block on expiry

create table if not exists public.subscription_renewal_reminders (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  reminder_type text not null check (reminder_type in ('due_5d', 'due_1d', 'expired')),
  period_end timestamptz not null,
  created_at timestamptz not null default now(),
  email_sent_at timestamptz,
  unique (coach_id, reminder_type, period_end)
);

create index if not exists subscription_renewal_reminders_pending_idx
  on public.subscription_renewal_reminders (email_sent_at)
  where email_sent_at is null;

alter table public.subscription_renewal_reminders enable row level security;

-- Service role / edge function only (no client policies)

create or replace function public.run_daily_subscription_renewal_lifecycle()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_blocked int := 0;
begin
  -- Queue 5-day reminders (renewal date is exactly 5 days from today)
  insert into public.subscription_renewal_reminders (coach_id, reminder_type, period_end)
  select
    p.id,
    'due_5d',
    coalesce(os.current_period_end, cs.current_period_end)
  from public.profiles p
  join public.coach_subscriptions cs on cs.coach_id = p.id
  left join public.organization_members om
    on om.profile_id = p.id and om.role = 'owner' and om.status = 'active'
  left join public.organization_subscriptions os on os.organization_id = om.organization_id
  where p.role = 'treinador'
    and not p.is_platform_admin
    and coalesce(os.status, cs.status) in ('active', 'trialing', 'past_due')
    and coalesce(os.current_period_end, cs.current_period_end) is not null
    and (coalesce(os.current_period_end, cs.current_period_end)::date - current_date) = 5
  on conflict (coach_id, reminder_type, period_end) do nothing;

  -- Queue 1-day reminders (renewal date is tomorrow)
  insert into public.subscription_renewal_reminders (coach_id, reminder_type, period_end)
  select
    p.id,
    'due_1d',
    coalesce(os.current_period_end, cs.current_period_end)
  from public.profiles p
  join public.coach_subscriptions cs on cs.coach_id = p.id
  left join public.organization_members om
    on om.profile_id = p.id and om.role = 'owner' and om.status = 'active'
  left join public.organization_subscriptions os on os.organization_id = om.organization_id
  where p.role = 'treinador'
    and not p.is_platform_admin
    and coalesce(os.status, cs.status) in ('active', 'trialing', 'past_due')
    and coalesce(os.current_period_end, cs.current_period_end) is not null
    and (coalesce(os.current_period_end, cs.current_period_end)::date - current_date) = 1
  on conflict (coach_id, reminder_type, period_end) do nothing;

  -- Queue expired reminders + block accounts (subscription period has ended)
  insert into public.subscription_renewal_reminders (coach_id, reminder_type, period_end)
  select
    p.id,
    'expired',
    coalesce(os.current_period_end, cs.current_period_end)
  from public.profiles p
  join public.coach_subscriptions cs on cs.coach_id = p.id
  left join public.organization_members om
    on om.profile_id = p.id and om.role = 'owner' and om.status = 'active'
  left join public.organization_subscriptions os on os.organization_id = om.organization_id
  where p.role = 'treinador'
    and not p.is_platform_admin
    and coalesce(os.status, cs.status) in ('active', 'trialing', 'past_due')
    and coalesce(os.current_period_end, cs.current_period_end) is not null
    and coalesce(os.current_period_end, cs.current_period_end) < now()
  on conflict (coach_id, reminder_type, period_end) do nothing;

  -- Block expired coaches and mark subscription past_due
  create temp table _surfstar_expired_coaches on commit drop as
  select distinct
    p.id as coach_id,
    om.organization_id
  from public.profiles p
  join public.coach_subscriptions cs on cs.coach_id = p.id
  left join public.organization_members om
    on om.profile_id = p.id and om.role = 'owner' and om.status = 'active'
  left join public.organization_subscriptions os on os.organization_id = om.organization_id
  where p.role = 'treinador'
    and not p.is_platform_admin
    and not p.blocked
    and coalesce(os.status, cs.status) in ('active', 'trialing', 'past_due')
    and coalesce(os.current_period_end, cs.current_period_end) is not null
    and coalesce(os.current_period_end, cs.current_period_end) < now();

  update public.profiles p
  set blocked = true
  from _surfstar_expired_coaches e
  where p.id = e.coach_id;

  get diagnostics v_blocked = row_count;

  update public.coach_subscriptions cs
  set status = 'past_due', updated_at = now()
  from _surfstar_expired_coaches e
  where cs.coach_id = e.coach_id
    and cs.status in ('active', 'trialing');

  update public.organization_subscriptions os
  set status = 'past_due', updated_at = now()
  from _surfstar_expired_coaches e
  where os.organization_id = e.organization_id
    and os.status in ('active', 'trialing');

  return jsonb_build_object(
    'ok', true,
    'blocked_accounts', v_blocked,
    'pending_emails', (
      select coalesce(jsonb_agg(row order by row->>'period_end' asc), '[]'::jsonb)
      from (
        select jsonb_build_object(
          'reminder_id', r.id,
          'reminder_type', r.reminder_type,
          'coach_id', p.id,
          'name', p.name,
          'email', p.email,
          'plan_id', coalesce(os.plan_id, cs.plan_id),
          'plan_name', sp.name,
          'billing_interval', coalesce(os.billing_interval, cs.billing_interval, 'monthly'),
          'price_cents', sp.price_cents,
          'currency', sp.currency,
          'period_end', r.period_end,
          'organization_name', o.name
        ) as row
        from public.subscription_renewal_reminders r
        join public.profiles p on p.id = r.coach_id
        join public.coach_subscriptions cs on cs.coach_id = p.id
        left join public.organization_members om
          on om.profile_id = p.id and om.role = 'owner' and om.status = 'active'
        left join public.organizations o on o.id = om.organization_id
        left join public.organization_subscriptions os on os.organization_id = o.id
        join public.subscription_plans sp on sp.id = coalesce(os.plan_id, cs.plan_id)
        where r.email_sent_at is null
        order by r.period_end asc
        limit 200
      ) sub
    )
  );
end;
$$;

create or replace function public.mark_subscription_renewal_email_sent(p_reminder_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.subscription_renewal_reminders
  set email_sent_at = now()
  where id = p_reminder_id and email_sent_at is null;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Reminder not found or already sent.');
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

-- Unblock + reactivate when admin confirms renewal payment
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

  -- Unblock account after payment confirmed
  update public.profiles
  set blocked = false
  where id = p_coach_id and blocked = true;

  return jsonb_build_object(
    'ok', true,
    'coach_id', p_coach_id,
    'billing_interval', v_interval,
    'current_period_end', v_next,
    'unblocked', true,
    'notes', nullif(trim(p_notes), '')
  );
end;
$$;

revoke all on function public.run_daily_subscription_renewal_lifecycle() from public;
revoke all on function public.mark_subscription_renewal_email_sent(uuid) from public;
grant execute on function public.run_daily_subscription_renewal_lifecycle() to service_role;
grant execute on function public.mark_subscription_renewal_email_sent(uuid) to service_role;
