import { useState } from 'react'
import { useApp } from '../AppContext'
import { SeaAnalysisStatsPanel } from '../components/SeaAnalysisStatsPanel'
import { SeaAnalysisTimer } from '../components/SeaAnalysisTimer'
import { SeaObservationConfirmModal } from '../components/SeaObservationConfirmModal'
import { ScreenHeader } from '../components/ScreenHeader'
import { seaIsRunning } from '../seaAnalysisStats'
import {
  SEA_PEAK_LABELS,
  SEA_PEAKS,
  SEA_WAVE_TYPE_LABELS,
  SEA_WAVE_TYPES,
  type SeaPeak,
  type SeaWaveType,
} from '../types'

export function SeaAnalysisSessionView() {
  const {
    activeSession,
    setView,
    startSeaAnalysisTimer,
    endSeaAnalysisTimer,
    logSeaObservation,
    openEndSessionSheet,
    cancelActiveSession,
  } = useApp()

  const state = activeSession?.seaAnalysis

  if (!activeSession || activeSession.mode !== 'sea-analysis' || !state) {
    return (
      <div className="ss-flow">
        <p className="muted">No active sea analysis session.</p>
        <button type="button" className="btn" onClick={() => setView('coach-home')}>
          Back
        </button>
      </div>
    )
  }

  const running = seaIsRunning(state)
  const canLog = running

  const [pendingLog, setPendingLog] = useState<{ peak: SeaPeak; waveType: SeaWaveType } | null>(
    null,
  )

  const requestLog = (peak: SeaPeak, waveType: SeaWaveType) => {
    if (!canLog) return
    setPendingLog({ peak, waveType })
  }

  const confirmLog = () => {
    if (!pendingLog) return
    logSeaObservation(pendingLog.peak, pendingLog.waveType)
    setPendingLog(null)
  }

  return (
    <div className="ss-flow ss-flow--training">
      <ScreenHeader title="Sea analysis" onBack={() => setView('coach-home')} />

      <div className="ss-card">
        <p className="muted stats-panel__sub">
          30-minute watch · log waves with potential at <strong>Peak 1</strong> and{' '}
          <strong>Peak 2</strong>.
        </p>

        <SeaAnalysisTimer state={state} onTimeUp={() => endSeaAnalysisTimer()} />

        <div className="heat-runner__controls">
          {!state.timerStartedAt ? (
            <button type="button" className="btn btn--primary btn--block btn--lg" onClick={startSeaAnalysisTimer}>
              Start 30 min analysis
            </button>
          ) : null}
          {running ? (
            <button type="button" className="btn btn--danger btn--block" onClick={endSeaAnalysisTimer}>
              End analysis now
            </button>
          ) : null}
        </div>

        <div className="sea-peak-grid">
          {SEA_PEAKS.map((peak) => (
            <div key={peak} className="sea-peak-column">
              <h3 className="sea-peak-column__title">{SEA_PEAK_LABELS[peak]}</h3>
              <div className="sea-peak-column__buttons">
                {SEA_WAVE_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`btn btn--block sea-wave-btn sea-wave-btn--${type}`}
                    disabled={!canLog}
                    onClick={() => requestLog(peak, type)}
                  >
                    {SEA_WAVE_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="ss-card stats-panel">
        <h2 className="stats-panel__title">Live statistics</h2>
        <SeaAnalysisStatsPanel state={state} />
      </div>

      <section className="ss-card ss-tools-wrap">
        <button type="button" className="btn btn--primary btn--block" onClick={openEndSessionSheet}>
          Save & end session
        </button>
        <button type="button" className="btn btn--ghost btn--block" onClick={cancelActiveSession}>
          Cancel session
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
