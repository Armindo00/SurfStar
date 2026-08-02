import { maneuverLabel, levelLabelEn } from '../i18n/labels'
import { useI18n } from '../i18n'
import type { ManeuverKind, ManeuverLevel, WaveSide } from '../types'
import { LEVELS } from '../sessionStats'

type Props = {
  kind: ManeuverKind
  onClose: () => void
  onLog: (side: WaveSide, level: ManeuverLevel, success: boolean) => void
}

function SideColumn({
  side,
  onLog,
  frontsideLabel,
  backsideLabel,
  successLabel,
  failLabel,
}: {
  side: WaveSide
  onLog: Props['onLog']
  frontsideLabel: string
  backsideLabel: string
  successLabel: string
  failLabel: string
}) {
  const title = side === 'frontside' ? frontsideLabel : backsideLabel

  return (
    <div className="maneuver-column">
      <h3 className="maneuver-column__title">{title}</h3>
      <div className="maneuver-levels">
        {LEVELS.map((level) => (
          <div key={level} className="maneuver-level">
            <span className="maneuver-level__label">{levelLabelEn(level)}</span>
            <div className="maneuver-level__outcomes">
              <button
                type="button"
                className="btn-outcome btn-outcome--ok"
                aria-label={`${title} ${levelLabelEn(level)} — ${successLabel}`}
                onClick={() => onLog(side, level, true)}
              >
                ✓
              </button>
              <button
                type="button"
                className="btn-outcome btn-outcome--fail"
                aria-label={`${title} ${levelLabelEn(level)} — ${failLabel}`}
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
  const { t, messages } = useI18n()
  const r = messages.session.register

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
            <p className="sheet__eyebrow">{r.quickLog}</p>
            <h2 id="maneuver-title">{maneuverLabel(kind)}</h2>
          </div>
          <button type="button" className="sheet__close" onClick={onClose} aria-label={t('common.close')}>
            ✕
          </button>
        </div>

        <div className="maneuver-modal-grid">
          <SideColumn
            side="frontside"
            onLog={onLog}
            frontsideLabel={r.frontside}
            backsideLabel={r.backside}
            successLabel={r.success}
            failLabel={r.fail}
          />
          <div className="maneuver-modal-divider" aria-hidden="true" />
          <SideColumn
            side="backside"
            onLog={onLog}
            frontsideLabel={r.frontside}
            backsideLabel={r.backside}
            successLabel={r.success}
            failLabel={r.fail}
          />
        </div>
      </div>
    </div>
  )
}
