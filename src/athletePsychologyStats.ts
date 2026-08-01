import {
  averagePsychologyScore,
  isPsychologySurveyScores,
  PSYCHOLOGY_SURVEY_KEYS,
  PSYCHOLOGY_SURVEY_QUESTIONS,
  psychologyQuestionLabel,
  type PsychologySurveyKey,
} from './psychologySurvey'
import { isTimestampInAnalyticsRange, presetAnalyticsRange } from './analyticsRange'
import type { AnalyticsRange } from './analyticsRange'
import { type AnalyticsPeriod } from './teamAnalyticsStats'
import type { SessionAthleteFeedback, TrainingSession } from './types'

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
  range: AnalyticsRange
  checkIns: number
  sessionsInPeriod: number
  feedbackRate: number | null
  averageOverall: number | null
  byQuestion: PsychologyQuestionAverage[]
  timeline: AthletePsychologyTimelineRow[]
  notesCount: number
  legacyCheckIns: number
}

export function filterAthleteFeedbackByRange(
  feedback: SessionAthleteFeedback[],
  coachId: string,
  athleteId: string,
  range: AnalyticsRange,
): SessionAthleteFeedback[] {
  return feedback
    .filter(
      (row) =>
        row.athleteId === athleteId &&
        row.coachId === coachId &&
        isTimestampInAnalyticsRange(row.submittedAt, range),
    )
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
}

export function filterAthleteFeedbackByPeriod(
  feedback: SessionAthleteFeedback[],
  coachId: string,
  athleteId: string,
  period: AnalyticsPeriod,
): SessionAthleteFeedback[] {
  return filterAthleteFeedbackByRange(feedback, coachId, athleteId, presetAnalyticsRange(period))
}

export function feedbackHasPsychologySurvey(feedback: SessionAthleteFeedback): boolean {
  return isPsychologySurveyScores(feedback.psychologyScores)
}

export function buildAthletePsychologyAnalytics(
  feedback: SessionAthleteFeedback[],
  sessions: TrainingSession[],
  coachId: string,
  athleteId: string,
  range: AnalyticsRange,
): AthletePsychologyAnalytics {
  const rows = filterAthleteFeedbackByRange(feedback, coachId, athleteId, range)
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
    range,
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
