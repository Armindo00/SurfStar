import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../AppContext'
import { useI18n } from '../i18n'
import type { WaveOutcome } from '../types'

export function WaveFlagsControls() {
  const {
    activeSession,
    activeWaveId,
    classifyActiveWave,
    reopenActiveWaveClassification,
  } = useApp()
  const { messages } = useI18n()
  const r = messages.session.register

  const openWave = useMemo(
    () => activeSession?.waves.find((w) => w.id === activeWaveId),
    [activeSession?.waves, activeWaveId],
  )

  const [draftPotential, setDraftPotential] = useState<boolean | null>(null)
  const [draftOutcome, setDraftOutcome] = useState<WaveOutcome | null>(null)

  useEffect(() => {
    if (!openWave || openWave.classified) {
      setDraftPotential(null)
      setDraftOutcome(null)
      return
    }
    setDraftPotential(null)
    setDraftOutcome(null)
  }, [openWave?.id, openWave?.classified])

  if (!openWave) return null

  if (openWave.classified) {
    return (
      <div className="wave-flags wave-flags--summary">
        <div className="wave-flags__summary-row">
          <p className="wave-flags__label">{r.waveTypeStep}</p>
          <button
            type="button"
            className="btn btn--ghost btn--small"
            onClick={reopenActiveWaveClassification}
          >
            {r.changeWaveType}
          </button>
        </div>
        <p className="wave-flags__summary-text">
          {openWave.hasPotential ? r.withPotential : r.noPotential}
          {' · '}
          {openWave.outcome === 'wasted' ? r.wasted : r.surfed}
        </p>
      </div>
    )
  }

  const canContinue = draftPotential !== null && draftOutcome !== null

  return (
    <div className="wave-flags">
      <div className="wave-flags__group">
        <p className="wave-flags__label">{r.waveTypeStep}</p>
        <p className="muted wave-flags__hint">{r.chooseWaveTypeHint}</p>
      </div>

      <div className="wave-flags__group">
        <p className="wave-flags__label">{r.potential}</p>
        <div className="wave-flags__row" role="group" aria-label={r.potential}>
          <button
            type="button"
            className={`chip ${draftPotential === true ? 'chip--active' : ''}`}
            aria-pressed={draftPotential === true}
            onClick={() => setDraftPotential(true)}
          >
            {r.withPotential}
          </button>
          <button
            type="button"
            className={`chip ${draftPotential === false ? 'chip--active' : ''}`}
            aria-pressed={draftPotential === false}
            onClick={() => setDraftPotential(false)}
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
            className={`chip ${draftOutcome === 'surfed' ? 'chip--active' : ''}`}
            aria-pressed={draftOutcome === 'surfed'}
            onClick={() => setDraftOutcome('surfed')}
          >
            {r.surfed}
          </button>
          <button
            type="button"
            className={`chip ${draftOutcome === 'wasted' ? 'chip--active' : ''}`}
            aria-pressed={draftOutcome === 'wasted'}
            onClick={() => setDraftOutcome('wasted')}
          >
            {r.wasted}
          </button>
        </div>
      </div>

      <button
        type="button"
        className="btn btn--primary btn--block"
        disabled={!canContinue}
        onClick={() => {
          if (draftPotential === null || draftOutcome === null) return
          classifyActiveWave(draftPotential, draftOutcome)
        }}
      >
        {draftOutcome === 'wasted' ? r.confirmWastedWave : r.continueToManeuvers}
      </button>
    </div>
  )
}
