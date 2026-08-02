import { useMemo } from 'react'
import {
  formatHeatTotal,
  formatWaveScoreCompact,
  getHeatInterference,
  heatResultBreakdown,
  heatWaveCellState,
  maxWavesInHeat,
  wavesOrderedChronological,
} from '../heatUtils'
import { useI18n } from '../i18n'
import { type HeatInterferenceType, type HeatRecord } from '../types'

type Props = {
  heat: HeatRecord
  getAthleteName: (id: string) => string
}

function cellClass(state: ReturnType<typeof heatWaveCellState>): string {
  switch (state) {
    case 'counting':
      return 'heat-cell heat-cell--counting'
    case 'int-half':
      return 'heat-cell heat-cell--counting heat-cell--int-half'
    case 'int-drop':
      return 'heat-cell heat-cell--int-drop'
    default:
      return 'heat-cell'
  }
}

function mobileWaveClass(state: ReturnType<typeof heatWaveCellState>): string {
  switch (state) {
    case 'counting':
      return 'heat-results-card__wave heat-results-card__wave--counting'
    case 'int-half':
      return 'heat-results-card__wave heat-results-card__wave--counting heat-results-card__wave--int-half'
    case 'int-drop':
      return 'heat-results-card__wave heat-results-card__wave--int-drop'
    default:
      return 'heat-results-card__wave'
  }
}

function interferenceLabel(type: HeatInterferenceType, h: Record<string, string>): string {
  return type === 'half-second' ? h.interferenceHalfSecond : h.interferenceDropSecond
}

export function HeatResultsTable({ heat, getAthleteName }: Props) {
  const { t, messages } = useI18n()
  const h = messages.session.heat as Record<string, string>
  const waveColumns = maxWavesInHeat(heat)

  const rows = useMemo(() => {
    return [...heat.athleteIds]
      .map((id) => ({
        id,
        name: getAthleteName(id),
        waves: wavesOrderedChronological(heat, id),
        total: heatResultBreakdown(heat, id).total,
        interference: getHeatInterference(heat, id),
      }))
      .sort((a, b) => b.total - a.total)
  }, [heat, getAthleteName])

  if (waveColumns === 0) return null

  return (
    <div className="heat-results-wrap">
      <div className="heat-results-legend">
        <span className="heat-results-legend__item heat-results-legend__item--counting">
          {h.twoBestWaves}
        </span>
        <span className="heat-results-legend__item heat-results-legend__item--int">
          {h.interference}
        </span>
      </div>

      <div className="heat-results-mobile" aria-label={h.heatResultsBySurfer}>
        {rows.map((row, rank) => {
          const breakdown = heatResultBreakdown(heat, row.id)
          return (
            <article key={row.id} className="heat-results-card">
              <header className="heat-results-card__head">
                <div className="heat-results-card__identity">
                  <span className="heat-results-card__rank">#{rank + 1}</span>
                  <strong>{row.name}</strong>
                </div>
                <span className="heat-results-card__total">{formatHeatTotal(row.total)}</span>
              </header>
              {row.interference ? (
                <p className="heat-int-badge heat-results-card__int">
                  {interferenceLabel(row.interference, h)}
                </p>
              ) : null}
              <ul className="heat-results-card__waves">
                {row.waves.length === 0 ? (
                  <li className="heat-results-card__wave heat-results-card__wave--empty">{h.noWavesLogged}</li>
                ) : (
                  row.waves.map((wave, index) => {
                    const state = heatWaveCellState(heat, row.id, wave)
                    return (
                      <li key={wave.id} className={mobileWaveClass(state)}>
                        <span className="heat-results-card__wave-label">
                          {t('session.heat.waveNumber', { number: index + 1 })}
                        </span>
                        <span className="heat-results-card__wave-score">
                          {formatWaveScoreCompact(wave.score)}
                        </span>
                        {state === 'int-half' && breakdown.rawSecondBest !== null ? (
                          <span className="heat-results-card__wave-int">
                            {t('session.heat.intHalved', {
                              score: formatWaveScoreCompact(breakdown.rawSecondBest / 2),
                            })}
                          </span>
                        ) : null}
                        {state === 'int-drop' ? (
                          <span className="heat-results-card__wave-int">{h.intDropped}</span>
                        ) : null}
                      </li>
                    )
                  })
                )}
              </ul>
            </article>
          )
        })}
      </div>

      <div className="table-wrap heat-results-table-wrap">
        <table className="data-table heat-results-table">
          <thead>
            <tr>
              <th>{h.surfer}</th>
              {Array.from({ length: waveColumns }, (_, i) => (
                <th key={i} className="heat-results-table__wave-head">
                  {i + 1}
                </th>
              ))}
              <th>{h.totalLabel}</th>
            </tr>
            <tr className="heat-results-table__subhead">
              <th aria-hidden="true" />
              {Array.from({ length: waveColumns }, (_, i) => (
                <th key={i}>{t('session.heat.waveNumber', { number: i + 1 })}</th>
              ))}
              <th aria-hidden="true" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="heat-results-table__surfer">
                  <strong>{row.name}</strong>
                  {row.interference ? (
                    <span className="heat-int-badge heat-int-badge--table">
                      {interferenceLabel(row.interference, h)}
                    </span>
                  ) : null}
                </td>
                {Array.from({ length: waveColumns }, (_, i) => {
                  const wave = row.waves[i]
                  if (!wave) {
                    return (
                      <td key={i} className="heat-cell heat-cell--empty">
                        —
                      </td>
                    )
                  }
                  const state = heatWaveCellState(heat, row.id, wave)
                  const breakdown = heatResultBreakdown(heat, row.id)
                  return (
                    <td key={i} className={cellClass(state)}>
                      <span className="heat-cell__score">{formatWaveScoreCompact(wave.score)}</span>
                      {state === 'int-half' && breakdown.rawSecondBest !== null ? (
                        <span className="heat-cell__int">
                          {t('session.heat.intHalved', {
                            score: formatWaveScoreCompact(breakdown.rawSecondBest / 2),
                          })}
                        </span>
                      ) : null}
                      {state === 'int-drop' ? (
                        <span className="heat-cell__int">{h.intDropped}</span>
                      ) : null}
                    </td>
                  )
                })}
                <td className="heat-cell heat-cell--total">
                  <strong>{formatHeatTotal(row.total)}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
