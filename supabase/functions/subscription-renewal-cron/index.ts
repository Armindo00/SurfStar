// Supabase Edge Function — daily subscription renewal emails + auto-block
// Deploy: supabase functions deploy subscription-renewal-cron --no-verify-jwt
// Schedule: Supabase Dashboard → Edge Functions → subscription-renewal-cron → Cron (daily 09:00 UTC)
// Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET,
//          SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, SMTP_FROM_NAME

import { createClient } from 'npm:@supabase/supabase-js@2.49.1'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

const cronSecret = Deno.env.get('CRON_SECRET')
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const smtpHost = Deno.env.get('SMTP_HOST') ?? 'smtp-pt.securemail.pro'
const smtpPort = Number(Deno.env.get('SMTP_PORT') ?? '465')
const smtpUser = Deno.env.get('SMTP_USER')
const smtpPass = Deno.env.get('SMTP_PASSWORD')
const smtpFrom = Deno.env.get('SMTP_FROM') ?? 'contact@surfstar.app'
const smtpFromName = Deno.env.get('SMTP_FROM_NAME') ?? 'SurfStar'
const contactEmail = smtpFrom

type ReminderType = 'due_5d' | 'due_1d' | 'expired'

type ReminderRow = {
  reminder_id: string
  reminder_type: ReminderType
  coach_id: string
  name: string
  email: string
  plan_id: string
  plan_name: string
  billing_interval: string
  price_cents: number
  currency: string
  period_end: string
  organization_name: string | null
}

type LifecycleResult = {
  ok: boolean
  blocked_accounts?: number
  pending_emails?: ReminderRow[]
}

const PLAN_LABELS: Record<string, string> = {
  team: 'Coach',
  club: 'Coach Premium',
  organization: 'Team Academy',
}

function planLabel(row: ReminderRow): string {
  return PLAN_LABELS[row.plan_id] ?? row.plan_name ?? row.plan_id
}

function formatAmount(row: ReminderRow): string {
  const monthly = row.price_cents / 100
  if (row.billing_interval === 'annual') {
    return `€${(monthly * 10).toFixed(0)}/year`
  }
  return `€${monthly.toFixed(0)}/month`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function consequencesBlock(): string {
  return `<ul style="margin:0.5rem 0;padding-left:1.2rem;line-height:1.6;">
    <li>Your coach account will be <strong>blocked</strong></li>
    <li>You will <strong>lose access</strong> to SurfStar until payment is confirmed</li>
    <li>Athletes linked to your organization may lose access to shared sessions and stats</li>
  </ul>`
}

function buildEmail(row: ReminderRow): { subject: string; html: string; text: string } {
  const plan = planLabel(row)
  const amount = formatAmount(row)
  const renewalDate = formatDate(row.period_end)
  const orgLine = row.organization_name ? `<p>Organization: <strong>${row.organization_name}</strong></p>` : ''

  if (row.reminder_type === 'due_5d') {
    const subject = 'SurfStar — subscription renews in 5 days'
    const text = `Hi ${row.name},

Your SurfStar subscription (${plan}) renews on ${renewalDate} — 5 days from now.

Amount due: ${amount}

Please arrange payment (bank transfer / MB Way). We will send payment details if you need them — reply to ${contactEmail}.

If payment is not received by the renewal date:
- Your coach account will be blocked
- You will lose access to the app until payment is confirmed
- Athletes may lose access to shared data

— SurfStar
${contactEmail}`

    const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
      <h2>Subscription renews in 5 days</h2>
      <p>Hi ${row.name},</p>
      <p>Your SurfStar subscription <strong>${plan}</strong> renews on <strong>${renewalDate}</strong> (5 days from now).</p>
      ${orgLine}
      <p>Amount due: <strong>${amount}</strong> (${row.billing_interval === 'annual' ? 'annual' : 'monthly'} billing)</p>
      <p>Please arrange payment (bank transfer / MB Way). Contact us at <a href="mailto:${contactEmail}">${contactEmail}</a> if you need payment details.</p>
      <p><strong>If payment is not received by the renewal date:</strong></p>
      ${consequencesBlock()}
      <p>— SurfStar · <a href="mailto:${contactEmail}">${contactEmail}</a></p>
    </div>`

    return { subject, html, text }
  }

  if (row.reminder_type === 'due_1d') {
    const subject = 'SurfStar — subscription renews tomorrow'
    const text = `Hi ${row.name},

Your SurfStar subscription (${plan}) renews tomorrow (${renewalDate}).

Amount due: ${amount}

Please complete payment today to avoid interruption. Contact ${contactEmail} for IBAN / MB Way details.

If payment is not received:
- Your account will be blocked when the subscription expires
- Access to SurfStar will be suspended until we confirm payment

— SurfStar`

    const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
      <h2>Subscription renews tomorrow</h2>
      <p>Hi ${row.name},</p>
      <p>Your SurfStar subscription <strong>${plan}</strong> renews <strong>tomorrow (${renewalDate})</strong>.</p>
      ${orgLine}
      <p>Amount due: <strong>${amount}</strong></p>
      <p>Please complete payment today. Contact <a href="mailto:${contactEmail}">${contactEmail}</a> for payment details.</p>
      <p><strong>If payment is not received when the subscription expires:</strong></p>
      ${consequencesBlock()}
      <p>— SurfStar</p>
    </div>`

    return { subject, html, text }
  }

  const subject = 'SurfStar — subscription expired, account blocked'
  const text = `Hi ${row.name},

Your SurfStar subscription (${plan}) expired on ${renewalDate}.

Your coach account has been blocked until we confirm payment of ${amount}.

To restore access:
1. Complete the payment (bank transfer / MB Way)
2. Email ${contactEmail} with the payment reference
3. We will reactivate your account within 1 business day

— SurfStar`

  const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
    <h2>Subscription expired — account blocked</h2>
    <p>Hi ${row.name},</p>
    <p>Your SurfStar subscription <strong>${plan}</strong> expired on <strong>${renewalDate}</strong>.</p>
    ${orgLine}
    <p>Your coach account is <strong>blocked</strong> until we confirm payment of <strong>${amount}</strong>.</p>
    <p><strong>To restore access:</strong></p>
    <ol style="line-height:1.6;">
      <li>Complete payment (bank transfer / MB Way)</li>
      <li>Email <a href="mailto:${contactEmail}">${contactEmail}</a> with your payment reference</li>
      <li>We reactivate your account after confirmation (usually within 1 business day)</li>
    </ol>
    <p>— SurfStar</p>
  </div>`

  return { subject, html, text }
}

Deno.serve(async (req) => {
  if (cronSecret) {
    const auth = req.headers.get('Authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing Supabase env' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!smtpUser || !smtpPass) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing SMTP env' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const { data, error } = await supabase.rpc('run_daily_subscription_renewal_lifecycle')

  if (error || !data?.ok) {
    return new Response(
      JSON.stringify({ ok: false, error: error?.message ?? 'Lifecycle RPC failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const lifecycle = data as LifecycleResult
  const pending = lifecycle.pending_emails ?? []

  if (pending.length === 0) {
    return new Response(
      JSON.stringify({
        ok: true,
        blocked_accounts: lifecycle.blocked_accounts ?? 0,
        emails_sent: 0,
        emails_failed: 0,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  }

  const client = new SMTPClient({
    connection: {
      hostname: smtpHost,
      port: smtpPort,
      tls: true,
      auth: {
        username: smtpUser,
        password: smtpPass,
      },
    },
  })

  let sent = 0
  let failed = 0

  for (const row of pending) {
    const { subject, html, text } = buildEmail(row)
    try {
      await client.send({
        from: `${smtpFromName} <${smtpFrom}>`,
        to: row.email,
        subject,
        content: text,
        html,
      })

      const { error: markError } = await supabase.rpc('mark_subscription_renewal_email_sent', {
        p_reminder_id: row.reminder_id,
      })

      if (markError) {
        console.error('Failed to mark sent', row.reminder_id, markError.message)
        failed++
      } else {
        sent++
      }
    } catch (err) {
      console.error('SMTP send failed', row.email, err)
      failed++
    }
  }

  try {
    await client.close()
  } catch {
    /* ignore */
  }

  return new Response(
    JSON.stringify({
      ok: true,
      blocked_accounts: lifecycle.blocked_accounts ?? 0,
      emails_sent: sent,
      emails_failed: failed,
    }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
