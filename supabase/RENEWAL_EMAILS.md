# Subscription renewal emails (automated)

Automated emails for manual billing:

| When | Email | Action |
|------|-------|--------|
| **5 days before** renewal | Warning + consequences of non-payment | — |
| **1 day before** renewal | Urgent reminder | — |
| **Subscription expired** | Account blocked notice | **Block coach account** |

When you confirm renewal payment in **Admin → Subscriptions**, the account is **automatically unblocked**.

---

## 1. Run SQL migration

In Supabase → **SQL Editor**, run:

`supabase/add-subscription-renewal-automation.sql`

---

## 2. Deploy Edge Function

Install [Supabase CLI](https://supabase.com/docs/guides/cli) and link your project:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy subscription-renewal-cron --no-verify-jwt
```

---

## 3. Set secrets (same Amen SMTP as auth emails)

```bash
supabase secrets set CRON_SECRET=your-long-random-secret
supabase secrets set SMTP_HOST=smtp-pt.securemail.pro
supabase secrets set SMTP_PORT=465
supabase secrets set SMTP_USER=contact@surfstar.app
supabase secrets set SMTP_PASSWORD=your-amen-password
supabase secrets set SMTP_FROM=contact@surfstar.app
supabase secrets set SMTP_FROM_NAME=SurfStar
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.

---

## 4. Schedule daily cron

Supabase Dashboard → **Edge Functions** → `subscription-renewal-cron` → **Schedules**

- **Cron expression:** `0 9 * * *` (every day at 09:00 UTC)
- Or use [Supabase Cron](https://supabase.com/docs/guides/functions/schedule-functions) with HTTP POST and header:
  `Authorization: Bearer YOUR_CRON_SECRET`

---

## 5. Manual test

```bash
curl -X POST "https://YOUR_PROJECT.supabase.co/functions/v1/subscription-renewal-cron" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Response example:

```json
{ "ok": true, "blocked_accounts": 0, "emails_sent": 2, "emails_failed": 0 }
```

---

## Workflow summary

```
Daily cron (09:00)
    ↓
run_daily_subscription_renewal_lifecycle()
    ↓
├── 5 days before → queue email
├── 1 day before  → queue email
└── expired       → queue email + block account + status past_due
    ↓
Send emails via Amen SMTP (contact@surfstar.app)
    ↓
Admin confirms payment → account unblocked + period extended
```

---

## Notes

- Platform admin accounts are **never** auto-blocked.
- Each reminder is sent **once per renewal period** (deduplicated in DB).
- Emails are in **English** to match the app; contact address is `contact@surfstar.app`.
