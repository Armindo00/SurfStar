import { useMemo } from 'react'
import type { ComboLevel } from '../types'
import { ComboOutcomeModal } from './ComboOutcomeModal'
import { WaveRegisterSummary } from './WaveRegisterSummary'
import { useApp } from '../AppContext'
import { waveHasLoggedAttempts } from '../sessionStats'

type Props = {
  athleteName: string
  onBack: () => void
  comboLevel: ComboLevel | null
  setComboLevel: (level: ComboLevel | null) => void
}

export function ComboRegisterPanel({
  athleteName,
  onBack,
  comboLevel,
  setComboLevel,
}: Props) {
  const {
    activeSession,
    activeWaveId,
    startOpenWave,
    registerNoPotentialWave,
    logComboAttempt,
    closeActiveWave,
    setView,
  } = useApp()

  const waveOpen = Boolean(activeWaveId)

  const openWave = useMemo(
    () => activeSession?.waves.find((w) => w.id === activeWaveId),
    [activeSession?.waves, activeWaveId],
  )

  const canMarkNoPotential =
    waveOpen &&
    openWave &&
    activeSession &&
    !waveHasLoggedAttempts(openWave, activeSession.mode)

  return (
    <div className="register-panel">
      <div className="register-panel__head">
        <button type="button" className="btn btn--ghost" onClick={onBack}>
          ← Athletes
        </button>
        <div>
          <p className="register-panel__eyebrow">Live register · Combos</p>
          <h2>{athleteName}</h2>
        </div>
      </div>

      {!waveOpen ? (
        <button type="button" className="btn btn--primary btn--block btn--lg" onClick={startOpenWave}>
          Start wave
        </button>
      ) : (
        <>
          <WaveRegisterSummary mode="combos" />

          <p className="muted keypad-legend">
            Wave open: pick combo level, then frontside or backside.
          </p>

          <div className="ss-keypad ss-keypad--combo">
            <button type="button" className="key key--c1" onClick={() => setComboLevel(1)}>
              1
            </button>
            <button type="button" className="key key--c2" onClick={() => setComboLevel(2)}>
              2
            </button>
            <button type="button" className="key key--c3" onClick={() => setComboLevel(3)}>
              3
            </button>
            <button type="button" className="key key--c-star" onClick={() => setComboLevel('estrela')}>
              ★
            </button>
          </div>

          {canMarkNoPotential ? (
            <button type="button" className="btn btn--block btn-np-wide" onClick={registerNoPotentialWave}>
              No potential
            </button>
          ) : null}

          <button type="button" className="btn btn--primary btn--block" onClick={closeActiveWave}>
            Close wave
          </button>
        </>
      )}

      <div className="register-panel__links">
        <button type="button" className="btn btn--ghost btn--block" onClick={() => setView('session-stats')}>
          Live stats
        </button>
        <button type="button" className="btn btn--ghost btn--block" onClick={() => setView('saved-waves')}>
          Saved waves
        </button>
      </div>

      {comboLevel !== null && (
        <ComboOutcomeModal
          level={comboLevel}
          onClose={() => setComboLevel(null)}
          onLog={(side, success) => {
            logComboAttempt(comboLevel, side, success)
            setComboLevel(null)
          }}
        />
      )}
    </div>
  )
}
