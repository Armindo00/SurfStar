import { useMemo } from 'react'
import { useI18n } from '../i18n'
import { ChampionshipBracketBoard } from '../components/ChampionshipBracketBoard'
import { ChampionshipRoundRunner } from '../components/ChampionshipRoundRunner'
import { HeatRunnerPanel } from '../components/HeatRunnerPanel'
import { SessionStickyBar } from '../components/SessionStickyBar'
import { ScreenHeader } from '../components/ScreenHeader'
import { useApp } from '../AppContext'
import {
  activeChampionshipRound,
  championshipParallelHeatsEnabled,
  groupHeatsByRound,
  previewBracketRounds,
  roundHeatsActionable,
  roundHeatsRunning,
  shouldUseParallelRoundRunner,
  splitAthletesIntoHeats,
} from '../championshipUtils'

export function ChampionshipSessionView() {
  const { t } = useI18n()
  const { activeSession, activeHeatId, setActiveHeatId, setView, getAthlete } = useApp()

  const heats = activeSession?.heats ?? []
  const championship = activeSession?.championship ?? null
  const heatSize = championship?.heatSize ?? 4
  const parallelHeats = championshipParallelHeatsEnabled(championship)
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

  const showParallelRunner = shouldUseParallelRoundRunner(championship, heats, focusRound)

  const sequentialRoundHeats =
    !parallelHeats && focusRoundHeats.length > 1 ? focusRoundHeats : []

  const sequentialActiveHeat =
    sequentialRoundHeats.length > 0
      ? sequentialRoundHeats.find((h) => h.id === activeHeatId) ??
        sequentialRoundHeats.find((h) => !h.endedAt) ??
        sequentialRoundHeats[0]
      : null

  if (!activeSession || activeSession.mode !== 'campeonato') {
    return (
      <div className="ss-flow">
        <p className="muted">{t('ui.championship.noActiveSession')}</p>
        <button type="button" className="btn" onClick={() => setView('coach-home')}>
          {t('common.back')}
        </button>
      </div>
    )
  }

  const champion =
    championship?.status === 'complete' && championship.championAthleteId
      ? getAthlete(championship.championAthleteId)
      : null

  return (
    <div className="ss-flow ss-flow--training ss-flow--with-sticky">
      <ScreenHeader title={t('nav.championship')} onBack={() => setView('coach-home')} />

      <div className="ss-card champ-bracket-card">
        <h2 className="page-title">{t('ui.championship.bracket')}</h2>
        <p className="muted stats-panel__sub">
          {athleteCount} surfers ·{' '}
          {heatSize === 2 ? 'heats of 2 · top 1 advances' : 'heats of 3 or 4 · top 2 advance'}
          {' · '}
          {parallelHeats ? 'parallel heats' : 'sequential heats'}
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
          <p className="muted">{t('ui.championship.roundInProgress', { round: currentRound })}</p>
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
      ) : sequentialActiveHeat ? (
        <div className="ss-card">
          <div className="champ-sequential-runner">
            <header className="champ-sequential-runner__head">
              <h2 className="heat-runner__title">{focusRoundLabel}</h2>
              <p className="muted champ-sequential-runner__sub">
                One heat at a time — select a heat below or from the bracket.
              </p>
            </header>
            <div className="chip-row chip-row--pro champ-sequential-runner__tabs">
              {sequentialRoundHeats.map((heat) => {
                const selected = heat.id === sequentialActiveHeat.id
                const status = heat.endedAt ? ' · done' : heat.timerStartedAt ? ' · live' : ''
                return (
                  <button
                    key={heat.id}
                    type="button"
                    className={selected ? 'chip chip--active' : 'chip'}
                    onClick={() => setActiveHeatId(heat.id)}
                  >
                    {heat.label}
                    {status}
                  </button>
                )
              })}
            </div>
          </div>
          <HeatRunnerPanel heat={sequentialActiveHeat} championshipHeatSize={heatSize} />
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

      <SessionStickyBar />
    </div>
  )
}
