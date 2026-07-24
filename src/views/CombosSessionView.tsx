import { useMemo, useState } from 'react'
import { ComboRegisterPanel } from '../components/ComboRegisterPanel'
import { SessionTools } from '../components/SessionTools'
import { ScreenHeader } from '../components/ScreenHeader'
import { computeWaveStats } from '../sessionStats'
import { useApp } from '../AppContext'
import type { ComboLevel } from '../types'

export function CombosSessionView() {
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

  if (!activeSession || activeSession.mode !== 'combos') {
    return (
      <div className="ss-flow">
        <p className="muted">No active combos session.</p>
        <button type="button" className="btn" onClick={() => setView('coach-home')}>
          Back
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
      <div className="ss-flow ss-flow--training">
        <ScreenHeader title="Combos" onBack={backToGrid} />
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
    <div className="ss-flow ss-flow--training">
      <ScreenHeader title="Combos" onBack={() => setView('coach-home')} />

      <div className="ss-card">
        <h2 className="page-title">Choose an athlete</h2>
        <p className="muted">Tap a tile to open the register sheet.</p>

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
          <span>Session · {waveStats.totalWaves} waves</span>
          <span>Potential {waveStats.withPotential}</span>
          <span>No pot. {waveStats.withoutPotential}</span>
        </div>
      </div>

      <SessionTools />
    </div>
  )
}
