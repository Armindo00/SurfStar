-- Run once in Supabase → SQL Editor (SurfStar)
-- GDPR: account deletion requests + admin purge

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  email text not null,
  role text not null check (role in ('treinador', 'atleta')),
  reason text,
  status text not null default 'pending' check (status in ('pending', 'completed', 'rejected')),
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  processed_by uuid references public.profiles (id) on delete set null,
  admin_notes text
);

create unique index if not exists account_deletion_requests_pending_user_idx
  on public.account_deletion_requests (user_id)
  where status = 'pending';

create index if not exists account_deletion_requests_status_idx
  on public.account_deletion_requests (status, created_at desc);

alter table public.account_deletion_requests enable row level security;

drop policy if exists account_deletion_requests_own_select on public.account_deletion_requests;
create policy account_deletion_requests_own_select on public.account_deletion_requests
for select
using (user_id = auth.uid());

-- Extend admin notification types (if admin notify migration already ran)
alter table public.admin_notification_queue
  drop constraint if exists admin_notification_queue_event_type_check;

alter table public.admin_notification_queue
  add constraint admin_notification_queue_event_type_check
  check (event_type in (
    'payment_request',
    'team_academy_request',
    'contact_message',
    'account_deletion_request'
  ));

create or replace function public.purge_user_account(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_profile public.profiles%rowtype;
  v_email text;
  v_athlete_id uuid;
  v_org record;
  v_other_members int;
begin
  select * into v_profile from public.profiles where id = p_user_id;
  if not found then
    return;
  end if;

  if v_profile.is_platform_admin then
    raise exception 'Cannot delete platform admin accounts.';
  end if;

  v_email := lower(trim(v_profile.email));
  v_athlete_id := v_profile.athlete_id;

  if v_profile.role = 'treinador' then
    for v_org in
      select om.organization_id, om.role
      from public.organization_members om
      where om.profile_id = p_user_id and om.status = 'active'
    loop
      if v_org.role = 'owner' then
        select count(*) into v_other_members
        from public.organization_members om
        where om.organization_id = v_org.organization_id
          and om.status = 'active'
          and om.profile_id <> p_user_id;

        if v_other_members = 0 then
          delete from public.organizations where id = v_org.organization_id;
        else
          delete from public.organization_members
          where organization_id = v_org.organization_id and profile_id = p_user_id;
        end if;
      else
        delete from public.organization_members
        where organization_id = v_org.organization_id and profile_id = p_user_id;
      end if;
    end loop;

    delete from public.organization_plan_requests where lower(email) = v_email;
    delete from public.coach_notification_queue where lower(coach_email) = v_email;
    delete from public.subscription_renewal_reminders where coach_id = p_user_id;
  end if;

  if v_profile.role = 'atleta' and v_athlete_id is not null then
    delete from public.coach_athlete_links where athlete_id = v_athlete_id;
    delete from public.athletes where id = v_athlete_id;
  end if;

  delete from public.contact_messages where user_id = p_user_id;

  delete from auth.users where id = p_user_id;
end;
$$;

revoke all on function public.purge_user_account(uuid) from public;
grant execute on function public.purge_user_account(uuid) to service_role;

create or replace function public.request_account_deletion(p_reason text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_reason text := nullif(trim(p_reason), '');
  v_id uuid;
begin
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'Sign in first.');
  end if;

  select * into v_profile from public.profiles where id = v_user_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Profile not found.');
  end if;

  if v_profile.is_platform_admin then
    return jsonb_build_object('ok', false, 'error', 'Admin accounts cannot be deleted through this flow.');
  end if;

  if exists (
    select 1 from public.account_deletion_requests r
    where r.user_id = v_user_id and r.status = 'pending'
  ) then
    return jsonb_build_object('ok', false, 'error', 'A deletion request is already pending.');
  end if;

  if length(coalesce(v_reason, '')) > 2000 then
    return jsonb_build_object('ok', false, 'error', 'Reason is too long (max 2000 characters).');
  end if;

  insert into public.account_deletion_requests (user_id, profile_id, email, role, reason)
  values (v_user_id, v_profile.id, lower(trim(v_profile.email)), v_profile.role, v_reason)
  returning id into v_id;

  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;

grant execute on function public.request_account_deletion(text) to authenticated;

create or replace function public.fetch_my_account_deletion_request()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_row public.account_deletion_requests%rowtype;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'error', 'Sign in first.');
  end if;

  select * into v_row
  from public.account_deletion_requests r
  where r.user_id = auth.uid()
  order by r.created_at desc
  limit 1;

  if not found then
    return jsonb_build_object('ok', true, 'request', null);
  end if;

  return jsonb_build_object(
    'ok', true,
    'request', jsonb_build_object(
      'id', v_row.id,
      'status', v_row.status,
      'reason', v_row.reason,
      'created_at', v_row.created_at,
      'processed_at', v_row.processed_at,
      'admin_notes', v_row.admin_notes
    )
  );
end;
$$;

grant execute on function public.fetch_my_account_deletion_request() to authenticated;

create or replace function public.trg_queue_account_deletion_admin_notify()
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
    'account_deletion_request',
    NEW.id,
    jsonb_build_object(
      'name', (select p.name from public.profiles p where p.id = NEW.profile_id),
      'email', NEW.email,
      'role', NEW.role,
      'reason', NEW.reason,
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

drop trigger if exists account_deletion_requests_admin_notify_trg on public.account_deletion_requests;
create trigger account_deletion_requests_admin_notify_trg
  after insert on public.account_deletion_requests
  for each row
  execute function public.trg_queue_account_deletion_admin_notify();

create or replace function public.admin_list_account_deletion_requests(
  p_status text default 'pending',
  p_limit int default 50
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.admin_require_platform_admin();

  return jsonb_build_object(
    'ok', true,
    'requests', coalesce(
      (
        select jsonb_agg(row order by row->>'created_at' desc)
        from (
          select jsonb_build_object(
            'id', r.id,
            'user_id', r.user_id,
            'profile_id', r.profile_id,
            'email', r.email,
            'role', r.role,
            'reason', r.reason,
            'status', r.status,
            'created_at', r.created_at,
            'processed_at', r.processed_at,
            'admin_notes', r.admin_notes
          ) as row
          from public.account_deletion_requests r
          where p_status is null or r.status = p_status
          order by r.created_at desc
          limit greatest(1, least(coalesce(p_limit, 50), 100))
        ) q
      ),
      '[]'::jsonb
    )
  );
end;
$$;

grant execute on function public.admin_list_account_deletion_requests(text, int) to authenticated;

create or replace function public.admin_process_account_deletion_request(
  p_request_id uuid,
  p_action text,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.account_deletion_requests%rowtype;
  v_notes text := nullif(trim(p_notes), '');
begin
  perform public.admin_require_platform_admin();

  if p_action not in ('approve', 'reject') then
    return jsonb_build_object('ok', false, 'error', 'Invalid action.');
  end if;

  select * into v_row
  from public.account_deletion_requests
  where id = p_request_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Request not found.');
  end if;

  if v_row.status <> 'pending' then
    return jsonb_build_object('ok', false, 'error', 'Request already processed.');
  end if;

  if p_action = 'reject' then
    update public.account_deletion_requests
    set
      status = 'rejected',
      processed_at = now(),
      processed_by = auth.uid(),
      admin_notes = v_notes
    where id = p_request_id;

    return jsonb_build_object('ok', true, 'status', 'rejected');
  end if;

  if v_row.user_id = auth.uid() then
    return jsonb_build_object('ok', false, 'error', 'You cannot delete your own admin account through this action.');
  end if;

  perform public.purge_user_account(v_row.user_id);

  return jsonb_build_object('ok', true, 'status', 'completed');
end;
$$;

grant execute on function public.admin_process_account_deletion_request(uuid, text, text) to authenticated;
