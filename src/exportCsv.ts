import type { AthletePeriodAnalytics } from './teamAnalyticsStats'
import { analyticsPeriodLabel } from './teamAnalyticsStats'
import { buildAthleteHeatAnalytics, EARLY_HEAT_TOTAL_TARGET, MAJOR_HEAT_WAVE_SCORE } from './heatAnalyticsStats'
import type { Athlete, SurfSpot, TrainingSession } from './types'
import {
  athleteNamesForSession,
  buildCoachSessionHeadline,
  formatSessionDate,
  formatSessionDuration,
  resolveSessionSpotName,
} from './sessionHistoryUtils'
import { TRAINING_MODE_LABELS } from './types'

function escapeCsv(value: string | number | null | undefined): string {
  const text = value == null ? '' : String(value)
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

function downloadCsv(filename: string, rows: string[][]) {
  const body = rows.map((row) => row.map(escapeCsv).join(',')).join('\r\n')
  const blob = new Blob([`\uFEFF${body}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function exportSessionsCsv(
  sessions: TrainingSession[],
  getAthlete: (id: string) => Athlete | undefined,
  getSpot: (id: string) => SurfSpot | undefined,
) {
  const rows: string[][] = [
    ['Date', 'Mode', 'Athletes', 'Spot', 'Condition', 'Duration', 'Coach notes', 'Headline'],
  ]

  for (const session of sessions) {
    const endedAt = session.endedAt ?? session.startedAt
    rows.push([
      formatSessionDate(endedAt),
      TRAINING_MODE_LABELS[session.mode],
      athleteNamesForSession(session, getAthlete),
      resolveSessionSpotName(session, getSpot),
      session.condition || '',
      formatSessionDuration(session.startedAt, session.endedAt),
      session.coachNotes || '',
      buildCoachSessionHeadline(session, getAthlete),
    ])
  }

  const stamp = new Date().toISOString().slice(0, 10)
  downloadCsv(`surfstar-sessions-${stamp}.csv`, rows)
}

export function exportAthleteAnalyticsCsv(
  athleteName: string,
  analytics: AthletePeriodAnalytics,
  athleteId: string,
) {
  const periodLabel = analyticsPeriodLabel(analytics.period)
  const evolutionColumn =
    analytics.period === '6m' ? 'Month' : analytics.period === '1m' ? 'Week' : 'Day'

  const rows: string[][] = [
    ['Athlete', athleteName],
    ['Period', `Last ${periodLabel}`],
    [],
    [evolutionColumn, 'Sessions', 'Success rate %', 'Avg level (tech + combos)', 'Potential rate %', 'Waves'],
  ]

  for (const point of analytics.evolution) {
    rows.push([
      point.label,
      String(point.sessions),
      point.successRate == null ? '' : String(Math.round(point.successRate)),
      point.avgManeuverLevel == null ? '' : point.avgManeuverLevel.toFixed(2),
      point.potentialRate == null ? '' : String(Math.round(point.potentialRate)),
      String(point.waves),
    ])
  }

  rows.push([])
  rows.push(['Totals', ''])
  rows.push(['Total sessions', String(analytics.general.totalTrainings)])
  rows.push(['Total waves', String(analytics.general.totalWaves)])
  rows.push(['Avg level (technical + combos)', analytics.general.avgOverallManeuverLevel?.toFixed(2) ?? ''])
  rows.push(['Avg technical level', analytics.general.avgTechnicalManeuverLevel?.toFixed(2) ?? ''])
  rows.push(['Avg combo level', analytics.general.avgComboLevel?.toFixed(2) ?? ''])
  rows.push(['Maneuver attempts', String(analytics.general.totalManeuverAttempts)])
  rows.push(['Star maneuvers', String(analytics.general.totalStars)])
  rows.push(['Heat wins', String(analytics.general.heatWins)])

  const heatStats = buildAthleteHeatAnalytics(analytics.sessions, athleteId)
  if (heatStats.heatsTotal > 0) {
    rows.push([])
    rows.push(['Heat rhythm analytics', ''])
    rows.push(['Major score threshold', `${MAJOR_HEAT_WAVE_SCORE.toFixed(2)}+`])
    rows.push(['Heats with timer data', String(heatStats.heatsWithTiming)])
    rows.push(['Avg heat score', heatStats.avgHeatScore?.toFixed(2) ?? ''])
    rows.push(['Avg best wave first 5 min', heatStats.avgBestWaveOpening?.toFixed(2) ?? ''])
    rows.push([
      `${EARLY_HEAT_TOTAL_TARGET}+ pts total in first 10 min %`,
      heatStats.earlyTenPointsRate == null ? '' : String(heatStats.earlyTenPointsRate),
    ])
    rows.push(['Avg top-2 total first 10 min', heatStats.avgEarlyTotalFirst10Min?.toFixed(2) ?? ''])
    rows.push(['Avg time to 1st wave (min)', heatStats.avgTimeToFirstWaveMin?.toFixed(2) ?? ''])
    rows.push(['Avg time to 2 major scores (min)', heatStats.avgTimeToTwoMajorMin?.toFixed(2) ?? ''])
    rows.push(['Avg best wave last 5 min', heatStats.avgBestWaveClosing?.toFixed(2) ?? ''])
    rows.push(['Major score in last 5 min %', heatStats.closingMajorRate == null ? '' : String(heatStats.closingMajorRate)])
    rows.push(['Clutch delta (close - open)', heatStats.clutchDelta?.toFixed(2) ?? ''])
  }

  const safeName = athleteName.replace(/[^\w\-]+/g, '-').toLowerCase()
  downloadCsv(`surfstar-analytics-${safeName}.csv`, rows)
}
