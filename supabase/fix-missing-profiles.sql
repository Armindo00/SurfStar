-- Run once in Supabase → SQL Editor (project SurfStar)
-- Fixes: "Signed in but profile is missing"

-- Helper used by the app after login
create or replace function public.ensure_my_profile()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  u auth.users%rowtype;
begin
  select * into u from auth.users where id = auth.uid();
  if not found then
    return;
  end if;

  insert into public.profiles (id, role, name, email, coach_id, athlete_id)
  values (
    u.id,
    coalesce(u.raw_user_meta_data->>'role', 'treinador'),
    coalesce(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
    lower(u.email),
    nullif(u.raw_user_meta_data->>'coach_id', '')::uuid,
    nullif(u.raw_user_meta_data->>'athlete_id', '')::uuid
  )
  on conflict (id) do nothing;
end;
$$;

grant execute on function public.ensure_my_profile() to authenticated;

create or replace function public.get_my_profile()
returns setof public.profiles
language sql
security definer
set search_path = public
stable
as $$
  select * from public.profiles where id = auth.uid();
$$;

grant execute on function public.get_my_profile() to authenticated;

-- Backfill all auth users missing a profile
insert into public.profiles (id, role, name, email, coach_id, athlete_id)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'role', 'treinador'),
  coalesce(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  lower(u.email),
  nullif(u.raw_user_meta_data->>'coach_id', '')::uuid,
  nullif(u.raw_user_meta_data->>'athlete_id', '')::uuid
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

insert into public.spots (coach_id, name)
select p.id, 'Home break'
from public.profiles p
where p.role = 'treinador'
  and not exists (select 1 from public.spots s where s.coach_id = p.id);

insert into public.coach_conditions (coach_id, label)
select p.id, c.label
from public.profiles p
cross join (
  values ('Clean'), ('Onshore'), ('Offshore'), ('Choppy'), ('Glassy'), ('Average')
) as c(label)
where p.role = 'treinador'
  and not exists (select 1 from public.coach_conditions cc where cc.coach_id = p.id);
