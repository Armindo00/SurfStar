-- SurfStar — wipe test data for production launch
-- Run once in Supabase → SQL Editor (paste ALL of this file, then Run)
--
-- Keeps ONLY platform admin account(s) in app_settings.platform_admin_emails.
-- Deletes all other users, payment requests, contact messages, and admin test data.
--
-- ⚠️  DESTRUCTIVE — cannot be undone.

DO $$
DECLARE
  admin_id uuid;
  admin_count int;
BEGIN
  SELECT count(*) INTO admin_count
  FROM public.profiles p
  WHERE lower(p.email) IN (
    SELECT lower(trim(jsonb_array_elements_text(s.value)))
    FROM public.app_settings s
    WHERE s.key = 'platform_admin_emails'
  );

  IF admin_count = 0 THEN
    RAISE EXCEPTION 'No admin profile found. Sign in once as armindo.j.costa@hotmail.com, then re-run.';
  END IF;

  SELECT p.id INTO admin_id
  FROM public.profiles p
  WHERE lower(p.email) IN (
    SELECT lower(trim(jsonb_array_elements_text(s.value)))
    FROM public.app_settings s
    WHERE s.key = 'platform_admin_emails'
  )
  LIMIT 1;

  UPDATE public.app_settings
  SET value = 'false'::jsonb
  WHERE key = 'demo_subscriptions';

  DELETE FROM public.organization_plan_requests;
  DELETE FROM public.contact_messages;

  DELETE FROM auth.users
  WHERE id <> admin_id;

  -- Orphan athletes survive user deletes (owner_user_id ON DELETE SET NULL).
  -- Production reset: remove every athlete record.
  DELETE FROM public.session_athlete_feedback;
  DELETE FROM public.equipment_evaluations;
  DELETE FROM public.coach_athlete_links;
  DELETE FROM public.athlete_boards;
  DELETE FROM public.athlete_fins;
  DELETE FROM public.athletes;

  DELETE FROM public.organizations o
  WHERE NOT EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = o.id AND om.status = 'active'
  );

  DELETE FROM public.training_sessions WHERE coach_id = admin_id;
  DELETE FROM public.custom_training_templates WHERE coach_id = admin_id;

  DELETE FROM public.coach_subscriptions WHERE coach_id = admin_id;

  DELETE FROM public.organization_subscriptions os
  USING public.organization_members om
  WHERE om.profile_id = admin_id AND om.organization_id = os.organization_id;

  DELETE FROM public.organization_members WHERE profile_id = admin_id;
  DELETE FROM public.organizations WHERE created_by = admin_id;
  DELETE FROM public.spots WHERE coach_id = admin_id;
  DELETE FROM public.coach_conditions WHERE coach_id = admin_id;
END $$;

-- Verify (run together with the block above, or alone after cleanup succeeded)
SELECT
  (SELECT count(*) FROM auth.users) AS auth_users,
  (SELECT count(*) FROM public.profiles) AS profiles,
  (SELECT count(*) FROM public.profiles WHERE is_platform_admin) AS admins,
  (SELECT count(*) FROM public.athletes) AS athletes,
  (SELECT count(*) FROM public.organization_plan_requests) AS payment_requests,
  (SELECT value FROM public.app_settings WHERE key = 'demo_subscriptions') AS demo_subscriptions;
