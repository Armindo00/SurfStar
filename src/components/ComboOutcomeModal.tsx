import { comboLevelLabel } from '../i18n/labels'
import { useI18n } from '../i18n'
import type { ComboLevel, WaveSide } from '../types'

type Props = {
  level: ComboLevel
  onClose: () => void
  onLog: (side: WaveSide, success: boolean) => void
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
      <div className="combo-outcome-pick">
        <button
          type="button"
          className="btn-outcome btn-outcome--ok"
          aria-label={`${title} — ${successLabel}`}
          onClick={() => onLog(side, true)}
        >
          ✓
        </button>
        <button
          type="button"
          className="btn-outcome btn-outcome--fail"
          aria-label={`${title} — ${failLabel}`}
          onClick={() => onLog(side, false)}
        >
          ✕
        </button>
      </div>
    </div>
  )
}

export function ComboOutcomeModal({ level, onClose, onLog }: Props) {
  const { t, messages } = useI18n()
  const r = messages.session.register as Record<string, string>

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
            <p className="sheet__eyebrow">{r.quickLog}</p>
            <h2 id="combo-outcome-title">{comboLevelLabel(level)}</h2>
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
