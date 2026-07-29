-- Run once in Supabase → SQL Editor (SurfStar)
-- Manual billing: coach can cancel at end of current billing period (no Stripe)

create or replace function public.coach_cancel_manual_subscription()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coach_id uuid := auth.uid();
  v_org_id uuid;
  v_period_end timestamptz;
  v_org_updated int := 0;
  v_coach_updated int := 0;
begin
  if v_coach_id is null then
    return jsonb_build_object('ok', false, 'error', 'Sign in as coach first.');
  end if;

  if not exists (
    select 1 from public.profiles p
    where p.id = v_coach_id and p.role = 'treinador'
  ) then
    return jsonb_build_object('ok', false, 'error', 'Coach profile required.');
  end if;

  select om.organization_id into v_org_id
  from public.organization_members om
  where om.profile_id = v_coach_id
    and om.role = 'owner'
    and om.status = 'active'
  order by om.created_at
  limit 1;

  if v_org_id is not null then
    update public.organization_subscriptions os
    set status = 'canceled', updated_at = now()
    where os.organization_id = v_org_id
      and os.status in ('active', 'trialing');

    get diagnostics v_org_updated = row_count;

    select os.current_period_end into v_period_end
    from public.organization_subscriptions os
    where os.organization_id = v_org_id;
  end if;

  update public.coach_subscriptions cs
  set status = 'canceled', updated_at = now()
  where cs.coach_id = v_coach_id
    and cs.status in ('active', 'trialing');

  get diagnostics v_coach_updated = row_count;

  if v_coach_updated = 0 and v_org_updated = 0 then
    if exists (
      select 1
      from public.coach_subscriptions cs
      where cs.coach_id = v_coach_id and cs.status = 'canceled'
    ) or (
      v_org_id is not null and exists (
        select 1
        from public.organization_subscriptions os
        where os.organization_id = v_org_id and os.status = 'canceled'
      )
    ) then
      return jsonb_build_object(
        'ok', true,
        'already_canceled', true,
        'current_period_end', v_period_end
      );
    end if;

    return jsonb_build_object('ok', false, 'error', 'No active subscription to cancel.');
  end if;

  if v_period_end is null then
    select cs.current_period_end into v_period_end
    from public.coach_subscriptions cs
    where cs.coach_id = v_coach_id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'current_period_end', v_period_end
  );
end;
$$;

grant execute on function public.coach_cancel_manual_subscription() to authenticated;
