import { useState } from 'react'
import { useI18n } from '../i18n'
import {
  SEA_PEAK_LABELS,
  SEA_PEAKS,
  SEA_WAVE_TYPE_LABELS,
  SEA_WAVE_TYPES,
  type SeaPeak,
  type SeaWaveType,
} from '../types'

type Props = {
  peak: SeaPeak
  waveType: SeaWaveType
  onSave: (peak: SeaPeak, waveType: SeaWaveType) => void
  onClose: () => void
}

export function SeaObservationEditModal({ peak: initialPeak, waveType: initialType, onSave, onClose }: Props) {
  const { t, messages } = useI18n()
  const s = messages.ui.seaAnalysis as Record<string, string>
  const r = messages.session.register as Record<string, string>

  const [peak, setPeak] = useState(initialPeak)
  const [waveType, setWaveType] = useState(initialType)

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal sheet sheet--form"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sea-edit-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet__head sheet__head--pro">
          <div>
            <p className="sheet__eyebrow">{s.editLog}</p>
            <h2 id="sea-edit-title">{s.observation}</h2>
          </div>
          <button type="button" className="sheet__close" onClick={onClose} aria-label={t('common.close')}>
            ✕
          </button>
        </div>

        <p className="field-label">{s.peak}</p>
        <div className="sea-edit-peak-pick">
          {SEA_PEAKS.map((p) => (
            <button
              key={p}
              type="button"
              className={peak === p ? 'btn btn--primary btn--small' : 'btn btn--ghost btn--small'}
              onClick={() => setPeak(p)}
            >
              {SEA_PEAK_LABELS[p]}
            </button>
          ))}
        </div>

        <p className="field-label">{s.waveType}</p>
        <div className="sea-edit-type-pick">
          {SEA_WAVE_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              className={`btn btn--block btn--small sea-wave-btn sea-wave-btn--${type}${waveType === type ? ' sea-wave-btn--selected' : ''}`}
              onClick={() => setWaveType(type)}
            >
              {SEA_WAVE_TYPE_LABELS[type]}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="btn btn--primary btn--block btn--lg"
          onClick={() => onSave(peak, waveType)}
        >
          {r.saveChanges}
        </button>
      </div>
    </div>
  )
}
