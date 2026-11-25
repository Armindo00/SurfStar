import { buildTopicReadings } from './athleteInsights'
import type { AthletePsychologyAnalytics } from './athletePsychologyStats'
import type { AthleteGeneralStats, AthleteSessionSummary } from './athleteStats'
import type {
  AthleteReportPdfInput,
  AthleteReportPdfLabels,
  DomainSummaryRow,
  ManeuverSummaryRow,
  ReportCallout,
  TrainingMixRow,
} from './buildAthleteReportPdf'
import {
  buildComboSideCharts,
  buildPdfEvolutionCharts,
  buildTechnicalSideCharts,
  type SideCompareChart,
} from './athleteReportPdfEvolution'
import type { AthleteHeatAnalyticsSummary } from './heatAnalyticsStats'
import { formatSessionDate, resolveSessionSpotName } from './sessionHistoryUtils'
import { comboLevelLabel, trainingModeLabel, maneuverLabel } from './i18n/labels'
import type { AthletePeriodAnalytics } from './teamAnalyticsStats'
import type { SurfSpot } from './types'
import type { ManeuverKind } from './types'

const TECHNICAL_KINDS: ManeuverKind[] = ['rail', 'top-turn', 'progressive']

function formatLevel(value: number | null): string {
  return value === null ? '—' : value.toFixed(2)
}

export function buildTrainingMixRows(analytics: AthletePeriodAnalytics): TrainingMixRow[] {
  const counts = analytics.sessions.reduce(
    (acc, session) => {
      acc[session.mode] = (acc[session.mode] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )
  return Object.entries(counts).map(([mode, count]) => ({
    label: trainingModeLabel(mode),
    count,
  }))
}

export function buildManeuverSummaries(analytics: AthletePeriodAnalytics): ManeuverSummaryRow[] {
  const technical = analytics.technical
  if (!technical) return []
  const rows: ManeuverSummaryRow[] = []
  for (const kind of TECHNICAL_KINDS) {
    const stats = technical.byKind[kind]
    if (!stats || stats.total === 0) continue
    rows.push({
      label: maneuverLabel(kind),
      attempts: stats.total,
      rate: stats.rate,
    })
  }
  return rows
}

export function buildPerformanceLines(
  general: AthleteGeneralStats,
  analytics: AthletePeriodAnalytics,
  labels: Pick<
    AthleteReportPdfLabels,
    'technicalTraining' | 'comboTraining' | 'competition' | 'successCol' | 'attempts' | 'avgLevel' | 'heatWins'
  >,
): string[] {
  const lines: string[] = []
  const L = labels

  if (analytics.technical) {
    lines.push(
      `${L.technicalTraining}: ${analytics.technical.overallSuccessRate}% ${L.successCol} · ${analytics.technical.totalManeuvers} ${L.attempts} · ${L.avgLevel} ${formatLevel(analytics.technical.averageLevel)}`,
    )
  }
  if (analytics.combo) {
    lines.push(
      `${L.comboTraining}: ${analytics.combo.overallSuccessRate}% ${L.successCol} · ${analytics.combo.totalAttempts} ${L.attempts} · ${L.avgLevel} ${formatLevel(analytics.combo.averageLevel)}`,
    )
  }
  if (general.heatParticipations > 0) {
    lines.push(
      `${L.competition}: ${general.heatParticipations} heats · ${general.heatWins} ${L.heatWins} · ${L.avgLevel} ${general.avgHeatScore?.toFixed(1) ?? '—'}`,
    )
  }
  return lines
}

export function buildSessionRows(
  sessionSummaries: AthleteSessionSummary[],
  getSpot: (id: string) => SurfSpot | undefined,
): { date: string; mode: string; spot: string; summary: string }[] {
  return sessionSummaries.map(({ session, headline }) => ({
    date: formatSessionDate(session.endedAt ?? session.startedAt),
    mode: trainingModeLabel(session.mode),
    spot: resolveSessionSpotName(session, getSpot),
    summary: headline,
  }))
}

type ExecutiveLabelPick = Pick<
  AthleteReportPdfLabels,
  | 'frontside'
  | 'backside'
  | 'clutchHeat'
  | 'earlyTenPoints'
  | 'domainWaves'
  | 'technicalTraining'
  | 'comboTraining'
  | 'domainHeat'
  | 'psychology'
  | 'potentialRate'
  | 'successCol'
  | 'winRate'
  | 'psychologyAvgLabel'
  | 'psychologyCheckInsLabel'
  | 'readingStable'
  | 'readingGood'
  | 'readingOk'
  | 'readingWatch'
  | 'readingThin'
>

type SideRate = { label: string; rate: number }

function collectSideRates(charts: SideCompareChart[], frontside: string, backside: string): SideRate[] {
  const rows: SideRate[] = []
  for (const chart of charts) {
    if (chart.frontsideSuccess !== null) {
      rows.push({ label: `${chart.title} ${frontside}`, rate: chart.frontsideSuccess })
    }
    if (chart.backsideSuccess !== null) {
      rows.push({ label: `${chart.title} ${backside}`, rate: chart.backsideSuccess })
    }
  }
  return rows
}

function readingForRate(
  rate: number | null,
  labels: Pick<ExecutiveLabelPick, 'readingGood' | 'readingOk' | 'readingWatch' | 'readingStable' | 'readingThin'>,
  kind: 'success' | 'potential' | 'psych' | 'win' = 'success',
): string {
  if (rate === null) return labels.readingThin
  if (kind === 'psych') {
    if (rate >= 4) return labels.readingGood
    if (rate >= 3.2) return labels.readingOk
    return labels.readingWatch
  }
  if (kind === 'potential') {
    if (rate >= 60) return labels.readingStable
    if (rate >= 45) return labels.readingOk
    return labels.readingWatch
  }
  if (kind === 'win') {
    if (rate >= 60) return labels.readingGood
    if (rate >= 40) return labels.readingOk
    return labels.readingWatch
  }
  if (rate >= 70) return labels.readingGood
  if (rate >= 55) return labels.readingOk
  return labels.readingWatch
}

export function buildExecutiveInsights(args: {
  analytics: AthletePeriodAnalytics
  technicalSideCharts: SideCompareChart[]
  psychology?: AthletePsychologyAnalytics | null
  heatAnalytics?: AthleteHeatAnalyticsSummary | null
  labels: ExecutiveLabelPick
}): { strengths: ReportCallout[]; attention: ReportCallout[]; domainRows: DomainSummaryRow[] } {
  const L = args.labels
  const strengths: ReportCallout[] = []
  const attention: ReportCallout[] = []

  const sideRates = collectSideRates(args.technicalSideCharts, L.frontside, L.backside)
  if (sideRates.length > 0) {
    const ranked = [...sideRates].sort((a, b) => b.rate - a.rate)
    const best = ranked[0]
    const worst = ranked[ranked.length - 1]
    if (best) strengths.push({ label: best.label, value: `${best.rate}%` })
    if (worst && worst !== best) attention.push({ label: worst.label, value: `${worst.rate}%` })
  }

  const heat = args.heatAnalytics
  if (heat?.clutchDelta !== null && heat?.clutchDelta !== undefined) {
    const signed = `${heat.clutchDelta > 0 ? '+' : ''}${heat.clutchDelta.toFixed(1)}`
    const item = { label: L.clutchHeat, value: signed }
    if (heat.clutchDelta >= 0) strengths.push(item)
    else attention.push(item)
  }
  if (heat?.earlyTenPointsRate !== null && heat?.earlyTenPointsRate !== undefined) {
    const item = { label: L.earlyTenPoints, value: `${heat.earlyTenPointsRate}%` }
    if (heat.earlyTenPointsRate >= 70) strengths.push(item)
    else attention.push(item)
  }

  const psych = args.psychology
  if (psych && psych.checkIns > 0 && psych.byQuestion.length > 0) {
    const ranked = [...psych.byQuestion].sort((a, b) => b.average - a.average)
    const high = ranked[0]
    const low = ranked[ranked.length - 1]
    if (high) strengths.push({ label: high.label, value: `${high.average.toFixed(1)}/5` })
    if (low && low !== high) attention.push({ label: low.label, value: `${low.average.toFixed(1)}/5` })
  }

  const g = args.analytics.general
  const winRate =
    g.heatParticipations > 0 ? Math.round((g.heatWins / g.heatParticipations) * 100) : null

  const domainRows: DomainSummaryRow[] = [
    {
      domain: L.domainWaves,
      metric: L.potentialRate,
      value: g.withPotentialRate === null ? '—' : `${g.withPotentialRate}%`,
      reading: readingForRate(g.withPotentialRate, L, 'potential'),
    },
    {
      domain: L.technicalTraining,
      metric: L.successCol,
      value: args.analytics.technical ? `${args.analytics.technical.overallSuccessRate}%` : '—',
      reading: readingForRate(args.analytics.technical?.overallSuccessRate ?? null, L, 'success'),
    },
    {
      domain: L.comboTraining,
      metric: L.successCol,
      value: args.analytics.combo ? `${args.analytics.combo.overallSuccessRate}%` : '—',
      reading: readingForRate(args.analytics.combo?.overallSuccessRate ?? null, L, 'success'),
    },
    {
      domain: L.domainHeat,
      metric: L.winRate,
      value:
        winRate === null
          ? '—'
          : `${winRate}% (${g.heatWins}/${g.heatParticipations})`,
      reading: readingForRate(winRate, L, 'win'),
    },
    {
      domain: L.psychology,
      metric: L.psychologyAvgLabel,
      value:
        psych && psych.checkIns > 0 && psych.averageOverall !== null
          ? `${psych.averageOverall.toFixed(1)} (${psych.checkIns} ${L.psychologyCheckInsLabel.toLowerCase()})`
          : '—',
      reading: readingForRate(psych?.averageOverall ?? null, L, 'psych'),
    },
  ]

  return {
    strengths: strengths.slice(0, 3),
    attention: attention.slice(0, 3),
    domainRows,
  }
}

export function buildAthleteReportPdfInput(args: {
  athleteName: string
  coachName: string
  organizationName?: string | null
  rangeLabel: string
  reportTitle: string
  generatedAt: string
  footerLine: string
  coachComment?: string
  analytics: AthletePeriodAnalytics
  athleteId: string
  psychology?: AthletePsychologyAnalytics | null
  heatAnalytics?: AthleteHeatAnalyticsSummary | null
  sessionSummaries: AthleteSessionSummary[]
  getSpot: (id: string) => SurfSpot | undefined
  evolutionColumnLabel: string
  labels: AthleteReportPdfLabels
}): AthleteReportPdfInput {
  const trainingMix = buildTrainingMixRows(args.analytics)
  const maneuverSummaries = buildManeuverSummaries(args.analytics)
  const evolutionCharts = buildPdfEvolutionCharts(args.analytics, args.athleteId)
  const technicalSideCharts = buildTechnicalSideCharts(args.analytics, args.athleteId).map((chart) => ({
    ...chart,
    title: maneuverLabel(chart.title as 'rail' | 'top-turn' | 'progressive'),
  }))
  const comboSideCharts = buildComboSideCharts(args.analytics, args.athleteId).map((chart) => ({
    ...chart,
    title: comboLevelLabel(chart.title === 'estrela' ? 'estrela' : (Number(chart.title) as 1 | 2 | 3)),
  }))

  const maneuverLabels: Record<string, string> = {
    rail: maneuverLabel('rail'),
    'top-turn': maneuverLabel('top-turn'),
    progressive: maneuverLabel('progressive'),
  }

  const executive = buildExecutiveInsights({
    analytics: args.analytics,
    technicalSideCharts,
    psychology: args.psychology,
    heatAnalytics: args.heatAnalytics,
    labels: args.labels,
  })

  const topicReadings = buildTopicReadings({
    technical: args.analytics.technical,
    combo: args.analytics.combo,
    technicalSideCharts,
    comboSideCharts,
    heatAnalytics: args.heatAnalytics,
    psychology: args.psychology,
    labels: args.labels,
  })

  return {
    athleteName: args.athleteName,
    coachName: args.coachName,
    organizationName: args.organizationName,
    rangeLabel: args.rangeLabel,
    reportTitle: args.reportTitle,
    generatedAt: args.generatedAt,
    footerLine: args.footerLine,
    coachComment: args.coachComment,
    general: args.analytics.general,
    evolution: args.analytics.evolution,
    evolutionColumnLabel: args.evolutionColumnLabel,
    evolutionCharts,
    maneuverLabels,
    technicalSideCharts,
    comboSideCharts,
    trainingMix,
    technical: args.analytics.technical,
    combo: args.analytics.combo,
    psychology: args.psychology,
    heatAnalytics: args.heatAnalytics ?? null,
    strengths: executive.strengths,
    attention: executive.attention,
    domainRows: executive.domainRows,
    topicReadings,
    maneuverSummaries,
    sessionRows: buildSessionRows(args.sessionSummaries, args.getSpot),
    labels: args.labels,
  }
}
