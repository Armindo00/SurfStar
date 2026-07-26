import { useMemo, useState } from 'react'
import { CustomRegisterPanel } from '../components/CustomRegisterPanel'
import { SessionTools } from '../components/SessionTools'
import { ScreenHeader } from '../components/ScreenHeader'
import { computeCustomSessionStats } from '../customTrainingStats'
import { useApp } from '../AppContext'

export function CustomSessionView() {
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

  const sessionAthletes = useMemo(() => {
    if (!activeSession) return []
    return activeSession.athleteIds
      .map((id) => getAthlete(id))
      .filter(Boolean) as { id: string; name: string }[]
  }, [activeSession, getAthlete])

  const stats = activeSession ? computeCustomSessionStats(activeSession, null) : null
  const focusedAthlete = focusAthleteId ? getAthlete(focusAthleteId) : undefined
  const templateName = activeSession?.customTemplateName ?? 'Custom training'

  if (!activeSession || activeSession.mode !== 'custom') {
    return (
      <div className="ss-flow">
        <p className="muted">No active custom training session.</p>
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
        <ScreenHeader title={templateName} onBack={backToGrid} />
        <div className="ss-card">
          <CustomRegisterPanel athleteName={focusedAthlete.name} onBack={backToGrid} />
        </div>
      </div>
    )
  }

  return (
    <div className="ss-flow ss-flow--training">
      <ScreenHeader title={templateName} onBack={() => setView('coach-home')} />

      <div className="ss-card">
        <h2 className="page-title">Choose an athlete</h2>
        <p className="muted">Tap a tile to open your custom register sheet.</p>

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

        {stats ? (
          <div className="ss-mini-stats ss-mini-stats--bar">
            <span>Session · {stats.totalAttempts} attempts</span>
            {stats.waveStats.totalWaves > 0 ? <span>{stats.waveStats.totalWaves} waves</span> : null}
            <span>Success {stats.overallSuccessRate}%</span>
          </div>
        ) : null}
      </div>

      <SessionTools />
    </div>
  )
}
