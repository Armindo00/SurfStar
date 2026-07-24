import type { AuthChangeEvent } from '@supabase/supabase-js'
import { getSupabase } from './lib/supabase'
import {
  cloudFetchCoachAthletes,
  cloudFetchCoachLinks,
  cloudLoadAthletePortalData,
  cloudSetupSelfRegisteredAthlete,
} from './cloudPairingApi'
import { isValidEmail, normalizeEmail, validatePasswordStrength } from './passwordUtils'
import type {
  AuthSession,
  SurfSpot,
  TrainingSession,
} from './types'

type ProfileRow = {
  id: string
  role: 'treinador' | 'atleta'
  name: string
  email: string
  coach_id: string | null
  athlete_id: string | null
  must_change_password?: boolean
}

function buildAthleteSession(
  profile: ProfileRow,
  pairingCode: string,
): AuthSession {
  return {
    role: 'atleta',
    athleteId: profile.athlete_id!,
    name: profile.name,
    email: profile.email,
    pairingCode,
    mustChangePassword: profile.must_change_password ?? false,
  }
}

function buildCoachSession(user: {
  id: string
  email?: string | null
  user_metadata?: Record<string, unknown>
}): AuthSession {
  const meta = user.user_metadata ?? {}
  return {
    role: 'treinador',
    coachId: user.id,
    name: String(meta.name || user.email?.split('@')[0] || 'Coach'),
    email: (user.email || '').toLowerCase(),
  }
}

async function buildAthleteAuthSession(
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> },
  profile: ProfileRow,
): Promise<AuthSession | { error: string }> {
  const supabase = getSupabase()
  let athleteId = profile.athlete_id

  if (!athleteId) {
    const setup = await cloudSetupSelfRegisteredAthlete()
    if (!setup.ok) return { error: setup.error }
    athleteId = setup.athleteId
    profile = (await fetchProfileRow(user.id)) ?? {
      ...profile,
      athlete_id: athleteId,
      must_change_password: false,
    }
  }

  const { data: athleteRow, error: athleteError } = await supabase
    .from('athletes')
    .select('pairing_code, blocked')
    .eq('id', athleteId)
    .maybeSingle()

  if (athleteError || !athleteRow) {
    await supabase.auth.signOut()
    return { error: 'Your athlete profile is not set up. Sign out and sign in again.' }
  }

  if (athleteRow.blocked) {
    await supabase.auth.signOut()
    return {
      error: 'Your account is blocked. Contact your coach if you think this is a mistake.',
    }
  }

  return buildAthleteSession(profile, athleteRow.pairing_code ?? '')
}

async function fetchProfileRow(userId: string): Promise<ProfileRow | null> {
  const supabase = getSupabase()

  const { data: rpcData, error: rpcError } = await supabase.rpc('get_my_profile')
  if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
    return rpcData[0] as ProfileRow
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, role, name, email, coach_id, athlete_id, must_change_password')
    .eq('id', userId)
    .maybeSingle()

  if (error || !profile) return null
  return profile as ProfileRow
}

export async function cloudGetSession(): Promise<AuthSession | null> {
  const supabase = getSupabase()
  const { data } = await supabase.auth.getSession()
  if (!data.session?.user) return null
  const built = await buildAuthSessionFromUser(data.session.user)
  if ('error' in built) return null
  return built
}

export async function cloudOnAuthChange(
  cb: (session: AuthSession | null, event: AuthChangeEvent) => void,
): Promise<() => void> {
  const supabase = getSupabase()
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    setTimeout(() => {
      void (async () => {
        if (!session?.user) {
          cb(null, event)
          return
        }
        if (event === 'TOKEN_REFRESHED') {
          const profile = await fetchProfileRow(session.user.id)
          if (profile?.role === 'atleta' && profile.athlete_id) {
            const { data: athleteRow } = await supabase
              .from('athletes')
              .select('pairing_code')
              .eq('id', profile.athlete_id)
              .maybeSingle()
            cb(
              buildAthleteSession(profile, athleteRow?.pairing_code ?? ''),
              event,
            )
            return
          }
          cb(buildCoachSession(session.user), event)
          return
        }
        const built = await buildAuthSessionFromUser(session.user)
        if ('error' in built) {
          await supabase.auth.signOut()
          cb(null, event)
          return
        }
        cb(built, event)
      })()
    }, 0)
  })
  return () => data.subscription.unsubscribe()
}

async function ensureUserProfile(user: {
  id: string
  email?: string | null
  user_metadata?: Record<string, unknown>
}): Promise<{ ok: boolean; error?: string }> {
  if (await fetchProfileRow(user.id)) return { ok: true }

  const supabase = getSupabase()
  const { error: rpcError } = await supabase.rpc('ensure_my_profile')
  if (!rpcError) return { ok: true }

  if (await fetchProfileRow(user.id)) return { ok: true }

  const meta = user.user_metadata ?? {}
  const role = meta.role === 'atleta' ? 'atleta' : 'treinador'
  const { error } = await supabase.from('profiles').insert({
    id: user.id,
    role,
    name: (meta.name as string) || user.email?.split('@')[0] || 'User',
    email: (user.email || '').toLowerCase(),
    coach_id: (meta.coach_id as string) || null,
    athlete_id: (meta.athlete_id as string) || null,
  })

  if (error) {
    if (error.code === '23505' || error.message.includes('duplicate key')) {
      return { ok: true }
    }
    if (await fetchProfileRow(user.id)) return { ok: true }
    return {
      ok: false,
      error:
        role === 'treinador'
          ? 'Your coach profile is not set up yet. Sign out, sign in again, or ask support to run fix-missing-profiles.sql in Supabase.'
          : error.message,
    }
  }
  return { ok: true }
}

async function buildAuthSessionFromUser(user: {
  id: string
  email?: string | null
  user_metadata?: Record<string, unknown>
}): Promise<AuthSession | { error: string }> {
  const profileResult = await ensureUserProfile(user)
  if (!profileResult.ok) {
    return { error: profileResult.error ?? 'Could not load your profile.' }
  }

  const profile = await fetchProfileRow(user.id)
  if (!profile) {
    return { error: 'Could not load your profile.' }
  }

  if (profile.role === 'atleta') {
    return buildAthleteAuthSession(user, profile)
  }

  return buildCoachSession(user)
}

export type CloudAuthResult =
  | { ok: true; session: AuthSession }
  | { ok: false; error: string }

export async function cloudRegisterCoach(
  name: string,
  email: string,
  password: string,
): Promise<CloudAuthResult> {
  const trimmedName = name.trim()
  const normalized = normalizeEmail(email)
  if (!trimmedName) return { ok: false, error: 'Enter your name.' }
  if (!isValidEmail(normalized)) return { ok: false, error: 'Enter a valid email.' }
  const pwdError = validatePasswordStrength(password)
  if (pwdError) return { ok: false, error: pwdError }

  const supabase = getSupabase()
  const { data, error } = await supabase.auth.signUp({
    email: normalized,
    password,
    options: {
      data: { role: 'treinador', name: trimmedName },
    },
  })

  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('already registered') || msg.includes('already been registered')) {
      return cloudLogin(normalized, password)
    }
    return { ok: false, error: error.message }
  }

  if (data.session?.user) {
    const session = await buildAuthSessionFromUser(data.session.user)
    if ('error' in session) return { ok: false, error: session.error }
    return { ok: true, session }
  }

  const { data: signInData, error: loginError } = await supabase.auth.signInWithPassword({
    email: normalized,
    password,
  })
  if (loginError) {
    return {
      ok: false,
      error: 'Account created. Try Sign in with the same email and password.',
    }
  }
  if (!signInData.user) {
    return { ok: false, error: 'Account created but sign in failed. Try Sign in.' }
  }

  const session = await buildAuthSessionFromUser(signInData.user)
  if ('error' in session) return { ok: false, error: session.error }
  return { ok: true, session }
}

export async function cloudRegisterAthlete(
  name: string,
  email: string,
  password: string,
): Promise<CloudAuthResult> {
  const trimmedName = name.trim()
  const normalized = normalizeEmail(email)
  if (!trimmedName) return { ok: false, error: 'Enter your name.' }
  if (!isValidEmail(normalized)) return { ok: false, error: 'Enter a valid email.' }
  const pwdError = validatePasswordStrength(password)
  if (pwdError) return { ok: false, error: pwdError }

  const supabase = getSupabase()
  const { data, error } = await supabase.auth.signUp({
    email: normalized,
    password,
    options: {
      data: { role: 'atleta', name: trimmedName },
    },
  })

  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('already registered') || msg.includes('already been registered')) {
      return cloudLogin(normalized, password)
    }
    return { ok: false, error: error.message }
  }

  if (data.session?.user) {
    const session = await buildAuthSessionFromUser(data.session.user)
    if ('error' in session) return { ok: false, error: session.error }
    return { ok: true, session }
  }

  const { data: signInData, error: loginError } = await supabase.auth.signInWithPassword({
    email: normalized,
    password,
  })
  if (loginError) {
    return {
      ok: false,
      error: 'Account created. Try Sign in with the same email and password.',
    }
  }
  if (!signInData.user) {
    return { ok: false, error: 'Account created but sign in failed. Try Sign in.' }
  }

  const session = await buildAuthSessionFromUser(signInData.user)
  if ('error' in session) return { ok: false, error: session.error }
  return { ok: true, session }
}

export async function cloudLogin(
  email: string,
  password: string,
): Promise<CloudAuthResult> {
  const supabase = getSupabase()
  const normalized = normalizeEmail(email)
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalized,
    password,
  })

  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
      return {
        ok: false,
        error:
          'Wrong email or password. If you registered before the fix, try Create account with a new email, or reset the password in Supabase → Authentication → Users.',
      }
    }
    return { ok: false, error: error.message }
  }

  if (!data.user) return { ok: false, error: 'Sign in failed. Try again.' }

  const session = await buildAuthSessionFromUser(data.user)
  if ('error' in session) return { ok: false, error: session.error }
  return { ok: true, session }
}

export async function cloudLogout(): Promise<void> {
  await getSupabase().auth.signOut()
}

export async function cloudLoadCoachData(coachId: string) {
  const [athletes, links, spots, conditions, trainingSessions] = await Promise.all([
    cloudFetchCoachAthletes(coachId),
    cloudFetchCoachLinks(coachId),
    cloudFetchSpots(coachId),
    cloudFetchConditions(coachId),
    cloudFetchTrainingSessions(coachId),
  ])
  return { athletes, links, spots, conditions, trainingSessions }
}

export async function cloudLoadAthleteData(athleteId: string) {
  return cloudLoadAthletePortalData(athleteId)
}

export async function cloudChangePassword(
  newPassword: string,
): Promise<{ ok: true; session: AuthSession } | { ok: false; error: string }> {
  const pwdError = validatePasswordStrength(newPassword)
  if (pwdError) return { ok: false, error: pwdError }

  const supabase = getSupabase()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    return { ok: false, error: 'Session expired. Sign in again.' }
  }

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
  if (updateError) {
    return { ok: false, error: updateError.message }
  }

  const { error: clearError } = await supabase.rpc('clear_must_change_password')
  if (clearError) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ must_change_password: false })
      .eq('id', userData.user.id)
    if (profileError) {
      return { ok: false, error: profileError.message }
    }
  }

  const built = await buildAuthSessionFromUser(userData.user)
  if ('error' in built) return { ok: false, error: built.error }

  if (built.role === 'atleta') {
    return { ok: true, session: { ...built, mustChangePassword: false } }
  }

  return { ok: true, session: built }
}

export async function cloudResetPassword(
  email: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalized = normalizeEmail(email)
  if (!isValidEmail(normalized)) {
    return { ok: false, error: 'Enter a valid email address.' }
  }

  const redirectTo = `${window.location.origin}/login`
  const { error } = await getSupabase().auth.resetPasswordForEmail(normalized, { redirectTo })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function cloudFetchSpots(coachId: string): Promise<SurfSpot[]> {
  const { data, error } = await getSupabase()
    .from('spots')
    .select('id, name')
    .eq('coach_id', coachId)

  if (error || !data) return []
  return data as SurfSpot[]
}

export async function cloudFetchConditions(coachId: string): Promise<string[]> {
  const { data, error } = await getSupabase()
    .from('coach_conditions')
    .select('label')
    .eq('coach_id', coachId)

  if (error || !data) return []
  return data.map((r: { label: string }) => r.label)
}

export async function cloudFetchTrainingSessions(coachId: string): Promise<TrainingSession[]> {
  const { data, error } = await getSupabase()
    .from('training_sessions')
    .select('payload')
    .eq('coach_id', coachId)
    .order('updated_at', { ascending: false })

  if (error || !data) return []
  return data.map((r: { payload: TrainingSession }) => ({
    ...r.payload,
    spotName: r.payload.spotName?.trim() ?? '',
  }))
}

export type CloudSaveResult = { ok: true } | { ok: false; error: string }

export async function cloudSaveTrainingSessions(
  coachId: string,
  sessions: TrainingSession[],
): Promise<CloudSaveResult> {
  const supabase = getSupabase()
  const coachSessions = sessions.filter((s) => s.coachId === coachId)

  const { data: existing, error: fetchError } = await supabase
    .from('training_sessions')
    .select('id')
    .eq('coach_id', coachId)

  if (fetchError) return { ok: false, error: fetchError.message }

  const keepIds = new Set(coachSessions.map((s) => s.id))
  const toDelete = (existing ?? []).filter((r: { id: string }) => !keepIds.has(r.id)).map((r) => r.id)

  if (toDelete.length > 0) {
    const { error } = await supabase.from('training_sessions').delete().in('id', toDelete)
    if (error) return { ok: false, error: error.message }
  }

  if (coachSessions.length === 0) return { ok: true }

  const { error } = await supabase.from('training_sessions').upsert(
    coachSessions.map((s) => ({
      id: s.id,
      coach_id: coachId,
      payload: s,
      updated_at: new Date().toISOString(),
    })),
  )
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function cloudSaveSpots(coachId: string, spots: SurfSpot[]): Promise<CloudSaveResult> {
  const supabase = getSupabase()
  const { data: existing, error: fetchError } = await supabase.from('spots').select('id').eq('coach_id', coachId)
  if (fetchError) return { ok: false, error: fetchError.message }

  const keep = new Set(spots.map((s) => s.id))
  const deleteIds = (existing ?? []).filter((r: { id: string }) => !keep.has(r.id)).map((r) => r.id)
  if (deleteIds.length) {
    const { error } = await supabase.from('spots').delete().in('id', deleteIds)
    if (error) return { ok: false, error: error.message }
  }
  if (spots.length) {
    const { error } = await supabase.from('spots').upsert(
      spots.map((s) => ({ id: s.id, coach_id: coachId, name: s.name })),
    )
    if (error) return { ok: false, error: error.message }
  }
  return { ok: true }
}

export async function cloudSaveConditions(
  coachId: string,
  conditions: string[],
): Promise<CloudSaveResult> {
  const supabase = getSupabase()
  const { error: deleteError } = await supabase.from('coach_conditions').delete().eq('coach_id', coachId)
  if (deleteError) return { ok: false, error: deleteError.message }

  if (conditions.length) {
    const { error } = await supabase.from('coach_conditions').insert(
      conditions.map((label) => ({ coach_id: coachId, label })),
    )
    if (error) return { ok: false, error: error.message }
  }
  return { ok: true }
}
