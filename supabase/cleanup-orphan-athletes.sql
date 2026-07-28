-- Run in Supabase SQL Editor if cleanup left orphan athletes (safe to re-run)
DELETE FROM public.session_athlete_feedback;
DELETE FROM public.equipment_evaluations;
DELETE FROM public.coach_athlete_links;
DELETE FROM public.athlete_boards;
DELETE FROM public.athlete_fins;
DELETE FROM public.athletes;

SELECT count(*) AS athletes_remaining FROM public.athletes;
