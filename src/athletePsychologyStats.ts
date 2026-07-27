import {
  averagePsychologyScore,
  isPsychologySurveyScores,
  PSYCHOLOGY_SURVEY_KEYS,
  PSYCHOLOGY_SURVEY_QUESTIONS,
  psychologyQuestionLabel,
  type PsychologySurveyKey,
} from './psychologySurvey'
import { TEAM_ANALYTICS_MONTHS, type AnalyticsPeriod } from './teamAnalyticsStats'
import type { SessionAthleteFeedback, TrainingSession } from './types'

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
  averageScore: number | null
}

export type PsychologyQuestionAverage = {
  key: PsychologySurveyKey
  label: string
  average: number
}

export type AthletePsychologyAnalytics = {
  period: AnalyticsPeriod
  checkIns: number
  sessionsInPeriod: number
  feedbackRate: number | null
  averageOverall: number | null
  byQuestion: PsychologyQuestionAverage[]
  timeline: AthletePsychologyTimelineRow[]
  notesCount: number
  legacyCheckIns: number
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

export function feedbackHasPsychologySurvey(feedback: SessionAthleteFeedback): boolean {
  return isPsychologySurveyScores(feedback.psychologyScores)
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
  const surveyRows = rows.filter(feedbackHasPsychologySurvey)
  const legacyCheckIns = rows.length - surveyRows.length

  const totals = Object.fromEntries(
    PSYCHOLOGY_SURVEY_KEYS.map((key) => [key, 0]),
  ) as Record<PsychologySurveyKey, number>

  let notesCount = 0
  let overallSum = 0

  for (const row of surveyRows) {
    const scores = row.psychologyScores!
    overallSum += averagePsychologyScore(scores)
    for (const key of PSYCHOLOGY_SURVEY_KEYS) {
      totals[key] += scores[key]
    }
    if (row.writtenNote?.trim()) notesCount += 1
  }

  const checkIns = surveyRows.length
  const byQuestion = PSYCHOLOGY_SURVEY_QUESTIONS.map((question) => ({
    key: question.id,
    label: question.label,
    average: checkIns ? Math.round((totals[question.id] / checkIns) * 10) / 10 : 0,
  }))

  return {
    period,
    checkIns,
    sessionsInPeriod: sessions.length,
    feedbackRate: sessions.length ? Math.round((rows.length / sessions.length) * 100) : null,
    averageOverall: checkIns ? Math.round((overallSum / checkIns) * 10) / 10 : null,
    byQuestion,
    timeline: rows.map((entry) => ({
      feedback: entry,
      session: sessionMap.get(entry.sessionId),
      averageScore: feedbackHasPsychologySurvey(entry)
        ? averagePsychologyScore(entry.psychologyScores!)
        : null,
    })),
    notesCount,
    legacyCheckIns,
  }
}

export { psychologyQuestionLabel }
