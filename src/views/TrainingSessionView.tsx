import { useMemo, useState } from 'react'
import { TechnicalRegisterPanel } from '../components/TechnicalRegisterPanel'
import { ScreenHeader } from '../components/ScreenHeader'
import { computeWaveStats } from '../sessionStats'
import { useApp } from '../AppContext'
import type { ManeuverKind } from '../types'

export function TrainingSessionView() {
  const {
    activeSession,
    activeAthleteId,
    activeWaveId,
    selectAthlete,
    closeActiveWave,
    setView,
    getAthlete,
    endActiveSession,
    cancelActiveSession,
  } = useApp()

  const [focusAthleteId, setFocusAthleteId] = useState<string | null>(null)
  const [maneuver, setManeuver] = useState<ManeuverKind | null>(null)
  const [toolsOpen, setToolsOpen] = useState(false)

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

  if (!activeSession || activeSession.mode !== 'tecnico') {
    return (
      <div className="ss-flow">
        <p className="muted">No active technical session.</p>
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
        <ScreenHeader title="Technical training" onBack={backToGrid} />
        <div className="ss-card">
          <TechnicalRegisterPanel
            athleteName={focusedAthlete.name}
            onBack={backToGrid}
            maneuver={maneuver}
            setManeuver={setManeuver}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="ss-flow ss-flow--training">
      <ScreenHeader title="Technical training" onBack={() => setView('coach-home')} />

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

      <section className="ss-card ss-tools-wrap">
        <button type="button" className="ss-tools__toggle" onClick={() => setToolsOpen((v) => !v)}>
          Session tools
        </button>
        {toolsOpen && (
          <div className="ss-tools__body">
            <button type="button" className="btn btn--danger btn--block" onClick={cancelActiveSession}>
              Cancel session
            </button>
            <button type="button" className="btn btn--primary btn--block" onClick={endActiveSession}>
              End session
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
