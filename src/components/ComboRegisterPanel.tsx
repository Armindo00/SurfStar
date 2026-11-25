import { useMemo } from 'react'
import type { ComboLevel } from '../types'
import { ComboOutcomeModal } from './ComboOutcomeModal'
import { WaveFlagsControls } from './WaveFlagsControls'
import { WaveRegisterSummary } from './WaveRegisterSummary'
import { useApp } from '../AppContext'
import { useI18n } from '../i18n'

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
    logComboAttempt,
    requestCloseActiveWave,
    setView,
  } = useApp()
  const { t, messages } = useI18n()
  const r = messages.session.register as Record<string, string>

  const waveOpen = Boolean(activeWaveId)

  const openWave = useMemo(
    () => activeSession?.waves.find((w) => w.id === activeWaveId),
    [activeSession?.waves, activeWaveId],
  )

  const classified = Boolean(openWave?.classified)
  const canLogAttempts = classified && openWave?.outcome === 'surfed'
  const showClose = classified

  return (
    <div className="register-panel">
      <div className="register-panel__head">
        <button type="button" className="btn btn--ghost" onClick={onBack}>
          {r.backToAthletes}
        </button>
        <div>
          <p className="register-panel__eyebrow">{r.liveRegisterCombos}</p>
          <h2>{athleteName}</h2>
        </div>
      </div>

      {!waveOpen ? (
        <button type="button" className="btn btn--primary btn--block btn--lg" onClick={startOpenWave}>
          {r.startWave}
        </button>
      ) : (
        <>
          {classified ? <WaveRegisterSummary mode="combos" /> : null}
          <WaveFlagsControls />

          {canLogAttempts ? (
            <>
              <p className="wave-flags__label">{r.combinationsStep}</p>
              <p className="muted keypad-legend">{r.comboKeypadLegend}</p>

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
            </>
          ) : null}

          {classified && openWave?.outcome === 'wasted' ? (
            <p className="muted wave-flags__hint">{r.wastedHintCombos}</p>
          ) : null}

          {showClose ? (
            <button type="button" className="btn btn--primary btn--block" onClick={requestCloseActiveWave}>
              {r.closeWave}
            </button>
          ) : null}
        </>
      )}

      <div className="register-panel__links">
        <button type="button" className="btn btn--ghost btn--block" onClick={() => setView('session-stats')}>
          {t('session.liveStats')}
        </button>
        <button type="button" className="btn btn--ghost btn--block" onClick={() => setView('saved-waves')}>
          {t('nav.savedWaves')}
        </button>
      </div>

      {comboLevel !== null && canLogAttempts && (
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