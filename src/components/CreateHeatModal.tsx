import { useState } from 'react'
import { HEAT_DURATIONS, type HeatDurationMinutes } from '../types'
import { MAX_HEAT_ATHLETES } from '../heatUtils'

type Props = {
  poolAthleteIds: string[]
  getAthleteName: (id: string) => string
  defaultDuration: HeatDurationMinutes
  heatNumber: number
  onClose: () => void
  onCreate: (athleteIds: string[], durationMinutes: HeatDurationMinutes) => void
}

export function CreateHeatModal({
  poolAthleteIds,
  getAthleteName,
  defaultDuration,
  heatNumber,
  onClose,
  onCreate,
}: Props) {
  const [selected, setSelected] = useState<string[]>([])
  const [duration, setDuration] = useState<HeatDurationMinutes>(defaultDuration)

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= MAX_HEAT_ATHLETES) return prev
      return [...prev, id]
    })
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
            <p className="sheet__eyebrow">Championship</p>
            <h2>New heat {heatNumber}</h2>
          </div>
          <button type="button" className="sheet__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <p className="muted stats-panel__sub">Pick up to {MAX_HEAT_ATHLETES} surfers and heat length.</p>

        <p className="field-label">Duration</p>
        <div className="chip-row chip-row--pro">
          {HEAT_DURATIONS.map((d) => (
            <button
              key={d}
              type="button"
              className={duration === d ? 'chip chip--active' : 'chip'}
              onClick={() => setDuration(d)}
            >
              {d} min
            </button>
          ))}
        </div>

        <p className="field-label">Surfers in this heat</p>
        <div className="athlete-grid">
          {poolAthleteIds.map((id) => {
            const on = selected.includes(id)
            const disabled = !on && selected.length >= MAX_HEAT_ATHLETES
            return (
              <button
                key={id}
                type="button"
                disabled={disabled}
                className={on ? 'athlete-tile athlete-tile--selected' : 'athlete-tile'}
                onClick={() => toggle(id)}
              >
                <span className="athlete-tile__avatar" aria-hidden="true">
                  {getAthleteName(id).charAt(0).toUpperCase()}
                </span>
                <span className="athlete-tile__name">{getAthleteName(id)}</span>
                {on ? <span className="athlete-tile__check">✓</span> : null}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          className="btn btn--primary btn--block btn--lg"
          disabled={selected.length === 0}
          onClick={() => onCreate(selected, duration)}
        >
          Create heat
        </button>
      </div>
    </div>
  )
}
