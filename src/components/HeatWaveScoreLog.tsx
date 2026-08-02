import { useMemo, useState } from 'react'
import { useApp } from '../AppContext'
import { formatAppTime } from '../dateFormat'
import { formatHeatScore, formatWaveScoreCompact } from '../heatUtils'
import { useI18n } from '../i18n'
import type { HeatRecord } from '../types'
import { ConfirmDeleteModal } from './ConfirmDeleteModal'
import { HeatScoreModal } from './HeatScoreModal'
import { RecordRowActions } from './RecordRowActions'

type Props = {
  heat: HeatRecord
}

export function HeatWaveScoreLog({ heat }: Props) {
  const { getAthlete, updateHeatWaveScore, deleteHeatWaveScore } = useApp()
  const { t, messages } = useI18n()
  const h = messages.session.heat as Record<string, string>
  const r = messages.session.register as Record<string, string>
  const athleteFallback = messages.roles.athlete

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
      <h3 className="heat-leaderboard__title">{h.waveLog}</h3>
      <p className="muted heat-leaderboard__sub">{h.waveLogHint}</p>
      <ul className="sea-timeline heat-score-log">
        {rows.map((row) => {
          const name = getAthlete(row.athleteId)?.name ?? athleteFallback
          const time = formatAppTime(row.at, {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
          return (
            <li key={row.id} className="heat-score-log__row">
              <span className="sea-timeline__time">{time}</span>
              <span className="heat-score-log__main">
                {t('session.heat.waveLogEntry', {
                  name,
                  number: row.waveNumber,
                  score: formatWaveScoreCompact(row.score),
                })}
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
          athleteName={getAthlete(editScore.athleteId)?.name ?? athleteFallback}
          initialScore={editScore.score}
          title={r.editWaveScore}
          onClose={() => setEditId(null)}
          onSave={(score) => {
            updateHeatWaveScore(heat.id, editScore.id, score)
            setEditId(null)
          }}
        />
      ) : null}

      {deleteScore ? (
        <ConfirmDeleteModal
          title={r.deleteWaveScore}
          message={t('session.heat.deleteWaveScoreMessage', {
            score: formatHeatScore(deleteScore.score),
            name: getAthlete(deleteScore.athleteId)?.name ?? athleteFallback,
          })}
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
