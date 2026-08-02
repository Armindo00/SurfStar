import { useState } from 'react'
import { useI18n } from '../i18n'
import { useApp } from '../AppContext'
import { formatAppTime } from '../dateFormat'
import { ScreenHeader } from '../components/ScreenHeader'
import { ComboEditModal } from '../components/ComboEditModal'
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal'
import { ManeuverEditModal } from '../components/ManeuverEditModal'
import { RecordRowActions } from '../components/RecordRowActions'
import type { ComboAttemptLog, ManeuverLog } from '../types'
import { formatComboEntry, formatCustomEntry, formatManeuverEntry } from '../waveDisplay'

export function SavedWavesView() {
  const { t, messages } = useI18n()
  const r = messages.session.register
  const sw = messages.ui.savedWaves
  const {
    activeSession,
    activeAthleteId,
    setView,
    getAthlete,
    updateManeuverLog,
    deleteManeuverLog,
    updateComboAttempt,
    deleteComboAttempt,
    deleteCustomAttempt,
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
  const [deleteCustom, setDeleteCustom] = useState<{ waveId: string; logId: string } | null>(null)
  const [deleteWaveId, setDeleteWaveId] = useState<string | null>(null)

  const backView =
    activeSession?.mode === 'combos'
      ? 'combos'
      : activeSession?.mode === 'custom'
        ? 'custom'
        : 'training'

  const waves =
    activeSession?.waves.filter((w) => !activeAthleteId || w.athleteId === activeAthleteId) ?? []

  const isCombo = activeSession?.mode === 'combos'
  const isCustom = activeSession?.mode === 'custom'

  return (
    <div className="ss-flow">
      <ScreenHeader title={t('nav.savedWaves')} onBack={() => setView(backView)} />
      <div className="ss-card">
        {!activeSession || waves.length === 0 ? (
          <p className="muted">{sw.empty}</p>
        ) : (
          <ul className="wave-list wave-list--editable">
            {waves.map((w) => {
              const comboCount = w.comboAttempts?.length ?? 0
              const customCount = w.customAttempts?.length ?? 0
              const maneuverCount = w.maneuvers.length

              return (
                <li key={w.id} className="wave-list__block">
                  <div className="wave-list__head">
                    <div>
                      <strong>{getAthlete(w.athleteId)?.name ?? t('roles.athlete')}</strong>
                      <span>
                        {formatAppTime(w.startedAt, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        · {w.hasPotential ? sw.withPotential : sw.noPotential}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn--ghost btn--small record-row-actions__delete"
                      onClick={() => setDeleteWaveId(w.id)}
                    >
                      {sw.deleteWave}
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
                  ) : isCustom && customCount > 0 ? (
                    <ul className="wave-list__entries">
                      {(w.customAttempts ?? []).map((c) => (
                        <li key={c.id} className="wave-list__entry">
                          <span>{formatCustomEntry(c, activeSession?.customTemplateSnapshot)}</span>
                          <RecordRowActions
                            onDelete={() => setDeleteCustom({ waveId: w.id, logId: c.id })}
                          />
                        </li>
                      ))}
                    </ul>
                  ) : !isCombo && !isCustom && maneuverCount > 0 ? (
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
                    <small className="muted">{sw.noAttemptsLogged}</small>
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
          title={r.deleteManeuver}
          message={r.removeFromSavedWave}
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
          title={r.deleteComboAttempt}
          message={r.removeFromSavedWave}
          onConfirm={() => {
            deleteComboAttempt(deleteCombo.waveId, deleteCombo.logId)
            setDeleteCombo(null)
          }}
          onCancel={() => setDeleteCombo(null)}
        />
      ) : null}

      {deleteCustom ? (
        <ConfirmDeleteModal
          title={r.deleteAttempt}
          message={r.removeFromSavedWave}
          onConfirm={() => {
            deleteCustomAttempt(deleteCustom.waveId, deleteCustom.logId)
            setDeleteCustom(null)
          }}
          onCancel={() => setDeleteCustom(null)}
        />
      ) : null}

      {deleteWaveId ? (
        <ConfirmDeleteModal
          title={r.deleteEntireWave}
          message={r.deleteEntireWaveMessage}
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
