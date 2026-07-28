import { useMemo } from 'react'
import { useApp } from '../AppContext'
import {
  buildAthletePsychologyAnalytics,
  feedbackHasPsychologySurvey,
} from '../athletePsychologyStats'
import { PSYCHOLOGY_SURVEY_QUESTIONS } from '../psychologySurvey'
import { formatShortDate } from '../dateFormat'
import { analyticsPeriodLabel, type AnalyticsPeriod } from '../teamAnalyticsStats'
import { TRAINING_MODE_LABELS, type TrainingSession } from '../types'

type Props = {
  athleteId: string
  coachId: string
  period: AnalyticsPeriod
  sessions: TrainingSession[]
}

export function AthletePsychologyPanel({ athleteId, coachId, period, sessions }: Props) {
  const { sessionAthleteFeedback } = useApp()

  const psychology = useMemo(
    () =>
      buildAthletePsychologyAnalytics(
        sessionAthleteFeedback,
        sessions,
        coachId,
        athleteId,
        period,
      ),
    [athleteId, coachId, period, sessionAthleteFeedback, sessions],
  )

  const periodLabel = analyticsPeriodLabel(period)

  return (
    <div className="athlete-psychology-panel">
      <div className="ss-card stats-panel athlete-psychology-panel__intro">
        <h2 className="stats-panel__title">Psychological profile</h2>
        <p className="muted stats-panel__sub">
          Quick 0–5 check-ins after each session — mood, confidence, focus, satisfaction and mental
          fatigue.
        </p>
      </div>

      {psychology.checkIns === 0 ? (
        <div className="ss-card stats-panel analytics-empty-period">
          <h2 className="stats-panel__title">No check-ins in this period</h2>
          <p className="muted">
            The athlete has not submitted the post-session questionnaire in the last {periodLabel}.
            {psychology.legacyCheckIns > 0
              ? ` ${psychology.legacyCheckIns} older check-in${psychology.legacyCheckIns === 1 ? '' : 's'} used the previous format.`
              : ''}
          </p>
        </div>
      ) : (
        <>
          <div className="analytics-overview-strip athlete-psychology-panel__overview">
            <article className="analytics-overview-strip__item analytics-overview-strip__item--accent">
              <span>Check-ins</span>
              <strong>{psychology.checkIns}</strong>
            </article>
            <article className="analytics-overview-strip__item">
              <span>Avg overall</span>
              <strong>{psychology.averageOverall?.toFixed(1) ?? '—'}</strong>
            </article>
            <article className="analytics-overview-strip__item">
              <span>Feedback rate</span>
              <strong>{psychology.feedbackRate === null ? '—' : `${psychology.feedbackRate}%`}</strong>
            </article>
            <article className="analytics-overview-strip__item">
              <span>With notes</span>
              <strong>{psychology.notesCount}</strong>
            </article>
          </div>

          <div className="ss-card stats-panel">
            <h2 className="stats-panel__title">Question averages (0–5)</h2>
            <p className="muted stats-panel__sub">Average score per question in this period.</p>
            <ul className="psych-state-distribution">
              {psychology.byQuestion.map((entry) => (
                <li key={entry.key} className="psych-state-distribution__row">
                  <div className="psych-state-distribution__head">
                    <span>{entry.label}</span>
                    <strong>{entry.average.toFixed(1)}</strong>
                  </div>
                  <div className="rate-bar" role="presentation">
                    <div
                      className="rate-bar__fill"
                      style={{ width: `${(entry.average / 5) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="ss-card stats-panel">
            <h2 className="stats-panel__title">Session timeline</h2>
            <p className="muted stats-panel__sub">Latest check-ins in chronological order.</p>
            <ul className="feedback-timeline athlete-psychology-panel__timeline">
              {psychology.timeline.map(({ feedback, session, averageScore }) => (
                <li key={feedback.id} className="feedback-timeline__item">
                  <div className="feedback-timeline__head">
                    <strong>
                      {session ? TRAINING_MODE_LABELS[session.mode] : 'Session'}
                      {averageScore !== null ? ` · avg ${averageScore.toFixed(1)}/5` : ''}
                    </strong>
                    <span className="muted">{formatShortDate(feedback.submittedAt)}</span>
                  </div>
                  {feedbackHasPsychologySurvey(feedback) ? (
                    <ul className="psych-survey-summary">
                      {PSYCHOLOGY_SURVEY_QUESTIONS.map((question) => (
                        <li key={question.id}>
                          <span>{question.label}</span>
                          <strong>{feedback.psychologyScores![question.id]}/5</strong>
                        </li>
                      ))}
                    </ul>
                  ) : feedback.mentalState ? (
                    <p className="muted">Legacy check-in · {feedback.mentalState}</p>
                  ) : null}
                  {feedback.writtenNote ? (
                    <p className="feedback-timeline__note">{feedback.writtenNote}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
