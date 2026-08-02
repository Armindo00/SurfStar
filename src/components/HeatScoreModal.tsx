import { useState, type FormEvent } from 'react'
import { formatHeatScore, parseHeatScoreInput } from '../heatUtils'
import { useI18n } from '../i18n'

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
  title,
}: Props) {
  const { t, messages } = useI18n()
  const h = messages.session.heat as Record<string, string>
  const r = messages.session.register as Record<string, string>
  const [raw, setRaw] = useState(initialScore !== undefined ? String(initialScore) : '')
  const [error, setError] = useState('')

  const preview = parseHeatScoreInput(raw)
  const modalTitle = title ?? h.waveScore

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const score = parseHeatScoreInput(raw)
    if (score === null) {
      setError(h.scoreRangeError)
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
            <p className="sheet__eyebrow">{modalTitle}</p>
            <h2>{athleteName}</h2>
          </div>
          <button type="button" className="sheet__close" onClick={onClose} aria-label={t('common.close')}>
            ✕
          </button>
        </div>

        <form className="form-pro" onSubmit={submit}>
          <label className="field field--pro">
            <span>{h.scoreRange}</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder={h.scorePlaceholder}
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
              {t('session.heat.savedAs', { score: formatHeatScore(preview) })}
            </p>
          ) : null}
          {error ? <p className="login-error">{error}</p> : null}
          <button type="submit" className="btn btn--primary btn--block btn--lg">
            {initialScore !== undefined ? r.saveChanges : h.logWave}
          </button>
        </form>
      </div>
    </div>
  )
}
