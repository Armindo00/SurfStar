import { createPortal } from 'react-dom'
import { useApp } from '../AppContext'
import { useI18n } from '../i18n'

/**
 * Fixed snackbar — never participates in .app-shell flex layout.
 * Only surfaces sync failures; happy-path saves stay silent during live logging.
 */
export function SyncStatusBanner() {
  const { t } = useI18n()
  const { sessionsSyncStatus, retrySessionsSync } = useApp()

  if (sessionsSyncStatus !== 'error') return null

  return createPortal(
    <div className="sync-status-chip" role="alert">
      <span className="sync-status-chip__text">{t('errors.sessionsUnsynced')}</span>
      <button
        type="button"
        className="sync-status-chip__retry"
        onClick={() => void retrySessionsSync()}
      >
        {t('errors.sessionsRetrySync')}
      </button>
    </div>,
    document.body,
  )
}
