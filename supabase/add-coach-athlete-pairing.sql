-- Run once in Supabase → SQL Editor (project SurfStar)
-- Multi-coach athlete pairing: self-registration, codes, confirmations, global stats

-- ---------------------------------------------------------------------------
-- Schema extensions
-- ---------------------------------------------------------------------------

alter table public.athletes
  add column if not exists owner_user_id uuid references public.profiles (id) on delete set null;

alter table public.athletes
  add column if not exists pairing_code text;

create unique index if not exists athletes_pairing_code_idx
  on public.athletes (pairing_code)
  where pairing_code is not null;

alter table public.athletes
  alter column coach_id drop not null;

create table if not exists public.coach_athlete_links (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles (id) on delete cascade,
  athlete_id uuid not null references public.athletes (id) on delete cascade,
  status text not null check (status in ('pending', 'active', 'revoked')),
  initiated_by text not null check (initiated_by in ('coach', 'athlete')),
  share_settings jsonb not null default '{}'::jsonb,
  blocked boolean not null default false,
  created_at timestamptz not null default now(),
  unique (coach_id, athlete_id)
);

create index if not exists coach_athlete_links_coach_idx
  on public.coach_athlete_links (coach_id, status);

create index if not exists coach_athlete_links_athlete_idx
  on public.coach_athlete_links (athlete_id, status);

-- ---------------------------------------------------------------------------
-- Backfill existing coach-created athletes
-- ---------------------------------------------------------------------------

create or replace function public.generate_pairing_code()
returns text
language plpgsql
set search_path = public
as $$
declare
  candidate text;
  taken boolean;
begin
  loop
    candidate := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    select exists(select 1 from public.athletes a where a.pairing_code = candidate) into taken;
    exit when not taken;
  end loop;
  return candidate;
end;
$$;

update public.athletes
set pairing_code = public.generate_pairing_code()
where pairing_code is null;

update public.athletes a
set owner_user_id = p.id
from public.profiles p
where p.athlete_id = a.id
  and p.role = 'atleta'
  and a.owner_user_id is null;

insert into public.coach_athlete_links (coach_id, athlete_id, status, initiated_by, share_settings, blocked)
select
  a.coach_id,
  a.id,
  'active',
  'coach',
  coalesce(a.share_settings, '{}'::jsonb),
  coalesce(a.blocked, false)
from public.athletes a
where a.coach_id is not null
on conflict (coach_id, athlete_id) do update
set
  status = 'active',
  share_settings = excluded.share_settings,
  blocked = excluded.blocked;

-- ---------------------------------------------------------------------------
-- Self-registration trigger update
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_athlete_id uuid;
  v_code text;
begin
  v_role := coalesce(new.raw_user_meta_data->>'role', 'treinador');

  insert into public.profiles (id, role, name, email, coach_id, athlete_id, must_change_password)
  values (
    new.id,
    v_role,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    lower(new.email),
    nullif(new.raw_user_meta_data->>'coach_id', '')::uuid,
    nullif(new.raw_user_meta_data->>'athlete_id', '')::uuid,
    case
      when v_role = 'atleta'
        and nullif(new.raw_user_meta_data->>'athlete_id', '') is not null
      then true
      else false
    end
  );

  -- Self-registered athlete: create global athlete profile + pairing code
  if v_role = 'atleta'
    and nullif(new.raw_user_meta_data->>'athlete_id', '') is null
  then
    v_athlete_id := gen_random_uuid();
    v_code := public.generate_pairing_code();
    insert into public.athletes (id, name, owner_user_id, pairing_code)
    values (
      v_athlete_id,
      coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
      new.id,
      v_code
    );
    update public.profiles
    set athlete_id = v_athlete_id
    where id = new.id;
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC helpers
-- ---------------------------------------------------------------------------

create or replace function public.setup_self_registered_athlete()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  prof public.profiles%rowtype;
  new_athlete_id uuid;
  new_code text;
begin
  select * into prof from public.profiles where id = auth.uid();
  if not found or prof.role <> 'atleta' then
    return json_build_object('ok', false, 'error', 'Not an athlete account.');
  end if;

  if prof.athlete_id is not null then
    select pairing_code into new_code from public.athletes where id = prof.athlete_id;
    return json_build_object(
      'ok', true,
      'athlete_id', prof.athlete_id,
      'pairing_code', new_code
    );
  end if;

  new_athlete_id := gen_random_uuid();
  new_code := public.generate_pairing_code();
  insert into public.athletes (id, name, owner_user_id, pairing_code)
  values (new_athlete_id, prof.name, prof.id, new_code);

  update public.profiles
  set athlete_id = new_athlete_id
  where id = prof.id;

  return json_build_object(
    'ok', true,
    'athlete_id', new_athlete_id,
    'pairing_code', new_code
  );
end;
$$;

create or replace function public.coach_request_pairing(p_code text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  coach public.profiles%rowtype;
  athlete_row public.athletes%rowtype;
  normalized text;
  link_id uuid;
  link_status text;
begin
  select * into coach from public.profiles where id = auth.uid();
  if not found or coach.role <> 'treinador' then
    return json_build_object('ok', false, 'error', 'Sign in as coach first.');
  end if;

  normalized := upper(trim(p_code));
  if length(normalized) < 4 then
    return json_build_object('ok', false, 'error', 'Enter a valid athlete code.');
  end if;

  select * into athlete_row
  from public.athletes
  where pairing_code = normalized;

  if not found then
    return json_build_object('ok', false, 'error', 'No athlete found with this code.');
  end if;

  select id, status
  into link_id, link_status
  from public.coach_athlete_links
  where coach_id = coach.id and athlete_id = athlete_row.id;

  if link_status = 'active' then
    return json_build_object('ok', false, 'error', 'This athlete is already on your team.');
  end if;

  if link_status = 'pending' then
    return json_build_object(
      'ok', true,
      'link_id', link_id,
      'athlete_name', athlete_row.name,
      'status', 'pending'
    );
  end if;

  insert into public.coach_athlete_links (coach_id, athlete_id, status, initiated_by)
  values (coach.id, athlete_row.id, 'pending', 'coach')
  on conflict (coach_id, athlete_id) do update
  set status = 'pending', initiated_by = 'coach', blocked = false
  returning id into link_id;

  return json_build_object(
    'ok', true,
    'link_id', link_id,
    'athlete_name', athlete_row.name,
    'status', 'pending'
  );
end;
$$;

create or replace function public.respond_to_pairing(p_link_id uuid, p_accept boolean)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  prof public.profiles%rowtype;
  link_row public.coach_athlete_links%rowtype;
begin
  select * into prof from public.profiles where id = auth.uid();
  if not found or prof.role <> 'atleta' or prof.athlete_id is null then
    return json_build_object('ok', false, 'error', 'Not allowed.');
  end if;

  select * into link_row
  from public.coach_athlete_links
  where id = p_link_id and athlete_id = prof.athlete_id;

  if not found then
    return json_build_object('ok', false, 'error', 'Request not found.');
  end if;

  if link_row.status <> 'pending' then
    return json_build_object('ok', false, 'error', 'This request is no longer pending.');
  end if;

  update public.coach_athlete_links
  set status = case when p_accept then 'active' else 'revoked' end
  where id = p_link_id;

  return json_build_object('ok', true, 'status', case when p_accept then 'active' else 'revoked' end);
end;
$$;

create or replace function public.revoke_pairing(p_link_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  prof public.profiles%rowtype;
  link_row public.coach_athlete_links%rowtype;
begin
  select * into prof from public.profiles where id = auth.uid();
  if not found then
    return json_build_object('ok', false, 'error', 'Not allowed.');
  end if;

  select * into link_row from public.coach_athlete_links where id = p_link_id;
  if not found then
    return json_build_object('ok', false, 'error', 'Link not found.');
  end if;

  if prof.role = 'treinador' and link_row.coach_id <> prof.id then
    return json_build_object('ok', false, 'error', 'Not allowed.');
  end if;

  if prof.role = 'atleta' and link_row.athlete_id <> prof.athlete_id then
    return json_build_object('ok', false, 'error', 'Not allowed.');
  end if;

  update public.coach_athlete_links
  set status = 'revoked', blocked = false
  where id = p_link_id;

  return json_build_object('ok', true);
end;
$$;

create or replace function public.set_link_blocked(p_link_id uuid, p_blocked boolean)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  prof public.profiles%rowtype;
  link_row public.coach_athlete_links%rowtype;
begin
  select * into prof from public.profiles where id = auth.uid();
  if not found or prof.role <> 'treinador' then
    return json_build_object('ok', false, 'error', 'Sign in as coach first.');
  end if;

  select * into link_row
  from public.coach_athlete_links
  where id = p_link_id and coach_id = prof.id and status = 'active';

  if not found then
    return json_build_object('ok', false, 'error', 'Athlete link not found.');
  end if;

  update public.coach_athlete_links
  set blocked = p_blocked
  where id = p_link_id;

  return json_build_object('ok', true);
end;
$$;

create or replace function public.update_link_share_settings(p_link_id uuid, p_settings jsonb)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  prof public.profiles%rowtype;
begin
  select * into prof from public.profiles where id = auth.uid();
  if not found or prof.role <> 'treinador' then
    return json_build_object('ok', false, 'error', 'Sign in as coach first.');
  end if;

  update public.coach_athlete_links
  set share_settings = coalesce(p_settings, '{}'::jsonb)
  where id = p_link_id and coach_id = prof.id and status = 'active';

  if not found then
    return json_build_object('ok', false, 'error', 'Athlete link not found.');
  end if;

  return json_build_object('ok', true);
end;
$$;

create or replace function public.get_athlete_training_sessions(p_athlete_id uuid)
returns setof jsonb
language sql
security definer
stable
set search_path = public
as $$
  select ts.payload
  from public.training_sessions ts
  join public.coach_athlete_links cal
    on cal.coach_id = ts.coach_id
    and cal.athlete_id = p_athlete_id
    and cal.status = 'active'
    and cal.blocked = false
  where exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.athlete_id = p_athlete_id
  )
    and (ts.payload->'athleteIds') @> to_jsonb(p_athlete_id::text)
  order by ts.updated_at desc;
$$;

-- ---------------------------------------------------------------------------
-- RLS for coach_athlete_links
-- ---------------------------------------------------------------------------

alter table public.coach_athlete_links enable row level security;

create policy "links_coach_read"
  on public.coach_athlete_links for select
  using (coach_id = auth.uid());

create policy "links_athlete_read"
  on public.coach_athlete_links for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.athlete_id = coach_athlete_links.athlete_id
    )
  );

-- Writes go through security definer RPCs

-- Update athlete session read policy to use active links
drop policy if exists "sessions_athlete_read" on public.training_sessions;

create policy "sessions_athlete_read"
  on public.training_sessions for select
  using (
    exists (
      select 1
      from public.profiles p
      join public.coach_athlete_links cal
        on cal.athlete_id = p.athlete_id
        and cal.coach_id = training_sessions.coach_id
        and cal.status = 'active'
        and cal.blocked = false
      where p.id = auth.uid()
        and p.role = 'atleta'
        and (training_sessions.payload->'athleteIds') @> to_jsonb(p.athlete_id::text)
    )
  );

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

grant execute on function public.setup_self_registered_athlete() to authenticated;
grant execute on function public.coach_request_pairing(text) to authenticated;
grant execute on function public.respond_to_pairing(uuid, boolean) to authenticated;
grant execute on function public.revoke_pairing(uuid) to authenticated;
grant execute on function public.set_link_blocked(uuid, boolean) to authenticated;
grant execute on function public.update_link_share_settings(uuid, jsonb) to authenticated;
grant execute on function public.get_athlete_training_sessions(uuid) to authenticated;
