import { useState } from 'react'
import { ScreenHeader } from '../components/ScreenHeader'
import { useApp } from '../AppContext'
import type { AthleteBoard, AthleteFin } from '../types'

type BoardDraft = {
  name: string
  lengthCm: string
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
  lengthCm: '',
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

function formatBoardSpecs(board: AthleteBoard): string {
  const parts: string[] = []
  if (board.lengthCm != null) parts.push(`${board.lengthCm} cm`)
  if (board.widthInches != null) parts.push(`${board.widthInches}"`)
  if (board.thicknessInches != null) parts.push(`${board.thicknessInches}"`)
  if (board.volumeLiters != null) parts.push(`${board.volumeLiters} L`)
  return parts.join(' · ')
}

export function AthleteMaterialView() {
  const {
    athleteBoards,
    athleteFins,
    saveAthleteBoard,
    deleteAthleteBoard,
    saveAthleteFin,
    deleteAthleteFin,
    setView,
  } = useApp()

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
      lengthCm: board.lengthCm?.toString() ?? '',
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
        lengthCm: parseOptionalNumber(boardDraft.lengthCm),
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
      <ScreenHeader title="O meu material" onBack={() => setView('athlete-portal')} />

      <div className="ss-card material-section">
        <h2 className="page-title">Quiver de pranchas</h2>
        <p className="muted">Regista tamanho, largura, espessura e litros — o teu treinador vê este quiver.</p>

        <div className="material-form-grid">
          <label className="field field--pro">
            <span>Nome / modelo</span>
            <input
              value={boardDraft.name}
              onChange={(e) => setBoardDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="Ex.: Pyzel Phantom"
            />
          </label>
          <label className="field field--pro">
            <span>Comprimento (cm)</span>
            <input
              inputMode="decimal"
              value={boardDraft.lengthCm}
              onChange={(e) => setBoardDraft((d) => ({ ...d, lengthCm: e.target.value }))}
              placeholder="186"
            />
          </label>
          <label className="field field--pro">
            <span>Largura (in)</span>
            <input
              inputMode="decimal"
              value={boardDraft.widthInches}
              onChange={(e) => setBoardDraft((d) => ({ ...d, widthInches: e.target.value }))}
              placeholder="19.25"
            />
          </label>
          <label className="field field--pro">
            <span>Espessura (in)</span>
            <input
              inputMode="decimal"
              value={boardDraft.thicknessInches}
              onChange={(e) => setBoardDraft((d) => ({ ...d, thicknessInches: e.target.value }))}
              placeholder="2.56"
            />
          </label>
          <label className="field field--pro">
            <span>Litros (L)</span>
            <input
              inputMode="decimal"
              value={boardDraft.volumeLiters}
              onChange={(e) => setBoardDraft((d) => ({ ...d, volumeLiters: e.target.value }))}
              placeholder="28.5"
            />
          </label>
          <label className="field field--pro material-form-grid__full">
            <span>Notas</span>
            <textarea
              rows={2}
              value={boardDraft.notes}
              onChange={(e) => setBoardDraft((d) => ({ ...d, notes: e.target.value }))}
              placeholder="Tipo de onda, setup, etc."
            />
          </label>
        </div>

        <div className="material-form-actions">
          <button type="button" className="btn btn--primary" disabled={busy} onClick={() => void submitBoard()}>
            {editingBoardId ? 'Guardar prancha' : 'Adicionar prancha'}
          </button>
          {editingBoardId ? (
            <button type="button" className="btn btn--ghost" onClick={resetBoardForm}>
              Cancelar
            </button>
          ) : null}
        </div>

        {athleteBoards.length === 0 ? (
          <p className="muted material-empty">Ainda não tens pranchas registadas.</p>
        ) : (
          <ul className="material-list">
            {athleteBoards.map((board) => (
              <li key={board.id} className="material-list__item">
                <div>
                  <strong>{board.name}</strong>
                  <p className="muted">{formatBoardSpecs(board) || 'Sem medidas'}</p>
                  {board.notes ? <p className="material-list__notes">{board.notes}</p> : null}
                </div>
                <div className="material-list__actions">
                  <button type="button" className="btn btn--ghost btn--small" onClick={() => startEditBoard(board)}>
                    Editar
                  </button>
                  <button type="button" className="btn btn--ghost btn--small" onClick={() => void removeBoard(board.id)}>
                    Apagar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="ss-card material-section">
        <h2 className="page-title">Quilhas</h2>
        <p className="muted">Template, tamanho e notas das tuas quilhas.</p>

        <div className="material-form-grid">
          <label className="field field--pro">
            <span>Nome / set</span>
            <input
              value={finDraft.name}
              onChange={(e) => setFinDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="Ex.: FCS II Performer"
            />
          </label>
          <label className="field field--pro">
            <span>Tamanho</span>
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
            <span>Notas</span>
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
            {editingFinId ? 'Guardar quilhas' : 'Adicionar quilhas'}
          </button>
          {editingFinId ? (
            <button type="button" className="btn btn--ghost" onClick={resetFinForm}>
              Cancelar
            </button>
          ) : null}
        </div>

        {athleteFins.length === 0 ? (
          <p className="muted material-empty">Ainda não tens quilhas registadas.</p>
        ) : (
          <ul className="material-list">
            {athleteFins.map((fin) => (
              <li key={fin.id} className="material-list__item">
                <div>
                  <strong>{fin.name}</strong>
                  <p className="muted">
                    {[fin.template, fin.size].filter(Boolean).join(' · ') || 'Sem detalhes'}
                  </p>
                  {fin.notes ? <p className="material-list__notes">{fin.notes}</p> : null}
                </div>
                <div className="material-list__actions">
                  <button type="button" className="btn btn--ghost btn--small" onClick={() => startEditFin(fin)}>
                    Editar
                  </button>
                  <button type="button" className="btn btn--ghost btn--small" onClick={() => void removeFin(fin.id)}>
                    Apagar
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
