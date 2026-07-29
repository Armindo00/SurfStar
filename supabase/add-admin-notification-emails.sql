-- Run once in Supabase → SQL Editor (SurfStar)
-- Admin email alerts: payment requests, Team Academy requests, contact messages

create extension if not exists pg_net with schema extensions;

create table if not exists public.admin_notification_queue (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('payment_request', 'team_academy_request', 'contact_message')),
  source_id uuid not null,
  payload jsonb not null,
  email_sent_at timestamptz,
  email_error text,
  created_at timestamptz not null default now(),
  unique (event_type, source_id)
);

create index if not exists admin_notification_queue_pending_idx
  on public.admin_notification_queue (email_sent_at, created_at asc)
  where email_sent_at is null;

alter table public.admin_notification_queue enable row level security;

-- Service role / edge function only (no client policies)

insert into public.app_settings (key, value)
values (
  'admin_notify_webhook',
  jsonb_build_object('enabled', false)
)
on conflict (key) do nothing;

-- Business inbox only — not platform_admin_emails (app login access)
insert into public.app_settings (key, value)
values (
  'admin_notification_emails',
  '["contact@surfstar.app"]'::jsonb
)
on conflict (key) do nothing;
create or replace function public.get_admin_notification_emails()
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    nullif(
      array(
        select lower(jsonb_array_elements_text(s.value))
        from public.app_settings s
        where s.key = 'admin_notification_emails'
      ),
      array[]::text[]
    ),
    array['contact@surfstar.app']::text[]
  );
$$;

revoke all on function public.get_admin_notification_emails() from public;
grant execute on function public.get_admin_notification_emails() to service_role;

create or replace function public.enqueue_admin_notification_webhook(p_notification_id uuid)
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
  where s.key = 'admin_notify_webhook';

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

revoke all on function public.enqueue_admin_notification_webhook(uuid) from public;
grant execute on function public.enqueue_admin_notification_webhook(uuid) to service_role;

create or replace function public.trg_queue_contact_message_admin_notify()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.admin_notification_queue (event_type, source_id, payload)
  values (
    'contact_message',
    NEW.id,
    jsonb_build_object(
      'kind', NEW.kind,
      'name', NEW.name,
      'email', NEW.email,
      'subject', NEW.subject,
      'message', NEW.message,
      'user_role', NEW.user_role,
      'created_at', NEW.created_at
    )
  )
  on conflict (event_type, source_id) do nothing
  returning id into v_id;

  if v_id is not null then
    perform public.enqueue_admin_notification_webhook(v_id);
  end if;

  return NEW;
end;
$$;

drop trigger if exists contact_messages_admin_notify_trg on public.contact_messages;
create trigger contact_messages_admin_notify_trg
  after insert on public.contact_messages
  for each row
  execute function public.trg_queue_contact_message_admin_notify();

create or replace function public.trg_queue_plan_request_admin_notify()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_event text;
begin
  v_event := case
    when NEW.plan_id = 'organization' then 'team_academy_request'
    else 'payment_request'
  end;

  insert into public.admin_notification_queue (event_type, source_id, payload)
  values (
    v_event,
    NEW.id,
    jsonb_build_object(
      'contact_name', NEW.contact_name,
      'email', NEW.email,
      'organization_name', NEW.organization_name,
      'coaches_count', NEW.coaches_count,
      'message', NEW.message,
      'plan_id', NEW.plan_id,
      'billing_interval', NEW.billing_interval,
      'tax_id', NEW.tax_id,
      'billing_address', NEW.billing_address,
      'billing_street', NEW.billing_street,
      'billing_address_line2', NEW.billing_address_line2,
      'billing_postal_code', NEW.billing_postal_code,
      'billing_city', NEW.billing_city,
      'billing_region', NEW.billing_region,
      'billing_country', NEW.billing_country,
      'created_at', NEW.created_at
    )
  )
  on conflict (event_type, source_id) do nothing
  returning id into v_id;

  if v_id is not null then
    perform public.enqueue_admin_notification_webhook(v_id);
  end if;

  return NEW;
end;
$$;

drop trigger if exists organization_plan_requests_admin_notify_trg on public.organization_plan_requests;
create trigger organization_plan_requests_admin_notify_trg
  after insert on public.organization_plan_requests
  for each row
  execute function public.trg_queue_plan_request_admin_notify();

create or replace function public.fetch_pending_admin_notifications(p_limit int default 20)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  return jsonb_build_object(
    'ok', true,
    'admin_emails', to_jsonb(public.get_admin_notification_emails()),
    'notifications', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', q.id,
            'event_type', q.event_type,
            'source_id', q.source_id,
            'payload', q.payload,
            'created_at', q.created_at
          )
          order by q.created_at asc
        )
        from (
          select *
          from public.admin_notification_queue
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

revoke all on function public.fetch_pending_admin_notifications(int) from public;
grant execute on function public.fetch_pending_admin_notifications(int) to service_role;

create or replace function public.fetch_admin_notification(p_notification_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.admin_notification_queue%rowtype;
begin
  select * into v_row
  from public.admin_notification_queue
  where id = p_notification_id;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Notification not found.');
  end if;

  return jsonb_build_object(
    'ok', true,
    'admin_emails', to_jsonb(public.get_admin_notification_emails()),
    'notification', jsonb_build_object(
      'id', v_row.id,
      'event_type', v_row.event_type,
      'source_id', v_row.source_id,
      'payload', v_row.payload,
      'created_at', v_row.created_at,
      'email_sent_at', v_row.email_sent_at
    )
  );
end;
$$;

revoke all on function public.fetch_admin_notification(uuid) from public;
grant execute on function public.fetch_admin_notification(uuid) to service_role;

create or replace function public.mark_admin_notification_sent(
  p_notification_id uuid,
  p_error text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.admin_notification_queue
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

revoke all on function public.mark_admin_notification_sent(uuid, text) from public;
grant execute on function public.mark_admin_notification_sent(uuid, text) to service_role;
