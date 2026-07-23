import { useMemo } from 'react'
import type { ManeuverKind } from '../types'
import { ManeuverModal } from './ManeuverModal'
import { WaveRegisterSummary } from './WaveRegisterSummary'
import { useApp } from '../AppContext'
import { waveHasLoggedAttempts } from '../sessionStats'

type Props = {
  athleteName: string
  onBack: () => void
  maneuver: ManeuverKind | null
  setManeuver: (k: ManeuverKind | null) => void
}

export function TechnicalRegisterPanel({
  athleteName,
  onBack,
  maneuver,
  setManeuver,
}: Props) {
  const {
    activeSession,
    activeWaveId,
    startOpenWave,
    registerNoPotentialWave,
    logTechnicalManeuver,
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
          <p className="register-panel__eyebrow">Live register</p>
          <h2>{athleteName}</h2>
        </div>
      </div>

      {!waveOpen ? (
        <button type="button" className="btn btn--primary btn--block btn--lg" onClick={startOpenWave}>
          Start wave
        </button>
      ) : (
        <>
          <WaveRegisterSummary mode="tecnico" />

          <p className="muted keypad-legend">
            Wave open: tap <strong>R</strong> rail · <strong>T</strong> top turn · <strong>P</strong>{' '}
            progressive
          </p>

          <div className="ss-keypad ss-keypad--tec">
            <button type="button" className="key key--r" onClick={() => setManeuver('rail')}>
              R
            </button>
            <button type="button" className="key key--t" onClick={() => setManeuver('top-turn')}>
              T
            </button>
            <button type="button" className="key key--p" onClick={() => setManeuver('progressive')}>
              P
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

      {maneuver && (
        <ManeuverModal
          kind={maneuver}
          onClose={() => setManeuver(null)}
          onLog={(side, level, success) => {
            logTechnicalManeuver(maneuver, side, level, success)
            setManeuver(null)
          }}
        />
      )}
    </div>
  )
}
