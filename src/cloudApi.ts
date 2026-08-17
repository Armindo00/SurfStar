import type { AuthChangeEvent } from '@supabase/supabase-js'
import { AUTH_ERROR_CODES } from './authErrors'
import { getSupabase } from './lib/supabase'
import {
  cloudFetchCoachAthletes,
  cloudFetchCoachLinks,
  cloudLoadAthletePortalData,
  cloudSetupSelfRegisteredAthlete,
} from './cloudPairingApi'
import { isValidEmail, normalizeEmail, validatePasswordStrength } from './passwordUtils'
import { normalizePasswordResetCode, PASSWORD_RESET_OTP_LENGTH } from './passwordRecoveryUtils'
import { normalizeTaxId, normalizeBillingAddress, billingAddressFromRow, formatBillingAddress, type BillingAddress } from './billingUtils'
import type {
  AuthSession,
  CustomTrainingTemplate,
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
  is_platform_admin?: boolean
  blocked?: boolean
  tax_id?: string | null
  billing_address?: string | null
  billing_street?: string | null
  billing_address_line2?: string | null
  billing_postal_code?: string | null
  billing_city?: string | null
  billing_region?: string | null
  billing_country?: string | null
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

function buildCoachSession(
  user: {
    id: string
    email?: string | null
    user_metadata?: Record<string, unknown>
  },
  org?: {
    organizationId: string
    organizationName: string
    role: 'owner' | 'coach'
  },
  options?: { isPlatformAdmin?: boolean; taxId?: string; billingAddress?: BillingAddress },
): AuthSession {
  const meta = user.user_metadata ?? {}
  return {
    role: 'treinador',
    coachId: user.id,
    organizationId: org?.organizationId ?? '',
    organizationRole: org?.role ?? 'owner',
    organizationName: org?.organizationName ?? 'My Team',
    name: String(meta.name || user.email?.split('@')[0] || 'Coach'),
    email: (user.email || '').toLowerCase(),
    isPlatformAdmin: options?.isPlatformAdmin ?? false,
    taxId: options?.taxId,
    billingAddress: options?.billingAddress,
  }
}

async function enrichCoachSession(user: {
  id: string
  email?: string | null
  user_metadata?: Record<string, unknown>
}, profile?: ProfileRow): Promise<AuthSession> {
  const supabase = getSupabase()
  const isPlatformAdmin = profile?.is_platform_admin ?? false
  const billingOptions = {
    isPlatformAdmin,
    taxId: profile?.tax_id ?? undefined,
    billingAddress: profile ? billingAddressFromRow(profile) : undefined,
  }
  await supabase.rpc('accept_organization_invites')
  const { data } = await supabase.rpc('get_my_organization_context')

  if (data?.ok) {
    return buildCoachSession(
      user,
      {
        organizationId: data.organization_id,
        organizationName: data.organization_name,
        role: data.role,
      },
      billingOptions,
    )
  }

  await supabase.rpc('ensure_coach_organization', { p_org_name: null })
  const { data: retry } = await supabase.rpc('get_my_organization_context')
  if (retry?.ok) {
    return buildCoachSession(
      user,
      {
        organizationId: retry.organization_id,
        organizationName: retry.organization_name,
        role: retry.role,
      },
      billingOptions,
    )
  }

  return buildCoachSession(user, undefined, billingOptions)
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

  if (athleteRow.blocked || profile.blocked) {
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
    .select('id, role, name, email, coach_id, athlete_id, must_change_password, is_platform_admin, blocked')
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

/** Re-sync platform admin bootstrap and rebuild the auth session from the profile. */
export async function cloudRefreshAuthSession(): Promise<AuthSession | null> {
  await getSupabase().rpc('sync_platform_admin_bootstrap')
  return cloudGetSession()
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
          await getSupabase().rpc('sync_platform_admin_bootstrap')
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
          if (profile?.role === 'treinador') {
            cb(await enrichCoachSession(session.user, profile), event)
            return
          }
          cb(buildCoachSession(session.user), event)
          return
        }
        const built = await buildAuthSessionFromUser(session.user)
        if ('error' in built) {
          // SIGNED_IN is handled by the login form; avoid signing out a session that already succeeded there.
          if (event !== 'SIGNED_IN') {
            await supabase.auth.signOut()
            cb(null, event)
          }
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

  await getSupabase().rpc('sync_platform_admin_bootstrap')

  const profile = await fetchProfileRow(user.id)
  if (!profile) {
    return { error: 'Could not load your profile.' }
  }

  if (profile.role === 'atleta') {
    return buildAthleteAuthSession(user, profile)
  }

  if (profile.blocked) {
    const supabase = getSupabase()
    const { data: sub } = await supabase
      .from('coach_subscriptions')
      .select('status')
      .eq('coach_id', profile.id)
      .maybeSingle()
    await supabase.auth.signOut()
    if (sub?.status === 'past_due') {
      return {
        error:
          'Your account is blocked because your subscription payment is overdue. Contact contact@surfstar.app after paying to restore access.',
      }
    }
    return { error: 'Your account is blocked. Contact SurfStar support if you think this is a mistake.' }
  }

  return enrichCoachSession(user, profile)
}

export type CloudAuthResult =
  | { ok: true; session: AuthSession }
  | { ok: false; error: string }

export type CoachBillingDetails = {
  taxId: string
  billingAddress: BillingAddress
}

export async function cloudSaveCoachBillingDetails(
  userId: string,
  billing: CoachBillingDetails,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const address = normalizeBillingAddress(billing.billingAddress)
  const { error } = await getSupabase()
    .from('profiles')
    .update({
      tax_id: normalizeTaxId(billing.taxId, address.countryCode),
      billing_street: address.street,
      billing_address_line2: address.addressLine2 ?? null,
      billing_postal_code: address.postalCode,
      billing_city: address.city,
      billing_region: address.region ?? null,
      billing_country: address.countryCode,
      billing_address: formatBillingAddress(address),
    })
    .eq('id', userId)
    .eq('role', 'treinador')

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function cloudRegisterCoach(
  name: string,
  email: string,
  password: string,
  billing?: CoachBillingDetails,
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
    if (billing) {
      await cloudSaveCoachBillingDetails(data.session.user.id, billing)
    }
    const session = await buildAuthSessionFromUser(data.session.user)
    if ('error' in session) return { ok: false, error: session.error }
    return {
      ok: true,
      session:
        billing && session.role === 'treinador'
          ? {
              ...session,
              taxId: normalizeTaxId(billing.taxId, billing.billingAddress.countryCode),
              billingAddress: normalizeBillingAddress(billing.billingAddress),
            }
          : session,
    }
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

  if (billing) {
    await cloudSaveCoachBillingDetails(signInData.user.id, billing)
  }

  const session = await buildAuthSessionFromUser(signInData.user)
  if ('error' in session) return { ok: false, error: session.error }
  return {
    ok: true,
    session:
      billing && session.role === 'treinador'
        ? {
            ...session,
            taxId: normalizeTaxId(billing.taxId, billing.billingAddress.countryCode),
            billingAddress: normalizeBillingAddress(billing.billingAddress),
          }
        : session,
  }
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
        error: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
      }
    }
    return { ok: false, error: AUTH_ERROR_CODES.SIGN_IN_FAILED }
  }

  if (!data.user) return { ok: false, error: AUTH_ERROR_CODES.SIGN_IN_FAILED }

  const session = await buildAuthSessionFromUser(data.user)
  if ('error' in session) return { ok: false, error: session.error }
  return { ok: true, session }
}

export async function cloudLogout(): Promise<void> {
  await getSupabase().auth.signOut()
}

export async function cloudLoadCoachData(organizationId: string, coachId: string) {
  const [athletes, links, spots, conditions, trainingSessions, customTemplates] = await Promise.all([
    cloudFetchCoachAthletes(organizationId),
    cloudFetchCoachLinks(organizationId),
    cloudFetchSpots(organizationId),
    cloudFetchConditions(organizationId),
    cloudFetchTrainingSessions(organizationId),
    cloudFetchCustomTemplates(organizationId),
  ])
  return { athletes, links, spots, conditions, trainingSessions, customTemplates, coachId }
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

export async function cloudVerifyRecoveryOtp(
  email: string,
  token: string,
): Promise<{ ok: true; session: AuthSession } | { ok: false; error: string }> {
  const normalized = normalizeEmail(email)
  const code = normalizePasswordResetCode(token)
  if (!isValidEmail(normalized)) {
    return { ok: false, error: 'Enter a valid email address.' }
  }
  if (code.length !== PASSWORD_RESET_OTP_LENGTH) {
    return {
      ok: false,
      error: `Enter the ${PASSWORD_RESET_OTP_LENGTH}-digit code from your email.`,
    }
  }

  const { data, error } = await getSupabase().auth.verifyOtp({
    email: normalized,
    token: code,
    type: 'recovery',
  })
  if (error) return { ok: false, error: error.message }
  if (!data.user) return { ok: false, error: 'Invalid or expired code.' }

  const built = await buildAuthSessionFromUser(data.user)
  if ('error' in built) return { ok: false, error: built.error }
  return { ok: true, session: built }
}

export async function cloudResetPassword(
  email: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalized = normalizeEmail(email)
  if (!isValidEmail(normalized)) {
    return { ok: false, error: 'Enter a valid email address.' }
  }

  const redirectTo = `${window.location.origin}/reset-password`
  const { error } = await getSupabase().auth.resetPasswordForEmail(normalized, { redirectTo })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function cloudFetchSpots(organizationId: string): Promise<SurfSpot[]> {
  const { data, error } = await getSupabase()
    .from('spots')
    .select('id, name')
    .eq('organization_id', organizationId)

  if (error || !data) return []
  return data as SurfSpot[]
}

export async function cloudFetchConditions(organizationId: string): Promise<string[]> {
  const { data, error } = await getSupabase()
    .from('coach_conditions')
    .select('label')
    .eq('organization_id', organizationId)

  if (error || !data) return []
  return data.map((r: { label: string }) => r.label)
}

export async function cloudFetchTrainingSessions(organizationId: string): Promise<TrainingSession[]> {
  const { data, error } = await getSupabase()
    .from('training_sessions')
    .select('payload')
    .eq('organization_id', organizationId)
    .order('updated_at', { ascending: false })

  if (error || !data) return []
  return data.map((r: { payload: TrainingSession }) => ({
    ...r.payload,
    organizationId,
    spotName: r.payload.spotName?.trim() ?? '',
  }))
}

export type CloudSaveResult = { ok: true } | { ok: false; error: string }

export async function cloudSaveTrainingSessions(
  organizationId: string,
  coachId: string,
  sessions: TrainingSession[],
): Promise<CloudSaveResult> {
  const supabase = getSupabase()
  const orgSessions = sessions
    .filter((s) => s.organizationId === organizationId || s.coachId === coachId)
    .map((s) => ({ ...s, organizationId, coachId: s.coachId || coachId }))

  const { data: existing, error: fetchError } = await supabase
    .from('training_sessions')
    .select('id')
    .eq('organization_id', organizationId)

  if (fetchError) return { ok: false, error: fetchError.message }

  const keepIds = new Set(orgSessions.map((s) => s.id))
  const toDelete = (existing ?? []).filter((r: { id: string }) => !keepIds.has(r.id)).map((r) => r.id)

  if (toDelete.length > 0) {
    const { error } = await supabase.from('training_sessions').delete().in('id', toDelete)
    if (error) return { ok: false, error: error.message }
  }

  if (orgSessions.length === 0) return { ok: true }

  const { error } = await supabase.from('training_sessions').upsert(
    orgSessions.map((s) => ({
      id: s.id,
      coach_id: s.coachId,
      organization_id: organizationId,
      payload: s,
      updated_at: new Date().toISOString(),
    })),
  )
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function cloudSaveSpots(organizationId: string, coachId: string, spots: SurfSpot[]): Promise<CloudSaveResult> {
  const supabase = getSupabase()
  const { data: existing, error: fetchError } = await supabase
    .from('spots')
    .select('id')
    .eq('organization_id', organizationId)
  if (fetchError) return { ok: false, error: fetchError.message }

  const keep = new Set(spots.map((s) => s.id))
  const deleteIds = (existing ?? []).filter((r: { id: string }) => !keep.has(r.id)).map((r) => r.id)
  if (deleteIds.length) {
    const { error } = await supabase.from('spots').delete().in('id', deleteIds)
    if (error) return { ok: false, error: error.message }
  }
  if (spots.length) {
    const { error } = await supabase.from('spots').upsert(
      spots.map((s) => ({ id: s.id, coach_id: coachId, organization_id: organizationId, name: s.name })),
    )
    if (error) return { ok: false, error: error.message }
  }
  return { ok: true }
}

export async function cloudSaveConditions(
  organizationId: string,
  coachId: string,
  conditions: string[],
): Promise<CloudSaveResult> {
  const supabase = getSupabase()
  const { error: deleteError } = await supabase
    .from('coach_conditions')
    .delete()
    .eq('organization_id', organizationId)
  if (deleteError) return { ok: false, error: deleteError.message }

  if (conditions.length) {
    const { error } = await supabase.from('coach_conditions').insert(
      conditions.map((label) => ({ coach_id: coachId, organization_id: organizationId, label })),
    )
    if (error) return { ok: false, error: error.message }
  }
  return { ok: true }
}

export async function cloudFetchCustomTemplates(organizationId: string): Promise<CustomTrainingTemplate[]> {
  const { data, error } = await getSupabase()
    .from('custom_training_templates')
    .select('payload')
    .eq('organization_id', organizationId)
    .order('updated_at', { ascending: false })

  if (error || !data) return []
  return data.map((row: { payload: CustomTrainingTemplate }) => row.payload)
}

export async function cloudSaveCustomTemplates(
  organizationId: string,
  coachId: string,
  templates: CustomTrainingTemplate[],
): Promise<CloudSaveResult> {
  const supabase = getSupabase()
  const { data: existing, error: fetchError } = await supabase
    .from('custom_training_templates')
    .select('id')
    .eq('organization_id', organizationId)

  if (fetchError) return { ok: false, error: fetchError.message }

  const keep = new Set(templates.map((t) => t.id))
  const deleteIds = (existing ?? []).map((r: { id: string }) => r.id).filter((id) => !keep.has(id))

  if (deleteIds.length) {
    const { error } = await supabase.from('custom_training_templates').delete().in('id', deleteIds)
    if (error) return { ok: false, error: error.message }
  }

  if (templates.length) {
    const { error } = await supabase.from('custom_training_templates').upsert(
      templates.map((template) => ({
        id: template.id,
        coach_id: coachId,
        organization_id: organizationId,
        payload: template,
        updated_at: template.updatedAt,
      })),
    )
    if (error) return { ok: false, error: error.message }
  }

  return { ok: true }
}
