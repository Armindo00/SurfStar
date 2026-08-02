import { useApp } from '../AppContext'
import { ScreenHeader } from '../components/ScreenHeader'
import { exportSessionsCsv } from '../exportCsv'
import { useI18n } from '../i18n'
import {
  athleteNamesForSession,
  buildCoachSessionHeadline,
  formatSessionDate,
  formatSessionDuration,
  resolveSessionSpotName,
} from '../sessionHistoryUtils'
import { trainingModeLabel } from '../i18n/labels'

export function TrainingSessionsView() {
  const { completedCoachSessions, getSpot, getAthlete, openHistorySession, setView } = useApp()
  const { t } = useI18n()
  const count = completedCoachSessions.length

  return (
    <div className="ss-flow">
      <ScreenHeader title={t('nav.pastSessions')} onBack={() => setView('coach-home')} />

      <div className="ss-card history-intro">
        <div className="history-intro__head">
          <div>
            <h2 className="page-title">{t('session.history.title')}</h2>
            <p className="muted">{t('session.history.intro')}</p>
            <p className="history-intro__count">
              <strong>{count}</strong>{' '}
              {count === 1
                ? t('session.history.completedSession', { count })
                : t('session.history.completedSessions', { count })}
            </p>
          </div>
          {count > 0 ? (
            <button
              type="button"
              className="btn btn--secondary btn--small history-intro__export"
              onClick={() => exportSessionsCsv(completedCoachSessions, getAthlete, getSpot)}
            >
              {t('session.history.exportCsv')}
            </button>
          ) : null}
        </div>
      </div>

      {count === 0 ? (
        <div className="ss-card history-empty">
          <p className="muted">{t('session.history.empty')}</p>
          <button type="button" className="btn btn--primary btn--block" onClick={() => setView('coach-home')}>
            {t('session.history.startNew')}
          </button>
        </div>
      ) : (
        <ul className="history-list">
          {completedCoachSessions.map((session) => {
            const spotName = resolveSessionSpotName(session, getSpot)
            const endedAt = session.endedAt ?? session.startedAt

            return (
              <li key={session.id}>
                <button
                  type="button"
                  className="history-card"
                  onClick={() => openHistorySession(session.id)}
                >
                  <div className="history-card__top">
                    <span className="history-card__mode">{trainingModeLabel(session.mode)}</span>
                    <span className="history-card__date">{formatSessionDate(endedAt)}</span>
                  </div>
                  <strong className="history-card__headline">
                    {buildCoachSessionHeadline(session, getAthlete)}
                  </strong>
                  <p className="history-card__meta">
                    {spotName} · {session.condition || t('session.history.noCondition')}
                  </p>
                  <p className="history-card__meta">
                    {athleteNamesForSession(session, getAthlete)} ·{' '}
                    {formatSessionDuration(session.startedAt, session.endedAt)}
                  </p>
                  {session.coachNotes ? (
                    <p className="history-card__notes-preview">
                      {session.coachNotes.length > 90
                        ? `${session.coachNotes.slice(0, 90)}…`
                        : session.coachNotes}
                    </p>
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
