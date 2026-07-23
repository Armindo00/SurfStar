import { COMBO_LEVEL_LABELS, type ComboLevel, type WaveSide } from '../types'

type Props = {
  level: ComboLevel
  onClose: () => void
  onLog: (side: WaveSide, success: boolean) => void
}

function SideColumn({
  side,
  onLog,
}: {
  side: WaveSide
  onLog: Props['onLog']
}) {
  const title = side === 'frontside' ? 'Frontside' : 'Backside'

  return (
    <div className="maneuver-column">
      <h3 className="maneuver-column__title">{title}</h3>
      <div className="combo-outcome-pick">
        <button
          type="button"
          className="btn-outcome btn-outcome--ok"
          aria-label={`${title} — success`}
          onClick={() => onLog(side, true)}
        >
          ✓
        </button>
        <button
          type="button"
          className="btn-outcome btn-outcome--fail"
          aria-label={`${title} — miss`}
          onClick={() => onLog(side, false)}
        >
          ✕
        </button>
      </div>
    </div>
  )
}

export function ComboOutcomeModal({ level, onClose, onLog }: Props) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal sheet sheet--maneuver"
        role="dialog"
        aria-modal="true"
        aria-labelledby="combo-outcome-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet__head sheet__head--pro">
          <div>
            <p className="sheet__eyebrow">Quick log</p>
            <h2 id="combo-outcome-title">{COMBO_LEVEL_LABELS[level]}</h2>
          </div>
          <button type="button" className="sheet__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="maneuver-modal-grid">
          <SideColumn side="frontside" onLog={onLog} />
          <div className="maneuver-modal-divider" aria-hidden="true" />
          <SideColumn side="backside" onLog={onLog} />
        </div>
      </div>
    </div>
  )
}
