import { buildEvolutionSlotsForRange } from './analyticsRange'
import { levelToNumeric, rate } from './sessionStats'
import type { AthletePeriodAnalytics } from './teamAnalyticsStats'
import type { ComboLevel, ManeuverKind, TrainingSession } from './types'
import { COMBO_LEVELS } from './sessionStats'

const TECHNICAL_KINDS: ManeuverKind[] = ['rail', 'top-turn', 'progressive']

type PeriodBucket = {
  waves: number
  withPotential: number
  byKind: Record<
    ManeuverKind,
    { attempts: number; successes: number; levelSum: number; levelCount: number }
  >
  comboAttempts: number
  comboSuccesses: number
  comboLevelSum: number
  comboLevelCount: number
}

function emptyKindBucket(): PeriodBucket['byKind'][ManeuverKind] {
  return { attempts: 0, successes: 0, levelSum: 0, levelCount: 0 }
}

function emptyBucket(): PeriodBucket {
  return {
    waves: 0,
    withPotential: 0,
    byKind: {
      rail: emptyKindBucket(),
      'top-turn': emptyKindBucket(),
      progressive: emptyKindBucket(),
    },
    comboAttempts: 0,
    comboSuccesses: 0,
    comboLevelSum: 0,
    comboLevelCount: 0,
  }
}

function fillBucketFromSession(bucket: PeriodBucket, session: TrainingSession, athleteId: string) {
  for (const wave of session.waves) {
    if (wave.athleteId !== athleteId) continue
    bucket.waves += 1
    if (wave.hasPotential) bucket.withPotential += 1

    for (const maneuver of wave.maneuvers) {
      const row = bucket.byKind[maneuver.kind]
      row.attempts += 1
      if (maneuver.success) row.successes += 1
      row.levelSum += levelToNumeric(maneuver.level)
      row.levelCount += 1
    }

    for (const attempt of wave.comboAttempts ?? []) {
      bucket.comboAttempts += 1
      if (attempt.success) bucket.comboSuccesses += 1
      bucket.comboLevelSum += levelToNumeric(attempt.level)
      bucket.comboLevelCount += 1
    }
  }
}

export type ManeuverEvolutionSeries = {
  kind: ManeuverKind
  successRates: (number | null)[]
  avgLevels: (number | null)[]
}

export type PdfEvolutionCharts = {
  periodLabels: string[]
  potentialRates: (number | null)[]
  maneuverSeries: ManeuverEvolutionSeries[]
  comboSuccessRates: (number | null)[]
  comboAvgLevels: (number | null)[]
}

export function buildPdfEvolutionCharts(
  analytics: AthletePeriodAnalytics,
  athleteId: string,
): PdfEvolutionCharts {
  const slots = buildEvolutionSlotsForRange(analytics.range)
  const buckets = new Map<string, PeriodBucket>()
  for (const slot of slots) {
    buckets.set(slot.periodKey, emptyBucket())
  }

  for (const session of analytics.sessions) {
    const when = session.endedAt ?? session.startedAt
    const slot = slots.find((entry) => entry.match(when))
    if (!slot) continue
    const bucket = buckets.get(slot.periodKey)
    if (!bucket) continue
    fillBucketFromSession(bucket, session, athleteId)
  }

  const periodLabels = slots.map((s) => s.label)
  const potentialRates = slots.map((slot) => {
    const b = buckets.get(slot.periodKey)!
    return b.waves ? Math.round((b.withPotential / b.waves) * 100) : null
  })

  const maneuverSeries: ManeuverEvolutionSeries[] = TECHNICAL_KINDS.map((kind) => ({
    kind,
    successRates: slots.map((slot) => {
      const row = buckets.get(slot.periodKey)!.byKind[kind]
      return row.attempts ? Math.round((row.successes / row.attempts) * 100) : null
    }),
    avgLevels: slots.map((slot) => {
      const row = buckets.get(slot.periodKey)!.byKind[kind]
      return row.levelCount ? Math.round((row.levelSum / row.levelCount) * 100) / 100 : null
    }),
  }))

  const comboSuccessRates = slots.map((slot) => {
    const b = buckets.get(slot.periodKey)!
    return b.comboAttempts ? Math.round((b.comboSuccesses / b.comboAttempts) * 100) : null
  })

  const comboAvgLevels = slots.map((slot) => {
    const b = buckets.get(slot.periodKey)!
    return b.comboLevelCount ? Math.round((b.comboLevelSum / b.comboLevelCount) * 100) / 100 : null
  })

  return { periodLabels, potentialRates, maneuverSeries, comboSuccessRates, comboAvgLevels }
}

export type SideCompareChart = {
  title: string
  frontsideSuccess: number | null
  backsideSuccess: number | null
  frontsideLevel: number | null
  backsideLevel: number | null
}

function avgLevelForLogs(logs: { level: ComboLevel }[]): number | null {
  if (logs.length === 0) return null
  const sum = logs.reduce((acc, log) => acc + levelToNumeric(log.level), 0)
  return Math.round((sum / logs.length) * 100) / 100
}

function collectManeuverLogs(
  sessions: TrainingSession[],
  athleteId: string,
  kind: ManeuverKind,
) {
  const logs: { level: ComboLevel; side: 'frontside' | 'backside'; success: boolean }[] = []
  for (const session of sessions) {
    if (session.mode !== 'tecnico') continue
    for (const wave of session.waves) {
      if (wave.athleteId !== athleteId) continue
      for (const m of wave.maneuvers) {
        if (m.kind !== kind) continue
        logs.push({ level: m.level, side: m.side, success: m.success })
      }
    }
  }
  return logs
}

function collectComboLogs(sessions: TrainingSession[], athleteId: string, level: ComboLevel) {
  const logs: { level: ComboLevel; side: 'frontside' | 'backside'; success: boolean }[] = []
  for (const session of sessions) {
    if (session.mode !== 'combos') continue
    for (const wave of session.waves) {
      if (wave.athleteId !== athleteId) continue
      for (const c of wave.comboAttempts ?? []) {
        if (c.level !== level) continue
        logs.push({ level: c.level, side: c.side, success: c.success })
      }
    }
  }
  return logs
}

export function buildTechnicalSideCharts(
  analytics: AthletePeriodAnalytics,
  athleteId: string,
): SideCompareChart[] {
  const charts: SideCompareChart[] = []
  for (const kind of TECHNICAL_KINDS) {
    const logs = collectManeuverLogs(analytics.sessions, athleteId, kind)
    if (logs.length === 0) continue
    const fsLogs = logs.filter((l) => l.side === 'frontside')
    const bsLogs = logs.filter((l) => l.side === 'backside')
    charts.push({
      title: kind,
      frontsideSuccess: fsLogs.length ? rate(fsLogs.filter((l) => l.success).length, fsLogs.length) : null,
      backsideSuccess: bsLogs.length ? rate(bsLogs.filter((l) => l.success).length, bsLogs.length) : null,
      frontsideLevel: avgLevelForLogs(fsLogs),
      backsideLevel: avgLevelForLogs(bsLogs),
    })
  }
  return charts
}

export function buildComboSideCharts(
  analytics: AthletePeriodAnalytics,
  athleteId: string,
): SideCompareChart[] {
  const charts: SideCompareChart[] = []
  for (const level of COMBO_LEVELS) {
    const logs = collectComboLogs(analytics.sessions, athleteId, level)
    if (logs.length === 0) continue
    const fsLogs = logs.filter((l) => l.side === 'frontside')
    const bsLogs = logs.filter((l) => l.side === 'backside')
    charts.push({
      title: String(level),
      frontsideSuccess: fsLogs.length ? rate(fsLogs.filter((l) => l.success).length, fsLogs.length) : null,
      backsideSuccess: bsLogs.length ? rate(bsLogs.filter((l) => l.success).length, bsLogs.length) : null,
      frontsideLevel: avgLevelForLogs(fsLogs),
      backsideLevel: avgLevelForLogs(bsLogs),
    })
  }
  return charts
}
