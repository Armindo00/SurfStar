import type { SeaAnalysisLog, SeaAnalysisState, SeaPeak, SeaWaveType } from './types'
import { SEA_ANALYSIS_DURATION_MINUTES, SEA_PEAKS, SEA_WAVE_TYPES } from './types'

export function formatElapsedMs(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min}:${sec.toString().padStart(2, '0')}`
}

export function seaAnalysisDurationMs(): number {
  return SEA_ANALYSIS_DURATION_MINUTES * 60 * 1000
}

export function seaRemainingMs(state: SeaAnalysisState, now = Date.now()): number | null {
  if (!state.timerStartedAt || state.endedAt) return null
  const end = new Date(state.timerStartedAt).getTime() + seaAnalysisDurationMs()
  return Math.max(0, end - now)
}

export function seaIsRunning(state: SeaAnalysisState): boolean {
  return Boolean(state.timerStartedAt && !state.endedAt)
}

export type SeaCountGrid = Record<SeaPeak, Record<SeaWaveType, number>>

export type SeaIntervalRow = {
  peak: SeaPeak
  waveType: SeaWaveType
  gaps: string[]
  averageGap: string | null
  count: number
}

/** Higher = more “potential” wave types (set weighs most). */
const WAVE_POTENTIAL_WEIGHT: Record<SeaWaveType, number> = {
  set: 4,
  'intermedia-grande': 3,
  'intermedia-pequena': 2,
  pequena: 1,
}

export type PeakScoreDetail = {
  observationCount: number
  ratePerHour: number
  weightedPotential: number
  meanIntervalMs: number | null
  meanIntervalLabel: string | null
  compositeScore: number
}

export type PeakRecommendation = {
  recommended: SeaPeak | null
  tie: boolean
  scores: Record<SeaPeak, PeakScoreDetail>
  summary: string
}

export type SeaAnalysisStats = {
  totalObservations: number
  counts: SeaCountGrid
  peakTotals: Record<SeaPeak, number>
  typeTotals: Record<SeaWaveType, number>
  intervals: SeaIntervalRow[]
  timeline: { id: string; elapsed: string; peak: SeaPeak; waveType: SeaWaveType }[]
  recommendation: PeakRecommendation
}

function emptyCounts(): SeaCountGrid {
  return {
    'peak-1': {
      set: 0,
      'intermedia-grande': 0,
      'intermedia-pequena': 0,
      pequena: 0,
    },
    'peak-2': {
      set: 0,
      'intermedia-grande': 0,
      'intermedia-pequena': 0,
      pequena: 0,
    },
  }
}

function logElapsed(state: SeaAnalysisState, log: SeaAnalysisLog): number {
  if (!state.timerStartedAt) return 0
  return new Date(log.at).getTime() - new Date(state.timerStartedAt).getTime()
}

function observationWindowMs(state: SeaAnalysisState, sorted: SeaAnalysisLog[]): number {
  if (!state.timerStartedAt) return 0
  const start = new Date(state.timerStartedAt).getTime()
  let end = state.endedAt ? new Date(state.endedAt).getTime() : Date.now()
  if (sorted.length > 0) {
    const last = new Date(sorted[sorted.length - 1].at).getTime()
    if (!state.endedAt) end = Math.max(end, last)
  }
  return Math.max(1, end - start)
}

function meanIntervalOnPeak(sorted: SeaAnalysisLog[], peak: SeaPeak): number | null {
  const logs = sorted.filter((l) => l.peak === peak)
  if (logs.length < 2) return null
  let sum = 0
  for (let i = 1; i < logs.length; i++) {
    sum += new Date(logs[i].at).getTime() - new Date(logs[i - 1].at).getTime()
  }
  return sum / (logs.length - 1)
}

function weightedPotential(counts: SeaCountGrid, peak: SeaPeak): number {
  let sum = 0
  for (const type of SEA_WAVE_TYPES) {
    sum += counts[peak][type] * WAVE_POTENTIAL_WEIGHT[type]
  }
  return sum
}

function computePeakRecommendation(
  state: SeaAnalysisState,
  sorted: SeaAnalysisLog[],
  counts: SeaCountGrid,
  peakTotals: Record<SeaPeak, number>,
): PeakRecommendation {
  const windowMs = observationWindowMs(state, sorted)
  const windowHours = windowMs / 3_600_000

  const raw: Record<SeaPeak, PeakScoreDetail> = {
    'peak-1': {
      observationCount: peakTotals['peak-1'],
      ratePerHour: 0,
      weightedPotential: weightedPotential(counts, 'peak-1'),
      meanIntervalMs: meanIntervalOnPeak(sorted, 'peak-1'),
      meanIntervalLabel: null,
      compositeScore: 0,
    },
    'peak-2': {
      observationCount: peakTotals['peak-2'],
      ratePerHour: 0,
      weightedPotential: weightedPotential(counts, 'peak-2'),
      meanIntervalMs: meanIntervalOnPeak(sorted, 'peak-2'),
      meanIntervalLabel: null,
      compositeScore: 0,
    },
  }

  for (const peak of SEA_PEAKS) {
    raw[peak].ratePerHour =
      windowHours > 0 ? Math.round((raw[peak].observationCount / windowHours) * 10) / 10 : 0
    raw[peak].meanIntervalLabel =
      raw[peak].meanIntervalMs !== null ? formatElapsedMs(raw[peak].meanIntervalMs) : null
  }

  const maxCount = Math.max(raw['peak-1'].observationCount, raw['peak-2'].observationCount, 1)
  const maxRate = Math.max(raw['peak-1'].ratePerHour, raw['peak-2'].ratePerHour, 0.001)
  const maxWeighted = Math.max(
    raw['peak-1'].weightedPotential,
    raw['peak-2'].weightedPotential,
    1,
  )

  function freqIndex(d: PeakScoreDetail): number {
    if (d.meanIntervalMs !== null && d.meanIntervalMs > 0) return 1 / d.meanIntervalMs
    return d.ratePerHour / 3600
  }

  const maxFreqIdx = Math.max(freqIndex(raw['peak-1']), freqIndex(raw['peak-2']), 0.000001)

  for (const peak of SEA_PEAKS) {
    const d = raw[peak]
    const normCount = d.observationCount / maxCount
    const normRate = d.ratePerHour / maxRate
    const normWeighted = d.weightedPotential / maxWeighted
    const normFreq = freqIndex(d) / maxFreqIdx

    d.compositeScore =
      Math.round(
        (0.35 * normCount + 0.3 * normRate + 0.2 * normWeighted + 0.15 * normFreq) * 1000,
      ) / 10
  }

  const totalObs = peakTotals['peak-1'] + peakTotals['peak-2']
  if (totalObs === 0) {
    return {
      recommended: null,
      tie: false,
      scores: raw,
      summary: 'Log waves with potential to calculate a recommended peak.',
    }
  }

  const s1 = raw['peak-1'].compositeScore
  const s2 = raw['peak-2'].compositeScore
  const tie = Math.abs(s1 - s2) < 5

  let recommended: SeaPeak | null = null
  if (!tie) {
    recommended = s1 >= s2 ? 'peak-1' : 'peak-2'
  }

  const summary = tie
    ? 'Both peaks score similarly on volume, frequency and wave quality — no clear favourite yet.'
    : recommended === 'peak-1'
      ? `Peak 1 leads: ${raw['peak-1'].observationCount} observations, ${raw['peak-1'].ratePerHour}/h, weighted potential ${raw['peak-1'].weightedPotential} (score ${s1} vs ${s2}).`
      : `Peak 2 leads: ${raw['peak-2'].observationCount} observations, ${raw['peak-2'].ratePerHour}/h, weighted potential ${raw['peak-2'].weightedPotential} (score ${s2} vs ${s1}).`

  return { recommended, tie, scores: raw, summary }
}

export function computeSeaAnalysisStats(state: SeaAnalysisState): SeaAnalysisStats {
  const counts = emptyCounts()
  const peakTotals: Record<SeaPeak, number> = { 'peak-1': 0, 'peak-2': 0 }
  const typeTotals: Record<SeaWaveType, number> = {
    set: 0,
    'intermedia-grande': 0,
    'intermedia-pequena': 0,
    pequena: 0,
  }

  const sorted = [...state.logs].sort((a, b) => a.at.localeCompare(b.at))

  for (const log of sorted) {
    counts[log.peak][log.waveType] += 1
    peakTotals[log.peak] += 1
    typeTotals[log.waveType] += 1
  }

  const intervals: SeaIntervalRow[] = []

  for (const peak of SEA_PEAKS) {
    for (const waveType of SEA_WAVE_TYPES) {
      const subset = sorted.filter((l) => l.peak === peak && l.waveType === waveType)
      const gapsMs: number[] = []
      for (let i = 1; i < subset.length; i++) {
        gapsMs.push(new Date(subset[i].at).getTime() - new Date(subset[i - 1].at).getTime())
      }
      const gaps = gapsMs.map(formatElapsedMs)
      const averageGap =
        gapsMs.length > 0
          ? formatElapsedMs(Math.round(gapsMs.reduce((a, b) => a + b, 0) / gapsMs.length))
          : null
      intervals.push({
        peak,
        waveType,
        gaps,
        averageGap,
        count: subset.length,
      })
    }
  }

  const timeline = sorted.map((log) => ({
    id: log.id,
    elapsed: formatElapsedMs(logElapsed(state, log)),
    peak: log.peak,
    waveType: log.waveType,
  }))

  const recommendation = computePeakRecommendation(state, sorted, counts, peakTotals)

  return {
    totalObservations: sorted.length,
    counts,
    peakTotals,
    typeTotals,
    intervals,
    timeline,
    recommendation,
  }
}
