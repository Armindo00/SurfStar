import { heatIsFinished, heatResultBreakdown } from './heatUtils'
import {
  buildEvolutionSlotsForRange,
  parseAnalyticsRangeBounds,
  presetAnalyticsRange,
  sessionTimestamp,
  type AnalyticsRange,
} from './analyticsRange'
import {
  computeAthleteComboStats,
  computeAthleteGeneralStats,
  computeAthleteTechnicalStats,
  filterAthleteSessions,
} from './athleteStats'
import { formatDayMonth, formatMonthShort, formatWeekdayShort } from './dateFormat'
import {
  computeComboSessionStats,
  computeSessionStats,
  computeWaveStats,
  levelToNumeric,
} from './sessionStats'
import type { TrainingSession } from './types'

export const TEAM_ANALYTICS_MONTHS = 6

export type AnalyticsPeriod = '6m' | '1m' | '1w'

export const ANALYTICS_PERIOD_OPTIONS: {
  id: AnalyticsPeriod
  label: string
  shortLabel: string
}[] = [
  { id: '6m', label: 'Last 6 months', shortLabel: '6 months' },
  { id: '1m', label: 'Last month', shortLabel: '1 month' },
  { id: '1w', label: 'Last week', shortLabel: '1 week' },
]

export function analyticsPeriodLabel(period: AnalyticsPeriod): string {
  return ANALYTICS_PERIOD_OPTIONS.find((option) => option.id === period)?.shortLabel ?? period
}

export type EvolutionPoint = {
  periodKey: string
  label: string
  sessions: number
  waves: number
  successRate: number | null
  potentialRate: number | null
  avgManeuverLevel: number | null
}

/** @deprecated Use EvolutionPoint */
export type EvolutionMonthPoint = EvolutionPoint

export type AthletePeriodAnalytics = {
  range: AnalyticsRange
  sessions: TrainingSession[]
  general: ReturnType<typeof computeAthleteGeneralStats>
  evolution: EvolutionPoint[]
  technical: ReturnType<typeof computeAthleteTechnicalStats>
  combo: ReturnType<typeof computeAthleteComboStats>
}

export type AthleteSixMonthAnalytics = AthletePeriodAnalytics & {
  monthlyEvolution: EvolutionPoint[]
}

type EvolutionBucket = {
  sessions: number
  waves: number
  successes: number
  attempts: number
  withPotential: number
  levelSum: number
  levelCount: number
}

type EvolutionSlot = {
  periodKey: string
  label: string
  match: (iso: string) => boolean
}

function emptyBucket(): EvolutionBucket {
  return {
    sessions: 0,
    waves: 0,
    successes: 0,
    attempts: 0,
    withPotential: 0,
    levelSum: 0,
    levelCount: 0,
  }
}

function monthKeyFromIso(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function dayKeyFromIso(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10)
}

export function lastNMonthSlots(count: number): { periodKey: string; label: string }[] {
  const slots: { periodKey: string; label: string }[] = []
  const now = new Date()

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    slots.push({
      periodKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: formatMonthShort(d),
    })
  }

  return slots
}

function lastNWeekSlots(count: number): EvolutionSlot[] {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  return Array.from({ length: count }, (_, index) => {
    const weeksAgo = count - 1 - index
    const start = new Date(now)
    start.setDate(start.getDate() - (weeksAgo + 1) * 7)
    const end = new Date(now)
    end.setDate(end.getDate() - weeksAgo * 7)
    end.setHours(23, 59, 59, 999)

    const label =
      weeksAgo === 0
        ? 'This wk'
        : formatDayMonth(start)

    return {
      periodKey: `week-${weeksAgo}`,
      label,
      match: (iso: string) => {
        const when = new Date(iso).getTime()
        return when >= start.getTime() && when <= end.getTime()
      },
    }
  })
}

function lastNDaySlots(count: number): EvolutionSlot[] {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  return Array.from({ length: count }, (_, index) => {
    const daysAgo = count - 1 - index
    const day = new Date(now)
    day.setDate(day.getDate() - daysAgo)

    const start = new Date(day)
    start.setHours(0, 0, 0, 0)
    const end = new Date(day)
    end.setHours(23, 59, 59, 999)

    const label =
      daysAgo === 0
        ? 'Today'
        : daysAgo === 1
          ? 'Yesterday'
          : formatWeekdayShort(day)

    return {
      periodKey: dayKeyFromIso(start.toISOString()),
      label,
      match: (iso: string) => {
        const when = new Date(iso).getTime()
        return when >= start.getTime() && when <= end.getTime()
      },
    }
  })
}

function evolutionSlotsForPeriod(period: AnalyticsPeriod): EvolutionSlot[] {
  if (period === '6m') {
    return lastNMonthSlots(TEAM_ANALYTICS_MONTHS).map((slot) => ({
      ...slot,
      match: (iso: string) => monthKeyFromIso(iso) === slot.periodKey,
    }))
  }

  if (period === '1m') {
    return lastNWeekSlots(4)
  }

  return lastNDaySlots(7)
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

export function filterAthleteSessionsByPeriod(
  sessions: TrainingSession[],
  coachId: string,
  athleteId: string,
  period: AnalyticsPeriod,
): TrainingSession[] {
  const cutoff = new Date()
  cutoff.setHours(0, 0, 0, 0)

  if (period === '6m') {
    cutoff.setMonth(cutoff.getMonth() - TEAM_ANALYTICS_MONTHS)
  } else if (period === '1m') {
    cutoff.setMonth(cutoff.getMonth() - 1)
  } else {
    cutoff.setDate(cutoff.getDate() - 7)
  }

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

function accumulateSessionLevelSum(
  session: TrainingSession,
  athleteId: string,
): { levelSum: number; levelCount: number } {
  let levelSum = 0
  let levelCount = 0

  for (const wave of session.waves) {
    if (wave.athleteId !== athleteId) continue
    for (const maneuver of wave.maneuvers) {
      levelSum += levelToNumeric(maneuver.level)
      levelCount += 1
    }
    for (const attempt of wave.comboAttempts ?? []) {
      levelSum += levelToNumeric(attempt.level)
      levelCount += 1
    }
  }

  return { levelSum, levelCount }
}

function bucketEvolutionPoints(
  sessions: TrainingSession[],
  athleteId: string,
  slots: EvolutionSlot[],
): EvolutionPoint[] {
  const bucket = new Map<string, EvolutionBucket>()

  for (const slot of slots) {
    bucket.set(slot.periodKey, emptyBucket())
  }

  for (const session of sessions) {
    const when = session.endedAt ?? session.startedAt
    const slot = slots.find((entry) => entry.match(when))
    if (!slot) continue

    const row = bucket.get(slot.periodKey)
    if (!row) continue

    const perf = accumulateSessionPerformance(session, athleteId)
    const levels = accumulateSessionLevelSum(session, athleteId)
    row.sessions += 1
    row.waves += perf.waves
    row.successes += perf.successes
    row.attempts += perf.attempts
    row.withPotential += perf.withPotential
    row.levelSum += levels.levelSum
    row.levelCount += levels.levelCount
  }

  return slots.map((slot) => {
    const row = bucket.get(slot.periodKey)!
    return {
      periodKey: slot.periodKey,
      label: slot.label,
      sessions: row.sessions,
      waves: row.waves,
      successRate: row.attempts ? Math.round((row.successes / row.attempts) * 100) : null,
      potentialRate: row.waves ? Math.round((row.withPotential / row.waves) * 100) : null,
      avgManeuverLevel: row.levelCount
        ? Math.round((row.levelSum / row.levelCount) * 100) / 100
        : null,
    }
  })
}

export function buildAthleteMonthlyEvolution(
  sessions: TrainingSession[],
  athleteId: string,
  months = TEAM_ANALYTICS_MONTHS,
): EvolutionPoint[] {
  const slots = lastNMonthSlots(months).map((slot) => ({
    ...slot,
    match: (iso: string) => monthKeyFromIso(iso) === slot.periodKey,
  }))
  return bucketEvolutionPoints(sessions, athleteId, slots)
}

export function buildAthleteEvolution(
  sessions: TrainingSession[],
  athleteId: string,
  period: AnalyticsPeriod,
): EvolutionPoint[] {
  return bucketEvolutionPoints(sessions, athleteId, evolutionSlotsForPeriod(period))
}

export function filterAthleteSessionsByRange(
  sessions: TrainingSession[],
  coachId: string,
  athleteId: string,
  range: AnalyticsRange,
): TrainingSession[] {
  const { start, end } = parseAnalyticsRangeBounds(range)
  return filterAthleteSessions(sessions, coachId, athleteId).filter((session) => {
    const when = sessionTimestamp(session)
    return when >= start.getTime() && when <= end.getTime()
  })
}

export function buildAthleteRangeAnalytics(
  allSessions: TrainingSession[],
  coachId: string,
  athleteId: string,
  range: AnalyticsRange,
): AthletePeriodAnalytics {
  const sessions = filterAthleteSessionsByRange(allSessions, coachId, athleteId, range)

  return {
    range,
    sessions,
    general: computeAthleteGeneralStats(sessions, athleteId),
    evolution: bucketEvolutionPoints(sessions, athleteId, buildEvolutionSlotsForRange(range)),
    technical: computeAthleteTechnicalStats(sessions, athleteId),
    combo: computeAthleteComboStats(sessions, athleteId),
  }
}

export function buildAthletePeriodAnalytics(
  allSessions: TrainingSession[],
  coachId: string,
  athleteId: string,
  period: AnalyticsPeriod = '6m',
): AthletePeriodAnalytics {
  return buildAthleteRangeAnalytics(allSessions, coachId, athleteId, presetAnalyticsRange(period))
}

export function buildAthleteSixMonthAnalytics(
  allSessions: TrainingSession[],
  coachId: string,
  athleteId: string,
): AthleteSixMonthAnalytics {
  const analytics = buildAthletePeriodAnalytics(allSessions, coachId, athleteId, '6m')
  return {
    ...analytics,
    monthlyEvolution: analytics.evolution,
  }
}
