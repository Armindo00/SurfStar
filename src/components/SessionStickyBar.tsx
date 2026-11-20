import { useEffect, useRef, useState } from 'react'
import { useApp } from '../AppContext'
import { useI18n } from '../i18n'
import { canEndHeatBasedSession } from '../heatUtils'
import { liveStatsButtonLabelKey } from '../sessionModeUtils'

export function SessionStickyBar() {
  const { t } = useI18n()
  const { activeSession, cancelActiveSession, openEndSessionSheet, setView } = useApp()
  const [confirmCancel, setConfirmCancel] = useState(false)
  const confirmTimerRef = useRef<number | null>(null)

  const canEndSession = activeSession ? canEndHeatBasedSession(activeSession) : true
  const statsLabel = activeSession
    ? t(liveStatsButtonLabelKey(activeSession))
    : t('session.liveStats')

  useEffect(() => {
    return () => {
      if (confirmTimerRef.current) window.clearTimeout(confirmTimerRef.current)
    }
  }, [])

  const handleCancel = () => {
    if (!confirmCancel) {
      setConfirmCancel(true)
      if (confirmTimerRef.current) window.clearTimeout(confirmTimerRef.current)
      confirmTimerRef.current = window.setTimeout(() => setConfirmCancel(false), 4000)
      return
    }
    if (confirmTimerRef.current) window.clearTimeout(confirmTimerRef.current)
    setConfirmCancel(false)
    cancelActiveSession()
  }

  return (
    <div className="ss-flow session-sticky-bar-wrap">
      {!canEndSession ? (
        <p className="session-sticky-bar__notice muted">{t('session.finishAllHeatsNotice')}</p>
      ) : null}
      <div className="session-sticky-bar" role="toolbar" aria-label={t('session.sessionActionsLabel')}>
        <button
          type="button"
          className="btn btn--ghost btn--small session-sticky-bar__stats"
          onClick={() => setView('session-stats')}
        >
          {statsLabel}
        </button>
        <div className="session-sticky-bar__primary">
          <button
            type="button"
            className={confirmCancel ? 'btn btn--danger btn--small' : 'btn btn--ghost btn--small'}
            onClick={handleCancel}
          >
            {confirmCancel ? t('session.confirmCancel') : t('session.cancel')}
          </button>
          <button
            type="button"
            className="btn btn--gold session-sticky-bar__end"
            onClick={openEndSessionSheet}
            disabled={!canEndSession}
            title={canEndSession ? undefined : t('session.finishAllHeatsTitle')}
          >
            {t('session.endSession')}
          </button>
        </div>
      </div>
    </div>
  )
}
