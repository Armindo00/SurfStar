import { useApp } from '../AppContext'
import { ScreenHeader } from '../components/ScreenHeader'
import {
  athleteNamesForSession,
  buildCoachSessionHeadline,
  formatSessionDate,
  formatSessionDuration,
} from '../sessionHistoryUtils'
import { TRAINING_MODE_LABELS } from '../types'

export function TrainingSessionsView() {
  const { completedCoachSessions, getSpot, getAthlete, openHistorySession, setView } = useApp()

  return (
    <div className="ss-flow">
      <ScreenHeader title="Past sessions" onBack={() => setView('coach-home')} />

      <div className="ss-card history-intro">
        <h2 className="page-title">Session history</h2>
        <p className="muted">
          Completed trainings saved to your account. Tap a session for full stats and coach notes.
        </p>
        <p className="history-intro__count">
          <strong>{completedCoachSessions.length}</strong> completed session
          {completedCoachSessions.length === 1 ? '' : 's'}
        </p>
      </div>

      {completedCoachSessions.length === 0 ? (
        <div className="ss-card history-empty">
          <p className="muted">No completed sessions yet.</p>
          <button type="button" className="btn btn--primary btn--block" onClick={() => setView('coach-home')}>
            Start a new session
          </button>
        </div>
      ) : (
        <ul className="history-list">
          {completedCoachSessions.map((session) => {
            const spotName = getSpot(session.spotId)?.name ?? 'Unknown spot'
            const endedAt = session.endedAt ?? session.startedAt

            return (
              <li key={session.id}>
                <button
                  type="button"
                  className="history-card"
                  onClick={() => openHistorySession(session.id)}
                >
                  <div className="history-card__top">
                    <span className="history-card__mode">{TRAINING_MODE_LABELS[session.mode]}</span>
                    <span className="history-card__date">{formatSessionDate(endedAt)}</span>
                  </div>
                  <strong className="history-card__headline">{buildCoachSessionHeadline(session)}</strong>
                  <p className="history-card__meta">
                    {spotName} · {session.condition || 'No condition'}
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
