# Admin email notifications

Instant email alerts to platform admins when:

| Event | Trigger |
|-------|---------|
| **Payment request** | Coach submits checkout (Coach / Coach Premium) |
| **Team Academy request** | Organization plan request form |
| **Contact message** | Contact / feedback form |

All alerts go **only** to **`contact@surfstar.app`** (`app_settings.admin_notification_emails`).

This is separate from **`platform_admin_emails`**, which only controls who can open the Admin panel in the app (your personal login). You manage the business inbox at contact@surfstar.app; you log into Admin with your personal account.

---

## 1. Run SQL migration

In Supabase → **SQL Editor**, run:

`supabase/add-admin-notification-emails.sql`

---

## 2. Deploy Edge Function

Uses the **same SMTP secrets** as `subscription-renewal-cron`:

```bash
supabase functions deploy admin-notify --no-verify-jwt
```

If SMTP secrets are already set, skip to step 3.

---

## 3. Enable webhook (instant delivery)

Run once in **SQL Editor** (replace project ref and secret):

```sql
update public.app_settings
set value = jsonb_build_object(
  'enabled', true,
  'url', 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/admin-notify',
  'secret', 'YOUR_CRON_SECRET'
)
where key = 'admin_notify_webhook';
```

Use the **same secret** as `CRON_SECRET` on the renewal cron.

When a payment request or contact message is inserted, PostgreSQL queues it and calls the edge function via `pg_net` immediately.

---

## 4. Manual test

Process all pending notifications:

```bash
curl.exe -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/admin-notify" -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Process one notification by id:

```bash
curl.exe -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/admin-notify" -H "Authorization: Bearer YOUR_CRON_SECRET" -H "Content-Type: application/json" -d "{\"notification_id\":\"NOTIFICATION_UUID\"}"
```

Response example:

```json
{ "ok": true, "emails_sent": 1, "emails_failed": 0 }
```

---

## 5. Optional retry cron

If `pg_net` fails (rare), schedule a backup cron every 15 minutes calling `admin-notify` with no body — it processes all pending rows in `admin_notification_queue`.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| No email, row in queue | Run manual `curl` test; check Edge Function logs |
| `401 Unauthorized` | Wrong `CRON_SECRET` in webhook config or curl header |
| `No admin emails configured` | Check `app_settings.admin_notification_emails` |
| Queue empty | SQL migration not run, or triggers missing |
| Email sent but not received | Check spam; verify Amen SMTP secrets |

Check queue:

```sql
select id, event_type, email_sent_at, email_error, created_at
from public.admin_notification_queue
order by created_at desc
limit 20;
```
