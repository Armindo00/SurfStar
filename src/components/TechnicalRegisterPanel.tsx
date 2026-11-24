import { useMemo } from 'react'
import type { ManeuverKind } from '../types'
import { ManeuverModal } from './ManeuverModal'
import { WaveFlagsControls } from './WaveFlagsControls'
import { WaveRegisterSummary } from './WaveRegisterSummary'
import { useApp } from '../AppContext'
import { useI18n } from '../i18n'

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
    logTechnicalManeuver,
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
  const canLogManeuvers = classified && openWave?.outcome === 'surfed'
  const showClose = classified

  return (
    <div className="register-panel">
      <div className="register-panel__head">
        <button type="button" className="btn btn--ghost" onClick={onBack}>
          {r.backToAthletes}
        </button>
        <div>
          <p className="register-panel__eyebrow">{r.liveRegister}</p>
          <h2>{athleteName}</h2>
        </div>
      </div>

      {!waveOpen ? (
        <button type="button" className="btn btn--primary btn--block btn--lg" onClick={startOpenWave}>
          {r.startWave}
        </button>
      ) : (
        <>
          {classified ? <WaveRegisterSummary mode="tecnico" /> : null}
          <WaveFlagsControls />

          {canLogManeuvers ? (
            <>
              <p className="wave-flags__label">{r.maneuversStep}</p>
              <p className="muted keypad-legend">
                {r.technicalKeypadLegend}{' '}
                <strong>R</strong> {r.technicalKeypadRail.slice(2).trim()} · <strong>T</strong>{' '}
                {r.technicalKeypadTop.slice(2).trim()} · <strong>P</strong>{' '}
                {r.technicalKeypadProgressive.slice(2).trim()}
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
            </>
          ) : null}

          {classified && openWave?.outcome === 'wasted' ? (
            <p className="muted wave-flags__hint">{r.wastedHint}</p>
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

      {maneuver && canLogManeuvers && (
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
