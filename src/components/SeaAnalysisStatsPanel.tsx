import { useMemo, useState } from 'react'
import { useApp } from '../AppContext'
import { useI18n } from '../i18n'
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
  readOnly?: boolean
  /** Session end time — freezes scores for completed sessions saved without seaAnalysis.endedAt */
  frozenAt?: string | null
}

export function SeaAnalysisStatsPanel({ state, readOnly = false, frozenAt = null }: Props) {
  const { updateSeaAnalysisLog, deleteSeaAnalysisLog } = useApp()
  const { t, messages } = useI18n()
  const s = messages.ui.seaAnalysis as Record<string, string>
  const [editLog, setEditLog] = useState<SeaAnalysisLog | null>(null)
  const [deleteLogId, setDeleteLogId] = useState<string | null>(null)

  const stats = useMemo(
    () => computeSeaAnalysisStats(state, { frozenAt }),
    [state, frozenAt],
  )
  const rec = stats.recommendation

  const deleteLog = deleteLogId ? state.logs.find((l) => l.id === deleteLogId) : undefined

  const topIntervalRows = stats.intervals
    .filter((r) => r.count >= 2 && r.averageGap)
    .sort((a, b) => b.count - a.count)

  return (
    <div className="sea-stats">
      <section className="sea-recommend">
        <h3 className="sea-recommend__title">{s.recommendedPeak}</h3>
        {rec.recommended ? (
          <p className="sea-recommend__pick">{SEA_PEAK_LABELS[rec.recommended]}</p>
        ) : rec.tie && stats.totalObservations > 0 ? (
          <p className="sea-recommend__pick sea-recommend__pick--tie">{s.evenMatch}</p>
        ) : (
          <p className="muted sea-recommend__pick">—</p>
        )}
        <p className="muted sea-recommend__summary">{rec.summary}</p>
        <p className="sea-recommend__formula muted">{s.scoreFormula}</p>
        <div className="table-wrap">
          <table className="data-table sea-stats-table">
            <thead>
              <tr>
                <th>{s.peak}</th>
                <th>{t('ui.stats.waves')}</th>
                <th>{s.waveScore}</th>
                <th>{s.arrivalScore}</th>
                <th>{s.avgGap}</th>
                <th>{s.total}</th>
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
                      {isRec ? <span className="sea-recommend-tag">{s.best}</span> : null}
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
          <span className="kpi-card__label">{s.observations}</span>
          <strong className="kpi-card__value">{stats.totalObservations}</strong>
        </article>
        <article className="kpi-card kpi-card--accent">
          <span className="kpi-card__label">{SEA_PEAK_LABELS['peak-1']}</span>
          <strong className="kpi-card__value">{stats.peakTotals['peak-1']}</strong>
        </article>
        <article className="kpi-card kpi-card--accent">
          <span className="kpi-card__label">{SEA_PEAK_LABELS['peak-2']}</span>
          <strong className="kpi-card__value">{stats.peakTotals['peak-2']}</strong>
        </article>
      </div>

      <div className="table-wrap">
        <table className="data-table sea-stats-table">
          <thead>
            <tr>
              <th>{s.waveType}</th>
              <th>{SEA_PEAK_LABELS['peak-1']}</th>
              <th>{SEA_PEAK_LABELS['peak-2']}</th>
              <th>{s.total}</th>
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

      <h3 className="sea-stats__title">{s.timeBetweenObservations}</h3>
      <p className="muted sea-stats__sub">{s.timeBetweenObsSub}</p>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>{s.peak}</th>
              <th>{s.type}</th>
              <th>{s.count}</th>
              <th>{s.avgInterval}</th>
              <th>{s.gapsHeader}</th>
            </tr>
          </thead>
          <tbody>
            {topIntervalRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="muted">
                  {s.intervalsEmpty}
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
          <h3 className="sea-stats__title">{s.timeline}</h3>
          {!readOnly ? (
            <p className="muted sea-stats__sub">{s.timelineEditHint}</p>
          ) : null}
          <ul className="sea-timeline">
            {stats.timeline.map((row) => (
              <li key={row.id} className="sea-timeline__row">
                <span className="sea-timeline__time">{row.elapsed}</span>
                <span>
                  {SEA_PEAK_LABELS[row.peak]} · {SEA_WAVE_TYPE_LABELS[row.waveType]}
                </span>
                {!readOnly ? (
                  <RecordRowActions
                    onEdit={() => {
                      const log = state.logs.find((l) => l.id === row.id)
                      if (log) setEditLog(log)
                    }}
                    onDelete={() => setDeleteLogId(row.id)}
                  />
                ) : null}
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
          title={s.deleteObservation}
          message={t('ui.seaAnalysis.deleteObservationMessage', {
            waveType: SEA_WAVE_TYPE_LABELS[deleteLog.waveType],
            peak: SEA_PEAK_LABELS[deleteLog.peak],
          })}
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
