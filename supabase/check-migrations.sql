-- SurfStar: verifica quais migrations SQL ja foram corridas
-- Supabase → SQL Editor → cola ISTO → Run
-- Resultado: OK = ja instalado | FALTA = corre o ficheiro indicado

select * from (
  values
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
      'Tabelas base: profiles, training_sessions, spots'
    ),
    (
      2,
      'fix-missing-profiles.sql',
      case when exists (
        select 1 from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
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
      ) and exists (
        select 1 from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = 'coach_request_pairing'
      )
      then 'OK' else 'FALTA' end,
      'Pairing: coach_athlete_links + coach_request_pairing'
    ),
    (
      4,
      'fix-rls-pairing-policies.sql',
      case when exists (
        select 1 from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = 'get_my_athlete_id'
      )
      then 'OK' else 'FALTA' end,
      'Funcao get_my_athlete_id (RLS pairing)'
    ),
    (
      5,
      'add-athlete-management.sql',
      case when exists (
        select 1 from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
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
        where table_schema = 'public'
          and table_name = 'athletes'
          and column_name = 'share_settings'
      )
      then 'OK' else 'FALTA' end,
      'Coluna athletes.share_settings'
    ),
    (
      7,
      'fix-pairing-share-settings.sql',
      case when exists (
        select 1 from information_schema.columns
        where table_schema = 'public'
          and table_name = 'coach_athlete_links'
          and column_name = 'share_settings'
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
      ) and exists (
        select 1 from information_schema.tables
        where table_schema = 'public' and table_name = 'subscription_plans'
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
        select 1 from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = 'create_pending_coach_subscription'
      )
      then 'OK' else 'FALTA' end,
      'app_settings + create_pending_coach_subscription'
    ),
    (
      10,
      'enable-demo-mode.sql',
      case when exists (
        select 1 from public.app_settings
        where key = 'demo_subscriptions'
          and coalesce(value #>> '{}', 'false') = 'true'
      )
      then 'OK' else 'FALTA' end,
      'demo_subscriptions = true (checkout demo sem Stripe)'
    )
) as t(ordem, ficheiro, estado, o_que_verifica)
order by ordem;

-- Se a linha 9 der FALTA mas a 8 der OK, corre fix-subscription-security.sql
-- Se a linha 10 der FALTA, corre enable-demo-mode.sql
-- Corre APENAS os ficheiros marcados FALTA, por ordem (1 → 10)
