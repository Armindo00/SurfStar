# SurfStar — Supabase migrations

Run **in this order** in Supabase → SQL Editor (once per project):

| # | File | Purpose |
|---|------|---------|
| 1 | `schema.sql` | Base tables, profiles, sessions, RLS |
| 2 | `fix-missing-profiles.sql` | Profile bootstrap RPCs |
| 3 | `add-coach-athlete-pairing.sql` | Pairing + RPCs |
| 4 | `fix-rls-pairing-policies.sql` | RLS recursion fixes |
| 5 | `add-athlete-management.sql` | Password / athlete management |
| 6 | `add-athlete-share-settings.sql` | Share settings columns |
| 7 | `fix-pairing-share-settings.sql` | Share settings fixes |
| 8 | `add-subscriptions.sql` | Plans + subscriptions table |
| 9 | `fix-subscription-security.sql` | **Production:** secure billing, limits, demo flag |

## Production billing

1. Deploy Edge Function: `supabase/functions/stripe-webhook`
2. Set secrets (Stripe + service role + payment link IDs)
3. Stripe webhook URL: `https://<project>.supabase.co/functions/v1/stripe-webhook`
4. Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
5. Payment Links must pass `client_reference_id` (coach UUID) — app adds this automatically
6. Keep `app_settings.demo_subscriptions = false` in production

## Dev / demo without Stripe

```sql
update public.app_settings set value = 'true'::jsonb where key = 'demo_subscriptions';
```

Set `VITE_DEMO_SUBSCRIPTION=true` in `.env` for the checkout demo button.
