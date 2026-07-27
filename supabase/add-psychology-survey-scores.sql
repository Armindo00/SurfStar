-- Run once in Supabase → SQL Editor (SurfStar)
-- Adds 0-5 psychology survey scores to post-session athlete feedback

alter table public.session_athlete_feedback
  add column if not exists psychology_scores jsonb;

alter table public.session_athlete_feedback
  alter column mental_state drop not null;

comment on column public.session_athlete_feedback.psychology_scores is
  'Post-session 0-5 psychology questionnaire scores (mood, confidence, focus, etc.)';
