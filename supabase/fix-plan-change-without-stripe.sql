-- Allow coaches to activate / change plan without Stripe until they have a paid Stripe subscription.
-- Run in Supabase → SQL Editor (after fix-subscription-security.sql)

create or replace function public.activate_coach_subscription_demo(p_plan_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coach_id uuid := auth.uid();
  v_demo boolean;
  v_stripe_subscription_id text;
  v_period_end timestamptz := now() + interval '1 month';
  v_row public.coach_subscriptions%rowtype;
begin
  select coalesce((value #>> '{}')::boolean, false)
  into v_demo
  from public.app_settings
  where key = 'demo_subscriptions';

  if not coalesce(v_demo, false) then
    select cs.stripe_subscription_id
    into v_stripe_subscription_id
    from public.coach_subscriptions cs
    where cs.coach_id = v_coach_id;

    if v_stripe_subscription_id is not null then
      return jsonb_build_object(
        'ok',
        false,
        'error',
        'Complete payment via Stripe to change your plan.'
      );
    end if;
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
