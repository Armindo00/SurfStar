import { MANEUVER_LABELS, type ManeuverKind, type ManeuverLevel, type WaveSide } from '../types'
import { LEVELS } from '../sessionStats'

type Props = {
  kind: ManeuverKind
  onClose: () => void
  onLog: (side: WaveSide, level: ManeuverLevel, success: boolean) => void
}

function levelLabel(level: ManeuverLevel) {
  return level === 'estrela' ? 'Star ★' : `Level ${level}`
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
      <div className="maneuver-levels">
        {LEVELS.map((level) => (
          <div key={level} className="maneuver-level">
            <span className="maneuver-level__label">{levelLabel(level)}</span>
            <div className="maneuver-level__outcomes">
              <button
                type="button"
                className="btn-outcome btn-outcome--ok"
                aria-label={`${title} ${levelLabel(level)} — success`}
                onClick={() => onLog(side, level, true)}
              >
                ✓
              </button>
              <button
                type="button"
                className="btn-outcome btn-outcome--fail"
                aria-label={`${title} ${levelLabel(level)} — miss`}
                onClick={() => onLog(side, level, false)}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ManeuverModal({ kind, onClose, onLog }: Props) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal sheet sheet--maneuver"
        role="dialog"
        aria-modal="true"
        aria-labelledby="maneuver-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet__head sheet__head--pro">
          <div>
            <p className="sheet__eyebrow">Quick log</p>
            <h2 id="maneuver-title">{MANEUVER_LABELS[kind]}</h2>
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
