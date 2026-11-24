import type { AthletePsychologyAnalytics } from './athletePsychologyStats'
import type { SideCompareChart } from './athleteReportPdfEvolution'
import type { AthleteHeatAnalyticsSummary } from './heatAnalyticsStats'
import type { ComboSessionStatsSnapshot, SessionStatsSnapshot } from './sessionStats'

export type TopicReadings = {
  technical: string | null
  combo: string | null
  heat: string | null
  psychology: string | null
}

export type TopicReadingLabels = {
  readingLabel: string
  technicalReadingSideGap: string
  technicalReadingBalanced: string
  technicalReadingThin: string
  technicalReadingOverall: string
  comboReadingSideGap: string
  comboReadingBalanced: string
  comboReadingThin: string
  comboReadingOverall: string
  heatReadingClutchNegative: string
  heatReadingClutchPositive: string
  heatReadingEarlyWeak: string
  heatReadingEarlyStrong: string
  heatReadingThin: string
  heatReadingBasic: string
  psychologyReadingStandout: string
  psychologyReadingThin: string
  frontside: string
  backside: string
}

const SIDE_GAP_THRESHOLD = 10
const CLUTCH_STRONG = 0.3
const EARLY_STRONG = 70
const EARLY_WEAK = 50

type SidePair = {
  title: string
  frontside: number
  backside: number
  gap: number
  weakSide: 'frontside' | 'backside'
  weakRate: number
  strongRate: number
}

function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(values[key] ?? ''))
}

function largestSideGap(charts: SideCompareChart[]): SidePair | null {
  let best: SidePair | null = null
  for (const chart of charts) {
    if (chart.frontsideSuccess === null || chart.backsideSuccess === null) continue
    const gap = Math.abs(chart.frontsideSuccess - chart.backsideSuccess)
    if (gap < SIDE_GAP_THRESHOLD) continue
    const weakSide = chart.frontsideSuccess < chart.backsideSuccess ? 'frontside' : 'backside'
    const candidate: SidePair = {
      title: chart.title,
      frontside: chart.frontsideSuccess,
      backside: chart.backsideSuccess,
      gap,
      weakSide,
      weakRate: weakSide === 'frontside' ? chart.frontsideSuccess : chart.backsideSuccess,
      strongRate: weakSide === 'frontside' ? chart.backsideSuccess : chart.frontsideSuccess,
    }
    if (!best || candidate.gap > best.gap) best = candidate
  }
  return best
}

function withReadingPrefix(label: string, body: string): string {
  return `${label}: ${body}`
}

export function buildTechnicalReading(
  technical: SessionStatsSnapshot | null | undefined,
  charts: SideCompareChart[],
  labels: TopicReadingLabels,
): string | null {
  if (!technical && charts.length === 0) return null
  const gap = largestSideGap(charts)
  if (gap) {
    const weakLabel = gap.weakSide === 'frontside' ? labels.frontside : labels.backside
    const strongLabel = gap.weakSide === 'frontside' ? labels.backside : labels.frontside
    return withReadingPrefix(
      labels.readingLabel,
      interpolate(labels.technicalReadingSideGap, {
        maneuver: gap.title,
        weakSide: weakLabel,
        weakRate: gap.weakRate,
        strongSide: strongLabel,
        strongRate: gap.strongRate,
        gap: gap.gap,
      }),
    )
  }
  if (!technical) {
    return withReadingPrefix(labels.readingLabel, labels.technicalReadingThin)
  }
  if (charts.length > 0) {
    return withReadingPrefix(
      labels.readingLabel,
      interpolate(labels.technicalReadingBalanced, {
        rate: technical.overallSuccessRate,
        level: technical.averageLevel?.toFixed(1) ?? '—',
      }),
    )
  }
  return withReadingPrefix(
    labels.readingLabel,
    interpolate(labels.technicalReadingOverall, {
      rate: technical.overallSuccessRate,
      attempts: technical.totalManeuvers,
      level: technical.averageLevel?.toFixed(1) ?? '—',
    }),
  )
}

export function buildComboReading(
  combo: ComboSessionStatsSnapshot | null | undefined,
  charts: SideCompareChart[],
  labels: TopicReadingLabels,
): string | null {
  if (!combo && charts.length === 0) return null
  const gap = largestSideGap(charts)
  if (gap) {
    const weakLabel = gap.weakSide === 'frontside' ? labels.frontside : labels.backside
    const strongLabel = gap.weakSide === 'frontside' ? labels.backside : labels.frontside
    return withReadingPrefix(
      labels.readingLabel,
      interpolate(labels.comboReadingSideGap, {
        level: gap.title,
        weakSide: weakLabel,
        weakRate: gap.weakRate,
        strongSide: strongLabel,
        strongRate: gap.strongRate,
        gap: gap.gap,
      }),
    )
  }
  if (!combo) {
    return withReadingPrefix(labels.readingLabel, labels.comboReadingThin)
  }
  if (charts.length > 0) {
    return withReadingPrefix(
      labels.readingLabel,
      interpolate(labels.comboReadingBalanced, {
        rate: combo.overallSuccessRate,
        level: combo.averageLevel?.toFixed(1) ?? '—',
      }),
    )
  }
  return withReadingPrefix(
    labels.readingLabel,
    interpolate(labels.comboReadingOverall, {
      rate: combo.overallSuccessRate,
      attempts: combo.totalAttempts,
      level: combo.averageLevel?.toFixed(1) ?? '—',
    }),
  )
}

export function buildHeatReading(
  heat: AthleteHeatAnalyticsSummary | null | undefined,
  labels: TopicReadingLabels,
): string | null {
  if (!heat || heat.heatsTotal <= 0) return null

  if (heat.heatsWithTiming <= 0) {
    return withReadingPrefix(
      labels.readingLabel,
      interpolate(labels.heatReadingBasic, {
        heats: heat.heatsTotal,
        score: heat.avgHeatScore?.toFixed(1) ?? '—',
      }),
    )
  }

  if (heat.clutchDelta !== null && heat.clutchDelta < 0) {
    return withReadingPrefix(
      labels.readingLabel,
      interpolate(labels.heatReadingClutchNegative, {
        clutch: heat.clutchDelta.toFixed(1),
        open: heat.avgBestWaveOpening?.toFixed(1) ?? '—',
        close: heat.avgBestWaveClosing?.toFixed(1) ?? '—',
      }),
    )
  }

  if (heat.clutchDelta !== null && heat.clutchDelta >= CLUTCH_STRONG) {
    return withReadingPrefix(
      labels.readingLabel,
      interpolate(labels.heatReadingClutchPositive, {
        clutch: `+${heat.clutchDelta.toFixed(1)}`,
        close: heat.avgBestWaveClosing?.toFixed(1) ?? '—',
      }),
    )
  }

  if (heat.earlyTenPointsRate !== null && heat.earlyTenPointsRate < EARLY_WEAK) {
    return withReadingPrefix(
      labels.readingLabel,
      interpolate(labels.heatReadingEarlyWeak, {
        rate: heat.earlyTenPointsRate,
      }),
    )
  }

  if (heat.earlyTenPointsRate !== null && heat.earlyTenPointsRate >= EARLY_STRONG) {
    return withReadingPrefix(
      labels.readingLabel,
      interpolate(labels.heatReadingEarlyStrong, {
        rate: heat.earlyTenPointsRate,
      }),
    )
  }

  return withReadingPrefix(
    labels.readingLabel,
    interpolate(labels.heatReadingBasic, {
      heats: heat.heatsTotal,
      score: heat.avgHeatScore?.toFixed(1) ?? '—',
    }),
  )
}

export function buildPsychologyReading(
  psychology: AthletePsychologyAnalytics | null | undefined,
  labels: TopicReadingLabels,
): string | null {
  if (!psychology || psychology.checkIns <= 0) {
    return null
  }
  if (psychology.byQuestion.length === 0) {
    return withReadingPrefix(labels.readingLabel, labels.psychologyReadingThin)
  }

  const ranked = [...psychology.byQuestion].sort((a, b) => b.average - a.average)
  const high = ranked[0]
  const low = ranked[ranked.length - 1]
  if (!high || !low) {
    return withReadingPrefix(labels.readingLabel, labels.psychologyReadingThin)
  }

  return withReadingPrefix(
    labels.readingLabel,
    interpolate(labels.psychologyReadingStandout, {
      highLabel: high.label,
      highAvg: high.average.toFixed(1),
      lowLabel: low.label,
      lowAvg: low.average.toFixed(1),
      overall: psychology.averageOverall?.toFixed(1) ?? '—',
    }),
  )
}

export function buildTopicReadings(args: {
  technical?: SessionStatsSnapshot | null
  combo?: ComboSessionStatsSnapshot | null
  technicalSideCharts: SideCompareChart[]
  comboSideCharts: SideCompareChart[]
  heatAnalytics?: AthleteHeatAnalyticsSummary | null
  psychology?: AthletePsychologyAnalytics | null
  labels: TopicReadingLabels
}): TopicReadings {
  return {
    technical: buildTechnicalReading(args.technical, args.technicalSideCharts, args.labels),
    combo: buildComboReading(args.combo, args.comboSideCharts, args.labels),
    heat: buildHeatReading(args.heatAnalytics, args.labels),
    psychology: buildPsychologyReading(args.psychology, args.labels),
  }
}
