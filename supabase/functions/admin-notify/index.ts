// Supabase Edge Function — instant admin email alerts
// Deploy: supabase functions deploy admin-notify --no-verify-jwt
// Secrets: same SMTP + CRON_SECRET as subscription-renewal-cron
// Triggered via pg_net when admin_notify_webhook is enabled in app_settings

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

type EventType = 'payment_request' | 'team_academy_request' | 'contact_message'

type NotificationRow = {
  id: string
  event_type: EventType
  source_id: string
  payload: Record<string, unknown>
  created_at: string
  email_sent_at?: string | null
}

const PLAN_LABELS: Record<string, string> = {
  team: 'Coach (€49/mo)',
  club: 'Coach Premium (€89/mo)',
  organization: 'Team Academy (€179/mo)',
}

const CONTACT_KIND_LABELS: Record<string, string> = {
  feedback: 'Feedback',
  support: 'Support',
  bug: 'Bug report',
  billing: 'Billing',
  other: 'Other',
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

function formatDate(iso: unknown): string {
  if (!iso) return '—'
  return new Date(String(iso)).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function buildAdminEmail(notification: NotificationRow): { subject: string; html: string; text: string } {
  const p = notification.payload
  const created = formatDate(p.created_at ?? notification.created_at)

  if (notification.event_type === 'contact_message') {
    const kind = CONTACT_KIND_LABELS[asString(p.kind)] ?? asString(p.kind)
    const subject = `[SurfStar] New contact message — ${asString(p.subject)}`
    const text = [
      'New contact message on SurfStar',
      '',
      `Type: ${kind}`,
      `From: ${asString(p.name)} <${asString(p.email)}>`,
      p.user_role ? `Role: ${asString(p.user_role)}` : '',
      `Subject: ${asString(p.subject)}`,
      `Received: ${created}`,
      '',
      asString(p.message),
      '',
      'Open Admin → Contact in the SurfStar app to respond.',
    ]
      .filter(Boolean)
      .join('\n')

    const html = `<div style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;max-width:640px;">
      <h2 style="margin:0 0 0.75rem;">New contact message</h2>
      <table style="border-collapse:collapse;width:100%;margin-bottom:1rem;">
        <tr><td style="padding:0.25rem 0.75rem 0.25rem 0;color:#666;">Type</td><td><strong>${escapeHtml(kind)}</strong></td></tr>
        <tr><td style="padding:0.25rem 0.75rem 0.25rem 0;color:#666;">From</td><td>${escapeHtml(asString(p.name))} &lt;${escapeHtml(asString(p.email))}&gt;</td></tr>
        ${p.user_role ? `<tr><td style="padding:0.25rem 0.75rem 0.25rem 0;color:#666;">Role</td><td>${escapeHtml(asString(p.user_role))}</td></tr>` : ''}
        <tr><td style="padding:0.25rem 0.75rem 0.25rem 0;color:#666;">Subject</td><td>${escapeHtml(asString(p.subject))}</td></tr>
        <tr><td style="padding:0.25rem 0.75rem 0.25rem 0;color:#666;">Received</td><td>${escapeHtml(created)}</td></tr>
      </table>
      <div style="background:#f4f4f5;border-radius:8px;padding:1rem;white-space:pre-wrap;">${escapeHtml(asString(p.message))}</div>
      <p style="margin-top:1rem;color:#666;">Open <strong>Admin → Contact</strong> in the SurfStar app.</p>
    </div>`

    return { subject, html, text }
  }

  const isTeamAcademy = notification.event_type === 'team_academy_request'
  const planLabel = PLAN_LABELS[asString(p.plan_id)] ?? asString(p.plan_id)
  const interval = asString(p.billing_interval) === 'annual' ? 'Annual' : 'Monthly'
  const subject = isTeamAcademy
    ? `[SurfStar] New Team Academy request — ${asString(p.organization_name)}`
    : `[SurfStar] New payment request — ${planLabel}`

  const addressParts = [
    asString(p.billing_street),
    asString(p.billing_address_line2),
    [asString(p.billing_postal_code), asString(p.billing_city)].filter(Boolean).join(' '),
    asString(p.billing_region),
    asString(p.billing_country),
  ].filter(Boolean)

  const text = [
    isTeamAcademy ? 'New Team Academy access request' : 'New coach payment request',
    '',
    `Contact: ${asString(p.contact_name)}`,
    `Email: ${asString(p.email)}`,
    `Organization: ${asString(p.organization_name)}`,
    `Plan: ${planLabel}`,
    `Billing: ${interval}`,
    p.coaches_count ? `Coaches needed: ${asString(p.coaches_count)}` : '',
    p.tax_id ? `Tax ID / VAT: ${asString(p.tax_id)}` : '',
    addressParts.length ? `Billing address: ${addressParts.join(', ')}` : '',
    `Submitted: ${created}`,
    '',
    p.message ? `Message:\n${asString(p.message)}` : '',
    '',
    'Open Admin → Payments in the SurfStar app to review.',
  ]
    .filter(Boolean)
    .join('\n')

  const html = `<div style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;max-width:640px;">
    <h2 style="margin:0 0 0.75rem;">${isTeamAcademy ? 'New Team Academy request' : 'New payment request'}</h2>
    <table style="border-collapse:collapse;width:100%;margin-bottom:1rem;">
      <tr><td style="padding:0.25rem 0.75rem 0.25rem 0;color:#666;">Contact</td><td><strong>${escapeHtml(asString(p.contact_name))}</strong></td></tr>
      <tr><td style="padding:0.25rem 0.75rem 0.25rem 0;color:#666;">Email</td><td><a href="mailto:${escapeHtml(asString(p.email))}">${escapeHtml(asString(p.email))}</a></td></tr>
      <tr><td style="padding:0.25rem 0.75rem 0.25rem 0;color:#666;">Organization</td><td>${escapeHtml(asString(p.organization_name))}</td></tr>
      <tr><td style="padding:0.25rem 0.75rem 0.25rem 0;color:#666;">Plan</td><td>${escapeHtml(planLabel)}</td></tr>
      <tr><td style="padding:0.25rem 0.75rem 0.25rem 0;color:#666;">Billing</td><td>${escapeHtml(interval)}</td></tr>
      ${p.coaches_count ? `<tr><td style="padding:0.25rem 0.75rem 0.25rem 0;color:#666;">Coaches</td><td>${escapeHtml(asString(p.coaches_count))}</td></tr>` : ''}
      ${p.tax_id ? `<tr><td style="padding:0.25rem 0.75rem 0.25rem 0;color:#666;">Tax ID</td><td>${escapeHtml(asString(p.tax_id))}</td></tr>` : ''}
      ${addressParts.length ? `<tr><td style="padding:0.25rem 0.75rem 0.25rem 0;color:#666;">Address</td><td>${escapeHtml(addressParts.join(', '))}</td></tr>` : ''}
      <tr><td style="padding:0.25rem 0.75rem 0.25rem 0;color:#666;">Submitted</td><td>${escapeHtml(created)}</td></tr>
    </table>
    ${p.message ? `<div style="background:#f4f4f5;border-radius:8px;padding:1rem;white-space:pre-wrap;margin-bottom:1rem;">${escapeHtml(asString(p.message))}</div>` : ''}
    <p style="margin-top:1rem;color:#666;">Open <strong>Admin → Payments</strong> in the SurfStar app.</p>
  </div>`

  return { subject, html, text }
}

async function loadNotifications(
  supabase: ReturnType<typeof createClient>,
  notificationId?: string,
): Promise<{ adminEmails: string[]; rows: NotificationRow[]; error?: string }> {
  if (notificationId) {
    const { data, error } = await supabase.rpc('fetch_admin_notification', {
      p_notification_id: notificationId,
    })
    if (error || !data?.ok) {
      return { adminEmails: [], rows: [], error: error?.message ?? data?.error ?? 'Fetch failed' }
    }
    const row = data.notification as NotificationRow
    if (row.email_sent_at) {
      return { adminEmails: [], rows: [], error: 'Already sent' }
    }
    return {
      adminEmails: (data.admin_emails as string[]) ?? [],
      rows: [row],
    }
  }

  const { data, error } = await supabase.rpc('fetch_pending_admin_notifications', { p_limit: 20 })
  if (error || !data?.ok) {
    return { adminEmails: [], rows: [], error: error?.message ?? 'Fetch failed' }
  }
  return {
    adminEmails: (data.admin_emails as string[]) ?? [],
    rows: (data.notifications as NotificationRow[]) ?? [],
  }
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
  const { adminEmails, rows, error } = await loadNotifications(supabase, notificationId)

  if (error && rows.length === 0) {
    const status = error === 'Already sent' ? 200 : 500
    return new Response(JSON.stringify({ ok: error === 'Already sent', error, emails_sent: 0 }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (adminEmails.length === 0) {
    return new Response(JSON.stringify({ ok: false, error: 'No admin emails configured' }), {
      status: 500,
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
    const { subject, html, text } = buildAdminEmail(row)
    try {
      for (const adminEmail of adminEmails) {
        await client.send({
          from: `${smtpFromName} <${smtpFrom}>`,
          to: adminEmail,
          subject,
          content: text,
          html,
        })
      }

      const { error: markError } = await supabase.rpc('mark_admin_notification_sent', {
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
      console.error('SMTP send failed', row.id, message)
      await supabase.rpc('mark_admin_notification_sent', {
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
