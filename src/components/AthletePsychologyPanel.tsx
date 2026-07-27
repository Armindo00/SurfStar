import { useMemo } from 'react'
import { useApp } from '../AppContext'
import {
  buildAthletePsychologyAnalytics,
  CHALLENGING_MENTAL_STATES,
  POSITIVE_MENTAL_STATES,
} from '../athletePsychologyStats'
import { mentalStateLabel } from '../mentalState'
import { analyticsPeriodLabel, type AnalyticsPeriod } from '../teamAnalyticsStats'
import { TRAINING_MODE_LABELS, type MentalState, type TrainingSession } from '../types'

type Props = {
  athleteId: string
  coachId: string
  period: AnalyticsPeriod
  sessions: TrainingSession[]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function mentalStateTone(state: MentalState): 'positive' | 'neutral' | 'challenging' {
  if (POSITIVE_MENTAL_STATES.includes(state)) return 'positive'
  if (CHALLENGING_MENTAL_STATES.includes(state)) return 'challenging'
  return 'neutral'
}

export function AthletePsychologyPanel({ athleteId, coachId, period, sessions }: Props) {
  const { sessionAthleteFeedback, athleteBoards, athleteFins } = useApp()

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
          Post-session wellbeing check-ins from the athlete — mental state and optional notes after
          each training.
        </p>
      </div>

      {psychology.checkIns === 0 ? (
        <div className="ss-card stats-panel analytics-empty-period">
          <h2 className="stats-panel__title">No check-ins in this period</h2>
          <p className="muted">
            The athlete has not submitted session feedback in the last {periodLabel}. Check-ins appear
            here after they complete the post-session questionnaire.
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
              <span>Positive states</span>
              <strong>{psychology.positiveRate === null ? '—' : `${psychology.positiveRate}%`}</strong>
            </article>
            <article className="analytics-overview-strip__item">
              <span>Challenging states</span>
              <strong>
                {psychology.challengingRate === null ? '—' : `${psychology.challengingRate}%`}
              </strong>
            </article>
            <article className="analytics-overview-strip__item">
              <span>Most common</span>
              <strong>{psychology.dominantStateLabel ?? '—'}</strong>
            </article>
          </div>

          <div className="kpi-grid athlete-psychology-panel__kpis">
            <article className="kpi-card">
              <span className="kpi-card__label">Feedback rate</span>
              <strong className="kpi-card__value">
                {psychology.feedbackRate === null ? '—' : `${psychology.feedbackRate}%`}
              </strong>
              <small className="kpi-card__hint">
                {psychology.checkIns} of {psychology.sessionsInPeriod} sessions
              </small>
            </article>
            <article className="kpi-card kpi-card--accent">
              <span className="kpi-card__label">Written notes</span>
              <strong className="kpi-card__value">{psychology.notesCount}</strong>
              <small className="kpi-card__hint">Sessions with a note</small>
            </article>
          </div>

          <div className="ss-card stats-panel">
            <h2 className="stats-panel__title">Mental state distribution</h2>
            <p className="muted stats-panel__sub">How the athlete reported feeling after sessions.</p>
            <ul className="psych-state-distribution">
              {psychology.byState.map((entry) => (
                <li key={entry.state} className="psych-state-distribution__row">
                  <div className="psych-state-distribution__head">
                    <span
                      className={`psych-state-badge psych-state-badge--${mentalStateTone(entry.state)}`}
                    >
                      {entry.label}
                    </span>
                    <strong>
                      {entry.count} · {entry.rate}%
                    </strong>
                  </div>
                  <div className="rate-bar" role="presentation">
                    <div className="rate-bar__fill" style={{ width: `${entry.rate}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="ss-card stats-panel">
            <h2 className="stats-panel__title">Session timeline</h2>
            <p className="muted stats-panel__sub">Latest wellbeing reports in chronological order.</p>
            <ul className="feedback-timeline athlete-psychology-panel__timeline">
              {psychology.timeline.map(({ feedback, session }) => {
                const board = feedback.boardId
                  ? athleteBoards.find((item) => item.id === feedback.boardId)
                  : null
                const fin = feedback.finId
                  ? athleteFins.find((item) => item.id === feedback.finId)
                  : null

                return (
                  <li key={feedback.id} className="feedback-timeline__item">
                    <div className="feedback-timeline__head">
                      <strong>
                        {session ? TRAINING_MODE_LABELS[session.mode] : 'Session'} ·{' '}
                        <span
                          className={`psych-state-badge psych-state-badge--${mentalStateTone(feedback.mentalState)}`}
                        >
                          {mentalStateLabel(feedback.mentalState)}
                        </span>
                      </strong>
                      <span className="muted">{formatDate(feedback.submittedAt)}</span>
                    </div>
                    <p className="muted feedback-timeline__gear">
                      Gear: {board?.name ?? '—'} · Fins: {fin?.name ?? '—'}
                    </p>
                    {feedback.writtenNote ? (
                      <p className="feedback-timeline__note">{feedback.writtenNote}</p>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
