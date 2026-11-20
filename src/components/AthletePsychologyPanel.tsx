import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../AppContext'
import { useI18n } from '../i18n'
import {
  buildAthletePsychologyAnalytics,
  feedbackHasPsychologySurvey,
} from '../athletePsychologyStats'
import { PSYCHOLOGY_SURVEY_QUESTIONS } from '../psychologySurvey'
import { formatShortDate } from '../dateFormat'
import { describeAnalyticsRange, type AnalyticsRange } from '../analyticsRange'
import { trainingModeLabel } from '../i18n/labels'
import type { TrainingSession } from '../types'

type Props = {
  athleteId: string
  coachId: string
  range: AnalyticsRange
  sessions: TrainingSession[]
}

export function AthletePsychologyPanel({ athleteId, coachId, range, sessions }: Props) {
  const { sessionAthleteFeedback, refreshAthleteEquipment } = useApp()
  const { t } = useI18n()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError(false)
    void refreshAthleteEquipment(athleteId).then((ok) => {
      if (cancelled) return
      setLoadError(!ok)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [athleteId, refreshAthleteEquipment])

  const psychology = useMemo(
    () =>
      buildAthletePsychologyAnalytics(
        sessionAthleteFeedback,
        sessions,
        coachId,
        athleteId,
        range,
      ),
    [athleteId, coachId, range, sessionAthleteFeedback, sessions],
  )

  const periodLabel = describeAnalyticsRange(range)

  if (loading) {
    return (
      <div className="athlete-psychology-panel">
        <div className="ss-card stats-panel athlete-psychology-panel__intro">
          <h2 className="stats-panel__title">{t('ui.psychology.psychologicalProfile')}</h2>
          <p className="muted stats-panel__sub">{t('common.pleaseWait')}</p>
        </div>
      </div>
    )
  }

  if (loadError && psychology.checkIns === 0) {
    return (
      <div className="athlete-psychology-panel">
        <div className="ss-card stats-panel athlete-psychology-panel__intro">
          <h2 className="stats-panel__title">{t('ui.psychology.psychologicalProfile')}</h2>
          <p className="muted stats-panel__sub">{t('errors.psychologyLoadFailed')}</p>
          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={() => {
              setLoading(true)
              setLoadError(false)
              void refreshAthleteEquipment(athleteId).then((ok) => {
                setLoadError(!ok)
                setLoading(false)
              })
            }}
          >
            {t('common.tryAgain')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="athlete-psychology-panel">
      <div className="ss-card stats-panel athlete-psychology-panel__intro">
        <h2 className="stats-panel__title">{t('ui.psychology.psychologicalProfile')}</h2>
        <p className="muted stats-panel__sub">{t('ui.psychology.intro')}</p>
      </div>

      {psychology.checkIns === 0 ? (
        <div className="ss-card stats-panel analytics-empty-period">
          <h2 className="stats-panel__title">{t('ui.psychology.noCheckinsInPeriod')}</h2>
          <p className="muted">
            {t('ui.psychology.noCheckinsInPeriodBody', { period: periodLabel })}
            {psychology.legacyCheckIns > 0
              ? ` ${
                  psychology.legacyCheckIns === 1
                    ? t('ui.psychology.legacyCheckinsNote', { count: psychology.legacyCheckIns })
                    : t('ui.psychology.legacyCheckinsNotePlural', { count: psychology.legacyCheckIns })
                }`
              : ''}
          </p>
        </div>
      ) : (
        <>
          <div className="analytics-overview-strip athlete-psychology-panel__overview">
            <article className="analytics-overview-strip__item analytics-overview-strip__item--accent">
              <span>{t('ui.psychology.checkIns')}</span>
              <strong>{psychology.checkIns}</strong>
            </article>
            <article className="analytics-overview-strip__item">
              <span>{t('ui.psychology.avgOverall')}</span>
              <strong>{psychology.averageOverall?.toFixed(1) ?? '—'}</strong>
            </article>
            <article className="analytics-overview-strip__item">
              <span>{t('ui.psychology.feedbackRate')}</span>
              <strong>{psychology.feedbackRate === null ? '—' : `${psychology.feedbackRate}%`}</strong>
            </article>
            <article className="analytics-overview-strip__item">
              <span>{t('ui.psychology.withNotes')}</span>
              <strong>{psychology.notesCount}</strong>
            </article>
          </div>

          <div className="ss-card stats-panel">
            <h2 className="stats-panel__title">{t('ui.psychology.questionAverages')}</h2>
            <p className="muted stats-panel__sub">{t('ui.psychology.questionAveragesHint')}</p>
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
            <h2 className="stats-panel__title">{t('ui.psychology.sessionTimeline')}</h2>
            <p className="muted stats-panel__sub">{t('ui.psychology.sessionTimelineHint')}</p>
            <ul className="feedback-timeline athlete-psychology-panel__timeline">
              {psychology.timeline.map(({ feedback, session, averageScore }) => (
                <li key={feedback.id} className="feedback-timeline__item">
                  <div className="feedback-timeline__head">
                    <strong>
                      {session ? trainingModeLabel(session.mode) : t('ui.psychology.sessionFallback')}
                      {averageScore !== null
                        ? ` · ${t('ui.psychology.avgScore', { score: averageScore.toFixed(1) })}`
                        : ''}
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
                    <p className="muted">{t('ui.psychology.legacyCheckin', { state: feedback.mentalState })}</p>
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
