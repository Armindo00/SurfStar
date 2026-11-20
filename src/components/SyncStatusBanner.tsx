import { useApp } from '../AppContext'
import { useI18n } from '../i18n'

export function SyncStatusBanner() {
  const { t } = useI18n()
  const { sessionsSyncStatus, retrySessionsSync } = useApp()

  if (sessionsSyncStatus === 'idle' || sessionsSyncStatus === 'saved') return null

  if (sessionsSyncStatus === 'syncing') {
    return (
      <div className="sync-status-banner sync-status-banner--syncing" role="status">
        {t('errors.sessionsSyncing')}
      </div>
    )
  }

  return (
    <div className="sync-status-banner sync-status-banner--error" role="alert">
      <span>{t('errors.sessionsUnsynced')}</span>
      <button type="button" className="btn btn--ghost btn--small" onClick={() => void retrySessionsSync()}>
        {t('errors.sessionsRetrySync')}
      </button>
    </div>
  )
}
