-- Run once in Supabase → SQL Editor (SurfStar)
-- Fixes RLS recursion + coach/athlete read access for pairing
-- Self-contained: does NOT require fix-missing-profiles.sql

-- Helper: read own athlete_id without triggering profiles RLS recursion
create or replace function public.get_my_athlete_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select athlete_id from public.profiles where id = auth.uid() limit 1;
$$;

grant execute on function public.get_my_athlete_id() to authenticated;

-- ---------------------------------------------------------------------------

drop policy if exists "links_athlete_read" on public.coach_athlete_links;

create policy "links_athlete_read"
  on public.coach_athlete_links for select
  using (athlete_id = public.get_my_athlete_id());

drop policy if exists "sessions_athlete_read" on public.training_sessions;

create policy "sessions_athlete_read"
  on public.training_sessions for select
  using (
    exists (
      select 1
      from public.coach_athlete_links cal
      where cal.athlete_id = public.get_my_athlete_id()
        and cal.coach_id = training_sessions.coach_id
        and cal.status = 'active'
        and cal.blocked = false
        and (training_sessions.payload->'athleteIds') @> to_jsonb(public.get_my_athlete_id()::text)
    )
  );

drop policy if exists "profiles_select_coach_athletes" on public.profiles;

create policy "profiles_select_coach_athletes"
  on public.profiles for select
  using (
    role = 'atleta'
    and coach_id = auth.uid()
  );

drop policy if exists "profiles_athlete_read_linked_coaches" on public.profiles;

create policy "profiles_athlete_read_linked_coaches"
  on public.profiles for select
  using (
    role = 'treinador'
    and exists (
      select 1
      from public.coach_athlete_links cal
      where cal.coach_id = profiles.id
        and cal.athlete_id = public.get_my_athlete_id()
        and cal.status in ('pending', 'active')
    )
  );

drop policy if exists "athletes_coach_read_linked" on public.athletes;

create policy "athletes_coach_read_linked"
  on public.athletes for select
  using (
    exists (
      select 1
      from public.coach_athlete_links cal
      where cal.athlete_id = athletes.id
        and cal.coach_id = auth.uid()
        and cal.status in ('pending', 'active', 'revoked')
    )
  );
