# Coach transactional emails (manual billing)

Automatic emails to coaches during the manual payment lifecycle:

| When | Email to coach |
|------|----------------|
| **Payment request submitted** | Request received — review within 2 business days |
| **Admin approves request** | Payment instructions (IBAN / MB Way) |
| **Admin rejects request** | Request not approved |
| **Admin confirms payment & activates** | Account is active — sign in |

Emails are sent **from** `contact@surfstar.app` **to** the coach email on the payment request.

---

## 1. Run SQL migration

In Supabase → **SQL Editor**, run:

`supabase/add-coach-notification-emails.sql`

---

## 2. Configure IBAN / MB Way

Run in **SQL Editor** (replace with your real details):

```sql
update public.app_settings
set value = jsonb_build_object(
  'account_name', 'SurfStar',
  'iban', 'PT50 XXXX XXXX XXXX XXXX XXXX X',
  'mbway', '+351 9XX XXX XXX',
  'payment_reference_hint', 'Use your registered email as the payment reference.'
)
where key = 'manual_payment_details';
```

This is included in the **approval email**. If IBAN is empty, the email tells the coach to contact support.

---

## 3. Deploy Edge Function

Uses the **same SMTP secrets** as `admin-notify`:

```bash
supabase functions deploy coach-notify --no-verify-jwt
```

---

## 4. Enable webhook (instant delivery)

Run once in **SQL Editor**:

```sql
update public.app_settings
set value = jsonb_build_object(
  'enabled', true,
  'url', 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/coach-notify',
  'secret', 'YOUR_CRON_SECRET'
)
where key = 'coach_notify_webhook';
```

Use the **same `CRON_SECRET`** as the other edge functions.

---

## 5. Manual test

Process all pending coach notifications:

```bash
curl.exe -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/coach-notify" -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## Workflow

```
Coach submits payment request
    → plan_request_received email

Admin approves (Admin → Payments)
    → plan_request_approved email (with IBAN/MB Way)

Admin confirms payment & activates
    → plan_account_activated email
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| No email on submit | SQL migration + webhook enabled? |
| Approval email without IBAN | Set `manual_payment_details` in app_settings |
| `401 Unauthorized` | Wrong CRON_SECRET |
| Row in queue, no email | Run manual curl; check Edge Function logs |

```sql
select event_type, coach_email, email_sent_at, email_error, created_at
from public.coach_notification_queue
order by created_at desc
limit 10;
```
