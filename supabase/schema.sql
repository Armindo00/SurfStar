-- SurfStar cloud schema (Supabase SQL editor)
-- Run once in: Dashboard → SQL → New query

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('treinador', 'atleta')),
  name text not null,
  email text not null,
  coach_id uuid references public.profiles (id) on delete cascade,
  athlete_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.athletes (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  share_settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles
  drop constraint if exists profiles_athlete_id_fkey;

alter table public.profiles
  add constraint profiles_athlete_id_fkey
  foreign key (athlete_id) references public.athletes (id) on delete set null;

create table if not exists public.spots (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles (id) on delete cascade,
  name text not null
);

create table if not exists public.coach_conditions (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles (id) on delete cascade,
  label text not null
);

create table if not exists public.training_sessions (
  id uuid primary key,
  coach_id uuid not null references public.profiles (id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists training_sessions_coach_id_idx on public.training_sessions (coach_id);

alter table public.profiles enable row level security;
alter table public.athletes enable row level security;
alter table public.spots enable row level security;
alter table public.coach_conditions enable row level security;
alter table public.training_sessions enable row level security;

-- Profiles
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_select_coach_athletes"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles coach
      where coach.id = auth.uid()
        and coach.role = 'treinador'
        and profiles.coach_id = coach.id
    )
  );

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Athletes
create policy "athletes_coach_all"
  on public.athletes for all
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

create policy "athletes_read_own"
  on public.athletes for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.athlete_id = athletes.id
    )
  );

-- Spots & conditions
create policy "spots_coach_all"
  on public.spots for all
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

create policy "spots_athlete_read"
  on public.spots for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.coach_id = spots.coach_id
    )
  );

create policy "conditions_coach_all"
  on public.coach_conditions for all
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

-- Sessions: coach full access
create policy "sessions_coach_all"
  on public.training_sessions for all
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

-- Athlete read sessions they belong to
create policy "sessions_athlete_read"
  on public.training_sessions for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'atleta'
        and (payload->'athleteIds') @> to_jsonb(p.athlete_id::text)
    )
  );

-- Auto-create profile row after auth signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, name, email, coach_id, athlete_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'treinador'),
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    lower(new.email),
    nullif(new.raw_user_meta_data->>'coach_id', '')::uuid,
    nullif(new.raw_user_meta_data->>'athlete_id', '')::uuid
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Default spot + conditions for new coaches
create or replace function public.seed_coach_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'treinador' then
    insert into public.spots (coach_id, name) values (new.id, 'Home break');
    insert into public.coach_conditions (coach_id, label)
    values
      (new.id, 'Clean'),
      (new.id, 'Onshore'),
      (new.id, 'Offshore'),
      (new.id, 'Choppy'),
      (new.id, 'Glassy'),
      (new.id, 'Average');
  end if;
  return new;
end;
$$;

drop trigger if exists on_profile_coach_seed on public.profiles;

create trigger on_profile_coach_seed
  after insert on public.profiles
  for each row execute function public.seed_coach_defaults();
