import { useState } from 'react'
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
            <p className="sheet__eyebrow">Edit log</p>
            <h2 id="sea-edit-title">Observation</h2>
          </div>
          <button type="button" className="sheet__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <p className="field-label">Peak</p>
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

        <p className="field-label">Wave type</p>
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
          Save changes
        </button>
      </div>
    </div>
  )
}
