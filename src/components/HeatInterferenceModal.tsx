import { HEAT_INTERFERENCE_LABELS, type HeatInterferenceType } from '../types'

type Props = {
  athleteName: string
  current: HeatInterferenceType | null
  onClose: () => void
  onApply: (type: HeatInterferenceType) => void
  onClear: () => void
}

export function HeatInterferenceModal({
  athleteName,
  current,
  onClose,
  onApply,
  onClear,
}: Props) {
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
            <p className="sheet__eyebrow">Interference</p>
            <h2>{athleteName}</h2>
          </div>
          <button type="button" className="sheet__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <p className="muted stats-panel__sub">
          Applies to this surfer&apos;s <strong>2nd best wave</strong> in the heat total.
        </p>

        <button
          type="button"
          className="btn btn--block heat-int-btn"
          onClick={() => onApply('half-second')}
        >
          <strong>Halve 2nd best</strong>
          <span className="muted">2nd counting wave counts at 50% (e.g. 6.00 → 3.00)</span>
        </button>

        <button
          type="button"
          className="btn btn--block heat-int-btn heat-int-btn--severe"
          onClick={() => onApply('drop-second')}
        >
          <strong>Remove 2nd best</strong>
          <span className="muted">Only the best wave counts toward the total</span>
        </button>

        {current ? (
          <>
            <p className="heat-int-current">
              Active: <strong>{HEAT_INTERFERENCE_LABELS[current]}</strong>
            </p>
            <button type="button" className="btn btn--ghost btn--block" onClick={onClear}>
              Clear interference
            </button>
          </>
        ) : null}
      </div>
    </div>
  )
}
