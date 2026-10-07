-- Subscriptions tab: include past_due (expired) coaches so admin can confirm renewal.
-- Run once in Supabase SQL Editor.

create or replace function public.admin_list_billing_subscriptions(
  p_filter text default 'all',
  p_limit int default 100
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.admin_require_platform_admin();

  return jsonb_build_object(
    'ok', true,
    'subscriptions', (
      select coalesce(jsonb_agg(row order by row->>'current_period_end' asc nulls last), '[]'::jsonb)
      from (
        select jsonb_build_object(
          'coach_id', p.id,
          'name', p.name,
          'email', p.email,
          'tax_id', p.tax_id,
          'organization_name', o.name,
          'organization_id', o.id,
          'plan_id', coalesce(os.plan_id, cs.plan_id),
          'plan_status', coalesce(os.status, cs.status),
          'billing_interval', coalesce(os.billing_interval, cs.billing_interval, 'monthly'),
          'current_period_end', coalesce(os.current_period_end, cs.current_period_end),
          'blocked', p.blocked
        ) as row
        from public.profiles p
        left join public.organization_members om
          on om.profile_id = p.id and om.role = 'owner' and om.status = 'active'
        left join public.organizations o on o.id = om.organization_id
        left join public.organization_subscriptions os on os.organization_id = o.id
        left join public.coach_subscriptions cs on cs.coach_id = p.id
        where p.role = 'treinador'
          and not p.is_platform_admin
          and coalesce(os.status, cs.status) in ('active', 'trialing', 'past_due')
          and coalesce(os.plan_id, cs.plan_id) is not null
          and (
            p_filter = 'all'
            or (p_filter = 'monthly' and coalesce(os.billing_interval, cs.billing_interval) = 'monthly')
            or (p_filter = 'annual' and coalesce(os.billing_interval, cs.billing_interval) = 'annual')
            or (
              p_filter = 'due_7d'
              and coalesce(os.current_period_end, cs.current_period_end) is not null
              and coalesce(os.current_period_end, cs.current_period_end) <= now() + interval '7 days'
              and coalesce(os.current_period_end, cs.current_period_end) >= now()
            )
            or (
              p_filter = 'due_30d'
              and coalesce(os.current_period_end, cs.current_period_end) is not null
              and coalesce(os.current_period_end, cs.current_period_end) <= now() + interval '30 days'
              and coalesce(os.current_period_end, cs.current_period_end) >= now()
            )
            or (
              p_filter = 'overdue'
              and coalesce(os.current_period_end, cs.current_period_end) is not null
              and coalesce(os.current_period_end, cs.current_period_end) < now()
            )
          )
        order by coalesce(os.current_period_end, cs.current_period_end) asc nulls last
        limit greatest(1, least(coalesce(p_limit, 100), 200))
      ) sub
    )
  );
end;
$$;

grant execute on function public.admin_list_billing_subscriptions(text, int) to authenticated;
