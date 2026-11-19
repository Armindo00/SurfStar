#!/usr/bin/env node
/**
 * Apply SURFSTAR_MANUAL_IBAN / SURFSTAR_MANUAL_MBWAY into app_settings.manual_payment_details.
 * Uses the Supabase service role (never commit those values).
 *
 *   SURFSTAR_MANUAL_IBAN=PT50... SURFSTAR_MANUAL_MBWAY=+351... \
 *   VITE_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   node scripts/apply-manual-payment-details.mjs
 */
import { createClient } from '@supabase/supabase-js'

function clean(raw) {
  if (!raw) return ''
  return String(raw).trim().replace(/^['"]|['"]$/g, '')
}

function projectUrl(raw) {
  const value = clean(raw)
  if (!value) throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_URL')
  return new URL(value).origin
}

const url = projectUrl(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL)
const serviceKey = clean(process.env.SUPABASE_SERVICE_ROLE_KEY)
const iban = clean(process.env.SURFSTAR_MANUAL_IBAN)
const mbway = clean(process.env.SURFSTAR_MANUAL_MBWAY)
const accountName = clean(process.env.SURFSTAR_MANUAL_ACCOUNT_NAME) || 'SurfStar'
const hint =
  clean(process.env.SURFSTAR_MANUAL_PAYMENT_HINT) ||
  'Use your registered email as the payment reference.'

if (!serviceKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
if (!iban && !mbway) {
  console.error('Set SURFSTAR_MANUAL_IBAN and/or SURFSTAR_MANUAL_MBWAY')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const { data: existing, error: readError } = await supabase
  .from('app_settings')
  .select('value')
  .eq('key', 'manual_payment_details')
  .maybeSingle()

if (readError) {
  console.error('Read failed:', readError.message)
  process.exit(1)
}

const current = existing?.value && typeof existing.value === 'object' ? existing.value : {}
const next = {
  account_name: accountName || current.account_name || 'SurfStar',
  iban: iban || current.iban || '',
  mbway: mbway || current.mbway || '',
  payment_reference_hint: hint || current.payment_reference_hint || '',
}

const { error: writeError } = await supabase
  .from('app_settings')
  .upsert({ key: 'manual_payment_details', value: next }, { onConflict: 'key' })

if (writeError) {
  console.error('Write failed:', writeError.message)
  process.exit(1)
}

console.log(
  JSON.stringify({
    ok: true,
    account_name: next.account_name,
    iban_len: String(next.iban || '').length,
    mbway_len: String(next.mbway || '').length,
    has_hint: Boolean(next.payment_reference_hint),
  }),
)
