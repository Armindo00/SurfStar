import type { HeatInterferenceType, HeatRecord, HeatWaveScore } from './types'

export const MAX_HEAT_ATHLETES = 4

export function clampHeatScore(value: number): number {
  const clamped = Math.min(10, Math.max(0, value))
  return Math.round(clamped * 100) / 100
}

export function formatHeatScore(score: number): string {
  return `${clampHeatScore(score).toFixed(2)} pts`
}

export function formatHeatTotal(score: number): string {
  return `${(Math.round(score * 100) / 100).toFixed(2)} pts`
}

export function parseHeatScoreInput(raw: string): number | null {
  const normalized = raw.trim().replace(',', '.')
  if (!normalized) return null
  const value = Number(normalized)
  if (!Number.isFinite(value)) return null
  return clampHeatScore(value)
}

function roundTotal(value: number) {
  return Math.round(value * 100) / 100
}

export function scoresForAthlete(heat: HeatRecord, athleteId: string): HeatWaveScore[] {
  return heat.waveScores.filter((w) => w.athleteId === athleteId)
}

export function getHeatInterference(
  heat: HeatRecord,
  athleteId: string,
): HeatInterferenceType | null {
  const list = (heat.interferences ?? []).filter((i) => i.athleteId === athleteId)
  if (list.length === 0) return null
  return list[list.length - 1].type
}

export type HeatResultBreakdown = {
  total: number
  /** Values used in the total (2nd may be halved). */
  countingScores: number[]
  countingWaveIds: Set<string>
  interference: HeatInterferenceType | null
  /** Raw 2nd-best wave score before penalty, if any. */
  rawSecondBest: number | null
}

export function heatResultBreakdown(heat: HeatRecord, athleteId: string): HeatResultBreakdown {
  const logs = scoresForAthlete(heat, athleteId)
  const ranked = [...logs].sort((a, b) => b.score - a.score || a.at.localeCompare(b.at))
  const interference = getHeatInterference(heat, athleteId)
  const best = ranked[0]
  const second = ranked[1]

  if (!best) {
    return {
      total: 0,
      countingScores: [],
      countingWaveIds: new Set(),
      interference,
      rawSecondBest: null,
    }
  }

  const bestScore = best.score

  if (!second) {
    return {
      total: roundTotal(bestScore),
      countingScores: [bestScore],
      countingWaveIds: new Set([best.id]),
      interference,
      rawSecondBest: null,
    }
  }

  const secondScore = second.score

  if (interference === 'drop-second') {
    return {
      total: roundTotal(bestScore),
      countingScores: [bestScore],
      countingWaveIds: new Set([best.id]),
      interference,
      rawSecondBest: secondScore,
    }
  }

  if (interference === 'half-second') {
    const halfSecond = roundTotal(secondScore / 2)
    return {
      total: roundTotal(bestScore + halfSecond),
      countingScores: [bestScore, halfSecond],
      countingWaveIds: new Set([best.id, second.id]),
      interference,
      rawSecondBest: secondScore,
    }
  }

  return {
    total: roundTotal(bestScore + secondScore),
    countingScores: [bestScore, secondScore],
    countingWaveIds: new Set([best.id, second.id]),
    interference,
    rawSecondBest: secondScore,
  }
}

/** @deprecated use heatResultBreakdown */
export function countingWaveTotal(scores: number[]): number {
  if (scores.length === 0) return 0
  const sorted = [...scores].sort((a, b) => b - a)
  const top = sorted.slice(0, 2)
  return roundTotal(top.reduce((sum, s) => sum + s, 0))
}

export function countingWaveLogIds(heat: HeatRecord, athleteId: string): Set<string> {
  return heatResultBreakdown(heat, athleteId).countingWaveIds
}

export function heatAthleteTotals(heat: HeatRecord): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const id of heat.athleteIds) {
    totals[id] = heatResultBreakdown(heat, id).total
  }
  return totals
}

export function heatRemainingMs(heat: HeatRecord, now = Date.now()): number | null {
  if (!heat.timerStartedAt || heat.endedAt) return null
  const end = new Date(heat.timerStartedAt).getTime() + heat.durationMinutes * 60 * 1000
  return Math.max(0, end - now)
}

export function heatIsRunning(heat: HeatRecord): boolean {
  return Boolean(heat.timerStartedAt && !heat.endedAt)
}

export function heatIsFinished(heat: HeatRecord): boolean {
  return Boolean(heat.endedAt)
}

export type HeatWaveCellState = 'counting' | 'int-drop' | 'int-half' | 'normal'

export function wavesOrderedChronological(heat: HeatRecord, athleteId: string): HeatWaveScore[] {
  return [...scoresForAthlete(heat, athleteId)].sort((a, b) => a.at.localeCompare(b.at))
}

export function maxWavesInHeat(heat: HeatRecord): number {
  if (heat.athleteIds.length === 0) return 0
  return Math.max(...heat.athleteIds.map((id) => scoresForAthlete(heat, id).length))
}

export function heatWaveCellState(
  heat: HeatRecord,
  athleteId: string,
  wave: HeatWaveScore,
): HeatWaveCellState {
  const breakdown = heatResultBreakdown(heat, athleteId)
  const ranked = [...scoresForAthlete(heat, athleteId)].sort(
    (a, b) => b.score - a.score || a.at.localeCompare(b.at),
  )
  const second = ranked[1]

  if (breakdown.interference === 'drop-second' && second && wave.id === second.id) {
    return 'int-drop'
  }

  if (breakdown.countingWaveIds.has(wave.id)) {
    if (breakdown.interference === 'half-second' && second && wave.id === second.id) {
      return 'int-half'
    }
    return 'counting'
  }

  return 'normal'
}

export function formatWaveScoreCompact(score: number): string {
  return clampHeatScore(score).toFixed(2)
}

export function formatWaveCountingLine(heat: HeatRecord, athleteId: string): string {
  const logs = scoresForAthlete(heat, athleteId)
  const breakdown = heatResultBreakdown(heat, athleteId)
  if (logs.length === 0) return '—'

  return logs
    .map((w) => {
      const label = formatHeatScore(w.score)
      if (!breakdown.countingWaveIds.has(w.id)) return label
      if (
        breakdown.interference === 'half-second' &&
        breakdown.rawSecondBest !== null &&
        w.score === breakdown.rawSecondBest
      ) {
        const half = roundTotal(w.score / 2)
        return `${label} ★ → ${formatHeatScore(half)}`
      }
      return `${label} ★`
    })
    .join(', ')
}
