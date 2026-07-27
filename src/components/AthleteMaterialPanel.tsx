import { useEffect, useMemo, useState } from 'react'
import { EquipmentRatingChart } from './EquipmentRatingChart'
import { useApp } from '../AppContext'
import { formatBoardSpecs, formatMaterialDate } from '../materialUtils'
import type { EquipmentType } from '../types'

type Props = {
  athleteId: string
}

export function AthleteMaterialPanel({ athleteId }: Props) {
  const {
    athleteBoards,
    athleteFins,
    equipmentEvaluations,
    refreshAthleteEquipment,
    saveEquipmentEvaluation,
  } = useApp()

  const [equipmentType, setEquipmentType] = useState<EquipmentType>('board')
  const [equipmentId, setEquipmentId] = useState('')
  const [speed, setSpeed] = useState(7)
  const [control, setControl] = useState(7)
  const [release, setRelease] = useState(7)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void refreshAthleteEquipment(athleteId).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [athleteId, refreshAthleteEquipment])

  const boards = useMemo(
    () => athleteBoards.filter((board) => board.athleteId === athleteId),
    [athleteBoards, athleteId],
  )

  const fins = useMemo(
    () => athleteFins.filter((fin) => fin.athleteId === athleteId),
    [athleteFins, athleteId],
  )

  const evaluationsForAthlete = useMemo(
    () =>
      equipmentEvaluations
        .filter((item) => item.athleteId === athleteId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [athleteId, equipmentEvaluations],
  )

  const equipmentOptions = equipmentType === 'board' ? boards : fins

  const equipmentName = (type: EquipmentType, id: string) => {
    if (type === 'board') return boards.find((board) => board.id === id)?.name ?? 'Board'
    return fins.find((fin) => fin.id === id)?.name ?? 'Fins'
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
        athleteId,
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

  if (loading) {
    return (
      <div className="ss-card stats-panel analytics-empty-period">
        <p className="muted">Loading athlete equipment…</p>
      </div>
    )
  }

  return (
    <div className="athlete-material-panel">
      <div className="ss-card stats-panel athlete-material-panel__intro">
        <h2 className="stats-panel__title">Equipment management</h2>
        <p className="muted stats-panel__sub">
          View the athlete&apos;s board quiver and fins. The athlete updates their gear from their
          account — you can score speed, control and release here.
        </p>
      </div>

      <div className="ss-card material-section">
        <h2 className="page-title">Board quiver</h2>
        {boards.length === 0 ? (
          <p className="muted">Athlete has not added boards yet.</p>
        ) : (
          <ul className="material-list">
            {boards.map((board) => (
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
        {fins.length === 0 ? (
          <p className="muted">Athlete has not added fins yet.</p>
        ) : (
          <ul className="material-list">
            {fins.map((fin) => (
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
        <button
          type="button"
          className="btn btn--primary btn--block"
          disabled={busy}
          onClick={() => void submitEvaluation()}
        >
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
                  <span className="muted">{formatMaterialDate(item.createdAt)}</span>
                </div>
                <EquipmentRatingChart speed={item.speed} control={item.control} release={item.release} />
                {item.notes ? <p className="material-list__notes">{item.notes}</p> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
