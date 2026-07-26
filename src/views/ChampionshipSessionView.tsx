import { useMemo } from 'react'
import { ChampionshipBracketBoard } from '../components/ChampionshipBracketBoard'
import { ChampionshipRoundRunner } from '../components/ChampionshipRoundRunner'
import { HeatRunnerPanel } from '../components/HeatRunnerPanel'
import { SessionTools } from '../components/SessionTools'
import { ScreenHeader } from '../components/ScreenHeader'
import { useApp } from '../AppContext'
import {
  activeChampionshipRound,
  groupHeatsByRound,
  previewBracketRounds,
  roundHeatsActionable,
  roundHeatsRunning,
  splitAthletesIntoHeats,
} from '../championshipUtils'

export function ChampionshipSessionView() {
  const { activeSession, activeHeatId, setActiveHeatId, setView, getAthlete } = useApp()

  const heats = activeSession?.heats ?? []
  const championship = activeSession?.championship ?? null
  const heatSize = championship?.heatSize ?? 4
  const activeHeat =
    heats.find((h) => h.id === activeHeatId) ??
    heats.find((h) => !h.endedAt && !h.bracketLocked) ??
    heats[0]

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

  const currentRound = useMemo(() => activeChampionshipRound(heats), [heats])

  const focusRound = activeHeat?.round ?? currentRound

  const focusRoundHeats = useMemo(
    () => roundHeatsActionable(heats, focusRound),
    [focusRound, heats],
  )

  const runningHeatIds = useMemo(
    () => roundHeatsRunning(heats, currentRound).map((h) => h.id),
    [currentRound, heats],
  )

  const focusRoundLabel = useMemo(() => {
    const column = groupHeatsByRound(heats).find((entry) => entry.round === focusRound)
    return column?.label ?? `Round ${focusRound}`
  }, [focusRound, heats])

  const showParallelRunner = focusRoundHeats.length > 0 && !focusRoundHeats.every((h) => h.bracketLocked)

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
          {athleteCount} surfers ·{' '}
          {heatSize === 2 ? 'heats of 2 · top 1 advances' : 'heats of 3 or 4 · top 2 advance'}
        </p>
        {bracketPreview.length > 0 ? (
          <p className="muted stats-panel__sub">
            {bracketPreview.join(' → ')}
            {firstRoundLayout ? ` · opening: ${firstRoundLayout}` : ''}
          </p>
        ) : null}

        {champion ? (
          <p className="champ-winner-banner login-success">
            Champion: <strong>{champion.name}</strong>
          </p>
        ) : (
          <p className="muted">Round {currentRound} in progress</p>
        )}

        <ChampionshipBracketBoard
          heats={heats}
          heatSize={heatSize}
          activeHeatId={activeHeat?.id ?? null}
          runningHeatIds={runningHeatIds}
          onSelectHeat={setActiveHeatId}
          getAthleteName={(id) => getAthlete(id)?.name ?? 'Surfer'}
        />
      </div>

      {showParallelRunner ? (
        <div className="ss-card">
          <ChampionshipRoundRunner
            heats={focusRoundHeats}
            heatSize={heatSize}
            roundLabel={focusRoundLabel}
          />
        </div>
      ) : activeHeat ? (
        <div className="ss-card">
          {activeHeat.bracketLocked ? (
            <div className="champ-bracket-wait">
              <h2 className="heat-runner__title">{activeHeat.label}</h2>
              <p className="muted">
                This heat unlocks when the previous round finishes. Finish every heat in the
                current round to fill these slots automatically.
              </p>
              <ul className="champ-bracket-slots">
                {Array.from({ length: activeHeat.bracketCapacity ?? 2 }, (_, i) => (
                  <li key={i} className="champ-bracket-slots__tbd">
                    TBD
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <HeatRunnerPanel heat={activeHeat} championshipHeatSize={heatSize} />
          )}
        </div>
      ) : null}

      <SessionTools />
    </div>
  )
}
