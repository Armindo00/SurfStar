import { heatIsFinished, heatResultBreakdown } from './heatUtils'
import {
  computeAthleteComboStats,
  computeAthleteGeneralStats,
  computeAthleteTechnicalStats,
  filterAthleteSessions,
} from './athleteStats'
import {
  computeComboSessionStats,
  computeSessionStats,
  computeWaveStats,
} from './sessionStats'
import type { TrainingSession } from './types'

export const TEAM_ANALYTICS_MONTHS = 6

export type EvolutionMonthPoint = {
  monthKey: string
  label: string
  sessions: number
  waves: number
  successRate: number | null
  potentialRate: number | null
}

export type AthleteSixMonthAnalytics = {
  sessions: TrainingSession[]
  general: ReturnType<typeof computeAthleteGeneralStats>
  monthlyEvolution: EvolutionMonthPoint[]
  technical: ReturnType<typeof computeAthleteTechnicalStats>
  combo: ReturnType<typeof computeAthleteComboStats>
}

function monthKeyFromIso(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function lastNMonthSlots(count: number): { monthKey: string; label: string }[] {
  const slots: { monthKey: string; label: string }[] = []
  const now = new Date()

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    slots.push({
      monthKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString(undefined, { month: 'short' }),
    })
  }

  return slots
}

export function filterAthleteSessionsLastMonths(
  sessions: TrainingSession[],
  coachId: string,
  athleteId: string,
  months = TEAM_ANALYTICS_MONTHS,
): TrainingSession[] {
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - months)
  cutoff.setHours(0, 0, 0, 0)

  return filterAthleteSessions(sessions, coachId, athleteId).filter((session) => {
    const when = session.endedAt ?? session.startedAt
    return new Date(when).getTime() >= cutoff.getTime()
  })
}

function accumulateSessionPerformance(
  session: TrainingSession,
  athleteId: string,
): { successes: number; attempts: number; waves: number; withPotential: number } {
  let successes = 0
  let attempts = 0

  if (session.mode === 'tecnico') {
    const stats = computeSessionStats(session, athleteId)
    successes += stats.successfulManeuvers
    attempts += stats.totalManeuvers
  } else if (session.mode === 'combos') {
    const stats = computeComboSessionStats(session, athleteId)
    successes += stats.successfulAttempts
    attempts += stats.totalAttempts
  } else if (session.mode === 'heats' || session.mode === 'campeonato') {
    for (const heat of session.heats) {
      if (!heatIsFinished(heat) || !heat.athleteIds.includes(athleteId)) continue
      const total = heatResultBreakdown(heat, athleteId).total
      if (total > 0) {
        successes += total
        attempts += 20
      }
    }
  }

  const waveStats = computeWaveStats(session, athleteId)

  return {
    successes,
    attempts,
    waves: waveStats.totalWaves,
    withPotential: waveStats.withPotential,
  }
}

export function buildAthleteMonthlyEvolution(
  sessions: TrainingSession[],
  athleteId: string,
  months = TEAM_ANALYTICS_MONTHS,
): EvolutionMonthPoint[] {
  const slots = lastNMonthSlots(months)
  const bucket = new Map<
    string,
    { sessions: number; waves: number; successes: number; attempts: number; withPotential: number }
  >()

  for (const slot of slots) {
    bucket.set(slot.monthKey, {
      sessions: 0,
      waves: 0,
      successes: 0,
      attempts: 0,
      withPotential: 0,
    })
  }

  for (const session of sessions) {
    const when = session.endedAt ?? session.startedAt
    const key = monthKeyFromIso(when)
    const row = bucket.get(key)
    if (!row) continue

    const perf = accumulateSessionPerformance(session, athleteId)
    row.sessions += 1
    row.waves += perf.waves
    row.successes += perf.successes
    row.attempts += perf.attempts
    row.withPotential += perf.withPotential
  }

  return slots.map((slot) => {
    const row = bucket.get(slot.monthKey)!
    return {
      monthKey: slot.monthKey,
      label: slot.label,
      sessions: row.sessions,
      waves: row.waves,
      successRate: row.attempts ? Math.round((row.successes / row.attempts) * 100) : null,
      potentialRate: row.waves ? Math.round((row.withPotential / row.waves) * 100) : null,
    }
  })
}

export function buildAthleteSixMonthAnalytics(
  allSessions: TrainingSession[],
  coachId: string,
  athleteId: string,
): AthleteSixMonthAnalytics {
  const sessions = filterAthleteSessionsLastMonths(allSessions, coachId, athleteId)

  return {
    sessions,
    general: computeAthleteGeneralStats(sessions, athleteId),
    monthlyEvolution: buildAthleteMonthlyEvolution(sessions, athleteId),
    technical: computeAthleteTechnicalStats(sessions, athleteId),
    combo: computeAthleteComboStats(sessions, athleteId),
  }
}
