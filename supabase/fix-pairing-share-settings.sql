-- Run this if add-coach-athlete-pairing.sql failed on share_settings
-- Supabase → SQL → New query

alter table public.athletes
  add column if not exists share_settings jsonb not null default '{}'::jsonb;

alter table public.athletes
  add column if not exists blocked boolean not null default false;

alter table public.profiles
  add column if not exists must_change_password boolean not null default false;

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
