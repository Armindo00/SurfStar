import { useMemo, useState } from 'react'
import { useI18n } from '../i18n'
import { useApp } from '../AppContext'
import { waveHasLoggedAttempts } from '../sessionStats'
import type { ComboAttemptLog, ManeuverLog, TrainingMode } from '../types'
import { formatComboEntry, formatCustomEntry, formatManeuverEntry } from '../waveDisplay'
import { ComboEditModal } from './ComboEditModal'
import { ConfirmDeleteModal } from './ConfirmDeleteModal'
import { ManeuverEditModal } from './ManeuverEditModal'
import { RecordRowActions } from './RecordRowActions'

type Props = {
  mode: TrainingMode
}

export function WaveRegisterSummary({ mode }: Props) {
  const { t, messages } = useI18n()
  const r = messages.session.register
  const {
    activeSession,
    activeWaveId,
    updateManeuverLog,
    deleteManeuverLog,
    updateComboAttempt,
    deleteComboAttempt,
    deleteCustomAttempt,
  } = useApp()

  const [editManeuver, setEditManeuver] = useState<ManeuverLog | null>(null)
  const [deleteManeuverId, setDeleteManeuverId] = useState<string | null>(null)
  const [editCombo, setEditCombo] = useState<ComboAttemptLog | null>(null)
  const [deleteComboId, setDeleteComboId] = useState<string | null>(null)
  const [deleteCustomId, setDeleteCustomId] = useState<string | null>(null)

  const openWave = useMemo(
    () => activeSession?.waves.find((w) => w.id === activeWaveId),
    [activeSession?.waves, activeWaveId],
  )

  if (!activeWaveId || !openWave) return null

  const isCombo = mode === 'combos'
  const isCustom = mode === 'custom'
  const entries = isCombo
    ? (openWave.comboAttempts ?? [])
    : isCustom
      ? (openWave.customAttempts ?? [])
      : openWave.maneuvers
  const hasEntries = waveHasLoggedAttempts(openWave, mode)

  const waveId = openWave.id

  return (
    <section className="wave-summary" aria-live="polite">
      <header className="wave-summary__head">
        <span className="wave-summary__dot" aria-hidden="true" />
        <div>
          <p className="wave-summary__eyebrow">{r.currentWave}</p>
          <h3 className="wave-summary__title">
            {hasEntries ? t('session.register.loggedCount', { count: entries.length }) : r.recording}
          </h3>
        </div>
      </header>

      {!hasEntries ? (
        <p className="wave-summary__empty muted">{r.nothingLoggedYet}</p>
      ) : (
        <ol className="wave-summary__list">
          {isCombo
            ? (openWave.comboAttempts ?? []).map((log) => (
                <li key={log.id} className="wave-summary__item wave-summary__item--row">
                  <span>{formatComboEntry(log)}</span>
                  <RecordRowActions
                    onEdit={() => setEditCombo(log)}
                    onDelete={() => setDeleteComboId(log.id)}
                  />
                </li>
              ))
            : isCustom
              ? (openWave.customAttempts ?? []).map((log) => (
                  <li key={log.id} className="wave-summary__item wave-summary__item--row">
                    <span>{formatCustomEntry(log, activeSession?.customTemplateSnapshot)}</span>
                    <RecordRowActions onDelete={() => setDeleteCustomId(log.id)} />
                  </li>
                ))
              : openWave.maneuvers.map((log) => (
                <li key={log.id} className="wave-summary__item wave-summary__item--row">
                  <span>{formatManeuverEntry(log)}</span>
                  <RecordRowActions
                    onEdit={() => setEditManeuver(log)}
                    onDelete={() => setDeleteManeuverId(log.id)}
                  />
                </li>
              ))}
        </ol>
      )}

      {editManeuver ? (
        <ManeuverEditModal
          log={editManeuver}
          onClose={() => setEditManeuver(null)}
          onSave={(patch) => {
            updateManeuverLog(waveId, editManeuver.id, patch)
            setEditManeuver(null)
          }}
        />
      ) : null}

      {deleteManeuverId ? (
        <ConfirmDeleteModal
          title={r.deleteManeuver}
          message={r.removeFromCurrentWave}
          onConfirm={() => {
            deleteManeuverLog(waveId, deleteManeuverId)
            setDeleteManeuverId(null)
          }}
          onCancel={() => setDeleteManeuverId(null)}
        />
      ) : null}

      {editCombo ? (
        <ComboEditModal
          log={editCombo}
          onClose={() => setEditCombo(null)}
          onSave={(patch) => {
            updateComboAttempt(waveId, editCombo.id, patch)
            setEditCombo(null)
          }}
        />
      ) : null}

      {deleteComboId ? (
        <ConfirmDeleteModal
          title={r.deleteComboAttempt}
          message={r.removeFromCurrentWave}
          onConfirm={() => {
            deleteComboAttempt(waveId, deleteComboId)
            setDeleteComboId(null)
          }}
          onCancel={() => setDeleteComboId(null)}
        />
      ) : null}

      {deleteCustomId ? (
        <ConfirmDeleteModal
          title={r.deleteAttempt}
          message={r.removeFromCurrentWave}
          onConfirm={() => {
            deleteCustomAttempt(waveId, deleteCustomId)
            setDeleteCustomId(null)
          }}
          onCancel={() => setDeleteCustomId(null)}
        />
      ) : null}
    </section>
  )
}
