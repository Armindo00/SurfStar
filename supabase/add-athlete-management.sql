-- Run once in Supabase → SQL Editor (project SurfStar)
-- Adds athlete block, first-login password change, and safe delete for mistaken adds

alter table public.athletes
  add column if not exists blocked boolean not null default false;

alter table public.profiles
  add column if not exists must_change_password boolean not null default false;

-- New athlete accounts must change password on first login
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
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
    v_role = 'atleta'
  );

  return new;
end;
$$;

-- Coach can delete an athlete only if they have no training sessions (added by mistake)
create or replace function public.coach_delete_athlete(p_athlete_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coach_id uuid;
  v_profile_id uuid;
  v_session_count int;
begin
  select coach_id into v_coach_id
  from public.athletes
  where id = p_athlete_id;

  if v_coach_id is null then
    return json_build_object('ok', false, 'error', 'Athlete not found.');
  end if;

  if v_coach_id <> auth.uid() then
    return json_build_object('ok', false, 'error', 'Not allowed.');
  end if;

  select count(*)::int into v_session_count
  from public.training_sessions
  where coach_id = auth.uid()
    and (payload->'athleteIds') @> to_jsonb(p_athlete_id::text);

  if v_session_count > 0 then
    return json_build_object(
      'ok',
      false,
      'error',
      'This athlete has training sessions and cannot be deleted. Use Block instead.'
    );
  end if;

  select id into v_profile_id
  from public.profiles
  where athlete_id = p_athlete_id
    and role = 'atleta';

  delete from public.athletes where id = p_athlete_id;

  if v_profile_id is not null then
    delete from auth.users where id = v_profile_id;
  end if;

  return json_build_object('ok', true);
end;
$$;

grant execute on function public.coach_delete_athlete(uuid) to authenticated;

create or replace function public.clear_must_change_password()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set must_change_password = false
  where id = auth.uid();
end;
$$;

grant execute on function public.clear_must_change_password() to authenticated;
