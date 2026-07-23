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
import { HEAT_INTERFERENCE_LABELS, type HeatRecord } from '../types'

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

export function HeatResultsTable({ heat, getAthleteName }: Props) {
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
          2 best waves
        </span>
        <span className="heat-results-legend__item heat-results-legend__item--int">
          Interference
        </span>
      </div>
      <div className="table-wrap">
        <table className="data-table heat-results-table">
          <thead>
            <tr>
              <th>Surfer</th>
              {Array.from({ length: waveColumns }, (_, i) => (
                <th key={i} className="heat-results-table__wave-head">
                  {i + 1}
                </th>
              ))}
              <th>Total</th>
            </tr>
            <tr className="heat-results-table__subhead">
              <th aria-hidden="true" />
              {Array.from({ length: waveColumns }, (_, i) => (
                <th key={i}>Wave {i + 1}</th>
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
                      {HEAT_INTERFERENCE_LABELS[row.interference]}
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
                          INT → {formatWaveScoreCompact(breakdown.rawSecondBest / 2)}
                        </span>
                      ) : null}
                      {state === 'int-drop' ? (
                        <span className="heat-cell__int">INT — dropped</span>
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
