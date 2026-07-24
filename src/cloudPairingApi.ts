import { getSupabase } from './lib/supabase'
import type { Athlete, AthleteShareSettings, CoachAthleteLink, TrainingSession } from './types'
import { normalizeAthleteShareSettings } from './types'

type LinkRow = {
  id: string
  coach_id: string
  athlete_id: string
  status: 'pending' | 'active' | 'revoked'
  initiated_by: 'coach' | 'athlete'
  share_settings: Partial<AthleteShareSettings> | null
  blocked: boolean
  created_at?: string
  athletes?: { id: string; name: string; pairing_code: string | null } | { id: string; name: string; pairing_code: string | null }[]
  profiles?: { name: string } | { name: string }[]
}

function mapLinkRow(row: LinkRow, coachName?: string, athleteName?: string): CoachAthleteLink {
  const athlete = Array.isArray(row.athletes) ? row.athletes[0] : row.athletes
  const coach = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
  return {
    id: row.id,
    coachId: row.coach_id,
    athleteId: row.athlete_id,
    status: row.status,
    initiatedBy: row.initiated_by,
    shareSettings: normalizeAthleteShareSettings(row.share_settings),
    blocked: row.blocked ?? false,
    coachName: coachName ?? coach?.name,
    athleteName: athleteName ?? athlete?.name,
    createdAt: row.created_at,
  }
}

function mapCoachAthlete(row: LinkRow): Athlete {
  const athlete = Array.isArray(row.athletes) ? row.athletes[0] : row.athletes
  if (!athlete) {
    return {
      id: row.athlete_id,
      name: 'Athlete',
      pairingCode: '',
      linkId: row.id,
      coachId: row.coach_id,
      shareSettings: normalizeAthleteShareSettings(row.share_settings),
      blocked: row.blocked ?? false,
    }
  }
  return {
    id: athlete.id,
    name: athlete.name,
    pairingCode: athlete.pairing_code ?? '',
    linkId: row.id,
    coachId: row.coach_id,
    shareSettings: normalizeAthleteShareSettings(row.share_settings),
    blocked: row.blocked ?? false,
  }
}

export async function cloudFetchCoachLinks(coachId: string): Promise<CoachAthleteLink[]> {
  const { data, error } = await getSupabase()
    .from('coach_athlete_links')
    .select(
      'id, coach_id, athlete_id, status, initiated_by, share_settings, blocked, created_at, athletes(id, name, pairing_code)',
    )
    .eq('coach_id', coachId)
    .order('created_at', { ascending: true })

  if (error || !data) return []
  return (data as LinkRow[]).map((row) => mapLinkRow(row))
}

export async function cloudFetchAthleteLinks(athleteId: string): Promise<CoachAthleteLink[]> {
  const { data, error } = await getSupabase()
    .from('coach_athlete_links')
    .select(
      'id, coach_id, athlete_id, status, initiated_by, share_settings, blocked, created_at, profiles:coach_id(name)',
    )
    .eq('athlete_id', athleteId)
    .order('created_at', { ascending: true })

  if (error || !data) return []
  return (data as LinkRow[]).map((row) => mapLinkRow(row))
}

export async function cloudFetchCoachAthletes(coachId: string): Promise<Athlete[]> {
  const { data, error } = await getSupabase()
    .from('coach_athlete_links')
    .select(
      'id, coach_id, athlete_id, status, share_settings, blocked, athletes(id, name, pairing_code)',
    )
    .eq('coach_id', coachId)
    .eq('status', 'active')

  if (error || !data) return []
  return (data as LinkRow[]).map((row) => mapCoachAthlete(row))
}

export async function cloudFetchAthleteProfile(athleteId: string): Promise<Athlete | null> {
  const { data, error } = await getSupabase()
    .from('athletes')
    .select('id, name, pairing_code, blocked')
    .eq('id', athleteId)
    .maybeSingle()

  if (error || !data) return null
  return {
    id: data.id,
    name: data.name,
    pairingCode: data.pairing_code ?? '',
    blocked: data.blocked ?? false,
  }
}

export async function cloudFetchAthleteSessions(athleteId: string): Promise<TrainingSession[]> {
  const { data, error } = await getSupabase().rpc('get_athlete_training_sessions', {
    p_athlete_id: athleteId,
  })

  if (error || !data) return []
  return data as TrainingSession[]
}

export async function cloudRequestPairingByCode(
  code: string,
): Promise<
  | { ok: true; linkId: string; athleteName: string; status: string }
  | { ok: false; error: string }
> {
  const { data, error } = await getSupabase().rpc('coach_request_pairing', { p_code: code.trim() })

  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('coach_request_pairing')) {
      return {
        ok: false,
        error: 'Pairing is not set up in the cloud. Run supabase/add-coach-athlete-pairing.sql.',
      }
    }
    return { ok: false, error: error.message }
  }

  const result = data as { ok?: boolean; error?: string; link_id?: string; athlete_name?: string; status?: string }
  if (!result?.ok) {
    return { ok: false, error: result?.error ?? 'Could not send pairing request.' }
  }

  return {
    ok: true,
    linkId: result.link_id!,
    athleteName: result.athlete_name ?? 'Athlete',
    status: result.status ?? 'pending',
  }
}

export async function cloudRespondToPairing(
  linkId: string,
  accept: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await getSupabase().rpc('respond_to_pairing', {
    p_link_id: linkId,
    p_accept: accept,
  })

  if (error) return { ok: false, error: error.message }
  const result = data as { ok?: boolean; error?: string }
  if (!result?.ok) return { ok: false, error: result?.error ?? 'Could not update request.' }
  return { ok: true }
}

export async function cloudRevokePairing(
  linkId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await getSupabase().rpc('revoke_pairing', { p_link_id: linkId })
  if (error) return { ok: false, error: error.message }
  const result = data as { ok?: boolean; error?: string }
  if (!result?.ok) return { ok: false, error: result?.error ?? 'Could not remove link.' }
  return { ok: true }
}

export async function cloudSetLinkBlocked(
  linkId: string,
  blocked: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await getSupabase().rpc('set_link_blocked', {
    p_link_id: linkId,
    p_blocked: blocked,
  })
  if (error) return { ok: false, error: error.message }
  const result = data as { ok?: boolean; error?: string }
  if (!result?.ok) return { ok: false, error: result?.error ?? 'Could not update block status.' }
  return { ok: true }
}

export async function cloudUpdateLinkShareSettings(
  linkId: string,
  shareSettings: AthleteShareSettings,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await getSupabase().rpc('update_link_share_settings', {
    p_link_id: linkId,
    p_settings: normalizeAthleteShareSettings(shareSettings),
  })
  if (error) return { ok: false, error: error.message }
  const result = data as { ok?: boolean; error?: string }
  if (!result?.ok) return { ok: false, error: result?.error ?? 'Could not save share settings.' }
  return { ok: true }
}

export async function cloudSetupSelfRegisteredAthlete(): Promise<
  { ok: true; athleteId: string; pairingCode: string } | { ok: false; error: string }
> {
  const { data, error } = await getSupabase().rpc('setup_self_registered_athlete')
  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('setup_self_registered_athlete')) {
      return {
        ok: false,
        error: 'Athlete setup is not configured. Run supabase/add-coach-athlete-pairing.sql.',
      }
    }
    return { ok: false, error: error.message }
  }
  const result = data as { ok?: boolean; error?: string; athlete_id?: string; pairing_code?: string }
  if (!result?.ok || !result.athlete_id) {
    return { ok: false, error: result?.error ?? 'Could not set up athlete profile.' }
  }
  return {
    ok: true,
    athleteId: result.athlete_id,
    pairingCode: result.pairing_code ?? '',
  }
}

export async function cloudLoadAthletePortalData(athleteId: string) {
  const [athlete, links, trainingSessions] = await Promise.all([
    cloudFetchAthleteProfile(athleteId),
    cloudFetchAthleteLinks(athleteId),
    cloudFetchAthleteSessions(athleteId),
  ])
  return { athlete, links, trainingSessions }
}

export async function cloudLoadCoachPairingData(coachId: string) {
  const [athletes, links] = await Promise.all([
    cloudFetchCoachAthletes(coachId),
    cloudFetchCoachLinks(coachId),
  ])
  return { athletes, links }
}
