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
),
(
  10,
  'add-custom-templates.sql',
  case when exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'custom_training_templates'
  )
  then 'OK' else 'FALTA' end,
  'Tabela custom_training_templates'
),
(
  11,
  'add-organizations.sql',
  case when exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'organizations'
  )
  then 'OK' else 'FALTA' end,
  'Tabela organizations (Team Academy)'
),
(
  12,
  'add-organization-plan-requests.sql',
  case when exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'organization_plan_requests'
  )
  then 'OK' else 'FALTA' end,
  'Tabela organization_plan_requests'
),
(
  13,
  'add-platform-admin.sql',
  case when exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'is_platform_admin'
  ) and exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'admin_get_dashboard_stats'
  )
  then 'OK' else 'FALTA' end,
  'Coluna profiles.is_platform_admin + RPC admin_get_dashboard_stats'
),
(
  14,
  'add-athlete-equipment-feedback.sql',
  case when exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'athlete_boards'
  ) and exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'session_athlete_feedback'
  )
  then 'OK' else 'FALTA' end,
  'Tabelas athlete_boards + session_athlete_feedback'
),
(
  15,
  'add-contact-messages.sql',
  case when exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'contact_messages'
  ) and exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'submit_contact_message'
  )
  then 'OK' else 'FALTA' end,
  'Tabela contact_messages + RPC submit_contact_message'
);

-- Passo 16 (opcional): demo mode para checkout sem Stripe
do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'app_settings'
  ) then
    insert into _surfstar_migration_check values (
      16, 'enable-demo-mode.sql', 'FALTA',
      'Primeiro corre fix-subscription-security.sql (passo 9)'
    );
  elsif exists (
    select 1 from public.app_settings
    where key = 'demo_subscriptions'
      and coalesce(value #>> '{}', 'false') = 'true'
  ) then
    insert into _surfstar_migration_check values (
      16, 'enable-demo-mode.sql', 'OK', 'Demo activo (checkout sem Stripe)'
    );
  else
    insert into _surfstar_migration_check values (
      16, 'enable-demo-mode.sql', 'FALTA', 'Corre enable-demo-mode.sql (opcional)'
    );
  end if;
end $$;

select ordem, ficheiro, estado, o_que_verifica
from _surfstar_migration_check
order by ordem;

-- Corre APENAS os ficheiros com estado FALTA, por ordem (1 → 15)
