import {
  heatIsFinished,
  heatResultBreakdown,
  heatWaveElapsedMs,
  type HeatResultBreakdown,
} from './heatUtils'
import type { HeatRecord, TrainingSession } from './types'

/** Wave score considered a strong / major scoring wave (0–10 scale). */
export const MAJOR_HEAT_WAVE_SCORE = 7

export const HEAT_OPENING_WINDOW_MIN = 5
export const HEAT_EARLY_WINDOW_MIN = 10
export const HEAT_CLOSING_WINDOW_MIN = 5
/** Target combined score (top 2 waves) within the first 10 minutes. */
export const EARLY_HEAT_TOTAL_TARGET = 10

export type HeatTimingMetrics = {
  heatId: string
  heatLabel: string
  durationMinutes: number
  hasTimerData: boolean
  waveCount: number
  /** Best single wave in the opening window (first 5 min). */
  bestWaveOpening: number | null
  /** Combined top-2 wave total from scores logged within the first 10 minutes. */
  earlyTotalFirst10Min: number | null
  /** Top-2 total in the first 10 minutes is at least {@link EARLY_HEAT_TOTAL_TARGET} pts. */
  reachedTenPointsInEarlyWindow: boolean
  /** Minutes from heat start until the first logged wave. */
  timeToFirstWaveMin: number | null
  /** Minutes from heat start until the 2nd major score (null if never reached). */
  timeToTwoMajorMin: number | null
  /** Best single wave in the closing window (last 5 min). */
  bestWaveClosing: number | null
  /** At least one major score in the closing window. */
  majorInClosingWindow: boolean
  majorCountClosingWindow: number
  /** Heat total from counting rules. */
  total: number
}

export type AthleteHeatTimingRow = HeatTimingMetrics & {
  sessionId: string
  sessionEndedAt: string
  placement: number
  won: boolean
}

export type AthleteHeatAnalyticsSummary = {
  /** Finished heats with a started timer (timing metrics available). */
  heatsWithTiming: number
  /** All finished heat participations in the period. */
  heatsTotal: number
  avgHeatScore: number | null
  avgBestWaveOpening: number | null
  /** Share of timed heats with 10+ pts (top 2) within the first 10 minutes. */
  earlyTenPointsRate: number | null
  avgEarlyTotalFirst10Min: number | null
  avgTimeToFirstWaveMin: number | null
  /** Heats where the athlete logged at least one wave with timer data. */
  heatsWithFirstWave: number
  avgTimeToTwoMajorMin: number | null
  /** Heats where the athlete reached 2 major scores (denominator for avg time). */
  heatsWithTwoMajor: number
  avgBestWaveClosing: number | null
  /** Share of timed heats with at least one major score in the last 5 minutes. */
  closingMajorRate: number | null
  /** Share of timed heats with at least one major score in the opening 5 minutes. */
  openingMajorRate: number | null
  /** Closing best avg minus opening best avg (positive = stronger finish). */
  clutchDelta: number | null
  rows: AthleteHeatTimingRow[]
}

function isMajorScore(score: number): boolean {
  return score >= MAJOR_HEAT_WAVE_SCORE
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function average(values: number[]): number | null {
  if (values.length === 0) return null
  return round2(values.reduce((sum, value) => sum + value, 0) / values.length)
}

function earlyWindowTopTwoTotal(scores: number[]): number | null {
  if (scores.length === 0) return null
  const sorted = [...scores].sort((a, b) => b - a)
  return round2(sorted.slice(0, 2).reduce((sum, score) => sum + score, 0))
}

function rate(count: number, total: number): number | null {
  if (total === 0) return null
  return Math.round((count / total) * 100)
}

export function analyzeHeatTiming(
  heat: HeatRecord,
  athleteId: string,
  breakdown: HeatResultBreakdown = heatResultBreakdown(heat, athleteId),
): HeatTimingMetrics {
  const athleteWaves = heat.waveScores.filter((wave) => wave.athleteId === athleteId)
  const hasTimerData = Boolean(heat.timerStartedAt)

  if (!hasTimerData) {
    return {
      heatId: heat.id,
      heatLabel: heat.label,
      durationMinutes: heat.durationMinutes,
      hasTimerData: false,
      waveCount: athleteWaves.length,
      bestWaveOpening: null,
      earlyTotalFirst10Min: null,
      reachedTenPointsInEarlyWindow: false,
      timeToFirstWaveMin: null,
      timeToTwoMajorMin: null,
      bestWaveClosing: null,
      majorInClosingWindow: false,
      majorCountClosingWindow: 0,
      total: breakdown.total,
    }
  }

  const openingLimitMs = Math.min(
    HEAT_OPENING_WINDOW_MIN * 60_000,
    heat.durationMinutes * 60_000,
  )
  const earlyLimitMs = Math.min(
    HEAT_EARLY_WINDOW_MIN * 60_000,
    heat.durationMinutes * 60_000,
  )
  const closingStartMs = Math.max(0, heat.durationMinutes * 60_000 - HEAT_CLOSING_WINDOW_MIN * 60_000)

  let bestWaveOpening: number | null = null
  const earlyWindowScores: number[] = []
  let bestWaveClosing: number | null = null
  let majorCountClosingWindow = 0

  const timedWaves = athleteWaves
    .map((wave) => ({
      wave,
      elapsedMs: heatWaveElapsedMs(heat, wave.at),
    }))
    .filter((entry): entry is { wave: (typeof athleteWaves)[number]; elapsedMs: number } => {
      return entry.elapsedMs !== null
    })
    .sort((a, b) => a.elapsedMs - b.elapsedMs)

  let majorCountChronological = 0
  let timeToTwoMajorMin: number | null = null

  for (const { wave, elapsedMs } of timedWaves) {
    if (elapsedMs <= openingLimitMs) {
      bestWaveOpening =
        bestWaveOpening === null ? wave.score : Math.max(bestWaveOpening, wave.score)
    }

    if (elapsedMs <= earlyLimitMs) {
      earlyWindowScores.push(wave.score)
    }

    if (elapsedMs >= closingStartMs) {
      bestWaveClosing =
        bestWaveClosing === null ? wave.score : Math.max(bestWaveClosing, wave.score)
      if (isMajorScore(wave.score)) {
        majorCountClosingWindow += 1
      }
    }

    if (isMajorScore(wave.score)) {
      majorCountChronological += 1
      if (majorCountChronological === 2 && timeToTwoMajorMin === null) {
        timeToTwoMajorMin = round2(elapsedMs / 60_000)
      }
    }
  }

  const earlyTotalFirst10Min = earlyWindowTopTwoTotal(earlyWindowScores)
  const reachedTenPointsInEarlyWindow =
    earlyTotalFirst10Min !== null && earlyTotalFirst10Min >= EARLY_HEAT_TOTAL_TARGET
  const timeToFirstWaveMin =
    timedWaves.length > 0 ? round2(timedWaves[0]!.elapsedMs / 60_000) : null

  return {
    heatId: heat.id,
    heatLabel: heat.label,
    durationMinutes: heat.durationMinutes,
    hasTimerData: true,
    waveCount: athleteWaves.length,
    bestWaveOpening,
    earlyTotalFirst10Min,
    reachedTenPointsInEarlyWindow,
    timeToFirstWaveMin,
    timeToTwoMajorMin,
    bestWaveClosing,
    majorInClosingWindow: majorCountClosingWindow > 0,
    majorCountClosingWindow,
    total: breakdown.total,
  }
}

export type HeatAthleteLiveStats = {
  athleteId: string
  total: number
  waveCount: number
  bestWave: number | null
  countingScores: number[]
  placement: number
  timing: HeatTimingMetrics
}

export type HeatLiveSnapshot = {
  heat: HeatRecord
  athletes: HeatAthleteLiveStats[]
}

function buildHeatAthleteLiveStats(heat: HeatRecord): HeatAthleteLiveStats[] {
  const totals = heat.athleteIds.reduce<Record<string, number>>((acc, id) => {
    acc[id] = heatResultBreakdown(heat, id).total
    return acc
  }, {})
  const ranked = [...heat.athleteIds].sort(
    (a, b) => (totals[b] ?? 0) - (totals[a] ?? 0) || a.localeCompare(b),
  )

  return heat.athleteIds
    .map((athleteId) => {
      const breakdown = heatResultBreakdown(heat, athleteId)
      const waves = heat.waveScores.filter((wave) => wave.athleteId === athleteId)
      const timing = analyzeHeatTiming(heat, athleteId, breakdown)

      return {
        athleteId,
        total: breakdown.total,
        waveCount: waves.length,
        bestWave: waves.length > 0 ? Math.max(...waves.map((wave) => wave.score)) : null,
        countingScores: breakdown.countingScores,
        placement: ranked.indexOf(athleteId) + 1,
        timing,
      }
    })
    .sort((a, b) => a.placement - b.placement)
}

export function buildHeatLiveSnapshots(session: TrainingSession): HeatLiveSnapshot[] {
  if (session.mode !== 'heats' && session.mode !== 'campeonato') return []

  return session.heats
    .filter((heat) => heat.athleteIds.length > 0)
    .map((heat) => ({
      heat,
      athletes: buildHeatAthleteLiveStats(heat),
    }))
}

export function buildAthleteHeatAnalytics(
  sessions: TrainingSession[],
  athleteId: string,
): AthleteHeatAnalyticsSummary {
  const rows: AthleteHeatTimingRow[] = []
  const heatTotals: number[] = []

  for (const session of sessions) {
    for (const heat of session.heats) {
      if (!heatIsFinished(heat) || !heat.athleteIds.includes(athleteId)) continue

      const breakdown = heatResultBreakdown(heat, athleteId)
      heatTotals.push(breakdown.total)

      const totals = heat.athleteIds.reduce<Record<string, number>>((acc, id) => {
        acc[id] = heatResultBreakdown(heat, id).total
        return acc
      }, {})
      const ranked = [...heat.athleteIds].sort(
        (a, b) => (totals[b] ?? 0) - (totals[a] ?? 0) || a.localeCompare(b),
      )
      const placement = ranked.indexOf(athleteId) + 1
      const maxTotal = Math.max(...heat.athleteIds.map((id) => totals[id] ?? 0))
      const timing = analyzeHeatTiming(heat, athleteId, breakdown)

      rows.push({
        ...timing,
        sessionId: session.id,
        sessionEndedAt: session.endedAt ?? session.startedAt,
        placement,
        won: breakdown.total > 0 && breakdown.total >= maxTotal,
      })
    }
  }

  rows.sort((a, b) => b.sessionEndedAt.localeCompare(a.sessionEndedAt))

  const timedRows = rows.filter((row) => row.hasTimerData)
  const openingBests = timedRows
    .map((row) => row.bestWaveOpening)
    .filter((value): value is number => value !== null)
  const closingBests = timedRows
    .map((row) => row.bestWaveClosing)
    .filter((value): value is number => value !== null)
  const timeToFirstWave = timedRows
    .map((row) => row.timeToFirstWaveMin)
    .filter((value): value is number => value !== null)
  const timeToTwoMajor = timedRows
    .map((row) => row.timeToTwoMajorMin)
    .filter((value): value is number => value !== null)

  const earlyTotals = timedRows
    .map((row) => row.earlyTotalFirst10Min)
    .filter((value): value is number => value !== null)

  const avgBestWaveOpening = average(openingBests)
  const avgBestWaveClosing = average(closingBests)

  return {
    heatsWithTiming: timedRows.length,
    heatsTotal: rows.length,
    avgHeatScore: average(heatTotals),
    avgBestWaveOpening,
    earlyTenPointsRate: rate(
      timedRows.filter((row) => row.reachedTenPointsInEarlyWindow).length,
      timedRows.length,
    ),
    avgEarlyTotalFirst10Min: average(earlyTotals),
    avgTimeToFirstWaveMin: average(timeToFirstWave),
    heatsWithFirstWave: timeToFirstWave.length,
    avgTimeToTwoMajorMin: average(timeToTwoMajor),
    heatsWithTwoMajor: timeToTwoMajor.length,
    avgBestWaveClosing,
    closingMajorRate: rate(
      timedRows.filter((row) => row.majorInClosingWindow).length,
      timedRows.length,
    ),
    openingMajorRate: rate(
      timedRows.filter((row) => row.bestWaveOpening !== null && row.bestWaveOpening >= MAJOR_HEAT_WAVE_SCORE)
        .length,
      timedRows.length,
    ),
    clutchDelta:
      avgBestWaveOpening !== null && avgBestWaveClosing !== null
        ? round2(avgBestWaveClosing - avgBestWaveOpening)
        : null,
    rows,
  }
}
