import { useState } from 'react'
import { useI18n } from '../i18n'
import { useApp } from '../AppContext'
import { SeaAnalysisStatsPanel } from '../components/SeaAnalysisStatsPanel'
import { SeaAnalysisTimer } from '../components/SeaAnalysisTimer'
import { SeaObservationConfirmModal } from '../components/SeaObservationConfirmModal'
import { ScreenHeader } from '../components/ScreenHeader'
import { seaIsRunning } from '../seaAnalysisStats'
import {
  SEA_PEAKS,
  SEA_WAVE_TYPES,
  type SeaPeak,
  type SeaWaveType,
} from '../types'

const PEAK_KEYS: Record<SeaPeak, 'peak1' | 'peak2'> = {
  'peak-1': 'peak1',
  'peak-2': 'peak2',
}

const WAVE_TYPE_KEYS: Record<
  SeaWaveType,
  'waveTypeSet' | 'waveTypeLargeInt' | 'waveTypeSmallInt' | 'waveTypeSmall'
> = {
  set: 'waveTypeSet',
  'intermedia-grande': 'waveTypeLargeInt',
  'intermedia-pequena': 'waveTypeSmallInt',
  pequena: 'waveTypeSmall',
}

export function SeaAnalysisSessionView() {
  const { t } = useI18n()
  const {
    activeSession,
    setView,
    startSeaAnalysisTimer,
    endSeaAnalysisTimer,
    logSeaObservation,
    openEndSessionSheet,
    cancelActiveSession,
  } = useApp()

  const [pendingLog, setPendingLog] = useState<{ peak: SeaPeak; waveType: SeaWaveType } | null>(
    null,
  )
  const [confirmCancel, setConfirmCancel] = useState(false)

  const state = activeSession?.seaAnalysis

  if (!activeSession || activeSession.mode !== 'sea-analysis' || !state) {
    return (
      <div className="ss-flow">
        <p className="muted">{t('ui.session.noActiveSeaSession')}</p>
        <button type="button" className="btn" onClick={() => setView('coach-home')}>
          {t('common.back')}
        </button>
      </div>
    )
  }

  const running = seaIsRunning(state)
  const canLog = running

  const requestLog = (peak: SeaPeak, waveType: SeaWaveType) => {
    if (!canLog) return
    setPendingLog({ peak, waveType })
  }

  const confirmLog = () => {
    if (!pendingLog) return
    logSeaObservation(pendingLog.peak, pendingLog.waveType)
    setPendingLog(null)
  }

  const handleCancel = () => {
    if (!confirmCancel) {
      setConfirmCancel(true)
      return
    }
    setConfirmCancel(false)
    cancelActiveSession()
  }

  return (
    <div className="ss-flow ss-flow--training">
      <ScreenHeader title={t('nav.seaAnalysis')} onBack={() => setView('coach-home')} />

      <div className="ss-card">
        <p className="muted stats-panel__sub">{t('ui.seaAnalysis.watchHint')}</p>

        <SeaAnalysisTimer state={state} onTimeUp={() => endSeaAnalysisTimer()} />

        <div className="heat-runner__controls">
          {!state.timerStartedAt ? (
            <button type="button" className="btn btn--primary btn--block btn--lg" onClick={startSeaAnalysisTimer}>
              {t('ui.seaAnalysis.start30Min')}
            </button>
          ) : null}
          {running ? (
            <button type="button" className="btn btn--danger btn--block" onClick={endSeaAnalysisTimer}>
              {t('ui.seaAnalysis.endAnalysisNow')}
            </button>
          ) : null}
        </div>

        <div className="sea-peak-grid">
          {SEA_PEAKS.map((peak) => (
            <div key={peak} className="sea-peak-column">
              <h3 className="sea-peak-column__title">{t(`ui.seaAnalysis.${PEAK_KEYS[peak]}`)}</h3>
              <div className="sea-peak-column__buttons">
                {SEA_WAVE_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`btn btn--block sea-wave-btn sea-wave-btn--${type}`}
                    disabled={!canLog}
                    onClick={() => requestLog(peak, type)}
                  >
                    {t(`ui.seaAnalysis.${WAVE_TYPE_KEYS[type]}`)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="ss-card stats-panel">
        <h2 className="stats-panel__title">{t('ui.stats.liveStatistics')}</h2>
        <SeaAnalysisStatsPanel state={state} />
      </div>

      <section className="ss-card ss-tools-wrap">
        <button type="button" className="btn btn--primary btn--block" onClick={openEndSessionSheet}>
          {t('ui.seaAnalysis.saveAndEndSession')}
        </button>
        <button
          type="button"
          className={confirmCancel ? 'btn btn--danger btn--block' : 'btn btn--ghost btn--block'}
          onClick={handleCancel}
        >
          {confirmCancel ? t('session.confirmCancel') : t('ui.seaAnalysis.cancelSession')}
        </button>
      </section>

      {pendingLog ? (
        <SeaObservationConfirmModal
          peak={pendingLog.peak}
          waveType={pendingLog.waveType}
          onConfirm={confirmLog}
          onCancel={() => setPendingLog(null)}
        />
      ) : null}
    </div>
  )
}
