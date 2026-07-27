-- Run once in Supabase → SQL Editor (SurfStar)
-- Athlete quiver (boards/fins), coach equipment ratings, post-session wellbeing feedback

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.athlete_boards (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes (id) on delete cascade,
  name text not null,
  length_cm numeric(6, 2),
  width_inches numeric(5, 2),
  thickness_inches numeric(5, 2),
  volume_liters numeric(6, 2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists athlete_boards_athlete_idx on public.athlete_boards (athlete_id);

create table if not exists public.athlete_fins (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes (id) on delete cascade,
  name text not null,
  size text,
  template text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists athlete_fins_athlete_idx on public.athlete_fins (athlete_id);

create table if not exists public.equipment_evaluations (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles (id) on delete cascade,
  athlete_id uuid not null references public.athletes (id) on delete cascade,
  equipment_type text not null check (equipment_type in ('board', 'fin')),
  equipment_id uuid not null,
  speed smallint not null check (speed between 0 and 10),
  control smallint not null check (control between 0 and 10),
  release smallint not null check (release between 0 and 10),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists equipment_evaluations_athlete_idx
  on public.equipment_evaluations (athlete_id, created_at desc);

create table if not exists public.session_athlete_feedback (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.training_sessions (id) on delete cascade,
  athlete_id uuid not null references public.athletes (id) on delete cascade,
  coach_id uuid not null references public.profiles (id) on delete cascade,
  board_id uuid references public.athlete_boards (id) on delete set null,
  fin_id uuid references public.athlete_fins (id) on delete set null,
  mental_state text not null,
  written_note text,
  submitted_at timestamptz not null default now(),
  unique (session_id, athlete_id)
);

create index if not exists session_athlete_feedback_athlete_idx
  on public.session_athlete_feedback (athlete_id, submitted_at desc);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.get_my_athlete_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select p.athlete_id from public.profiles p where p.id = auth.uid() and p.role = 'atleta';
$$;

create or replace function public.coach_can_access_athlete(p_athlete_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.coach_athlete_links l
    where l.coach_id = auth.uid()
      and l.athlete_id = p_athlete_id
      and l.status = 'active'
      and not l.blocked
  );
$$;

grant execute on function public.coach_can_access_athlete(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.athlete_boards enable row level security;
alter table public.athlete_fins enable row level security;
alter table public.equipment_evaluations enable row level security;
alter table public.session_athlete_feedback enable row level security;

-- Boards
drop policy if exists athlete_boards_select on public.athlete_boards;
create policy athlete_boards_select on public.athlete_boards for select
using (
  athlete_id = public.get_my_athlete_id()
  or public.coach_can_access_athlete(athlete_id)
);

drop policy if exists athlete_boards_insert on public.athlete_boards;
create policy athlete_boards_insert on public.athlete_boards for insert
with check (athlete_id = public.get_my_athlete_id());

drop policy if exists athlete_boards_update on public.athlete_boards;
create policy athlete_boards_update on public.athlete_boards for update
using (athlete_id = public.get_my_athlete_id());

drop policy if exists athlete_boards_delete on public.athlete_boards;
create policy athlete_boards_delete on public.athlete_boards for delete
using (athlete_id = public.get_my_athlete_id());

-- Fins
drop policy if exists athlete_fins_select on public.athlete_fins;
create policy athlete_fins_select on public.athlete_fins for select
using (
  athlete_id = public.get_my_athlete_id()
  or public.coach_can_access_athlete(athlete_id)
);

drop policy if exists athlete_fins_insert on public.athlete_fins;
create policy athlete_fins_insert on public.athlete_fins for insert
with check (athlete_id = public.get_my_athlete_id());

drop policy if exists athlete_fins_update on public.athlete_fins;
create policy athlete_fins_update on public.athlete_fins for update
using (athlete_id = public.get_my_athlete_id());

drop policy if exists athlete_fins_delete on public.athlete_fins;
create policy athlete_fins_delete on public.athlete_fins for delete
using (athlete_id = public.get_my_athlete_id());

-- Equipment evaluations (coach only)
drop policy if exists equipment_evaluations_select on public.equipment_evaluations;
create policy equipment_evaluations_select on public.equipment_evaluations for select
using (
  coach_id = auth.uid()
  or athlete_id = public.get_my_athlete_id()
);

drop policy if exists equipment_evaluations_insert on public.equipment_evaluations;
create policy equipment_evaluations_insert on public.equipment_evaluations for insert
with check (
  coach_id = auth.uid()
  and public.coach_can_access_athlete(athlete_id)
);

drop policy if exists equipment_evaluations_update on public.equipment_evaluations;
create policy equipment_evaluations_update on public.equipment_evaluations for update
using (coach_id = auth.uid());

drop policy if exists equipment_evaluations_delete on public.equipment_evaluations;
create policy equipment_evaluations_delete on public.equipment_evaluations for delete
using (coach_id = auth.uid());

-- Session feedback
drop policy if exists session_feedback_select on public.session_athlete_feedback;
create policy session_feedback_select on public.session_athlete_feedback for select
using (
  athlete_id = public.get_my_athlete_id()
  or coach_id = auth.uid()
);

drop policy if exists session_feedback_insert on public.session_athlete_feedback;
create policy session_feedback_insert on public.session_athlete_feedback for insert
with check (athlete_id = public.get_my_athlete_id());

drop policy if exists session_feedback_update on public.session_athlete_feedback;
create policy session_feedback_update on public.session_athlete_feedback for update
using (athlete_id = public.get_my_athlete_id());
