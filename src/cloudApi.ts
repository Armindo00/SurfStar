import type { AuthChangeEvent } from '@supabase/supabase-js'
import { getEphemeralSupabase, getSupabase } from './lib/supabase'
import { isValidEmail, normalizeEmail, validatePasswordStrength } from './passwordUtils'
import type {
  Athlete,
  AuthSession,
  StudentAccount,
  SurfSpot,
  TrainingSession,
} from './types'
import { normalizeAthleteShareSettings } from './types'

type ProfileRow = {
  id: string
  role: 'treinador' | 'atleta'
  name: string
  email: string
  coach_id: string | null
  athlete_id: string | null
  must_change_password?: boolean
}

function authSessionFromAuthUser(
  user: {
    id: string
    email?: string | null
    user_metadata?: Record<string, unknown>
  },
  options?: { mustChangePassword?: boolean },
): AuthSession {
  const meta = user.user_metadata ?? {}
  if (meta.role === 'atleta' && meta.coach_id && meta.athlete_id) {
    return {
      role: 'atleta',
      coachId: String(meta.coach_id),
      athleteId: String(meta.athlete_id),
      name: String(meta.name || user.email?.split('@')[0] || 'Athlete'),
      email: (user.email || '').toLowerCase(),
      mustChangePassword: options?.mustChangePassword ?? false,
    }
  }
  return {
    role: 'treinador',
    coachId: user.id,
    name: String(meta.name || user.email?.split('@')[0] || 'Coach'),
    email: (user.email || '').toLowerCase(),
  }
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
          cb(
            authSessionFromAuthUser(session.user, {
              mustChangePassword: profile?.must_change_password ?? false,
            }),
            event,
          )
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

  const meta = user.user_metadata ?? {}
  if (meta.role === 'atleta' && meta.coach_id && meta.athlete_id) {
    const athleteId = String(meta.athlete_id)
    const coachId = String(meta.coach_id)

    const supabase = getSupabase()
    const { data: athleteRow, error: athleteError } = await supabase
      .from('athletes')
      .select('blocked')
      .eq('id', athleteId)
      .eq('coach_id', coachId)
      .maybeSingle()

    if (athleteError || !athleteRow) {
      await supabase.auth.signOut()
      return { error: 'Your athlete profile is not set up. Ask your coach to recreate your account.' }
    }

    if (athleteRow.blocked) {
      await supabase.auth.signOut()
      return {
        error: 'Your account is blocked. Contact your coach if you think this is a mistake.',
      }
    }

    const profile = await fetchProfileRow(user.id)
    return authSessionFromAuthUser(user, {
      mustChangePassword: profile?.must_change_password ?? false,
    })
  }

  return authSessionFromAuthUser(user)
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

function mapAthleteRow(row: {
  id: string
  coach_id: string
  name: string
  share_settings?: Partial<Athlete['shareSettings']> | null
  blocked?: boolean | null
}): Athlete {
  return {
    id: row.id,
    coachId: row.coach_id,
    name: row.name,
    shareSettings: normalizeAthleteShareSettings(row.share_settings),
    blocked: row.blocked ?? false,
  }
}

export async function cloudFetchAthletes(coachId: string): Promise<Athlete[]> {
  const supabase = getSupabase()
  let { data, error } = await supabase
    .from('athletes')
    .select('id, coach_id, name, share_settings, blocked')
    .eq('coach_id', coachId)
    .order('created_at', { ascending: true })

  if (error) {
    const fallback = await supabase
      .from('athletes')
      .select('id, coach_id, name')
      .eq('coach_id', coachId)
      .order('created_at', { ascending: true })
    if (fallback.error || !fallback.data) return []
    return fallback.data.map((row) => mapAthleteRow(row))
  }

  if (!data) return []
  return data.map((row) => mapAthleteRow(row))
}

export async function cloudFetchAthleteById(
  coachId: string,
  athleteId: string,
): Promise<Athlete | null> {
  const supabase = getSupabase()
  let { data, error } = await supabase
    .from('athletes')
    .select('id, coach_id, name, share_settings, blocked')
    .eq('coach_id', coachId)
    .eq('id', athleteId)
    .maybeSingle()

  if (error) {
    const fallback = await supabase
      .from('athletes')
      .select('id, coach_id, name')
      .eq('coach_id', coachId)
      .eq('id', athleteId)
      .maybeSingle()
    if (fallback.error || !fallback.data) return null
    return mapAthleteRow(fallback.data)
  }

  if (!data) return null
  return mapAthleteRow(data)
}

export async function cloudFetchStudents(coachId: string): Promise<StudentAccount[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, coach_id, athlete_id, name, email, must_change_password')
    .eq('coach_id', coachId)
    .eq('role', 'atleta')

  if (error) {
    const fallback = await supabase
      .from('profiles')
      .select('id, coach_id, athlete_id, name, email')
      .eq('coach_id', coachId)
      .eq('role', 'atleta')
    if (fallback.error || !fallback.data) return []
    return (fallback.data as ProfileRow[]).map((p) => ({
      id: p.id,
      coachId: p.coach_id!,
      athleteId: p.athlete_id!,
      name: p.name,
      email: p.email,
      passwordHash: '',
      mustChangePassword: false,
    }))
  }

  if (!data) return []
  return (data as ProfileRow[]).map((p) => ({
    id: p.id,
    coachId: p.coach_id!,
    athleteId: p.athlete_id!,
    name: p.name,
    email: p.email,
    passwordHash: '',
    mustChangePassword: p.must_change_password ?? false,
  }))
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
  return data.map((r: { payload: TrainingSession }) => r.payload)
}

export async function cloudSaveTrainingSessions(
  coachId: string,
  sessions: TrainingSession[],
): Promise<void> {
  const supabase = getSupabase()
  const coachSessions = sessions.filter((s) => s.coachId === coachId)

  const { data: existing } = await supabase
    .from('training_sessions')
    .select('id')
    .eq('coach_id', coachId)

  const keepIds = new Set(coachSessions.map((s) => s.id))
  const toDelete = (existing ?? []).filter((r: { id: string }) => !keepIds.has(r.id)).map((r) => r.id)

  if (toDelete.length > 0) {
    await supabase.from('training_sessions').delete().in('id', toDelete)
  }

  if (coachSessions.length === 0) return

  await supabase.from('training_sessions').upsert(
    coachSessions.map((s) => ({
      id: s.id,
      coach_id: coachId,
      payload: s,
      updated_at: new Date().toISOString(),
    })),
  )
}

export async function cloudSaveAthletes(coachId: string, athletes: Athlete[]): Promise<void> {
  const mine = athletes.filter((a) => a.coachId === coachId)
  await getSupabase().from('athletes').upsert(
    mine.map((a) => ({
      id: a.id,
      coach_id: coachId,
      name: a.name,
      share_settings: normalizeAthleteShareSettings(a.shareSettings),
      blocked: a.blocked ?? false,
    })),
  )
}

export async function cloudSaveSpots(coachId: string, spots: SurfSpot[]): Promise<void> {
  const { data: existing } = await getSupabase().from('spots').select('id').eq('coach_id', coachId)
  const keep = new Set(spots.map((s) => s.id))
  const deleteIds = (existing ?? []).filter((r: { id: string }) => !keep.has(r.id)).map((r) => r.id)
  if (deleteIds.length) await getSupabase().from('spots').delete().in('id', deleteIds)
  if (spots.length) {
    await getSupabase().from('spots').upsert(spots.map((s) => ({ id: s.id, coach_id: coachId, name: s.name })))
  }
}

export async function cloudSaveConditions(coachId: string, conditions: string[]): Promise<void> {
  await getSupabase().from('coach_conditions').delete().eq('coach_id', coachId)
  if (conditions.length) {
    await getSupabase().from('coach_conditions').insert(
      conditions.map((label) => ({ coach_id: coachId, label })),
    )
  }
}

function friendlyAthleteSaveError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('foreign key') || lower.includes('profiles')) {
    return 'Your coach account is not fully set up in the cloud. Sign out, sign in again, and retry. If it persists, run fix-missing-profiles.sql in Supabase.'
  }
  if (lower.includes('duplicate key') || lower.includes('already registered')) {
    return 'This email is already used by another account.'
  }
  return message
}

export async function cloudAddAthleteWithLogin(
  coachId: string,
  name: string,
  email: string,
  password: string,
): Promise<
  | { ok: true; athlete: Athlete; athletes: Athlete[]; students: StudentAccount[] }
  | { ok: false; error: string }
> {
  const trimmedName = name.trim()
  const normalized = normalizeEmail(email)
  if (!trimmedName) return { ok: false, error: 'Enter athlete name.' }
  if (!isValidEmail(normalized)) return { ok: false, error: 'Enter a valid email.' }
  const pwdError = validatePasswordStrength(password)
  if (pwdError) return { ok: false, error: pwdError }

  const supabase = getSupabase()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    return { ok: false, error: 'Session expired. Sign in again as coach.' }
  }

  const profileResult = await ensureUserProfile(user)
  if (!profileResult.ok) {
    return { ok: false, error: profileResult.error ?? 'Coach profile missing.' }
  }

  const activeCoachId = user.id
  if (coachId !== activeCoachId) {
    return { ok: false, error: 'Session mismatch. Sign out and sign in again.' }
  }

  const athleteId = crypto.randomUUID()

  const { error: athleteError } = await supabase.from('athletes').insert({
    id: athleteId,
    coach_id: activeCoachId,
    name: trimmedName,
    blocked: false,
  })
  if (athleteError) {
    return { ok: false, error: friendlyAthleteSaveError(athleteError.message) }
  }

  const ephemeral = getEphemeralSupabase()
  const { error: signUpError } = await ephemeral.auth.signUp({
    email: normalized,
    password,
    options: {
      data: {
        role: 'atleta',
        name: trimmedName,
        coach_id: activeCoachId,
        athlete_id: athleteId,
      },
    },
  })

  await ephemeral.auth.signOut()

  if (signUpError) {
    await supabase.from('athletes').delete().eq('id', athleteId)
    return { ok: false, error: friendlyAthleteSaveError(signUpError.message) }
  }

  const refreshed = await cloudLoadCoachData(activeCoachId)
  const athlete =
    refreshed.athletes.find((a) => a.id === athleteId) ??
    ({ id: athleteId, coachId: activeCoachId, name: trimmedName } satisfies Athlete)

  return {
    ok: true,
    athlete,
    athletes: refreshed.athletes,
    students: refreshed.students,
  }
}

export async function cloudLoadCoachData(coachId: string) {
  const [athletes, students, spots, conditions, trainingSessions] = await Promise.all([
    cloudFetchAthletes(coachId),
    cloudFetchStudents(coachId),
    cloudFetchSpots(coachId),
    cloudFetchConditions(coachId),
    cloudFetchTrainingSessions(coachId),
  ])
  return { athletes, students, spots, conditions, trainingSessions }
}

export async function cloudLoadAthleteData(coachId: string, athleteId: string) {
  const [athlete, spots, trainingSessions] = await Promise.all([
    cloudFetchAthleteById(coachId, athleteId),
    cloudFetchSpots(coachId),
    cloudFetchTrainingSessions(coachId).then((sessions) =>
      sessions.filter((s) => s.athleteIds.includes(athleteId)),
    ),
  ])
  return { athlete, spots, trainingSessions }
}

export async function cloudSetAthleteBlocked(
  coachId: string,
  athleteId: string,
  blocked: boolean,
): Promise<{ ok: true; athletes: Athlete[] } | { ok: false; error: string }> {
  const supabase = getSupabase()
  const { error } = await supabase
    .from('athletes')
    .update({ blocked })
    .eq('id', athleteId)
    .eq('coach_id', coachId)

  if (error) {
    return { ok: false, error: error.message }
  }

  const athletes = await cloudFetchAthletes(coachId)
  return { ok: true, athletes }
}

export async function cloudDeleteAthlete(
  coachId: string,
  athleteId: string,
): Promise<{ ok: true; athletes: Athlete[]; students: StudentAccount[] } | { ok: false; error: string }> {
  const supabase = getSupabase()
  const { data, error } = await supabase.rpc('coach_delete_athlete', {
    p_athlete_id: athleteId,
  })

  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('coach_delete_athlete') || msg.includes('function')) {
      return {
        ok: false,
        error:
          'Delete is not set up in the cloud yet. Run supabase/add-athlete-management.sql in Supabase SQL Editor.',
      }
    }
    return { ok: false, error: error.message }
  }

  const result = data as { ok?: boolean; error?: string } | null
  if (!result?.ok) {
    return { ok: false, error: result?.error ?? 'Could not delete athlete.' }
  }

  const refreshed = await cloudLoadCoachData(coachId)
  return { ok: true, athletes: refreshed.athletes, students: refreshed.students }
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

  const session = authSessionFromAuthUser(userData.user, { mustChangePassword: false })
  if (session.role !== 'atleta') {
    return { ok: false, error: 'Only athletes can use this screen.' }
  }

  return { ok: true, session }
}
