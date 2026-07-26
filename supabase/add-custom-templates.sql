-- Custom training templates per coach (SurfStar)
-- Run after schema.sql / add-subscriptions.sql

create table if not exists public.custom_training_templates (
  id uuid primary key,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists custom_training_templates_coach_idx
  on public.custom_training_templates (coach_id);

alter table public.custom_training_templates enable row level security;

drop policy if exists "custom_templates_select_own" on public.custom_training_templates;
create policy "custom_templates_select_own"
  on public.custom_training_templates for select
  using (coach_id = auth.uid());

drop policy if exists "custom_templates_insert_own" on public.custom_training_templates;
create policy "custom_templates_insert_own"
  on public.custom_training_templates for insert
  with check (coach_id = auth.uid());

drop policy if exists "custom_templates_update_own" on public.custom_training_templates;
create policy "custom_templates_update_own"
  on public.custom_training_templates for update
  using (coach_id = auth.uid());

drop policy if exists "custom_templates_delete_own" on public.custom_training_templates;
create policy "custom_templates_delete_own"
  on public.custom_training_templates for delete
  using (coach_id = auth.uid());
