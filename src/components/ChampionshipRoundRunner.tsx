import { useMemo } from 'react'
import { HeatRunnerPanel } from './HeatRunnerPanel'
import { HeatTimer } from './HeatTimer'
import { useApp } from '../AppContext'
import { heatIsRunning } from '../heatUtils'
import type { ChampionshipHeatSize, HeatRecord } from '../types'

type Props = {
  heats: HeatRecord[]
  heatSize: ChampionshipHeatSize
  roundLabel?: string
}

export function ChampionshipRoundRunner({ heats, heatSize, roundLabel }: Props) {
  const { startHeatTimers, endHeatTimers } = useApp()

  const parallel = heats.length > 1
  const readyHeats = useMemo(
    () => heats.filter((h) => !h.timerStartedAt && !h.endedAt),
    [heats],
  )
  const runningHeats = useMemo(
    () => heats.filter((h) => Boolean(h.timerStartedAt) && !h.endedAt),
    [heats],
  )

  const timerHeat = runningHeats[0] ?? heats.find((h) => heatIsRunning(h)) ?? heats[0]
  const allFinished = heats.every((h) => Boolean(h.endedAt))
  const anyStarted = heats.some((h) => Boolean(h.timerStartedAt))

  if (heats.length === 0) return null

  if (!parallel) {
    const heat = heats[0]
    if (!heat) return null
    return <HeatRunnerPanel heat={heat} championshipHeatSize={heatSize} />
  }

  const startAll = () => {
    const ids = readyHeats.map((h) => h.id)
    if (ids.length > 0) startHeatTimers(ids)
  }

  const endAll = () => {
    const ids = runningHeats.map((h) => h.id)
    if (ids.length > 0) endHeatTimers(ids)
  }

  return (
    <div className="champ-round-runner">
      <header className="champ-round-runner__head">
        <div>
          <h2 className="heat-runner__title">{roundLabel ?? 'Round heats'}</h2>
          <p className="muted champ-round-runner__sub">
            {heats.length} heats in the water together · score each heat separately
          </p>
        </div>
        {timerHeat ? <HeatTimer heat={timerHeat} onTimeUp={endAll} /> : null}
      </header>

      {!allFinished ? (
        <div className="champ-round-runner__controls">
          {readyHeats.length > 0 ? (
            <button type="button" className="btn btn--primary btn--block btn--lg" onClick={startAll}>
              {anyStarted
                ? `Start ${readyHeats.length} remaining heat${readyHeats.length === 1 ? '' : 's'}`
                : `Start all ${readyHeats.length} heats`}
            </button>
          ) : null}
          {runningHeats.length > 0 ? (
            <button type="button" className="btn btn--danger btn--block" onClick={endAll}>
              End all heats now
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="champ-round-runner__heats">
        {heats.map((heat) => (
          <section key={heat.id} className="champ-round-runner__heat">
            <HeatRunnerPanel
              heat={heat}
              championshipHeatSize={heatSize}
              compact
              hideTimer
              hideControls
            />
          </section>
        ))}
      </div>
    </div>
  )
}
