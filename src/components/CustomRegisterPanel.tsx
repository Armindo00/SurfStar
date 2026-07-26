import { useMemo, useState } from 'react'
import { CustomAttemptModal } from './CustomAttemptModal'
import { CustomTimer } from './CustomTimer'
import { WaveRegisterSummary } from './WaveRegisterSummary'
import { useApp } from '../AppContext'
import {
  buttonDisplayLabel,
  countWaveCustomAttempts,
  sortCustomButtons,
} from '../customTrainingUtils'
import { waveHasLoggedAttempts } from '../sessionStats'
import type { CustomButton } from '../types'

type Props = {
  athleteName: string
  onBack: () => void
}

type PendingAttempt = {
  button: CustomButton
  step: 'level' | 'outcome'
  levelId?: string | null
}

export function CustomRegisterPanel({ athleteName, onBack }: Props) {
  const {
    activeSession,
    activeWaveId,
    startOpenWave,
    registerNoPotentialWave,
    logCustomAttempt,
    closeActiveWave,
    startCustomTimer,
    endCustomTimer,
    setView,
  } = useApp()

  const [pending, setPending] = useState<PendingAttempt | null>(null)

  const template = activeSession?.customTemplateSnapshot
  const rules = template?.rules
  const useWaves = template?.useWaves !== false
  const waveOpen = Boolean(activeWaveId)

  const openWave = useMemo(
    () => activeSession?.waves.find((w) => w.id === activeWaveId),
    [activeSession?.waves, activeWaveId],
  )

  const buttons = sortCustomButtons(template?.buttons ?? [])
  const timerEnabled = template?.timer?.enabled
  const timerRunning =
    activeSession?.customTimerStartedAt && !activeSession?.customTimerEndedAt

  const canLog =
    activeSession &&
    (!rules?.requireWaveBeforeLog || !useWaves || waveOpen) &&
    (!timerEnabled || activeSession.customTimerStartedAt)

  const canMarkNoPotential =
    useWaves &&
    waveOpen &&
    openWave &&
    activeSession &&
    !waveHasLoggedAttempts(openWave, activeSession.mode)

  const maxAttempts = rules?.maxAttemptsPerWave ?? null
  const attemptsOnWave = openWave ? countWaveCustomAttempts(openWave) : 0
  const atMaxAttempts = maxAttempts !== null && attemptsOnWave >= maxAttempts

  const beginAttempt = (button: CustomButton) => {
    if (!canLog || atMaxAttempts) return

    const hasLevels = button.levels.length > 0
    if (hasLevels && button.trackSuccess) {
      setPending({ button, step: 'level' })
      return
    }
    if (hasLevels) {
      setPending({ button, step: 'level' })
      return
    }
    if (button.trackSuccess) {
      setPending({ button, step: 'outcome' })
      return
    }
    logCustomAttempt(button.id, null, null)
  }

  const finishAttempt = (success: boolean | null) => {
    if (!pending) return
    logCustomAttempt(pending.button.id, pending.levelId ?? null, success)
    setPending(null)
  }

  return (
    <div className="register-panel">
      <div className="register-panel__head">
        <button type="button" className="btn btn--ghost" onClick={onBack}>
          ← Athletes
        </button>
        <div>
          <p className="register-panel__eyebrow">
            Live register · {template?.name ?? 'Custom training'}
          </p>
          <h2>{athleteName}</h2>
        </div>
      </div>

      {activeSession ? <CustomTimer session={activeSession} onTimeUp={() => endCustomTimer()} /> : null}

      {timerEnabled && activeSession && !activeSession.customTimerStartedAt ? (
        <button type="button" className="btn btn--primary btn--block btn--lg" onClick={startCustomTimer}>
          Start {template?.timer?.durationMinutes ?? 15} min timer
        </button>
      ) : null}

      {timerEnabled && timerRunning ? (
        <button type="button" className="btn btn--danger btn--block" onClick={endCustomTimer}>
          Stop timer
        </button>
      ) : null}

      {rules?.showRulesPanel && (template?.rulesNotes || template?.description) ? (
        <div className="custom-rules-panel">
          {template.description ? <p className="muted">{template.description}</p> : null}
          {template.rulesNotes ? (
            <p className="custom-rules-panel__notes">{template.rulesNotes}</p>
          ) : null}
          {maxAttempts !== null ? (
            <p className="muted custom-rules-panel__hint">
              Max {maxAttempts} attempt{maxAttempts === 1 ? '' : 's'} per wave
            </p>
          ) : null}
        </div>
      ) : null}

      {useWaves && !waveOpen ? (
        <button type="button" className="btn btn--primary btn--block btn--lg" onClick={startOpenWave}>
          Start wave
        </button>
      ) : useWaves && waveOpen ? (
        <>
          <WaveRegisterSummary mode="custom" />

          <p className="muted keypad-legend">Tap a skill button to log an attempt on this wave.</p>

          <div className="custom-button-grid">
            {buttons.map((button) => (
              <button
                key={button.id}
                type="button"
                className="custom-skill-btn"
                style={{ backgroundColor: button.color }}
                disabled={!canLog || atMaxAttempts}
                onClick={() => beginAttempt(button)}
              >
                <span className="custom-skill-btn__label">{buttonDisplayLabel(button)}</span>
              </button>
            ))}
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
      ) : !useWaves ? (
        <>
          <WaveRegisterSummary mode="custom" />
          <p className="muted keypad-legend">Tap a skill button to log directly — no wave required.</p>
          <div className="custom-button-grid">
            {buttons.map((button) => (
              <button
                key={button.id}
                type="button"
                className="custom-skill-btn"
                style={{ backgroundColor: button.color }}
                disabled={!canLog}
                onClick={() => beginAttempt(button)}
              >
                <span className="custom-skill-btn__label">{buttonDisplayLabel(button)}</span>
              </button>
            ))}
          </div>
        </>
      ) : null}

      <div className="register-panel__links">
        <button type="button" className="btn btn--ghost btn--block" onClick={() => setView('session-stats')}>
          Live stats
        </button>
        {useWaves ? (
          <button type="button" className="btn btn--ghost btn--block" onClick={() => setView('saved-waves')}>
            Saved waves
          </button>
        ) : null}
      </div>

      {pending ? (
        <CustomAttemptModal
          button={pending.button}
          step={pending.step}
          selectedLevelId={pending.levelId}
          onClose={() => setPending(null)}
          onPickLevel={(levelId) => {
            if (pending.button.trackSuccess) {
              setPending({ ...pending, step: 'outcome', levelId })
            } else {
              logCustomAttempt(pending.button.id, levelId, null)
              setPending(null)
            }
          }}
          onPickOutcome={(success) => finishAttempt(success)}
        />
      ) : null}
    </div>
  )
}
