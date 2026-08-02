import { useMemo, useState } from 'react'
import { useI18n } from '../i18n'
import { AthleteMaterialPanel } from '../components/AthleteMaterialPanel'
import { ScreenHeader } from '../components/ScreenHeader'
import { useApp } from '../AppContext'
import { buildAthletePsychologyAnalytics, feedbackHasPsychologySurvey } from '../athletePsychologyStats'
import { presetAnalyticsRange } from '../analyticsRange'
import { formatMaterialDate } from '../materialUtils'
import { PSYCHOLOGY_SURVEY_QUESTIONS } from '../psychologySurvey'
import { mentalStateLabel } from '../mentalState'
import { canUsePsychologyCheckins } from '../planUtils'
import { linkHasPsychologyCheckins } from '../psychologyCheckins'
import { trainingModeLabel } from '../i18n/labels'

export function CoachAthleteInsightsView() {
  const { t } = useI18n()
  const {
    insightsAthlete,
    sessionAthleteFeedback,
    trainingSessions,
    auth,
    subscription,
    coachLinks,
    setView,
  } = useApp()

  const [tab, setTab] = useState<'material' | 'wellbeing'>('material')

  const planId = subscription?.planId ?? 'team'
  const psychologyAvailable = canUsePsychologyCheckins(planId)
  const athleteLink = useMemo(() => {
    if (!insightsAthlete || auth?.role !== 'treinador') return null
    return (
      coachLinks.find(
        (link) => link.athleteId === insightsAthlete.id && link.status === 'active',
      ) ?? null
    )
  }, [auth, coachLinks, insightsAthlete])
  const athletePsychologyEnabled = athleteLink ? linkHasPsychologyCheckins(athleteLink) : false

  const feedbackRows = useMemo(() => {
    if (!insightsAthlete) return []
    return sessionAthleteFeedback
      .filter((row) => row.athleteId === insightsAthlete.id)
      .map((row) => ({
        row,
        session: trainingSessions.find((s) => s.id === row.sessionId),
      }))
      .sort(
        (a, b) =>
          new Date(b.row.submittedAt).getTime() - new Date(a.row.submittedAt).getTime(),
      )
  }, [insightsAthlete, sessionAthleteFeedback, trainingSessions])

  const psychologyPreview = useMemo(() => {
    if (!insightsAthlete || auth?.role !== 'treinador') return null
    const coachSessions = trainingSessions.filter(
      (session) =>
        session.coachId === auth.coachId &&
        session.athleteIds.includes(insightsAthlete.id),
    )
    return buildAthletePsychologyAnalytics(
      sessionAthleteFeedback,
      coachSessions,
      auth.coachId,
      insightsAthlete.id,
      presetAnalyticsRange('6m'),
    )
  }, [auth, insightsAthlete, sessionAthleteFeedback, trainingSessions])

  if (!insightsAthlete) {
    return (
      <div className="ss-flow">
        <ScreenHeader title={t('nav.athleteInsights')} onBack={() => setView('manage-athletes')} />
        <p className="muted">{t('ui.psychology.noAthleteSelected')}</p>
      </div>
    )
  }

  return (
    <div className="ss-flow">
      <ScreenHeader title={insightsAthlete.name} onBack={() => setView('manage-athletes')} />

      <nav className="admin-tabs insights-tabs" aria-label="Athlete insights">
        <button
          type="button"
          className={tab === 'material' ? 'admin-tabs__btn admin-tabs__btn--active' : 'admin-tabs__btn'}
          onClick={() => setTab('material')}
        >
          Gear & ratings
        </button>
        {psychologyAvailable ? (
          <button
            type="button"
            className={
              tab === 'wellbeing' ? 'admin-tabs__btn admin-tabs__btn--active' : 'admin-tabs__btn'
            }
            onClick={() => setTab('wellbeing')}
          >
            {t('ui.psychology.wellbeingTab')}
          </button>
        ) : null}
      </nav>

      {tab === 'material' || !psychologyAvailable ? (
        <AthleteMaterialPanel athleteId={insightsAthlete.id} />
      ) : !athletePsychologyEnabled ? (
        <div className="ss-card material-section">
          <h2 className="page-title">{t('ui.psychology.psychologyCheckins')}</h2>
          <p className="muted">{t('ui.psychology.enableSharingHint')}</p>
        </div>
      ) : (
        <div className="ss-card material-section">
          <h2 className="page-title">{t('ui.psychology.sessionCheckins')}</h2>
          <p className="muted">{t('ui.psychology.sessionCheckinsHint')}</p>

          {psychologyPreview && psychologyPreview.checkIns > 0 ? (
            <div className="kpi-grid athlete-psychology-panel__kpis">
              <article className="kpi-card kpi-card--accent">
                <span className="kpi-card__label">{t('ui.psychology.avgOverall6m')}</span>
                <strong className="kpi-card__value">
                  {psychologyPreview.averageOverall?.toFixed(1) ?? '—'}
                </strong>
              </article>
              <article className="kpi-card">
                <span className="kpi-card__label">{t('ui.psychology.checkIns')}</span>
                <strong className="kpi-card__value">{psychologyPreview.checkIns}</strong>
              </article>
            </div>
          ) : null}

          {feedbackRows.length === 0 ? (
            <p className="muted">{t('ui.psychology.noFeedbackYet')}</p>
          ) : (
            <ul className="feedback-timeline">
              {feedbackRows.map(({ row, session }) => (
                <li key={row.id} className="feedback-timeline__item">
                  <div className="feedback-timeline__head">
                    <strong>
                      {session ? trainingModeLabel(session.mode) : t('ui.psychology.sessionFallback')}
                      {feedbackHasPsychologySurvey(row)
                        ? ` · avg ${(
                            PSYCHOLOGY_SURVEY_QUESTIONS.reduce(
                              (sum, question) => sum + row.psychologyScores![question.id],
                              0,
                            ) / PSYCHOLOGY_SURVEY_QUESTIONS.length
                          ).toFixed(1)}/5`
                        : row.mentalState
                          ? ` · ${mentalStateLabel(row.mentalState)}`
                          : ''}
                    </strong>
                    <span className="muted">{formatMaterialDate(row.submittedAt)}</span>
                  </div>
                  {feedbackHasPsychologySurvey(row) ? (
                    <ul className="psych-survey-summary">
                      {PSYCHOLOGY_SURVEY_QUESTIONS.map((question) => (
                        <li key={question.id}>
                          <span>{question.label}</span>
                          <strong>{row.psychologyScores![question.id]}/5</strong>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {row.writtenNote ? <p className="feedback-timeline__note">{row.writtenNote}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
