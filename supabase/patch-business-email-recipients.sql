-- Business inboxes: admin alerts + reference for COACH_NOTIFY_BCC
-- Run once in Supabase SQL Editor.

update public.app_settings
set value = '["contact@surfstar.app", "armindoapp@outlook.com"]'::jsonb
where key = 'admin_notification_emails';

insert into public.app_settings (key, value)
values (
  'coach_notify_bcc_emails',
  '["contact@surfstar.app", "armindoapp@outlook.com"]'::jsonb
)
on conflict (key) do update
set value = excluded.value;
