import type { AthletePsychologyAnalytics } from './athletePsychologyStats'
import type { AthleteGeneralStats, AthleteSessionSummary } from './athleteStats'
import type { AthleteReportPdfInput, AthleteReportPdfLabels, ManeuverSummaryRow, TrainingMixRow } from './buildAthleteReportPdf'
import {
  buildComboSideCharts,
  buildPdfEvolutionCharts,
  buildTechnicalSideCharts,
} from './athleteReportPdfEvolution'
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
  psychology: AthletePsychologyAnalytics | null | undefined,
  labels: Pick<
    AthleteReportPdfLabels,
    'technicalTraining' | 'comboTraining' | 'competition' | 'psychology' | 'successCol' | 'attempts' | 'avgLevel' | 'heatWins'
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
  if (psychology && psychology.checkIns > 0) {
    lines.push(
      `${L.psychology}: ${psychology.checkIns} check-ins · ${L.avgLevel} ${psychology.averageOverall?.toFixed(1) ?? '—'}/5`,
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
    maneuverSummaries,
    sessionRows: buildSessionRows(args.sessionSummaries, args.getSpot),
    labels: args.labels,
  }
}
