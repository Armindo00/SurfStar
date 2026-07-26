import { useMemo } from 'react'
import { HeatRunnerPanel } from '../components/HeatRunnerPanel'
import { SessionTools } from '../components/SessionTools'
import { ScreenHeader } from '../components/ScreenHeader'
import { useApp } from '../AppContext'
import { getAdvancementSummary, heatsInRound, maxRound, previewBracketRounds, splitAthletesIntoHeats } from '../championshipUtils'
import { heatIsFinished, heatIsRunning } from '../heatUtils'

export function ChampionshipSessionView() {
  const { activeSession, activeHeatId, setActiveHeatId, setView, getAthlete } = useApp()

  const heats = activeSession?.heats ?? []
  const championship = activeSession?.championship ?? null
  const heatSize = championship?.heatSize ?? 4
  const activeHeat = heats.find((h) => h.id === activeHeatId) ?? heats.find((h) => !h.endedAt) ?? heats[0]

  const athleteCount = activeSession?.athleteIds.length ?? 0

  const bracketPreview = useMemo(() => {
    if (athleteCount < 2) return []
    return previewBracketRounds(athleteCount, heatSize)
  }, [athleteCount, heatSize])

  const firstRoundLayout = useMemo(() => {
    if (!activeSession || athleteCount < 2) return ''
    const groups = splitAthletesIntoHeats(activeSession.athleteIds, heatSize)
    const counts = groups.map((g) => g.length)
    const summary = counts.reduce<Record<number, number>>((acc, n) => {
      acc[n] = (acc[n] ?? 0) + 1
      return acc
    }, {})
    return Object.entries(summary)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([size, count]) => `${count}×${size}`)
      .join(' · ')
  }, [activeSession, athleteCount, heatSize])

  const rounds = useMemo(() => {
    const total = maxRound(heats)
    return Array.from({ length: total }, (_, i) => i + 1)
  }, [heats])

  const currentRound = useMemo(() => {
    const open = heats.find((h) => !h.endedAt)
    return open?.round ?? maxRound(heats)
  }, [heats])

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

  const champion =
    championship?.status === 'complete' && championship.championAthleteId
      ? getAthlete(championship.championAthleteId)
      : null

  return (
    <div className="ss-flow ss-flow--training">
      <ScreenHeader title="Championship" onBack={() => setView('coach-home')} />

      <div className="ss-card champ-bracket-card">
        <h2 className="page-title">Bracket</h2>
        <p className="muted stats-panel__sub">
          {athleteCount} surfers · {heatSize === 2 ? 'heats of 2 · top 1 advances' : 'heats of 3 or 4 · top 2 advance'}
        </p>
        {bracketPreview.length > 0 ? (
          <p className="muted stats-panel__sub">
            Bracket: {bracketPreview.join(' → ')}
            {firstRoundLayout ? ` · opening round: ${firstRoundLayout}` : ''}
          </p>
        ) : null}

        {champion ? (
          <p className="champ-winner-banner login-success">
            Champion: <strong>{champion.name}</strong>
          </p>
        ) : (
          <p className="muted">Round {currentRound} in progress</p>
        )}

        {rounds.map((round) => {
          const roundHeats = heatsInRound(heats, round)
          if (roundHeats.length === 0) return null
          return (
            <section key={round} className="champ-round">
              <h3 className="champ-round__title">
                {roundHeats[0]?.label.split(' · ')[0] ?? `Round ${round}`}
              </h3>
              <ul className="champ-heat-list">
                {roundHeats.map((h) => {
                  const running = heatIsRunning(h)
                  const done = heatIsFinished(h)
                  const summary = done ? getAdvancementSummary(h, heatSize) : []

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
                            {done ? ' · finished' : running ? ' · live' : ' · ready'}
                          </small>
                          {done && summary.length > 0 ? (
                            <small className="champ-heat-item__advance">
                              Advances:{' '}
                              {summary
                                .filter((row) => row.advances)
                                .map((row) => getAthlete(row.athleteId)?.name ?? 'Surfer')
                                .join(', ') || '—'}
                            </small>
                          ) : null}
                          {!done ? (
                            <small className="champ-heat-item__lineup">
                              {h.athleteIds
                                .map((id) => getAthlete(id)?.name ?? 'Surfer')
                                .join(' · ')}
                            </small>
                          ) : null}
                        </span>
                        <span aria-hidden="true">›</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>

      {activeHeat ? (
        <div className="ss-card">
          <HeatRunnerPanel heat={activeHeat} championshipHeatSize={heatSize} />
        </div>
      ) : null}

      <SessionTools />
    </div>
  )
}
