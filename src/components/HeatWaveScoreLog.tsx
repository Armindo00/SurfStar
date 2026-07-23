import { useMemo, useState } from 'react'
import { useApp } from '../AppContext'
import { formatHeatScore, formatWaveScoreCompact } from '../heatUtils'
import type { HeatRecord } from '../types'
import { ConfirmDeleteModal } from './ConfirmDeleteModal'
import { HeatScoreModal } from './HeatScoreModal'
import { RecordRowActions } from './RecordRowActions'

type Props = {
  heat: HeatRecord
}

export function HeatWaveScoreLog({ heat }: Props) {
  const { getAthlete, updateHeatWaveScore, deleteHeatWaveScore } = useApp()
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const rows = useMemo(
    () =>
      [...heat.waveScores].sort((a, b) => a.at.localeCompare(b.at)).map((score, index) => ({
        ...score,
        waveNumber: index + 1,
      })),
    [heat.waveScores],
  )

  const editScore = editId ? heat.waveScores.find((w) => w.id === editId) : undefined
  const deleteScore = deleteId ? heat.waveScores.find((w) => w.id === deleteId) : undefined

  if (rows.length === 0) return null

  return (
    <>
      <h3 className="heat-leaderboard__title">Wave log</h3>
      <p className="muted heat-leaderboard__sub">Edit or remove individual scores if logged by mistake.</p>
      <ul className="sea-timeline heat-score-log">
        {rows.map((row) => {
          const name = getAthlete(row.athleteId)?.name ?? 'Athlete'
          const time = new Date(row.at).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
          return (
            <li key={row.id} className="heat-score-log__row">
              <span className="sea-timeline__time">{time}</span>
              <span className="heat-score-log__main">
                <strong>{name}</strong> · Wave {row.waveNumber} · {formatWaveScoreCompact(row.score)}
              </span>
              <RecordRowActions
                onEdit={() => setEditId(row.id)}
                onDelete={() => setDeleteId(row.id)}
              />
            </li>
          )
        })}
      </ul>

      {editScore ? (
        <HeatScoreModal
          athleteName={getAthlete(editScore.athleteId)?.name ?? 'Athlete'}
          initialScore={editScore.score}
          title="Edit wave score"
          onClose={() => setEditId(null)}
          onSave={(score) => {
            updateHeatWaveScore(heat.id, editScore.id, score)
            setEditId(null)
          }}
        />
      ) : null}

      {deleteScore ? (
        <ConfirmDeleteModal
          title="Delete wave score?"
          message={`Remove ${formatHeatScore(deleteScore.score)} for ${getAthlete(deleteScore.athleteId)?.name ?? 'athlete'}? This cannot be undone.`}
          onConfirm={() => {
            deleteHeatWaveScore(heat.id, deleteScore.id)
            setDeleteId(null)
          }}
          onCancel={() => setDeleteId(null)}
        />
      ) : null}
    </>
  )
}
