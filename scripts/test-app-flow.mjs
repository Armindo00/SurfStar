/**
 * End-to-end cloud smoke test for SurfStar pairing flows.
 * Run: node scripts/test-app-flow.mjs
 */
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

function loadEnv() {
  try {
    const raw = readFileSync('.env', 'utf8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const idx = trimmed.indexOf('=')
      if (idx < 0) continue
      const key = trimmed.slice(0, idx).trim()
      const value = trimmed.slice(idx + 1).trim()
      if (!process.env[key]) process.env[key] = value
    }
  } catch {
    /* no .env */
  }
}

loadEnv()

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('FAIL: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env')
  process.exit(1)
}

const stamp = Date.now()
const athleteEmail = `qa-athlete-${stamp}@surfstar-test.local`
const coachEmail = `qa-coach-${stamp}@surfstar-test.local`
const password = 'TestPass123'

const results = []

function pass(name) {
  results.push({ name, ok: true })
  console.log(`PASS  ${name}`)
}

function fail(name, detail) {
  results.push({ name, ok: false, detail })
  console.error(`FAIL  ${name}: ${detail}`)
}

async function main() {
  const athleteClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const coachClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // 1. Athlete self-registration
  const athleteSignUp = await athleteClient.auth.signUp({
    email: athleteEmail,
    password,
    options: { data: { role: 'atleta', name: 'QA Athlete' } },
  })
  if (athleteSignUp.error) {
    fail('Athlete sign up', athleteSignUp.error.message)
    return summary()
  }
  pass('Athlete sign up')

  const { data: setupData, error: setupError } = await athleteClient.rpc('setup_self_registered_athlete')
  if (setupError || !setupData?.ok) {
    fail('Setup athlete profile', setupError?.message ?? setupData?.error ?? 'unknown')
    return summary()
  }
  const pairingCode = setupData.pairing_code
  const athleteId = setupData.athlete_id
  if (!pairingCode || !athleteId) {
    fail('Setup athlete profile', 'missing pairing_code or athlete_id')
    return summary()
  }
  pass(`Athlete pairing code generated (${pairingCode})`)

  // 2. Coach registration
  const coachSignUp = await coachClient.auth.signUp({
    email: coachEmail,
    password,
    options: { data: { role: 'treinador', name: 'QA Coach' } },
  })
  if (coachSignUp.error) {
    fail('Coach sign up', coachSignUp.error.message)
    return summary()
  }
  pass('Coach sign up')

  const coachUser = coachSignUp.data.user ?? coachSignUp.data.session?.user
  if (!coachUser) {
    const login = await coachClient.auth.signInWithPassword({ email: coachEmail, password })
    if (login.error || !login.data.user) {
      fail('Coach session', login.error?.message ?? 'no user after signup')
      return summary()
    }
  }

  // 3. Coach requests pairing
  const pairReq = await coachClient.rpc('coach_request_pairing', { p_code: pairingCode })
  if (pairReq.error || !pairReq.data?.ok) {
    fail('Coach pairing request', pairReq.error?.message ?? pairReq.data?.error ?? 'unknown')
    return summary()
  }
  const linkId = pairReq.data.link_id
  pass('Coach pairing request sent')

  // 4. Athlete accepts pairing
  const accept = await athleteClient.rpc('respond_to_pairing', {
    p_link_id: linkId,
    p_accept: true,
  })
  if (accept.error || !accept.data?.ok) {
    fail('Athlete accepts pairing', accept.error?.message ?? accept.data?.error ?? 'unknown')
    return summary()
  }
  pass('Athlete accepts pairing')

  // 5. Athlete sessions RPC (empty ok)
  const sessions = await athleteClient.rpc('get_athlete_training_sessions', {
    p_athlete_id: athleteId,
  })
  if (sessions.error) {
    fail('Get athlete sessions RPC', sessions.error.message)
  } else {
    pass(`Get athlete sessions RPC (${(sessions.data ?? []).length} sessions)`)
  }

  // 6. Coach can read links
  const { data: links, error: linksError } = await coachClient
    .from('coach_athlete_links')
    .select('id, status, athlete_id')
    .eq('status', 'active')
  if (linksError) {
    fail('Coach reads active links', linksError.message)
  } else if (!links?.some((l) => l.athlete_id === athleteId)) {
    fail('Coach reads active links', 'active link not found')
  } else {
    pass('Coach reads active links')
  }

  // 7. Block / unblock link
  const block = await coachClient.rpc('set_link_blocked', { p_link_id: linkId, p_blocked: true })
  if (block.error || !block.data?.ok) {
    fail('Block athlete link', block.error?.message ?? block.data?.error ?? 'unknown')
  } else {
    pass('Block athlete link')
  }

  const unblock = await coachClient.rpc('set_link_blocked', { p_link_id: linkId, p_blocked: false })
  if (unblock.error || !unblock.data?.ok) {
    fail('Unblock athlete link', unblock.error?.message ?? unblock.data?.error ?? 'unknown')
  } else {
    pass('Unblock athlete link')
  }

  // 8. Share settings update
  const share = await coachClient.rpc('update_link_share_settings', {
    p_link_id: linkId,
    p_settings: {
      technicalStats: true,
      comboStats: false,
      sessionHistory: true,
      heatDetails: false,
    },
  })
  if (share.error || !share.data?.ok) {
    fail('Update share settings', share.error?.message ?? share.data?.error ?? 'unknown')
  } else {
    pass('Update share settings')
  }

  // 9. Revoke pairing
  const revoke = await coachClient.rpc('revoke_pairing', { p_link_id: linkId })
  if (revoke.error || !revoke.data?.ok) {
    fail('Revoke pairing', revoke.error?.message ?? revoke.data?.error ?? 'unknown')
  } else {
    pass('Revoke pairing')
  }

  summary()
}

function summary() {
  const failed = results.filter((r) => !r.ok)
  console.log('\n--- Summary ---')
  console.log(`Total: ${results.length} | Passed: ${results.length - failed.length} | Failed: ${failed.length}`)
  if (failed.length) {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
