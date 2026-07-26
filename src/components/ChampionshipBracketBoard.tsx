import { useMemo } from 'react'
import { activeChampionshipRound, getAdvancementSummary, groupHeatsByRound } from '../championshipUtils'
import { heatIsFinished, heatIsRunning } from '../heatUtils'
import type { ChampionshipHeatSize, HeatRecord } from '../types'

type Props = {
  heats: HeatRecord[]
  heatSize: ChampionshipHeatSize
  activeHeatId: string | null
  runningHeatIds?: string[]
  onSelectHeat: (heatId: string) => void
  getAthleteName: (id: string) => string
}

function heatStatusLabel(heat: HeatRecord): string {
  if (heat.bracketLocked) return 'Waiting'
  if (heatIsFinished(heat)) return 'Finished'
  if (heatIsRunning(heat)) return 'Live'
  return 'Ready'
}

function slotNames(heat: HeatRecord, getAthleteName: (id: string) => string): string[] {
  const capacity = heat.bracketCapacity ?? heat.athleteIds.length
  if (heat.bracketLocked || heat.athleteIds.length === 0) {
    return Array.from({ length: Math.max(capacity, 1) }, () => 'TBD')
  }
  return heat.athleteIds.map((id) => getAthleteName(id))
}

export function ChampionshipBracketBoard({
  heats,
  heatSize,
  activeHeatId,
  runningHeatIds = [],
  onSelectHeat,
  getAthleteName,
}: Props) {
  const columns = useMemo(() => groupHeatsByRound(heats), [heats])
  const currentRound = useMemo(() => activeChampionshipRound(heats), [heats])

  if (columns.length === 0) return null

  return (
    <div className="champ-bracket-board" aria-label="Championship bracket">
      {columns.map((column, columnIndex) => (
        <section
          key={column.round}
          className={
            column.round === currentRound
              ? 'champ-bracket-col champ-bracket-col--active'
              : 'champ-bracket-col'
          }
        >
          <header className="champ-bracket-col__head">
            <h3>{column.label}</h3>
            <span>
              {column.heats.length} heat{column.heats.length === 1 ? '' : 's'}
            </span>
          </header>

          <div className="champ-bracket-col__heats">
            {column.heats.map((heat) => {
              const running = heatIsRunning(heat)
              const done = heatIsFinished(heat)
              const locked = Boolean(heat.bracketLocked)
              const summary = done ? getAdvancementSummary(heat, heatSize) : []
              const slots = slotNames(heat, getAthleteName)
              const heatTitle =
                heat.isFinal || column.heats.length === 1
                  ? column.label
                  : heat.label.split(' · ')[1] ?? heat.label

              return (
                <button
                  key={heat.id}
                  type="button"
                  className={
                    activeHeatId === heat.id || runningHeatIds.includes(heat.id)
                      ? 'champ-bracket-heat champ-bracket-heat--on'
                      : locked
                        ? 'champ-bracket-heat champ-bracket-heat--locked'
                        : 'champ-bracket-heat'
                  }
                  onClick={() => onSelectHeat(heat.id)}
                >
                  <div className="champ-bracket-heat__top">
                    <strong>{heatTitle}</strong>
                    <span
                      className={
                        running
                          ? 'champ-bracket-heat__badge champ-bracket-heat__badge--live'
                          : locked
                            ? 'champ-bracket-heat__badge champ-bracket-heat__badge--wait'
                            : done
                              ? 'champ-bracket-heat__badge champ-bracket-heat__badge--done'
                              : 'champ-bracket-heat__badge'
                      }
                    >
                      {heatStatusLabel(heat)}
                    </span>
                  </div>

                  <ul className="champ-bracket-slots">
                    {slots.map((name, index) => (
                      <li
                        key={`${heat.id}-${index}`}
                        className={name === 'TBD' ? 'champ-bracket-slots__tbd' : undefined}
                      >
                        {name}
                      </li>
                    ))}
                  </ul>

                  {locked ? (
                    <p className="champ-bracket-heat__hint muted">Winners from previous round</p>
                  ) : (
                    <p className="champ-bracket-heat__hint muted">
                      {heat.durationMinutes} min · top {heat.advancesCount ?? 1} advance
                    </p>
                  )}

                  {done && summary.length > 0 ? (
                    <p className="champ-bracket-heat__advance">
                      Through:{' '}
                      {summary
                        .filter((row) => row.advances)
                        .map((row) => getAthleteName(row.athleteId))
                        .join(', ') || '—'}
                    </p>
                  ) : null}
                </button>
              )
            })}
          </div>

          {columnIndex < columns.length - 1 ? (
            <span className="champ-bracket-col__arrow" aria-hidden="true">
              →
            </span>
          ) : null}
        </section>
      ))}
    </div>
  )
}
