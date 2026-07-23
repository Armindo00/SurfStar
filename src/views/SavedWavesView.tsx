import { useState } from 'react'
import { useApp } from '../AppContext'
import { ScreenHeader } from '../components/ScreenHeader'
import { ComboEditModal } from '../components/ComboEditModal'
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal'
import { ManeuverEditModal } from '../components/ManeuverEditModal'
import { RecordRowActions } from '../components/RecordRowActions'
import type { ComboAttemptLog, ManeuverLog } from '../types'
import { formatComboEntry, formatManeuverEntry } from '../waveDisplay'

export function SavedWavesView() {
  const {
    activeSession,
    activeAthleteId,
    setView,
    getAthlete,
    updateManeuverLog,
    deleteManeuverLog,
    updateComboAttempt,
    deleteComboAttempt,
    deleteWaveRecord,
  } = useApp()

  const [editManeuver, setEditManeuver] = useState<{ waveId: string; log: ManeuverLog } | null>(
    null,
  )
  const [deleteManeuver, setDeleteManeuver] = useState<{ waveId: string; logId: string } | null>(
    null,
  )
  const [editCombo, setEditCombo] = useState<{ waveId: string; log: ComboAttemptLog } | null>(null)
  const [deleteCombo, setDeleteCombo] = useState<{ waveId: string; logId: string } | null>(null)
  const [deleteWaveId, setDeleteWaveId] = useState<string | null>(null)

  const backView = activeSession?.mode === 'combos' ? 'combos' : 'training'

  const waves =
    activeSession?.waves.filter((w) => !activeAthleteId || w.athleteId === activeAthleteId) ?? []

  const isCombo = activeSession?.mode === 'combos'

  return (
    <div className="ss-flow">
      <ScreenHeader title="Saved waves" onBack={() => setView(backView)} />
      <div className="ss-card">
        {!activeSession || waves.length === 0 ? (
          <p className="muted">No waves recorded in this session yet.</p>
        ) : (
          <ul className="wave-list wave-list--editable">
            {waves.map((w) => {
              const comboCount = w.comboAttempts?.length ?? 0
              const maneuverCount = w.maneuvers.length

              return (
                <li key={w.id} className="wave-list__block">
                  <div className="wave-list__head">
                    <div>
                      <strong>{getAthlete(w.athleteId)?.name ?? 'Athlete'}</strong>
                      <span>
                        {new Date(w.startedAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        · {w.hasPotential ? 'With potential' : 'No potential'}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn--ghost btn--small record-row-actions__delete"
                      onClick={() => setDeleteWaveId(w.id)}
                    >
                      Delete wave
                    </button>
                  </div>

                  {isCombo && comboCount > 0 ? (
                    <ul className="wave-list__entries">
                      {(w.comboAttempts ?? []).map((c) => (
                        <li key={c.id} className="wave-list__entry">
                          <span>{formatComboEntry(c)}</span>
                          <RecordRowActions
                            onEdit={() => setEditCombo({ waveId: w.id, log: c })}
                            onDelete={() => setDeleteCombo({ waveId: w.id, logId: c.id })}
                          />
                        </li>
                      ))}
                    </ul>
                  ) : !isCombo && maneuverCount > 0 ? (
                    <ul className="wave-list__entries">
                      {w.maneuvers.map((m) => (
                        <li key={m.id} className="wave-list__entry">
                          <span>{formatManeuverEntry(m)}</span>
                          <RecordRowActions
                            onEdit={() => setEditManeuver({ waveId: w.id, log: m })}
                            onDelete={() => setDeleteManeuver({ waveId: w.id, logId: m.id })}
                          />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <small className="muted">No attempts logged</small>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {editManeuver ? (
        <ManeuverEditModal
          log={editManeuver.log}
          onClose={() => setEditManeuver(null)}
          onSave={(patch) => {
            updateManeuverLog(editManeuver.waveId, editManeuver.log.id, patch)
            setEditManeuver(null)
          }}
        />
      ) : null}

      {deleteManeuver ? (
        <ConfirmDeleteModal
          title="Delete maneuver?"
          message="Remove this entry from the saved wave?"
          onConfirm={() => {
            deleteManeuverLog(deleteManeuver.waveId, deleteManeuver.logId)
            setDeleteManeuver(null)
          }}
          onCancel={() => setDeleteManeuver(null)}
        />
      ) : null}

      {editCombo ? (
        <ComboEditModal
          log={editCombo.log}
          onClose={() => setEditCombo(null)}
          onSave={(patch) => {
            updateComboAttempt(editCombo.waveId, editCombo.log.id, patch)
            setEditCombo(null)
          }}
        />
      ) : null}

      {deleteCombo ? (
        <ConfirmDeleteModal
          title="Delete combo attempt?"
          message="Remove this entry from the saved wave?"
          onConfirm={() => {
            deleteComboAttempt(deleteCombo.waveId, deleteCombo.logId)
            setDeleteCombo(null)
          }}
          onCancel={() => setDeleteCombo(null)}
        />
      ) : null}

      {deleteWaveId ? (
        <ConfirmDeleteModal
          title="Delete entire wave?"
          message="This removes the wave and all entries logged on it."
          onConfirm={() => {
            deleteWaveRecord(deleteWaveId)
            setDeleteWaveId(null)
          }}
          onCancel={() => setDeleteWaveId(null)}
        />
      ) : null}
    </div>
  )
}
