-- Run once in Supabase → SQL Editor
-- Admin accounts list: include latest requested plan from payment requests

create or replace function public.admin_list_accounts(
  p_role text default null,
  p_search text default null,
  p_blocked_only boolean default false,
  p_limit int default 100
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_search text := nullif(lower(trim(p_search)), '');
begin
  perform public.admin_require_platform_admin();

  return jsonb_build_object(
    'ok', true,
    'accounts', (
      select coalesce(jsonb_agg(row order by row->>'created_at' desc), '[]'::jsonb)
      from (
        select jsonb_build_object(
          'profile_id', p.id,
          'name', p.name,
          'email', p.email,
          'role', p.role,
          'blocked', p.blocked,
          'is_platform_admin', p.is_platform_admin,
          'created_at', p.created_at,
          'plan_id', coalesce(os.plan_id, cs.plan_id),
          'plan_status', coalesce(os.status, cs.status),
          'organization_name', o.name,
          'organization_id', o.id,
          'requested_plan_id', lr.plan_id,
          'requested_billing_interval', lr.billing_interval,
          'requested_plan_status', lr.status,
          'requested_plan_payment_status', lr.payment_status,
          'requested_plan_activated_at', lr.activated_at
        ) as row
        from public.profiles p
        left join public.organization_members om
          on om.profile_id = p.id and om.status = 'active' and om.role = 'owner'
        left join public.organizations o on o.id = om.organization_id
        left join public.organization_subscriptions os on os.organization_id = o.id
        left join public.coach_subscriptions cs on cs.coach_id = p.id and p.role = 'treinador'
        left join lateral (
          select r.plan_id, r.billing_interval, r.status, r.payment_status, r.activated_at
          from public.organization_plan_requests r
          where lower(r.email) = lower(p.email)
          order by r.created_at desc
          limit 1
        ) lr on true
        where (p_role is null or p.role = p_role)
          and (not p_blocked_only or p.blocked = true)
          and (
            v_search is null
            or lower(p.name) like '%' || v_search || '%'
            or lower(p.email) like '%' || v_search || '%'
          )
        order by p.created_at desc
        limit greatest(1, least(coalesce(p_limit, 100), 200))
      ) sub
    )
  );
end;
$$;
