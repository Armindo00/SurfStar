-- Run once in Supabase → SQL Editor (SurfStar)
-- Coach transactional emails: request received, payment instructions, account activated

create table if not exists public.coach_notification_queue (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in (
    'plan_request_received',
    'plan_request_approved',
    'plan_request_rejected',
    'plan_account_activated'
  )),
  source_id uuid not null,
  coach_email text not null,
  payload jsonb not null,
  email_sent_at timestamptz,
  email_error text,
  created_at timestamptz not null default now(),
  unique (event_type, source_id)
);

create index if not exists coach_notification_queue_pending_idx
  on public.coach_notification_queue (email_sent_at, created_at asc)
  where email_sent_at is null;

alter table public.coach_notification_queue enable row level security;

insert into public.app_settings (key, value)
values (
  'coach_notify_webhook',
  jsonb_build_object('enabled', false)
)
on conflict (key) do nothing;

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

create or replace function public.get_manual_payment_details()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select s.value from public.app_settings s where s.key = 'manual_payment_details'),
    jsonb_build_object(
      'account_name', 'SurfStar',
      'iban', '',
      'mbway', '',
      'payment_reference_hint', 'Use your registered email as the payment reference.'
    )
  );
$$;

revoke all on function public.get_manual_payment_details() from public;
grant execute on function public.get_manual_payment_details() to service_role;

create or replace function public.enqueue_coach_notification_webhook(p_notification_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cfg jsonb;
  v_url text;
  v_secret text;
begin
  select s.value into v_cfg
  from public.app_settings s
  where s.key = 'coach_notify_webhook';

  if v_cfg is null or coalesce((v_cfg->>'enabled')::boolean, false) is not true then
    return;
  end if;

  v_url := nullif(trim(v_cfg->>'url'), '');
  v_secret := nullif(trim(v_cfg->>'secret'), '');

  if v_url is null or v_secret is null then
    return;
  end if;

  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_secret
    ),
    body := jsonb_build_object('notification_id', p_notification_id)
  );
end;
$$;

revoke all on function public.enqueue_coach_notification_webhook(uuid) from public;
grant execute on function public.enqueue_coach_notification_webhook(uuid) to service_role;

create or replace function public.build_coach_plan_request_payload(p_row public.organization_plan_requests)
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'contact_name', p_row.contact_name,
    'email', p_row.email,
    'organization_name', p_row.organization_name,
    'plan_id', p_row.plan_id,
    'billing_interval', p_row.billing_interval,
    'coaches_count', p_row.coaches_count,
    'message', p_row.message,
    'status', p_row.status,
    'payment_status', p_row.payment_status,
    'created_at', p_row.created_at,
    'reviewed_at', p_row.reviewed_at,
    'activated_at', p_row.activated_at,
    'payment_details', public.get_manual_payment_details(),
    'contact_email', 'contact@surfstar.app'
  );
$$;

create or replace function public.queue_coach_plan_notification(
  p_event_type text,
  p_row public.organization_plan_requests
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.coach_notification_queue (
    event_type,
    source_id,
    coach_email,
    payload
  )
  values (
    p_event_type,
    p_row.id,
    lower(trim(p_row.email)),
    public.build_coach_plan_request_payload(p_row)
  )
  on conflict (event_type, source_id) do nothing
  returning id into v_id;

  if v_id is not null then
    perform public.enqueue_coach_notification_webhook(v_id);
  end if;
end;
$$;

revoke all on function public.queue_coach_plan_notification(text, public.organization_plan_requests) from public;
grant execute on function public.queue_coach_plan_notification(text, public.organization_plan_requests) to service_role;

create or replace function public.trg_coach_notify_plan_request_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.queue_coach_plan_notification('plan_request_received', NEW);
  return NEW;
end;
$$;

create or replace function public.trg_coach_notify_plan_request_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if OLD.status is distinct from NEW.status and NEW.status = 'approved' and NEW.activated_at is null then
    perform public.queue_coach_plan_notification('plan_request_approved', NEW);
  end if;

  if OLD.status is distinct from NEW.status and NEW.status = 'rejected' then
    perform public.queue_coach_plan_notification('plan_request_rejected', NEW);
  end if;

  if OLD.activated_at is null and NEW.activated_at is not null then
    perform public.queue_coach_plan_notification('plan_account_activated', NEW);
  end if;

  return NEW;
end;
$$;

drop trigger if exists organization_plan_requests_coach_notify_insert_trg on public.organization_plan_requests;
create trigger organization_plan_requests_coach_notify_insert_trg
  after insert on public.organization_plan_requests
  for each row
  execute function public.trg_coach_notify_plan_request_insert();

drop trigger if exists organization_plan_requests_coach_notify_update_trg on public.organization_plan_requests;
create trigger organization_plan_requests_coach_notify_update_trg
  after update on public.organization_plan_requests
  for each row
  execute function public.trg_coach_notify_plan_request_update();

create or replace function public.fetch_pending_coach_notifications(p_limit int default 20)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  return jsonb_build_object(
    'ok', true,
    'notifications', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', q.id,
            'event_type', q.event_type,
            'coach_email', q.coach_email,
            'payload', q.payload,
            'created_at', q.created_at
          )
          order by q.created_at asc
        )
        from (
          select *
          from public.coach_notification_queue
          where email_sent_at is null
          order by created_at asc
          limit greatest(1, least(coalesce(p_limit, 20), 50))
        ) q
      ),
      '[]'::jsonb
    )
  );
end;
$$;

revoke all on function public.fetch_pending_coach_notifications(int) from public;
grant execute on function public.fetch_pending_coach_notifications(int) to service_role;

create or replace function public.fetch_coach_notification(p_notification_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.coach_notification_queue%rowtype;
begin
  select * into v_row
  from public.coach_notification_queue
  where id = p_notification_id;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Notification not found.');
  end if;

  return jsonb_build_object(
    'ok', true,
    'notification', jsonb_build_object(
      'id', v_row.id,
      'event_type', v_row.event_type,
      'coach_email', v_row.coach_email,
      'payload', v_row.payload,
      'created_at', v_row.created_at,
      'email_sent_at', v_row.email_sent_at
    )
  );
end;
$$;

revoke all on function public.fetch_coach_notification(uuid) from public;
grant execute on function public.fetch_coach_notification(uuid) to service_role;

create or replace function public.mark_coach_notification_sent(
  p_notification_id uuid,
  p_error text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.coach_notification_queue
  set
    email_sent_at = case when p_error is null then now() else email_sent_at end,
    email_error = p_error
  where id = p_notification_id;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Notification not found.');
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.mark_coach_notification_sent(uuid, text) from public;
grant execute on function public.mark_coach_notification_sent(uuid, text) to service_role;
