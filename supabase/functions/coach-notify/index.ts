// Supabase Edge Function — coach transactional emails (manual billing)
// Deploy: supabase functions deploy coach-notify --no-verify-jwt
// Secrets: same SMTP + CRON_SECRET as admin-notify / subscription-renewal-cron

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

type EventType =
  | 'plan_request_received'
  | 'plan_request_approved'
  | 'plan_request_rejected'
  | 'plan_account_activated'

type NotificationRow = {
  id: string
  event_type: EventType
  coach_email: string
  payload: Record<string, unknown>
  created_at: string
  email_sent_at?: string | null
}

type PaymentDetails = {
  account_name?: string
  iban?: string
  mbway?: string
  payment_reference_hint?: string
}

const PLAN_PRICES: Record<string, { monthly: number; annual: number; label: string }> = {
  team: { monthly: 49, annual: 490, label: 'Coach' },
  club: { monthly: 89, annual: 890, label: 'Coach Premium' },
  organization: { monthly: 179, annual: 1790, label: 'Team Academy' },
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function asString(value: unknown): string {
  if (value == null) return ''
  return String(value)
}

function planAmount(planId: string, interval: string): string {
  const plan = PLAN_PRICES[planId] ?? PLAN_PRICES.team
  if (interval === 'annual') return `€${plan.annual}/year`
  return `€${plan.monthly}/month`
}

function planLabel(planId: string): string {
  return PLAN_PRICES[planId]?.label ?? planId
}

function paymentDetailsBlock(details: PaymentDetails, contactEmail: string): { html: string; text: string } {
  const iban = asString(details.iban).trim()
  const mbway = asString(details.mbway).trim()
  const accountName = asString(details.account_name).trim() || 'SurfStar'
  const hint =
    asString(details.payment_reference_hint).trim() ||
    'Use your registered email as the payment reference.'

  if (!iban && !mbway) {
    const text = [
      'Payment details will be sent separately. If you do not receive them within 2 business days, email',
      contactEmail,
    ].join(' ')
    return {
      text,
      html: `<p>${escapeHtml(text)}</p>`,
    }
  }

  const lines = [
    `Account name: ${accountName}`,
    iban ? `IBAN: ${iban}` : '',
    mbway ? `MB Way: ${mbway}` : '',
    hint,
  ].filter(Boolean)

  const html = `<div style="background:#f4f4f5;border-radius:8px;padding:1rem;margin:1rem 0;">
    <p style="margin:0 0 0.5rem;"><strong>Payment details</strong></p>
    <ul style="margin:0;padding-left:1.2rem;line-height:1.6;">
      <li>Account name: <strong>${escapeHtml(accountName)}</strong></li>
      ${iban ? `<li>IBAN: <strong>${escapeHtml(iban)}</strong></li>` : ''}
      ${mbway ? `<li>MB Way: <strong>${escapeHtml(mbway)}</strong></li>` : ''}
      <li>${escapeHtml(hint)}</li>
    </ul>
  </div>`

  return { html, text: lines.join('\n') }
}

function buildCoachEmail(notification: NotificationRow): { subject: string; html: string; text: string } {
  const p = notification.payload
  const name = asString(p.contact_name) || 'Coach'
  const org = asString(p.organization_name)
  const plan = planLabel(asString(p.plan_id))
  const amount = planAmount(asString(p.plan_id), asString(p.billing_interval))
  const contactEmail = asString(p.contact_email) || smtpFrom
  const details = (p.payment_details ?? {}) as PaymentDetails
  const pay = paymentDetailsBlock(details, contactEmail)

  switch (notification.event_type) {
    case 'plan_request_received': {
      const subject = 'SurfStar — we received your plan request'
      const text = [
        `Hi ${name},`,
        '',
        'Thank you for your SurfStar plan request.',
        '',
        `Organization: ${org}`,
        `Plan: ${plan} (${amount})`,
        '',
        'Our team will review your request within 2 business days.',
        'You will receive another email with payment instructions once approved.',
        '',
        'Do not create a second account.',
        '',
        `Questions? ${contactEmail}`,
        '',
        '— SurfStar',
      ].join('\n')
      const html = `<div style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;max-width:640px;">
        <p>Hi ${escapeHtml(name)},</p>
        <p>Thank you for your SurfStar plan request.</p>
        <ul style="line-height:1.8;">
          <li><strong>Organization:</strong> ${escapeHtml(org)}</li>
          <li><strong>Plan:</strong> ${escapeHtml(plan)} (${escapeHtml(amount)})</li>
        </ul>
        <p>Our team will review your request within <strong>2 business days</strong>. You will receive payment instructions by email once approved.</p>
        <p style="color:#666;">Do not create a second account.</p>
        <p>Questions? <a href="mailto:${escapeHtml(contactEmail)}">${escapeHtml(contactEmail)}</a></p>
        <p>— SurfStar</p>
      </div>`
      return { subject, html, text }
    }

    case 'plan_request_approved': {
      const subject = 'SurfStar — payment instructions for your subscription'
      const text = [
        `Hi ${name},`,
        '',
        'Your SurfStar plan request has been approved.',
        '',
        `Plan: ${plan} (${amount})`,
        '',
        pay.text,
        '',
        'After paying, wait for us to confirm your payment and activate your account (usually within 1 business day).',
        'You will receive a final email when your account is active.',
        '',
        `Questions? ${contactEmail}`,
        '',
        '— SurfStar',
      ].join('\n')
      const html = `<div style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;max-width:640px;">
        <p>Hi ${escapeHtml(name)},</p>
        <p>Your SurfStar plan request has been <strong>approved</strong>.</p>
        <p><strong>Plan:</strong> ${escapeHtml(plan)} (${escapeHtml(amount)})</p>
        ${pay.html}
        <p>After paying, wait for us to confirm your payment and activate your account (usually within 1 business day). You will receive a final email when access is open.</p>
        <p>Questions? <a href="mailto:${escapeHtml(contactEmail)}">${escapeHtml(contactEmail)}</a></p>
        <p>— SurfStar</p>
      </div>`
      return { subject, html, text }
    }

    case 'plan_request_rejected': {
      const subject = 'SurfStar — update on your plan request'
      const text = [
        `Hi ${name},`,
        '',
        'Unfortunately we could not approve your SurfStar plan request at this time.',
        '',
        `If you believe this is a mistake, contact us at ${contactEmail}.`,
        '',
        '— SurfStar',
      ].join('\n')
      const html = `<div style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;max-width:640px;">
        <p>Hi ${escapeHtml(name)},</p>
        <p>Unfortunately we could not approve your SurfStar plan request at this time.</p>
        <p>If you believe this is a mistake, contact <a href="mailto:${escapeHtml(contactEmail)}">${escapeHtml(contactEmail)}</a>.</p>
        <p>— SurfStar</p>
      </div>`
      return { subject, html, text }
    }

    case 'plan_account_activated': {
      const subject = 'SurfStar — your account is active'
      const text = [
        `Hi ${name},`,
        '',
        'Your payment has been confirmed and your SurfStar coach account is now active.',
        '',
        `Plan: ${plan} (${amount})`,
        '',
        'Sign in at https://www.surfstar.app to start coaching.',
        '',
        '— SurfStar',
      ].join('\n')
      const html = `<div style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;max-width:640px;">
        <p>Hi ${escapeHtml(name)},</p>
        <p>Your payment has been confirmed and your SurfStar coach account is <strong>now active</strong>.</p>
        <p><strong>Plan:</strong> ${escapeHtml(plan)} (${escapeHtml(amount)})</p>
        <p><a href="https://www.surfstar.app" style="display:inline-block;background:#c9a227;color:#111;padding:0.6rem 1.2rem;border-radius:6px;text-decoration:none;font-weight:600;">Sign in to SurfStar</a></p>
        <p>— SurfStar</p>
      </div>`
      return { subject, html, text }
    }
  }
}

async function loadNotifications(
  supabase: ReturnType<typeof createClient>,
  notificationId?: string,
): Promise<{ rows: NotificationRow[]; error?: string }> {
  if (notificationId) {
    const { data, error } = await supabase.rpc('fetch_coach_notification', {
      p_notification_id: notificationId,
    })
    if (error || !data?.ok) {
      return { rows: [], error: error?.message ?? data?.error ?? 'Fetch failed' }
    }
    const row = data.notification as NotificationRow
    if (row.email_sent_at) return { rows: [], error: 'Already sent' }
    return { rows: [row] }
  }

  const { data, error } = await supabase.rpc('fetch_pending_coach_notifications', { p_limit: 20 })
  if (error || !data?.ok) {
    return { rows: [], error: error?.message ?? 'Fetch failed' }
  }
  return { rows: (data.notifications as NotificationRow[]) ?? [] }
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

  let notificationId: string | undefined
  if (req.method === 'POST') {
    try {
      const body = await req.json()
      notificationId = typeof body?.notification_id === 'string' ? body.notification_id : undefined
    } catch {
      /* process all pending */
    }
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const { rows, error } = await loadNotifications(supabase, notificationId)

  if (error && rows.length === 0) {
    const status = error === 'Already sent' ? 200 : 500
    return new Response(JSON.stringify({ ok: error === 'Already sent', error, emails_sent: 0 }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (rows.length === 0) {
    return new Response(JSON.stringify({ ok: true, emails_sent: 0, emails_failed: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const client = new SMTPClient({
    connection: {
      hostname: smtpHost,
      port: smtpPort,
      tls: true,
      auth: { username: smtpUser, password: smtpPass },
    },
  })

  let sent = 0
  let failed = 0

  for (const row of rows) {
    const { subject, html, text } = buildCoachEmail(row)
    try {
      await client.send({
        from: `${smtpFromName} <${smtpFrom}>`,
        to: row.coach_email,
        subject,
        content: text,
        html,
      })

      const { error: markError } = await supabase.rpc('mark_coach_notification_sent', {
        p_notification_id: row.id,
      })

      if (markError) {
        console.error('Failed to mark sent', row.id, markError.message)
        failed++
      } else {
        sent++
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('SMTP send failed', row.coach_email, message)
      await supabase.rpc('mark_coach_notification_sent', {
        p_notification_id: row.id,
        p_error: message,
      })
      failed++
    }
  }

  try {
    await client.close()
  } catch {
    /* ignore */
  }

  return new Response(
    JSON.stringify({ ok: true, emails_sent: sent, emails_failed: failed }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
