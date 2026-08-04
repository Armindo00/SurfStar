-- Run once in Supabase → SQL Editor (SurfStar)
-- Store board length as feet + inches (e.g. 5'8") instead of centimeters.

alter table public.athlete_boards
  add column if not exists length_feet smallint,
  add column if not exists length_inches numeric(4, 2);

update public.athlete_boards
set
  length_feet = floor((length_cm / 2.54) / 12)::smallint,
  length_inches = round(mod(length_cm / 2.54, 12)::numeric, 2)
where length_cm is not null
  and length_feet is null
  and length_inches is null;
