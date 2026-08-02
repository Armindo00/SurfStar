import { useMemo } from 'react'
import { activeChampionshipRound, getAdvancementSummary, groupHeatsByRound } from '../championshipUtils'
import { heatIsFinished, heatIsRunning } from '../heatUtils'
import { useI18n } from '../i18n'
import type { ChampionshipHeatSize, HeatRecord } from '../types'

type Props = {
  heats: HeatRecord[]
  heatSize: ChampionshipHeatSize
  activeHeatId: string | null
  runningHeatIds?: string[]
  onSelectHeat: (heatId: string) => void
  getAthleteName: (id: string) => string
}

function heatStatusLabel(heat: HeatRecord, c: Record<string, string>): string {
  if (heat.bracketLocked) return c.statusWaiting
  if (heatIsFinished(heat)) return c.statusFinished
  if (heatIsRunning(heat)) return c.statusLive
  return c.statusReady
}

function slotNames(
  heat: HeatRecord,
  getAthleteName: (id: string) => string,
  tbdLabel: string,
): string[] {
  const capacity = heat.bracketCapacity ?? heat.athleteIds.length
  if (heat.bracketLocked || heat.athleteIds.length === 0) {
    return Array.from({ length: Math.max(capacity, 1) }, () => tbdLabel)
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
  const { t, messages } = useI18n()
  const c = messages.ui.championship as Record<string, string>

  const columns = useMemo(() => groupHeatsByRound(heats), [heats])
  const currentRound = useMemo(() => activeChampionshipRound(heats), [heats])

  if (columns.length === 0) return null

  return (
    <div className="champ-bracket-board" aria-label={c.bracketAriaLabel}>
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
              {column.heats.length === 1
                ? t('ui.championship.heatCount', { count: column.heats.length })
                : t('ui.championship.heatCountPlural', { count: column.heats.length })}
            </span>
          </header>

          <div className="champ-bracket-col__heats">
            {column.heats.map((heat) => {
              const running = heatIsRunning(heat)
              const done = heatIsFinished(heat)
              const locked = Boolean(heat.bracketLocked)
              const summary = done ? getAdvancementSummary(heat, heatSize) : []
              const slots = slotNames(heat, getAthleteName, c.tbd)
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
                      {heatStatusLabel(heat, c)}
                    </span>
                  </div>

                  <ul className="champ-bracket-slots">
                    {slots.map((name, index) => (
                      <li
                        key={`${heat.id}-${index}`}
                        className={name === c.tbd ? 'champ-bracket-slots__tbd' : undefined}
                      >
                        {name}
                      </li>
                    ))}
                  </ul>

                  {locked ? (
                    <p className="champ-bracket-heat__hint muted">{c.winnersFromPrevious}</p>
                  ) : (
                    <p className="champ-bracket-heat__hint muted">
                      {t('ui.championship.heatDurationAdvance', {
                        minutes: heat.durationMinutes,
                        count: heat.advancesCount ?? 1,
                      })}
                    </p>
                  )}

                  {done && summary.length > 0 ? (
                    <p className="champ-bracket-heat__advance">
                      {c.through}{' '}
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
