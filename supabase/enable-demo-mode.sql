-- SurfStar: activar subscrições demo (sem Stripe)
-- Corre ISTO so depois de fix-subscription-security.sql

update public.app_settings
set value = 'true'::jsonb
where key = 'demo_subscriptions';
