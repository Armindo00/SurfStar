import type { LevelSuccessStats } from '../sessionStats'
import { LEVELS } from '../sessionStats'
import type { ManeuverLevel } from '../types'

export function levelLabelEn(level: ManeuverLevel) {
  return level === 'estrela' ? 'Star ★' : `Level ${level}`
}

export function findPredominantSuccessLevel(
  byLevel: Record<ManeuverLevel, LevelSuccessStats>,
): ManeuverLevel | null {
  let winner: ManeuverLevel | null = null
  let bestSuccesses = -1
  let bestRate = -1

  for (const lvl of LEVELS) {
    const row = byLevel[lvl]
    if (row.successes === 0) continue
    if (
      row.successes > bestSuccesses ||
      (row.successes === bestSuccesses && row.rate > bestRate)
    ) {
      bestSuccesses = row.successes
      bestRate = row.rate
      winner = lvl
    }
  }

  return winner
}

type Props = {
  byLevel: Record<ManeuverLevel, LevelSuccessStats>
}

export function ManeuverLevelSuccessChart({ byLevel }: Props) {
  const predominant = findPredominantSuccessLevel(byLevel)
  const maxSuccesses = Math.max(...LEVELS.map((lvl) => byLevel[lvl].successes), 1)
  const totalSuccesses = LEVELS.reduce((sum, lvl) => sum + byLevel[lvl].successes, 0)

  if (totalSuccesses === 0) {
    return (
      <p className="level-chart__empty muted">No successful attempts at any level yet.</p>
    )
  }

  return (
    <div className="level-chart">
      {predominant !== null ? (
        <p className="level-chart__lead">
          Strongest level:{' '}
          <strong className="level-chart__highlight">{levelLabelEn(predominant)}</strong>
          <span className="muted">
            {' '}
            · {byLevel[predominant].successes} success
            {byLevel[predominant].successes === 1 ? '' : 'es'} ({byLevel[predominant].rate}%)
          </span>
        </p>
      ) : null}

      <div className="level-chart__bars" role="img" aria-label="Successes by level">
        {LEVELS.map((lvl) => {
          const row = byLevel[lvl]
          const width = row.successes ? (row.successes / maxSuccesses) * 100 : 0
          const isTop = lvl === predominant

          return (
            <div
              key={String(lvl)}
              className={isTop ? 'level-chart__row level-chart__row--top' : 'level-chart__row'}
            >
              <span className="level-chart__label">{levelLabelEn(lvl)}</span>
              <div className="level-chart__track">
                <div
                  className={
                    isTop ? 'level-chart__fill level-chart__fill--top' : 'level-chart__fill'
                  }
                  style={{ width: `${width}%` }}
                />
              </div>
              <span className="level-chart__meta">
                <strong>{row.successes}</strong>
                <small>
                  / {row.attempts} · {row.rate}%
                </small>
              </span>
            </div>
          )
        })}
      </div>
      <p className="level-chart__hint muted">Bar length = number of successful attempts at that level.</p>
    </div>
  )
}
