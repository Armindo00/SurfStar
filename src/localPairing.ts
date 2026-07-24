import type { Athlete, CoachAthleteLink, CoachAccount, TrainingSession } from './types'
import { DEFAULT_ATHLETE_SHARE_SETTINGS } from './types'

export function generatePairingCode(existing: Iterable<string>): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const used = new Set(existing)
  for (let attempt = 0; attempt < 100; attempt++) {
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)]!
    }
    if (!used.has(code)) return code
  }
  return crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase()
}

export function buildCoachAthletesFromLinks(
  links: CoachAthleteLink[],
  athletes: Athlete[],
): Athlete[] {
  const athleteById = new Map(athletes.map((a) => [a.id, a]))
  return links
    .filter((link) => link.status === 'active')
    .map((link) => {
      const base = athleteById.get(link.athleteId)
      return {
        id: link.athleteId,
        name: base?.name ?? link.athleteName ?? 'Athlete',
        pairingCode: base?.pairingCode ?? '',
        linkId: link.id,
        coachId: link.coachId,
        shareSettings: link.shareSettings,
        blocked: link.blocked,
      }
    })
}

export function findAthleteByPairingCode(athletes: Athlete[], code: string): Athlete | undefined {
  const normalized = code.trim().toUpperCase()
  return athletes.find((a) => a.pairingCode.toUpperCase() === normalized)
}

export function loadAthleteSessionsLocal(
  athleteId: string,
  links: CoachAthleteLink[],
  sessions: TrainingSession[],
): TrainingSession[] {
  const activeCoachIds = new Set(
    links.filter((l) => l.status === 'active' && !l.blocked).map((l) => l.coachId),
  )
  return sessions.filter(
    (s) => activeCoachIds.has(s.coachId) && s.athleteIds.includes(athleteId),
  )
}

export function migrateLegacyLocalAthletes(athletes: Athlete[]): Athlete[] {
  const codes = athletes.map((a) => a.pairingCode).filter(Boolean)
  return athletes.map((a) => ({
    ...a,
    pairingCode: a.pairingCode || generatePairingCode(codes),
  }))
}

export function backfillLocalLinks(
  athletes: Athlete[],
  links: CoachAthleteLink[],
  coaches: CoachAccount[],
): CoachAthleteLink[] {
  const existing = new Set(links.map((l) => `${l.coachId}:${l.athleteId}`))
  const next = [...links]
  for (const athlete of athletes) {
    if (!athlete.coachId) continue
    const key = `${athlete.coachId}:${athlete.id}`
    if (existing.has(key)) continue
    next.push({
      id: crypto.randomUUID(),
      coachId: athlete.coachId,
      athleteId: athlete.id,
      status: 'active',
      initiatedBy: 'coach',
      shareSettings: athlete.shareSettings ?? DEFAULT_ATHLETE_SHARE_SETTINGS,
      blocked: athlete.blocked ?? false,
      coachName: coaches.find((c) => c.id === athlete.coachId)?.name,
      athleteName: athlete.name,
    })
  }
  return next
}
