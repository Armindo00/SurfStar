import { useMemo } from 'react'
import { useApp } from '../AppContext'
import { useI18n } from '../i18n'
import type { WaveOutcome } from '../types'

export function WaveFlagsControls() {
  const { activeSession, activeWaveId, setActiveWaveHasPotential, setActiveWaveOutcome } = useApp()
  const { messages } = useI18n()
  const r = messages.session.register

  const openWave = useMemo(
    () => activeSession?.waves.find((w) => w.id === activeWaveId),
    [activeSession?.waves, activeWaveId],
  )

  if (!openWave) return null

  const setOutcome = (outcome: WaveOutcome) => {
    setActiveWaveOutcome(outcome)
  }

  return (
    <div className="wave-flags">
      <div className="wave-flags__group">
        <p className="wave-flags__label">{r.potential}</p>
        <div className="wave-flags__row" role="group" aria-label={r.potential}>
          <button
            type="button"
            className={`chip ${openWave.hasPotential ? 'chip--active' : ''}`}
            aria-pressed={openWave.hasPotential}
            onClick={() => setActiveWaveHasPotential(true)}
          >
            {r.withPotential}
          </button>
          <button
            type="button"
            className={`chip ${!openWave.hasPotential ? 'chip--active' : ''}`}
            aria-pressed={!openWave.hasPotential}
            onClick={() => setActiveWaveHasPotential(false)}
          >
            {r.noPotential}
          </button>
        </div>
      </div>

      <div className="wave-flags__group">
        <p className="wave-flags__label">{r.outcome}</p>
        <div className="wave-flags__row" role="group" aria-label={r.outcome}>
          <button
            type="button"
            className={`chip ${openWave.outcome === 'surfed' ? 'chip--active' : ''}`}
            aria-pressed={openWave.outcome === 'surfed'}
            onClick={() => setOutcome('surfed')}
          >
            {r.surfed}
          </button>
          <button
            type="button"
            className={`chip ${openWave.outcome === 'wasted' ? 'chip--active' : ''}`}
            aria-pressed={openWave.outcome === 'wasted'}
            onClick={() => setOutcome('wasted')}
          >
            {r.wasted}
          </button>
        </div>
      </div>
    </div>
  )
}
