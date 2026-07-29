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
| 10 | `add-custom-templates.sql` | Custom training templates |
| 11 | `add-organizations.sql` | Team Academy orgs, shared data, org subscriptions |
| 12 | `add-organization-plan-requests.sql` | Team Academy approval request form |
| 13 | `add-platform-admin.sql` | Admin panel, block accounts, approve requests |
| 14 | `add-athlete-equipment-feedback.sql` | Athlete quiver, coach ratings, session wellbeing feedback |
| 14b | `add-psychology-survey-scores.sql` | Post-session psychology 0–5 scores (Coach Premium+) |
| 15 | `add-contact-messages.sql` | Contact / feedback form + admin inbox |
| 16 | `add-manual-payments.sql` | **Manual billing:** payment requests for all plans, admin confirm & activate |
| 17 | `add-billing-details.sql` | NIF + billing address on signup and payment requests |
| 18 | `patch-billing-address-fields.sql` | Split address into street, postal code, city, country |
| 19 | `patch-admin-plan-display.sql` | Admin accounts: show requested plan from payment requests |
| 20 | `patch-admin-billing-management.sql` | Billing cycle on subscriptions, renewals tab, confirm renewal RPC |
| 21 | `add-subscription-renewal-automation.sql` | Auto renewal emails (5d, 1d, expired) + auto-block on expiry |
| 22 | `add-admin-notification-emails.sql` | Admin email alerts: payment requests, Team Academy, contact form |
| 23 | `add-coach-notification-emails.sql` | Coach emails: request received, payment IBAN, account activated |
| 24 | `add-coach-manual-subscription-cancel.sql` | Coach self-cancel at period end (manual billing, no Stripe) |
| 25 | `add-account-deletion.sql` | GDPR account deletion requests + admin purge (requires #22 admin notify) |

See **`supabase/RENEWAL_EMAILS.md`** for deploying the daily cron edge function.

See **`supabase/ADMIN_NOTIFY.md`** for deploying instant admin notification emails.

See **`supabase/COACH_EMAILS.md`** for deploying coach transactional emails.

## Verify migrations

Run **`supabase/check-migrations.sql`** in SQL Editor — it lists OK / FALTA for steps 1–25 (plus optional demo mode). Fix anything marked **FALTA** before launch.

## Production reset

Run `cleanup-test-data.sql` **once** before launch to delete all test users and data. Keeps only accounts in `platform_admin_emails` (default: `armindo.j.costa@hotmail.com`).

## Platform admin

1. Run `add-platform-admin.sql` after the migrations above.
2. Run `add-manual-payments.sql` for manual billing workflow (recommended at launch).
3. First admin email is stored in `app_settings.platform_admin_emails` (default: `armindo.j.costa@hotmail.com`).
4. Sign in as coach with that email → **Admin** button appears in the app header.
5. Admin can review payment requests, approve, confirm payment, and activate plans manually.

## Manual billing (initial launch)

1. Set `VITE_MANUAL_PAYMENTS=true` in Vercel / `.env`.
2. Run `add-manual-payments.sql` in Supabase.
3. Coaches register → submit payment request → admin approves → sends IBAN/MB Way → confirms payment → account activates.
4. Admin panel **Payments** tab manages the full lifecycle.

## Production billing (Stripe — later)

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
