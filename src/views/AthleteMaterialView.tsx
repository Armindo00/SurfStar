import { useEffect, useMemo, useState } from 'react'
import { ScreenHeader } from '../components/ScreenHeader'
import { useApp } from '../AppContext'
import { useI18n } from '../i18n'
import { UNSEEN } from '../unseenDomains'
import { formatBoardSpecs } from '../materialUtils'
import type { AthleteBoard, AthleteFin } from '../types'

type BoardDraft = {
  name: string
  lengthFeet: string
  lengthInches: string
  widthInches: string
  thicknessInches: string
  volumeLiters: string
  notes: string
}

type FinDraft = {
  name: string
  size: string
  template: string
  notes: string
}

const emptyBoard = (): BoardDraft => ({
  name: '',
  lengthFeet: '',
  lengthInches: '',
  widthInches: '',
  thicknessInches: '',
  volumeLiters: '',
  notes: '',
})

const emptyFin = (): FinDraft => ({
  name: '',
  size: '',
  template: '',
  notes: '',
})

function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const num = Number(trimmed.replace(',', '.'))
  return Number.isFinite(num) ? num : null
}

export function AthleteMaterialView() {
  const { t } = useI18n()
  const {
    auth,
    athleteBoards,
    athleteFins,
    equipmentEvaluations,
    saveAthleteBoard,
    deleteAthleteBoard,
    saveAthleteFin,
    deleteAthleteFin,
    refreshAthleteEquipment,
    countUnseen,
    setView,
  } = useApp()

  useEffect(() => {
    if (auth?.role === 'atleta') void refreshAthleteEquipment(auth.athleteId)
  }, [auth, refreshAthleteEquipment])

  const equipmentReviewItems = useMemo(
    () =>
      auth?.role === 'atleta'
        ? equipmentEvaluations.filter((item) => item.athleteId === auth.athleteId)
        : [],
    [auth, equipmentEvaluations],
  )

  const unseenEquipmentReviews = countUnseen(UNSEEN.athleteEquipmentReviews, equipmentReviewItems)

  const [boardDraft, setBoardDraft] = useState<BoardDraft>(emptyBoard)
  const [finDraft, setFinDraft] = useState<FinDraft>(emptyFin)
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null)
  const [editingFinId, setEditingFinId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const resetBoardForm = () => {
    setBoardDraft(emptyBoard())
    setEditingBoardId(null)
  }

  const resetFinForm = () => {
    setFinDraft(emptyFin())
    setEditingFinId(null)
  }

  const startEditBoard = (board: AthleteBoard) => {
    setEditingBoardId(board.id)
    setBoardDraft({
      name: board.name,
      lengthFeet: board.lengthFeet?.toString() ?? '',
      lengthInches: board.lengthInches?.toString() ?? '',
      widthInches: board.widthInches?.toString() ?? '',
      thicknessInches: board.thicknessInches?.toString() ?? '',
      volumeLiters: board.volumeLiters?.toString() ?? '',
      notes: board.notes ?? '',
    })
  }

  const startEditFin = (fin: AthleteFin) => {
    setEditingFinId(fin.id)
    setFinDraft({
      name: fin.name,
      size: fin.size ?? '',
      template: fin.template ?? '',
      notes: fin.notes ?? '',
    })
  }

  const submitBoard = async () => {
    setError('')
    if (!boardDraft.name.trim()) {
      setError('Give your board a name.')
      return
    }
    setBusy(true)
    try {
      const result = await saveAthleteBoard({
        id: editingBoardId ?? undefined,
        name: boardDraft.name,
        lengthFeet: parseOptionalNumber(boardDraft.lengthFeet),
        lengthInches: parseOptionalNumber(boardDraft.lengthInches),
        widthInches: parseOptionalNumber(boardDraft.widthInches),
        thicknessInches: parseOptionalNumber(boardDraft.thicknessInches),
        volumeLiters: parseOptionalNumber(boardDraft.volumeLiters),
        notes: boardDraft.notes.trim() || null,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      resetBoardForm()
    } finally {
      setBusy(false)
    }
  }

  const submitFin = async () => {
    setError('')
    if (!finDraft.name.trim()) {
      setError('Give your fins a name.')
      return
    }
    setBusy(true)
    try {
      const result = await saveAthleteFin({
        id: editingFinId ?? undefined,
        name: finDraft.name,
        size: finDraft.size.trim() || null,
        template: finDraft.template.trim() || null,
        notes: finDraft.notes.trim() || null,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      resetFinForm()
    } finally {
      setBusy(false)
    }
  }

  const removeBoard = async (boardId: string) => {
    setBusy(true)
    try {
      await deleteAthleteBoard(boardId)
      if (editingBoardId === boardId) resetBoardForm()
    } finally {
      setBusy(false)
    }
  }

  const removeFin = async (finId: string) => {
    setBusy(true)
    try {
      await deleteAthleteFin(finId)
      if (editingFinId === finId) resetFinForm()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="ss-flow">
      <ScreenHeader title={t('nav.myEquipment')} onBack={() => setView('athlete-portal')} />

      <div className="ss-card material-section material-section--cta">
        <h2 className="page-title">{t('ui.material.coachReviews')}</h2>
        <p className="muted">
          See speed, control and release ratings — and comments — that your coaches left on your
          boards and fins.
        </p>
        <button
          type="button"
          className="btn btn--secondary btn--block"
          onClick={() => setView('athlete-equipment-reviews')}
        >
          {unseenEquipmentReviews > 0
            ? `View coach reviews (${unseenEquipmentReviews} new)`
            : equipmentReviewItems.length > 0
              ? `View coach reviews (${equipmentReviewItems.length})`
              : 'View coach reviews'}
        </button>
      </div>

      <div className="ss-card material-section">
        <h2 className="page-title">{t('ui.material.boardQuiver')}</h2>
        <p className="muted">{t('ui.material.boardQuiverHint')}</p>

        <div className="material-form-grid">
          <label className="field field--pro">
            <span>{t('ui.material.boardName')}</span>
            <input
              value={boardDraft.name}
              onChange={(e) => setBoardDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder={t('ui.material.boardNamePlaceholder')}
            />
          </label>
          <label className="field field--pro">
            <span>{t('ui.material.boardLengthFeet')}</span>
            <input
              inputMode="numeric"
              value={boardDraft.lengthFeet}
              onChange={(e) => setBoardDraft((d) => ({ ...d, lengthFeet: e.target.value }))}
              placeholder="5"
            />
          </label>
          <label className="field field--pro">
            <span>{t('ui.material.boardLengthInches')}</span>
            <input
              inputMode="decimal"
              value={boardDraft.lengthInches}
              onChange={(e) => setBoardDraft((d) => ({ ...d, lengthInches: e.target.value }))}
              placeholder="8"
            />
          </label>
          <p className="muted material-form-grid__full material-form-hint">{t('ui.material.boardLengthHint')}</p>
          <label className="field field--pro">
            <span>{t('ui.material.boardWidth')}</span>
            <input
              inputMode="decimal"
              value={boardDraft.widthInches}
              onChange={(e) => setBoardDraft((d) => ({ ...d, widthInches: e.target.value }))}
              placeholder="19.25"
            />
          </label>
          <label className="field field--pro">
            <span>{t('ui.material.boardThickness')}</span>
            <input
              inputMode="decimal"
              value={boardDraft.thicknessInches}
              onChange={(e) => setBoardDraft((d) => ({ ...d, thicknessInches: e.target.value }))}
              placeholder="2.56"
            />
          </label>
          <label className="field field--pro">
            <span>{t('ui.material.boardVolume')}</span>
            <input
              inputMode="decimal"
              value={boardDraft.volumeLiters}
              onChange={(e) => setBoardDraft((d) => ({ ...d, volumeLiters: e.target.value }))}
              placeholder="28.5"
            />
          </label>
          <label className="field field--pro material-form-grid__full">
            <span>Notes</span>
            <textarea
              rows={2}
              value={boardDraft.notes}
              onChange={(e) => setBoardDraft((d) => ({ ...d, notes: e.target.value }))}
              placeholder="Wave type, setup, etc."
            />
          </label>
        </div>

        <div className="material-form-actions">
          <button type="button" className="btn btn--primary" disabled={busy} onClick={() => void submitBoard()}>
            {editingBoardId ? 'Save board' : 'Add board'}
          </button>
          {editingBoardId ? (
            <button type="button" className="btn btn--ghost" onClick={resetBoardForm}>
              Cancel
            </button>
          ) : null}
        </div>

        {athleteBoards.length === 0 ? (
          <p className="muted material-empty">You haven&apos;t added any boards yet.</p>
        ) : (
          <ul className="material-list">
            {athleteBoards.map((board) => (
              <li key={board.id} className="material-list__item">
                <div>
                  <strong>{board.name}</strong>
                  <p className="muted">{formatBoardSpecs(board) || 'No dimensions'}</p>
                  {board.notes ? <p className="material-list__notes">{board.notes}</p> : null}
                </div>
                <div className="material-list__actions">
                  <button type="button" className="btn btn--ghost btn--small" onClick={() => startEditBoard(board)}>
                    Edit
                  </button>
                  <button type="button" className="btn btn--ghost btn--small" onClick={() => void removeBoard(board.id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="ss-card material-section">
        <h2 className="page-title">{t('ui.material.fins')}</h2>
        <p className="muted">Template, size and notes for your fins.</p>

        <div className="material-form-grid">
          <label className="field field--pro">
            <span>Name / set</span>
            <input
              value={finDraft.name}
              onChange={(e) => setFinDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="e.g. FCS II Performer"
            />
          </label>
          <label className="field field--pro">
            <span>Size</span>
            <input
              value={finDraft.size}
              onChange={(e) => setFinDraft((d) => ({ ...d, size: e.target.value }))}
              placeholder="M / G3"
            />
          </label>
          <label className="field field--pro">
            <span>Template</span>
            <input
              value={finDraft.template}
              onChange={(e) => setFinDraft((d) => ({ ...d, template: e.target.value }))}
              placeholder="Thruster / Quad"
            />
          </label>
          <label className="field field--pro material-form-grid__full">
            <span>Notes</span>
            <textarea
              rows={2}
              value={finDraft.notes}
              onChange={(e) => setFinDraft((d) => ({ ...d, notes: e.target.value }))}
              placeholder="Cant, rake, etc."
            />
          </label>
        </div>

        <div className="material-form-actions">
          <button type="button" className="btn btn--primary" disabled={busy} onClick={() => void submitFin()}>
            {editingFinId ? 'Save fins' : 'Add fins'}
          </button>
          {editingFinId ? (
            <button type="button" className="btn btn--ghost" onClick={resetFinForm}>
              Cancel
            </button>
          ) : null}
        </div>

        {athleteFins.length === 0 ? (
          <p className="muted material-empty">You haven&apos;t added any fins yet.</p>
        ) : (
          <ul className="material-list">
            {athleteFins.map((fin) => (
              <li key={fin.id} className="material-list__item">
                <div>
                  <strong>{fin.name}</strong>
                  <p className="muted">
                    {[fin.template, fin.size].filter(Boolean).join(' · ') || 'No details'}
                  </p>
                  {fin.notes ? <p className="material-list__notes">{fin.notes}</p> : null}
                </div>
                <div className="material-list__actions">
                  <button type="button" className="btn btn--ghost btn--small" onClick={() => startEditFin(fin)}>
                    Edit
                  </button>
                  <button type="button" className="btn btn--ghost btn--small" onClick={() => void removeFin(fin.id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error ? <p className="login-error">{error}</p> : null}
    </div>
  )
}
