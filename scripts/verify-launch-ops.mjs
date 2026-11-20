#!/usr/bin/env node
/**
 * Local launch-ops verifier for SurfStar (manual billing).
 *
 * Checks:
 *  1) .env / process env for production VITE_* flags
 *  2) Optional: app_settings via service role (IBAN, webhooks, demo flag)
 *  3) Optional: edge function smoke POST when CRON_SECRET is set
 *
 * Usage:
 *   npm run ops:verify
 *   npm run ops:verify -- --env .env.production.local
 *   SURFSTAR_OPS_PING=1 npm run ops:verify   # also curl edge functions
 *
 * Never prints secret values — only lengths / present flags.
 */
import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const args = process.argv.slice(2)
const envFlagIdx = args.indexOf('--env')
const envPath =
  envFlagIdx >= 0 && args[envFlagIdx + 1]
    ? resolve(args[envFlagIdx + 1])
    : resolve(process.cwd(), '.env')

function clean(raw) {
  if (raw == null) return ''
  return String(raw).trim().replace(/^['"]|['"]$/g, '')
}

function loadDotEnv(path) {
  if (!existsSync(path)) return {}
  const out = {}
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

function env(key, fileMap) {
  return clean(process.env[key] || fileMap[key] || '')
}

function status(ok, label, detail = '') {
  const mark = ok ? 'OK  ' : 'FAIL'
  console.log(`  [${mark}] ${label}${detail ? ` — ${detail}` : ''}`)
  return ok
}

function warn(label, detail = '') {
  console.log(`  [WARN] ${label}${detail ? ` — ${detail}` : ''}`)
}

function projectOrigin(raw) {
  if (!raw) return ''
  try {
    return new URL(raw).origin
  } catch {
    return ''
  }
}

function projectRefFromUrl(origin) {
  try {
    const host = new URL(origin).hostname
    return host.split('.')[0] || ''
  } catch {
    return ''
  }
}

const fileMap = loadDotEnv(envPath)
const ping = clean(process.env.SURFSTAR_OPS_PING) === '1' || args.includes('--ping')

console.log('SurfStar launch ops verify (manual billing)')
console.log(`Env file: ${existsSync(envPath) ? envPath : '(not found — using process env only)'}`)
console.log('')

let failures = 0
const fail = (...args) => {
  if (!status(...args)) failures += 1
}

console.log('1) Frontend / Vercel env')
const supabaseUrl = env('VITE_SUPABASE_URL', fileMap) || env('SUPABASE_URL', fileMap)
const anon = env('VITE_SUPABASE_ANON_KEY', fileMap)
const manual = env('VITE_MANUAL_PAYMENTS', fileMap)
const demo = env('VITE_DEMO_SUBSCRIPTION', fileMap)
const appUrl = env('VITE_APP_URL', fileMap)
const contact = env('VITE_CONTACT_EMAIL', fileMap)
const legalName = env('VITE_LEGAL_ENTITY_NAME', fileMap)
const legalNif = env('VITE_LEGAL_NIF', fileMap)
const legalAddress = env('VITE_LEGAL_ADDRESS', fileMap)
const stripeKeys = [
  'VITE_STRIPE_LINK_TEAM',
  'VITE_STRIPE_LINK_CLUB',
  'VITE_STRIPE_LINK_TEAM_ANNUAL',
  'VITE_STRIPE_LINK_CLUB_ANNUAL',
]
const stripeSet = stripeKeys.filter((k) => env(k, fileMap)).length

fail(Boolean(supabaseUrl), 'VITE_SUPABASE_URL', supabaseUrl ? projectOrigin(supabaseUrl) : 'missing')
fail(Boolean(anon), 'VITE_SUPABASE_ANON_KEY', anon ? `len ${anon.length}` : 'missing')

if (!manual || manual === 'true') {
  status(true, 'VITE_MANUAL_PAYMENTS', manual || 'unset (defaults ON without Stripe)')
} else if (manual === 'false' && stripeSet === 0) {
  fail(false, 'VITE_MANUAL_PAYMENTS=false', 'but no Stripe links — checkout will break')
} else {
  warn('VITE_MANUAL_PAYMENTS=false', 'Stripe Phase 2 mode')
}

if (demo === 'true') {
  fail(false, 'VITE_DEMO_SUBSCRIPTION', 'must be false in production')
} else {
  status(true, 'VITE_DEMO_SUBSCRIPTION', demo || 'unset/false')
}

if (stripeSet > 0 && manual !== 'false') {
  warn('Stripe links present', `${stripeSet} link(s) — ok if MANUAL_PAYMENTS=true`)
}

status(true, 'VITE_APP_URL', appUrl || 'unset → defaults to https://www.surfstar.app')
status(true, 'VITE_CONTACT_EMAIL', contact || 'unset → defaults to contact@surfstar.app')
fail(Boolean(legalName), 'VITE_LEGAL_ENTITY_NAME', legalName || 'missing (set before launch)')
fail(Boolean(legalNif), 'VITE_LEGAL_NIF', legalNif || 'missing (set before launch)')
fail(Boolean(legalAddress), 'VITE_LEGAL_ADDRESS', legalAddress ? 'set' : 'missing (set before launch)')

console.log('')
console.log('2) Supabase app_settings (optional — needs SUPABASE_SERVICE_ROLE_KEY)')

const serviceKey = env('SUPABASE_SERVICE_ROLE_KEY', fileMap)
const origin = projectOrigin(supabaseUrl)

if (!serviceKey || !origin) {
  warn('Skipped remote checks', 'set SUPABASE_SERVICE_ROLE_KEY to verify IBAN/webhooks')
} else {
  const supabase = createClient(origin, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const keys = [
    'demo_subscriptions',
    'manual_payment_details',
    'platform_admin_emails',
    'admin_notification_emails',
    'admin_notify_webhook',
    'coach_notify_webhook',
  ]
  const { data, error } = await supabase.from('app_settings').select('key, value').in('key', keys)
  if (error) {
    fail(false, 'Read app_settings', error.message)
  } else {
    const map = Object.fromEntries((data || []).map((row) => [row.key, row.value]))

    const demoVal = map.demo_subscriptions
    // Stored as jsonb — typically false boolean
    const demoIsOff =
      demoVal === false ||
      demoVal === 'false' ||
      demoVal == null ||
      (typeof demoVal === 'object' && demoVal !== null && JSON.stringify(demoVal) === 'false')
    fail(demoIsOff, 'demo_subscriptions off', JSON.stringify(demoVal))

    const pay = map.manual_payment_details && typeof map.manual_payment_details === 'object'
      ? map.manual_payment_details
      : {}
    fail(Boolean(clean(pay.iban)), 'manual_payment_details.iban', clean(pay.iban) ? `len ${clean(pay.iban).length}` : 'empty — coaches get no payment details')
    if (clean(pay.mbway)) {
      status(true, 'manual_payment_details.mbway', 'set')
    } else {
      warn('manual_payment_details.mbway', 'empty (optional)')
    }

    const admins = map.platform_admin_emails
    fail(Array.isArray(admins) ? admins.length > 0 : Boolean(admins), 'platform_admin_emails', Array.isArray(admins) ? `${admins.length} email(s)` : typeof admins)

    const notify = map.admin_notification_emails
    status(
      Array.isArray(notify) ? notify.length > 0 : Boolean(notify),
      'admin_notification_emails',
      Array.isArray(notify) ? `${notify.length} email(s)` : typeof notify,
    )

    for (const hookKey of ['admin_notify_webhook', 'coach_notify_webhook']) {
      const hook = map[hookKey] && typeof map[hookKey] === 'object' ? map[hookKey] : {}
      fail(hook.enabled === true, `${hookKey}.enabled`, String(hook.enabled))
      fail(Boolean(clean(hook.url)), `${hookKey}.url`, clean(hook.url) ? 'set' : 'missing')
      fail(Boolean(clean(hook.secret)), `${hookKey}.secret`, clean(hook.secret) ? 'set' : 'missing')
    }
  }
}

console.log('')
console.log('3) Edge function ping (optional — SURFSTAR_OPS_PING=1 or --ping + CRON_SECRET)')

const cronSecret = env('CRON_SECRET', fileMap)
const ref = projectRefFromUrl(origin)

if (!ping) {
  warn('Skipped', 'pass --ping or SURFSTAR_OPS_PING=1 to POST admin-notify / coach-notify / renewal-cron')
} else if (!cronSecret || !ref) {
  fail(false, 'Ping', 'need CRON_SECRET and VITE_SUPABASE_URL')
} else {
  for (const name of ['admin-notify', 'coach-notify', 'subscription-renewal-cron']) {
    const url = `https://${ref}.supabase.co/functions/v1/${name}`
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${cronSecret}` },
      })
      const text = await res.text()
      let ok = res.ok
      try {
        const json = JSON.parse(text)
        if (json && json.ok === false) ok = false
      } catch {
        /* non-json body */
      }
      fail(ok, name, `HTTP ${res.status}`)
    } catch (err) {
      fail(false, name, err instanceof Error ? err.message : String(err))
    }
  }
}

console.log('')
console.log('See LAUNCH_OPS.md for the full checklist (SQL, Auth, Vercel, smoke test).')
if (failures > 0) {
  console.log(`Result: ${failures} check(s) failed.`)
  process.exit(1)
}
console.log('Result: local checks passed (complete remote SQL/Auth steps in LAUNCH_OPS.md).')
process.exit(0)
