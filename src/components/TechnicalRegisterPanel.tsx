import { useMemo } from 'react'
import type { ManeuverKind } from '../types'
import { ManeuverModal } from './ManeuverModal'
import { WaveRegisterSummary } from './WaveRegisterSummary'
import { useApp } from '../AppContext'
import { useI18n } from '../i18n'
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
    requestNoPotentialWave,
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
          <WaveRegisterSummary mode="tecnico" />

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

          {canMarkNoPotential ? (
            <button type="button" className="btn btn--block btn-np-wide" onClick={requestNoPotentialWave}>
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
