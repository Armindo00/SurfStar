-- SurfStar: verifica quais migrations SQL ja foram corridas
-- Supabase → SQL Editor → cola ISTO → Run

create temp table if not exists _surfstar_migration_check (
  ordem int,
  ficheiro text,
  estado text,
  o_que_verifica text
);

truncate _surfstar_migration_check;

insert into _surfstar_migration_check values
(
  1,
  'schema.sql',
  case when exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'profiles'
  ) and exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'training_sessions'
  )
  then 'OK' else 'FALTA' end,
  'Tabelas base: profiles, training_sessions'
),
(
  2,
  'fix-missing-profiles.sql',
  case when exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'ensure_my_profile'
  )
  then 'OK' else 'FALTA' end,
  'Funcao ensure_my_profile'
),
(
  3,
  'add-coach-athlete-pairing.sql',
  case when exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'coach_athlete_links'
  )
  then 'OK' else 'FALTA' end,
  'Tabela coach_athlete_links (pairing)'
),
(
  4,
  'fix-rls-pairing-policies.sql',
  case when exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'get_my_athlete_id'
  )
  then 'OK' else 'FALTA' end,
  'Funcao get_my_athlete_id'
),
(
  5,
  'add-athlete-management.sql',
  case when exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'clear_must_change_password'
  )
  then 'OK' else 'FALTA' end,
  'Funcao clear_must_change_password'
),
(
  6,
  'add-athlete-share-settings.sql',
  case when exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'athletes' and column_name = 'share_settings'
  )
  then 'OK' else 'FALTA' end,
  'Coluna athletes.share_settings'
),
(
  7,
  'fix-pairing-share-settings.sql',
  case when exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'coach_athlete_links' and column_name = 'share_settings'
  )
  then 'OK' else 'FALTA' end,
  'Coluna coach_athlete_links.share_settings'
),
(
  8,
  'add-subscriptions.sql',
  case when exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'coach_subscriptions'
  )
  then 'OK' else 'FALTA' end,
  'Tabelas subscription_plans + coach_subscriptions'
),
(
  9,
  'fix-subscription-security.sql',
  case when exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'app_settings'
  ) and exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'create_pending_coach_subscription'
  )
  then 'OK' else 'FALTA' end,
  'app_settings + create_pending_coach_subscription'
);

-- Passo 10: so verifica se a tabela app_settings ja existe
do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'app_settings'
  ) then
    insert into _surfstar_migration_check values (
      10, 'enable-demo-mode.sql', 'FALTA',
      'Primeiro corre fix-subscription-security.sql (passo 9)'
    );
  elsif exists (
    select 1 from public.app_settings
    where key = 'demo_subscriptions'
      and coalesce(value #>> '{}', 'false') = 'true'
  ) then
    insert into _surfstar_migration_check values (
      10, 'enable-demo-mode.sql', 'OK', 'Demo activo (checkout sem Stripe)'
    );
  else
    insert into _surfstar_migration_check values (
      10, 'enable-demo-mode.sql', 'FALTA', 'Corre enable-demo-mode.sql'
    );
  end if;
end $$;

select ordem, ficheiro, estado, o_que_verifica
from _surfstar_migration_check
order by ordem;

-- Corre APENAS os ficheiros com estado FALTA, por ordem (1 → 10)
