import { useCallback, useMemo, useState } from 'react'
import { CustomAttemptModal } from './CustomAttemptModal'
import { CustomTimer } from './CustomTimer'
import { WaveRegisterSummary } from './WaveRegisterSummary'
import { useApp } from '../AppContext'
import { useI18n } from '../i18n'
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
    requestCloseActiveWave,
    startCustomTimer,
    endCustomTimer,
    setView,
  } = useApp()
  const { t, messages } = useI18n()
  const r = messages.session.register as Record<string, string>

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

  const handleTimerEnd = useCallback(() => {
    endCustomTimer()
  }, [endCustomTimer])

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

  const templateName = template?.name ?? t('ui.session.customTrainingFallback')
  const timerMinutes = template?.timer?.durationMinutes ?? 15

  return (
    <div className="register-panel">
      <div className="register-panel__head">
        <button type="button" className="btn btn--ghost" onClick={onBack}>
          {r.backToAthletes}
        </button>
        <div>
          <p className="register-panel__eyebrow">
            {t('session.register.liveRegisterWithName', { name: templateName })}
          </p>
          <h2>{athleteName}</h2>
        </div>
      </div>

      {activeSession ? <CustomTimer session={activeSession} onTimeUp={handleTimerEnd} /> : null}

      {timerEnabled && activeSession && !activeSession.customTimerStartedAt ? (
        <button type="button" className="btn btn--primary btn--block btn--lg" onClick={startCustomTimer}>
          {t('session.register.startTimer', { minutes: timerMinutes })}
        </button>
      ) : null}

      {timerEnabled && timerRunning ? (
        <button type="button" className="btn btn--danger btn--block" onClick={endCustomTimer}>
          {r.stopTimer}
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
              {maxAttempts === 1
                ? t('session.register.maxAttemptsPerWave', { count: maxAttempts })
                : t('session.register.maxAttemptsPerWavePlural', { count: maxAttempts })}
            </p>
          ) : null}
        </div>
      ) : null}

      {useWaves && !waveOpen ? (
        <button type="button" className="btn btn--primary btn--block btn--lg" onClick={startOpenWave}>
          {r.startWave}
        </button>
      ) : useWaves && waveOpen ? (
        <>
          <WaveRegisterSummary mode="custom" />

          <p className="muted keypad-legend">{r.customTapToLogWave}</p>

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
              {r.noPotential}
            </button>
          ) : null}

          <button type="button" className="btn btn--primary btn--block" onClick={requestCloseActiveWave}>
            {r.closeWave}
          </button>
        </>
      ) : !useWaves ? (
        <>
          <WaveRegisterSummary mode="custom" />
          <p className="muted keypad-legend">{r.customTapToLogDirect}</p>
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

      {buttons.length === 0 ? (
        <p className="muted">{r.noSkillButtons}</p>
      ) : null}

      <div className="register-panel__links">
        <button type="button" className="btn btn--ghost btn--block" onClick={() => setView('session-stats')}>
          {t('session.liveStats')}
        </button>
        {useWaves ? (
          <button type="button" className="btn btn--ghost btn--block" onClick={() => setView('saved-waves')}>
            {t('nav.savedWaves')}
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
