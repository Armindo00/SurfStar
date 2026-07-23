import { useState, type FormEvent } from 'react'
import { formatHeatScore, parseHeatScoreInput } from '../heatUtils'

type Props = {
  athleteName: string
  onClose: () => void
  onSave: (score: number) => void
  initialScore?: number
  title?: string
}

export function HeatScoreModal({
  athleteName,
  onClose,
  onSave,
  initialScore,
  title = 'Wave score',
}: Props) {
  const [raw, setRaw] = useState(initialScore !== undefined ? String(initialScore) : '')
  const [error, setError] = useState('')

  const preview = parseHeatScoreInput(raw)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const score = parseHeatScoreInput(raw)
    if (score === null) {
      setError('Enter a score from 0 to 10 (e.g. 3.75).')
      return
    }
    onSave(score)
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal sheet sheet--form"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet__head sheet__head--pro">
          <div>
            <p className="sheet__eyebrow">{title}</p>
            <h2>{athleteName}</h2>
          </div>
          <button type="button" className="sheet__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form className="form-pro" onSubmit={submit}>
          <label className="field field--pro">
            <span>Score (0–10)</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="e.g. 3.75"
              value={raw}
              autoFocus
              onChange={(e) => {
                setRaw(e.target.value)
                setError('')
              }}
            />
          </label>
          {preview !== null ? (
            <p className="heat-score-preview">
              Saved as <strong>{formatHeatScore(preview)}</strong>
            </p>
          ) : null}
          {error ? <p className="login-error">{error}</p> : null}
          <button type="submit" className="btn btn--primary btn--block btn--lg">
            {initialScore !== undefined ? 'Save changes' : 'Log wave'}
          </button>
        </form>
      </div>
    </div>
  )
}
