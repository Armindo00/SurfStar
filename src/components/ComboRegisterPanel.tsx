import { useMemo } from 'react'
import type { ComboLevel } from '../types'
import { ComboOutcomeModal } from './ComboOutcomeModal'
import { WaveRegisterSummary } from './WaveRegisterSummary'
import { useApp } from '../AppContext'
import { useI18n } from '../i18n'
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

  const canMarkNoPotential =
    waveOpen &&
    openWave &&
    activeSession &&
    !waveHasLoggedAttempts(openWave, activeSession.mode)

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
          <WaveRegisterSummary mode="combos" />

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

          {canMarkNoPotential ? (
            <button type="button" className="btn btn--block btn-np-wide" onClick={registerNoPotentialWave}>
              {r.noPotential}
            </button>
          ) : null}

          <button type="button" className="btn btn--primary btn--block" onClick={requestCloseActiveWave}>
            {r.closeWave}
          </button>
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
