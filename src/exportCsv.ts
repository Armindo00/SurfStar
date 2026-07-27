import type { AthleteSixMonthAnalytics } from './teamAnalyticsStats'
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
  analytics: AthleteSixMonthAnalytics,
) {
  const rows: string[][] = [
    ['Athlete', athleteName],
    ['Period', `Last ${analytics.monthlyEvolution.length} months`],
    [],
    ['Month', 'Sessions', 'Success rate %', 'Avg maneuver level', 'Potential rate %', 'Waves'],
  ]

  for (const point of analytics.monthlyEvolution) {
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
  rows.push(['Avg maneuver level', analytics.general.avgOverallManeuverLevel?.toFixed(2) ?? ''])
  rows.push(['Maneuver attempts', String(analytics.general.totalManeuverAttempts)])
  rows.push(['Star maneuvers', String(analytics.general.totalStars)])
  rows.push(['Heat wins', String(analytics.general.heatWins)])

  const safeName = athleteName.replace(/[^\w\-]+/g, '-').toLowerCase()
  downloadCsv(`surfstar-analytics-${safeName}.csv`, rows)
}
