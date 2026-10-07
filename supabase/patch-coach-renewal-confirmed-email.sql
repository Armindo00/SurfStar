-- Run once in Supabase → SQL Editor (after migrations 21 + 23)
-- Coach email when admin confirms subscription renewal payment

alter table public.coach_notification_queue
  drop constraint if exists coach_notification_queue_event_type_check;

alter table public.coach_notification_queue
  add constraint coach_notification_queue_event_type_check
  check (event_type in (
    'plan_request_received',
    'plan_request_approved',
    'plan_request_rejected',
    'plan_account_activated',
    'subscription_renewal_confirmed'
  ));

create or replace function public.queue_coach_renewal_confirmed_notification(
  p_coach_id uuid,
  p_period_end timestamptz,
  p_billing_interval text,
  p_plan_id text,
  p_was_unblocked boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_email text;
  v_name text;
  v_org_name text;
begin
  select lower(trim(p.email)), coalesce(nullif(trim(p.name), ''), 'Coach')
  into v_email, v_name
  from public.profiles p
  where p.id = p_coach_id;

  if v_email is null or v_email = '' then
    return;
  end if;

  select o.name into v_org_name
  from public.organization_members om
  join public.organizations o on o.id = om.organization_id
  where om.profile_id = p_coach_id
    and om.status = 'active'
  order by case when om.role = 'owner' then 0 else 1 end
  limit 1;

  insert into public.coach_notification_queue (
    event_type,
    source_id,
    coach_email,
    payload
  )
  values (
    'subscription_renewal_confirmed',
    gen_random_uuid(),
    v_email,
    jsonb_build_object(
      'contact_name', v_name,
      'email', v_email,
      'organization_name', coalesce(v_org_name, ''),
      'plan_id', coalesce(nullif(trim(p_plan_id), ''), 'team'),
      'billing_interval', coalesce(nullif(trim(p_billing_interval), ''), 'monthly'),
      'current_period_end', p_period_end,
      'was_unblocked', coalesce(p_was_unblocked, false),
      'contact_email', 'contact@surfstar.app'
    )
  )
  returning id into v_id;

  if v_id is not null then
    perform public.enqueue_coach_notification_webhook(v_id);
  end if;
end;
$$;

revoke all on function public.queue_coach_renewal_confirmed_notification(uuid, timestamptz, text, text, boolean) from public;
grant execute on function public.queue_coach_renewal_confirmed_notification(uuid, timestamptz, text, text, boolean) to service_role;

-- Includes unblock (from add-subscription-renewal-automation.sql) + coach email
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

  -- New paid period starts when payment is confirmed (not stacked on unused time).
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
