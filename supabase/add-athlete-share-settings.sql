-- Run once in Supabase → SQL Editor (SurfStar project)
-- Adds coach-controlled sharing settings visible to athletes

alter table public.athletes
  add column if not exists share_settings jsonb not null default '{}'::jsonb;

drop policy if exists "spots_athlete_read" on public.spots;

create policy "spots_athlete_read"
  on public.spots for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.coach_id = spots.coach_id
    )
  );
