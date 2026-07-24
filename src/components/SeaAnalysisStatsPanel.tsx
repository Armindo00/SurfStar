import { useMemo, useState } from 'react'
import { useApp } from '../AppContext'
import { computeSeaAnalysisStats } from '../seaAnalysisStats'
import { ConfirmDeleteModal } from './ConfirmDeleteModal'
import { RecordRowActions } from './RecordRowActions'
import { SeaObservationEditModal } from './SeaObservationEditModal'
import {
  SEA_PEAK_LABELS,
  SEA_PEAKS,
  SEA_WAVE_TYPE_LABELS,
  SEA_WAVE_TYPES,
  type SeaAnalysisLog,
  type SeaAnalysisState,
} from '../types'

type Props = {
  state: SeaAnalysisState
}

export function SeaAnalysisStatsPanel({ state }: Props) {
  const { updateSeaAnalysisLog, deleteSeaAnalysisLog } = useApp()
  const [editLog, setEditLog] = useState<SeaAnalysisLog | null>(null)
  const [deleteLogId, setDeleteLogId] = useState<string | null>(null)

  const stats = useMemo(() => computeSeaAnalysisStats(state), [state])
  const rec = stats.recommendation

  const deleteLog = deleteLogId ? state.logs.find((l) => l.id === deleteLogId) : undefined

  const topIntervalRows = stats.intervals
    .filter((r) => r.count >= 2 && r.averageGap)
    .sort((a, b) => b.count - a.count)

  return (
    <div className="sea-stats">
      <section className="sea-recommend">
        <h3 className="sea-recommend__title">Recommended peak</h3>
        {rec.recommended ? (
          <p className="sea-recommend__pick">{SEA_PEAK_LABELS[rec.recommended]}</p>
        ) : rec.tie && stats.totalObservations > 0 ? (
          <p className="sea-recommend__pick sea-recommend__pick--tie">Even match</p>
        ) : (
          <p className="muted sea-recommend__pick">—</p>
        )}
        <p className="muted sea-recommend__summary">{rec.summary}</p>
        <p className="sea-recommend__formula muted">
          Score = 55% weighted wave count (set ×4, large int. ×3, small int. ×2, small ×1) · 45%
          weighted arrival rate (shorter gaps between same-type waves score higher)
        </p>
        <div className="table-wrap">
          <table className="data-table sea-stats-table">
            <thead>
              <tr>
                <th>Peak</th>
                <th>Waves</th>
                <th>Wave score</th>
                <th>Arrival score</th>
                <th>Avg. gap</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {SEA_PEAKS.map((peak) => {
                const row = rec.scores[peak]
                const isRec = rec.recommended === peak
                return (
                  <tr key={peak} className={isRec ? 'sea-recommend-row--on' : undefined}>
                    <td>
                      <strong>{SEA_PEAK_LABELS[peak]}</strong>
                      {isRec ? <span className="sea-recommend-tag">Best</span> : null}
                    </td>
                    <td>{row.observationCount}</td>
                    <td>{row.weightedWaveScore}</td>
                    <td>{row.weightedArrivalScore}</td>
                    <td>{row.meanIntervalLabel ?? '—'}</td>
                    <td>
                      <strong>{row.compositeScore}</strong>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="kpi-grid kpi-grid--sea">
        <article className="kpi-card">
          <span className="kpi-card__label">Observations</span>
          <strong className="kpi-card__value">{stats.totalObservations}</strong>
        </article>
        <article className="kpi-card kpi-card--accent">
          <span className="kpi-card__label">Peak 1</span>
          <strong className="kpi-card__value">{stats.peakTotals['peak-1']}</strong>
        </article>
        <article className="kpi-card kpi-card--accent">
          <span className="kpi-card__label">Peak 2</span>
          <strong className="kpi-card__value">{stats.peakTotals['peak-2']}</strong>
        </article>
      </div>

      <div className="table-wrap">
        <table className="data-table sea-stats-table">
          <thead>
            <tr>
              <th>Wave type</th>
              <th>{SEA_PEAK_LABELS['peak-1']}</th>
              <th>{SEA_PEAK_LABELS['peak-2']}</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {SEA_WAVE_TYPES.map((type) => (
              <tr key={type}>
                <td>{SEA_WAVE_TYPE_LABELS[type]}</td>
                <td>{stats.counts['peak-1'][type]}</td>
                <td>{stats.counts['peak-2'][type]}</td>
                <td>
                  <strong>{stats.typeTotals[type]}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="sea-stats__title">Time between observations</h3>
      <p className="muted sea-stats__sub">Average wait until the same type appears again on each peak.</p>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Peak</th>
              <th>Type</th>
              <th>Count</th>
              <th>Avg. interval</th>
              <th>Gaps (mm:ss)</th>
            </tr>
          </thead>
          <tbody>
            {topIntervalRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="muted">
                  Log at least 2 of the same type on a peak to see intervals.
                </td>
              </tr>
            ) : (
              topIntervalRows.map((row) => (
                <tr key={`${row.peak}-${row.waveType}`}>
                  <td>{SEA_PEAK_LABELS[row.peak]}</td>
                  <td>{SEA_WAVE_TYPE_LABELS[row.waveType]}</td>
                  <td>{row.count}</td>
                  <td>{row.averageGap ?? '—'}</td>
                  <td>{row.gaps.length ? row.gaps.join(', ') : '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {stats.timeline.length > 0 ? (
        <>
          <h3 className="sea-stats__title">Timeline</h3>
          <p className="muted sea-stats__sub">Edit or delete entries logged by mistake.</p>
          <ul className="sea-timeline">
            {stats.timeline.map((row) => (
              <li key={row.id} className="sea-timeline__row">
                <span className="sea-timeline__time">{row.elapsed}</span>
                <span>
                  {SEA_PEAK_LABELS[row.peak]} · {SEA_WAVE_TYPE_LABELS[row.waveType]}
                </span>
                <RecordRowActions
                  onEdit={() => {
                    const log = state.logs.find((l) => l.id === row.id)
                    if (log) setEditLog(log)
                  }}
                  onDelete={() => setDeleteLogId(row.id)}
                />
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {editLog ? (
        <SeaObservationEditModal
          peak={editLog.peak}
          waveType={editLog.waveType}
          onClose={() => setEditLog(null)}
          onSave={(peak, waveType) => {
            updateSeaAnalysisLog(editLog.id, peak, waveType)
            setEditLog(null)
          }}
        />
      ) : null}

      {deleteLog ? (
        <ConfirmDeleteModal
          title="Delete observation?"
          message={`Remove ${SEA_WAVE_TYPE_LABELS[deleteLog.waveType]} at ${SEA_PEAK_LABELS[deleteLog.peak]}? This cannot be undone.`}
          onConfirm={() => {
            deleteSeaAnalysisLog(deleteLog.id)
            setDeleteLogId(null)
          }}
          onCancel={() => setDeleteLogId(null)}
        />
      ) : null}
    </div>
  )
}
