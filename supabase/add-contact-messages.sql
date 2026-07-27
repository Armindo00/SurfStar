-- Run once in Supabase → SQL Editor (SurfStar)
-- Contact & feedback messages from coaches, athletes, and visitors

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('feedback', 'support', 'bug', 'billing', 'other')),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  user_id uuid references public.profiles (id) on delete set null,
  user_role text check (user_role in ('treinador', 'atleta')),
  status text not null default 'new' check (status in ('new', 'read', 'resolved')),
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_status_idx
  on public.contact_messages (status, created_at desc);

alter table public.contact_messages enable row level security;

-- Platform admins can read all messages
drop policy if exists contact_messages_admin_select on public.contact_messages;
create policy contact_messages_admin_select on public.contact_messages
for select
using (public.is_platform_admin());

drop policy if exists contact_messages_admin_update on public.contact_messages;
create policy contact_messages_admin_update on public.contact_messages
for update
using (public.is_platform_admin());

-- Users can read their own submissions
drop policy if exists contact_messages_own_select on public.contact_messages;
create policy contact_messages_own_select on public.contact_messages
for select
using (user_id = auth.uid());

create or replace function public.submit_contact_message(
  p_kind text,
  p_name text,
  p_email text,
  p_subject text,
  p_message text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_user_id uuid;
  v_role text;
  v_name text;
  v_email text;
begin
  if p_kind not in ('feedback', 'support', 'bug', 'billing', 'other') then
    return jsonb_build_object('ok', false, 'error', 'Invalid message type.');
  end if;

  v_name := nullif(trim(p_name), '');
  v_email := nullif(trim(lower(p_email)), '');
  p_subject := nullif(trim(p_subject), '');
  p_message := nullif(trim(p_message), '');

  if v_name is null then
    return jsonb_build_object('ok', false, 'error', 'Name is required.');
  end if;
  if v_email is null or position('@' in v_email) < 2 then
    return jsonb_build_object('ok', false, 'error', 'Valid email is required.');
  end if;
  if p_subject is null then
    return jsonb_build_object('ok', false, 'error', 'Subject is required.');
  end if;
  if p_message is null or length(p_message) < 10 then
    return jsonb_build_object('ok', false, 'error', 'Message must be at least 10 characters.');
  end if;
  if length(p_message) > 4000 then
    return jsonb_build_object('ok', false, 'error', 'Message is too long (max 4000 characters).');
  end if;

  v_user_id := auth.uid();
  if v_user_id is not null then
    select p.role into v_role from public.profiles p where p.id = v_user_id;
  end if;

  insert into public.contact_messages (kind, name, email, subject, message, user_id, user_role)
  values (p_kind, v_name, v_email, p_subject, p_message, v_user_id, v_role)
  returning id into v_id;

  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;

grant execute on function public.submit_contact_message(text, text, text, text, text) to anon, authenticated;

create or replace function public.admin_list_contact_messages(
  p_status text default null,
  p_limit int default 100
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    return jsonb_build_object('ok', false, 'error', 'Not authorized.');
  end if;

  return jsonb_build_object(
    'ok', true,
    'messages', coalesce(
      (
        select jsonb_agg(row_to_json(m)::jsonb order by m.created_at desc)
        from (
          select
            cm.id,
            cm.kind,
            cm.name,
            cm.email,
            cm.subject,
            cm.message,
            cm.user_id,
            cm.user_role,
            cm.status,
            cm.created_at
          from public.contact_messages cm
          where p_status is null or cm.status = p_status
          order by cm.created_at desc
          limit greatest(1, least(coalesce(p_limit, 100), 200))
        ) m
      ),
      '[]'::jsonb
    )
  );
end;
$$;

grant execute on function public.admin_list_contact_messages(text, int) to authenticated;

create or replace function public.admin_update_contact_message_status(
  p_message_id uuid,
  p_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    return jsonb_build_object('ok', false, 'error', 'Not authorized.');
  end if;
  if p_status not in ('new', 'read', 'resolved') then
    return jsonb_build_object('ok', false, 'error', 'Invalid status.');
  end if;

  update public.contact_messages
  set status = p_status
  where id = p_message_id;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Message not found.');
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.admin_update_contact_message_status(uuid, text) to authenticated;
