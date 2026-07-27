import { MENTAL_STATES, mentalStateLabel } from './mentalState'
import { TEAM_ANALYTICS_MONTHS, type AnalyticsPeriod } from './teamAnalyticsStats'
import type { MentalState, SessionAthleteFeedback, TrainingSession } from './types'

export const POSITIVE_MENTAL_STATES: MentalState[] = ['focused', 'motivated', 'confident']
export const CHALLENGING_MENTAL_STATES: MentalState[] = [
  'tired',
  'anxious',
  'demotivated',
  'frustrated',
]

function periodCutoff(period: AnalyticsPeriod): Date {
  const cutoff = new Date()
  cutoff.setHours(0, 0, 0, 0)

  if (period === '6m') {
    cutoff.setMonth(cutoff.getMonth() - TEAM_ANALYTICS_MONTHS)
  } else if (period === '1m') {
    cutoff.setMonth(cutoff.getMonth() - 1)
  } else {
    cutoff.setDate(cutoff.getDate() - 7)
  }

  return cutoff
}

export type AthletePsychologyTimelineRow = {
  feedback: SessionAthleteFeedback
  session: TrainingSession | undefined
}

export type MentalStateCount = {
  state: MentalState
  label: string
  count: number
  rate: number
}

export type AthletePsychologyAnalytics = {
  period: AnalyticsPeriod
  checkIns: number
  sessionsInPeriod: number
  feedbackRate: number | null
  positiveRate: number | null
  challengingRate: number | null
  dominantState: MentalState | null
  dominantStateLabel: string | null
  byState: MentalStateCount[]
  timeline: AthletePsychologyTimelineRow[]
  notesCount: number
}

export function filterAthleteFeedbackByPeriod(
  feedback: SessionAthleteFeedback[],
  coachId: string,
  athleteId: string,
  period: AnalyticsPeriod,
): SessionAthleteFeedback[] {
  const cutoff = periodCutoff(period).getTime()

  return feedback
    .filter(
      (row) =>
        row.athleteId === athleteId &&
        row.coachId === coachId &&
        new Date(row.submittedAt).getTime() >= cutoff,
    )
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
}

export function buildAthletePsychologyAnalytics(
  feedback: SessionAthleteFeedback[],
  sessions: TrainingSession[],
  coachId: string,
  athleteId: string,
  period: AnalyticsPeriod,
): AthletePsychologyAnalytics {
  const rows = filterAthleteFeedbackByPeriod(feedback, coachId, athleteId, period)
  const sessionMap = new Map(sessions.map((session) => [session.id, session]))

  const counts = new Map<MentalState, number>()
  for (const state of MENTAL_STATES) counts.set(state.id, 0)

  let positiveCount = 0
  let challengingCount = 0
  let notesCount = 0

  for (const row of rows) {
    counts.set(row.mentalState, (counts.get(row.mentalState) ?? 0) + 1)
    if (POSITIVE_MENTAL_STATES.includes(row.mentalState)) positiveCount += 1
    if (CHALLENGING_MENTAL_STATES.includes(row.mentalState)) challengingCount += 1
    if (row.writtenNote?.trim()) notesCount += 1
  }

  const checkIns = rows.length
  const byState = MENTAL_STATES.map(({ id, label }) => ({
    state: id,
    label,
    count: counts.get(id) ?? 0,
    rate: checkIns ? Math.round(((counts.get(id) ?? 0) / checkIns) * 100) : 0,
  })).filter((entry) => entry.count > 0)

  byState.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))

  const dominant = byState[0] ?? null

  return {
    period,
    checkIns,
    sessionsInPeriod: sessions.length,
    feedbackRate: sessions.length ? Math.round((checkIns / sessions.length) * 100) : null,
    positiveRate: checkIns ? Math.round((positiveCount / checkIns) * 100) : null,
    challengingRate: checkIns ? Math.round((challengingCount / checkIns) * 100) : null,
    dominantState: dominant?.state ?? null,
    dominantStateLabel: dominant ? mentalStateLabel(dominant.state) : null,
    byState,
    timeline: rows.map((entry) => ({
      feedback: entry,
      session: sessionMap.get(entry.sessionId),
    })),
    notesCount,
  }
}
