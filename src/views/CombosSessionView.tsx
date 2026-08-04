import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../i18n'
import { ComboRegisterPanel } from '../components/ComboRegisterPanel'
import { SessionStickyBar } from '../components/SessionStickyBar'
import { ScreenHeader } from '../components/ScreenHeader'
import { computeWaveStats } from '../sessionStats'
import { useApp } from '../AppContext'
import type { ComboLevel } from '../types'

export function CombosSessionView() {
  const { t } = useI18n()
  const {
    activeSession,
    activeAthleteId,
    activeWaveId,
    selectAthlete,
    closeActiveWave,
    setView,
    getAthlete,
  } = useApp()

  const [focusAthleteId, setFocusAthleteId] = useState<string | null>(null)
  const [comboLevel, setComboLevel] = useState<ComboLevel | null>(null)

  const sessionAthletes = useMemo(() => {
    if (!activeSession) return []
    return activeSession.athleteIds
      .map((id) => getAthlete(id))
      .filter(Boolean) as { id: string; name: string }[]
  }, [activeSession, getAthlete])

  const waveStats = activeSession
    ? computeWaveStats(activeSession, null)
    : { totalWaves: 0, withPotential: 0, withoutPotential: 0 }

  const focusedAthlete = focusAthleteId ? getAthlete(focusAthleteId) : undefined

  useEffect(() => {
    if (!activeAthleteId) {
      setFocusAthleteId(null)
      setComboLevel(null)
    }
  }, [activeAthleteId])

  if (!activeSession || activeSession.mode !== 'combos') {
    return (
      <div className="ss-flow">
        <p className="muted">{t('session.noActiveCombosSession')}</p>
        <button type="button" className="btn" onClick={() => setView('coach-home')}>
          {t('common.back')}
        </button>
      </div>
    )
  }

  const openAthleteRegister = (athleteId: string) => {
    if (activeWaveId) closeActiveWave()
    selectAthlete(athleteId)
    setFocusAthleteId(athleteId)
  }

  const backToGrid = () => {
    if (activeWaveId) closeActiveWave()
    setFocusAthleteId(null)
  }

  if (focusAthleteId && focusedAthlete && activeAthleteId === focusAthleteId) {
    return (
      <div className="ss-flow ss-flow--training ss-flow--with-sticky">
        <ScreenHeader title={t('nav.combos')} onBack={backToGrid} />
        <div className="ss-card">
          <ComboRegisterPanel
            athleteName={focusedAthlete.name}
            onBack={backToGrid}
            comboLevel={comboLevel}
            setComboLevel={setComboLevel}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="ss-flow ss-flow--training ss-flow--with-sticky">
      <ScreenHeader title={t('nav.combos')} onBack={() => setView('coach-home')} />

      <div className="ss-card">
        <h2 className="page-title">{t('ui.session.chooseAthlete')}</h2>
        <p className="muted">{t('ui.session.chooseAthleteHint')}</p>

        <div className="athlete-grid">
          {sessionAthletes.map((a) => (
            <button
              key={a.id}
              type="button"
              className="athlete-tile"
              onClick={() => openAthleteRegister(a.id)}
            >
              <span className="athlete-tile__avatar" aria-hidden="true">
                {a.name.charAt(0).toUpperCase()}
              </span>
              <span className="athlete-tile__name">{a.name}</span>
            </button>
          ))}
        </div>

        <div className="ss-mini-stats ss-mini-stats--bar">
          <span>{t('ui.session.sessionMeta', { waves: waveStats.totalWaves })}</span>
          <span>{t('ui.session.potentialShort', { count: waveStats.withPotential })}</span>
          <span>{t('ui.session.noPotShort', { count: waveStats.withoutPotential })}</span>
        </div>
      </div>

      <SessionStickyBar />
    </div>
  )
}
