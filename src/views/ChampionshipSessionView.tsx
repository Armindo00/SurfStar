import { useState } from 'react'
import { CreateHeatModal } from '../components/CreateHeatModal'
import { HeatRunnerPanel } from '../components/HeatRunnerPanel'
import { SessionTools } from '../components/SessionTools'
import { ScreenHeader } from '../components/ScreenHeader'
import { useApp } from '../AppContext'
import { formatHeatTotal, heatAthleteTotals, heatIsFinished, heatIsRunning } from '../heatUtils'

export function ChampionshipSessionView() {
  const {
    activeSession,
    activeHeatId,
    setActiveHeatId,
    createChampionshipHeat,
    setView,
    getAthlete,
    draft,
  } = useApp()

  const [createOpen, setCreateOpen] = useState(false)

  const heats = activeSession?.heats ?? []
  const activeHeat = heats.find((h) => h.id === activeHeatId) ?? heats[0]

  const defaultDuration = draft.heatDurationMinutes

  if (!activeSession || activeSession.mode !== 'campeonato') {
    return (
      <div className="ss-flow">
        <p className="muted">No active championship session.</p>
        <button type="button" className="btn" onClick={() => setView('coach-home')}>
          Back
        </button>
      </div>
    )
  }

  return (
    <div className="ss-flow ss-flow--training">
      <ScreenHeader title="Championship" onBack={() => setView('coach-home')} />

      <div className="ss-card">
        <div className="champ-heats-head">
          <h2 className="page-title">Heats</h2>
          <button type="button" className="btn btn--primary btn--small" onClick={() => setCreateOpen(true)}>
            + New heat
          </button>
        </div>

        {heats.length === 0 ? (
          <p className="muted">Create heats to simulate the full contest.</p>
        ) : (
          <ul className="champ-heat-list">
            {heats.map((h) => {
              const running = heatIsRunning(h)
              const done = heatIsFinished(h)
              const totals = heatAthleteTotals(h)
              const top = [...h.athleteIds]
                .map((id) => totals[id] ?? 0)
                .sort((a, b) => b - a)[0]

              return (
                <li key={h.id}>
                  <button
                    type="button"
                    className={
                      activeHeat?.id === h.id ? 'champ-heat-item champ-heat-item--on' : 'champ-heat-item'
                    }
                    onClick={() => setActiveHeatId(h.id)}
                  >
                    <span>
                      <strong>{h.label}</strong>
                      <small>
                        {h.durationMinutes} min · {h.athleteIds.length} surfers
                        {done ? ` · done · top ${formatHeatTotal(top ?? 0)}` : running ? ' · live' : ' · ready'}
                      </small>
                    </span>
                    <span aria-hidden="true">›</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {activeHeat ? (
        <div className="ss-card">
          <HeatRunnerPanel heat={activeHeat} />
        </div>
      ) : null}

      <SessionTools />

      {createOpen ? (
        <CreateHeatModal
          poolAthleteIds={activeSession.athleteIds}
          getAthleteName={(id) => getAthlete(id)?.name ?? 'Athlete'}
          defaultDuration={defaultDuration}
          heatNumber={heats.length + 1}
          onClose={() => setCreateOpen(false)}
          onCreate={(athleteIds, durationMinutes) => {
            createChampionshipHeat(athleteIds, durationMinutes)
            setCreateOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}
