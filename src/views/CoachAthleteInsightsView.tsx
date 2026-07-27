import { useMemo, useState } from 'react'
import { EquipmentRatingChart } from '../components/EquipmentRatingChart'
import { ScreenHeader } from '../components/ScreenHeader'
import { useApp } from '../AppContext'
import { mentalStateLabel } from '../mentalState'
import { TRAINING_MODE_LABELS } from '../types'
import type { EquipmentType } from '../types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatBoardSpecs(board: {
  lengthCm: number | null
  widthInches: number | null
  thicknessInches: number | null
  volumeLiters: number | null
}) {
  const parts: string[] = []
  if (board.lengthCm != null) parts.push(`${board.lengthCm} cm`)
  if (board.widthInches != null) parts.push(`${board.widthInches}"`)
  if (board.thicknessInches != null) parts.push(`${board.thicknessInches}"`)
  if (board.volumeLiters != null) parts.push(`${board.volumeLiters} L`)
  return parts.join(' · ')
}

export function CoachAthleteInsightsView() {
  const {
    insightsAthlete,
    athleteBoards,
    athleteFins,
    equipmentEvaluations,
    sessionAthleteFeedback,
    trainingSessions,
    saveEquipmentEvaluation,
    setView,
  } = useApp()

  const [tab, setTab] = useState<'material' | 'wellbeing'>('material')
  const [equipmentType, setEquipmentType] = useState<EquipmentType>('board')
  const [equipmentId, setEquipmentId] = useState('')
  const [speed, setSpeed] = useState(7)
  const [control, setControl] = useState(7)
  const [release, setRelease] = useState(7)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const equipmentOptions = equipmentType === 'board' ? athleteBoards : athleteFins

  const feedbackRows = useMemo(() => {
    if (!insightsAthlete) return []
    return sessionAthleteFeedback
      .filter((row) => row.athleteId === insightsAthlete.id)
      .map((row) => {
        const session = trainingSessions.find((s) => s.id === row.sessionId)
        const board = row.boardId ? athleteBoards.find((b) => b.id === row.boardId) : null
        const fin = row.finId ? athleteFins.find((f) => f.id === row.finId) : null
        return { row, session, board, fin }
      })
      .sort(
        (a, b) =>
          new Date(b.row.submittedAt).getTime() - new Date(a.row.submittedAt).getTime(),
      )
  }, [athleteBoards, athleteFins, insightsAthlete, sessionAthleteFeedback, trainingSessions])

  const evaluationsForAthlete = useMemo(() => {
    if (!insightsAthlete) return []
    return equipmentEvaluations.filter((item) => item.athleteId === insightsAthlete.id)
  }, [equipmentEvaluations, insightsAthlete])

  if (!insightsAthlete) {
    return (
      <div className="ss-flow">
        <ScreenHeader title="Athlete insights" onBack={() => setView('manage-athletes')} />
        <p className="muted">No athlete selected.</p>
      </div>
    )
  }

  const submitEvaluation = async () => {
    setError('')
    if (!equipmentId) {
      setError('Select equipment to evaluate.')
      return
    }
    setBusy(true)
    try {
      const result = await saveEquipmentEvaluation({
        athleteId: insightsAthlete.id,
        equipmentType,
        equipmentId,
        speed,
        control,
        release,
        notes: notes.trim() || null,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setNotes('')
    } finally {
      setBusy(false)
    }
  }

  const equipmentName = (type: EquipmentType, id: string) => {
    if (type === 'board') return athleteBoards.find((b) => b.id === id)?.name ?? 'Board'
    return athleteFins.find((f) => f.id === id)?.name ?? 'Fins'
  }

  return (
    <div className="ss-flow">
      <ScreenHeader title={insightsAthlete.name} onBack={() => setView('manage-athletes')} />

      <nav className="admin-tabs insights-tabs" aria-label="Athlete insights">
        <button
          type="button"
          className={tab === 'material' ? 'admin-tabs__btn admin-tabs__btn--active' : 'admin-tabs__btn'}
          onClick={() => setTab('material')}
        >
          Gear & ratings
        </button>
        <button
          type="button"
          className={tab === 'wellbeing' ? 'admin-tabs__btn admin-tabs__btn--active' : 'admin-tabs__btn'}
          onClick={() => setTab('wellbeing')}
        >
          Wellbeing & feedback
        </button>
      </nav>

      {tab === 'material' ? (
        <>
          <div className="ss-card material-section">
            <h2 className="page-title">Board quiver</h2>
            {athleteBoards.length === 0 ? (
              <p className="muted">Athlete has not added boards yet.</p>
            ) : (
              <ul className="material-list">
                {athleteBoards.map((board) => (
                  <li key={board.id} className="material-list__item">
                    <div>
                      <strong>{board.name}</strong>
                      <p className="muted">{formatBoardSpecs(board) || 'No dimensions'}</p>
                      {board.notes ? <p className="material-list__notes">{board.notes}</p> : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="ss-card material-section">
            <h2 className="page-title">Fins</h2>
            {athleteFins.length === 0 ? (
              <p className="muted">Athlete has not added fins yet.</p>
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
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="ss-card material-section">
            <h2 className="page-title">Rate equipment (0–10)</h2>
            <p className="muted">Score speed, control and release — add optional notes.</p>

            <div className="material-form-grid">
              <label className="field field--pro">
                <span>Type</span>
                <select
                  value={equipmentType}
                  onChange={(e) => {
                    setEquipmentType(e.target.value as EquipmentType)
                    setEquipmentId('')
                  }}
                >
                  <option value="board">Board</option>
                  <option value="fin">Fins</option>
                </select>
              </label>
              <label className="field field--pro">
                <span>Item</span>
                <select value={equipmentId} onChange={(e) => setEquipmentId(e.target.value)}>
                  <option value="">Select…</option>
                  {equipmentOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <EquipmentRatingChart speed={speed} control={control} release={release} />

            <div className="rating-sliders">
              {(
                [
                  ['Speed', speed, setSpeed],
                  ['Control', control, setControl],
                  ['Release', release, setRelease],
                ] as const
              ).map(([label, value, setter]) => (
                <label key={label} className="field field--pro rating-slider">
                  <span>
                    {label}: <strong>{value}</strong>
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={1}
                    value={value}
                    onChange={(e) => setter(Number(e.target.value))}
                  />
                </label>
              ))}
            </div>

            <label className="field field--pro">
              <span>Written notes</span>
              <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>

            {error ? <p className="login-error">{error}</p> : null}
            <button type="button" className="btn btn--primary btn--block" disabled={busy} onClick={() => void submitEvaluation()}>
              Save evaluation
            </button>
          </div>

          {evaluationsForAthlete.length > 0 ? (
            <div className="ss-card material-section">
              <h2 className="page-title">Past evaluations</h2>
              <ul className="evaluation-history">
                {evaluationsForAthlete.map((item) => (
                  <li key={item.id} className="evaluation-history__item">
                    <div className="evaluation-history__head">
                      <strong>
                        {equipmentName(item.equipmentType, item.equipmentId)} ·{' '}
                        {item.equipmentType === 'board' ? 'Board' : 'Fins'}
                      </strong>
                      <span className="muted">{formatDate(item.createdAt)}</span>
                    </div>
                    <EquipmentRatingChart speed={item.speed} control={item.control} release={item.release} />
                    {item.notes ? <p className="material-list__notes">{item.notes}</p> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : (
        <div className="ss-card material-section">
          <h2 className="page-title">Session feedback & wellbeing</h2>
          <p className="muted">Post-session reports from the athlete across the season.</p>

          {feedbackRows.length === 0 ? (
            <p className="muted">No feedback submitted yet.</p>
          ) : (
            <ul className="feedback-timeline">
              {feedbackRows.map(({ row, session, board, fin }) => (
                <li key={row.id} className="feedback-timeline__item">
                  <div className="feedback-timeline__head">
                    <strong>
                      {session ? TRAINING_MODE_LABELS[session.mode] : 'Session'} ·{' '}
                      {mentalStateLabel(row.mentalState)}
                    </strong>
                    <span className="muted">{formatDate(row.submittedAt)}</span>
                  </div>
                  <p className="muted feedback-timeline__gear">
                    Gear: {board?.name ?? '—'} · Fins: {fin?.name ?? '—'}
                  </p>
                  {row.writtenNote ? <p className="feedback-timeline__note">{row.writtenNote}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
