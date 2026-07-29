-- Run once in Supabase → SQL Editor (SurfStar)
-- Admin UI: edit IBAN / MB Way used in coach approval emails

insert into public.app_settings (key, value)
values (
  'manual_payment_details',
  jsonb_build_object(
    'account_name', 'SurfStar',
    'iban', '',
    'mbway', '',
    'payment_reference_hint', 'Use your registered email as the payment reference.'
  )
)
on conflict (key) do nothing;

create or replace function public.admin_get_manual_payment_details()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_details jsonb;
begin
  perform public.admin_require_platform_admin();
  v_details := public.get_manual_payment_details();
  return jsonb_build_object('ok', true, 'details', v_details);
end;
$$;

grant execute on function public.admin_get_manual_payment_details() to authenticated;

create or replace function public.admin_update_manual_payment_details(
  p_account_name text default null,
  p_iban text default null,
  p_mbway text default null,
  p_payment_reference_hint text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current jsonb;
  v_next jsonb;
begin
  perform public.admin_require_platform_admin();

  v_current := public.get_manual_payment_details();

  v_next := jsonb_build_object(
    'account_name', coalesce(nullif(trim(p_account_name), ''), v_current->>'account_name', 'SurfStar'),
    'iban', coalesce(nullif(trim(p_iban), ''), v_current->>'iban', ''),
    'mbway', coalesce(nullif(trim(p_mbway), ''), v_current->>'mbway', ''),
    'payment_reference_hint', coalesce(
      nullif(trim(p_payment_reference_hint), ''),
      v_current->>'payment_reference_hint',
      'Use your registered email as the payment reference.'
    )
  );

  insert into public.app_settings (key, value)
  values ('manual_payment_details', v_next)
  on conflict (key) do update set value = excluded.value;

  return jsonb_build_object('ok', true, 'details', v_next);
end;
$$;

grant execute on function public.admin_update_manual_payment_details(text, text, text, text) to authenticated;
