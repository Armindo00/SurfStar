-- Fix: confirming renewal payment starts the new period from now (payment date),
-- not stacked on an existing future current_period_end (~60 days for monthly).
-- Run once in Supabase SQL Editor (replaces admin_confirm_subscription_renewal).

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
  v_plan_id text;
  v_org_id uuid;
  v_next timestamptz;
  v_was_blocked boolean := false;
begin
  perform public.admin_require_platform_admin();

  select cs.billing_interval, cs.plan_id
  into v_interval, v_plan_id
  from public.coach_subscriptions cs
  where cs.coach_id = p_coach_id;

  if v_interval is null then
    return jsonb_build_object('ok', false, 'error', 'No active subscription found.');
  end if;

  select om.organization_id into v_org_id
  from public.organization_members om
  where om.profile_id = p_coach_id and om.status = 'active' and om.role = 'owner'
  limit 1;

  v_next := case
    when v_interval = 'annual' then now() + interval '1 year'
    else now() + interval '1 month'
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

  select p.blocked into v_was_blocked
  from public.profiles p
  where p.id = p_coach_id;

  update public.profiles
  set blocked = false
  where id = p_coach_id and blocked = true;

  perform public.queue_coach_renewal_confirmed_notification(
    p_coach_id,
    v_next,
    v_interval,
    v_plan_id,
    coalesce(v_was_blocked, false)
  );

  return jsonb_build_object(
    'ok', true,
    'coach_id', p_coach_id,
    'billing_interval', v_interval,
    'current_period_end', v_next,
    'unblocked', coalesce(v_was_blocked, false),
    'notes', nullif(trim(p_notes), '')
  );
end;
$$;

grant execute on function public.admin_confirm_subscription_renewal(uuid, text) to authenticated;
