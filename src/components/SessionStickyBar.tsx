import { useState } from 'react'
import { useApp } from '../AppContext'
import { canEndHeatBasedSession } from '../heatUtils'

export function SessionStickyBar() {
  const { activeSession, cancelActiveSession, openEndSessionSheet, setView } = useApp()
  const [confirmCancel, setConfirmCancel] = useState(false)

  const canEndSession = activeSession ? canEndHeatBasedSession(activeSession) : true

  const handleCancel = () => {
    if (!confirmCancel) {
      setConfirmCancel(true)
      return
    }
    setConfirmCancel(false)
    cancelActiveSession()
  }

  return (
    <div className="ss-flow session-sticky-bar-wrap">
      {!canEndSession ? (
        <p className="session-sticky-bar__notice muted">
          Finish all heats before ending the session.
        </p>
      ) : null}
      <div className="session-sticky-bar" role="toolbar" aria-label="Session actions">
        <button
          type="button"
          className="btn btn--ghost btn--small session-sticky-bar__stats"
          onClick={() => setView('session-stats')}
        >
          Live stats
        </button>
        <div className="session-sticky-bar__primary">
          <button
            type="button"
            className={confirmCancel ? 'btn btn--danger btn--small' : 'btn btn--ghost btn--small'}
            onClick={handleCancel}
            onBlur={() => setConfirmCancel(false)}
          >
            {confirmCancel ? 'Confirm cancel' : 'Cancel'}
          </button>
          <button
            type="button"
            className="btn btn--gold session-sticky-bar__end"
            onClick={openEndSessionSheet}
            disabled={!canEndSession}
            title={
              canEndSession ? undefined : 'Finish all heats before ending the session'
            }
          >
            End session
          </button>
        </div>
      </div>
    </div>
  )
}
