import { useI18n } from '../i18n'
import { type HeatInterferenceType } from '../types'

type Props = {
  athleteName: string
  current: HeatInterferenceType | null
  onClose: () => void
  onApply: (type: HeatInterferenceType) => void
  onClear: () => void
}

function interferenceLabel(type: HeatInterferenceType, h: Record<string, string>): string {
  return type === 'half-second' ? h.interferenceHalfSecond : h.interferenceDropSecond
}

export function HeatInterferenceModal({
  athleteName,
  current,
  onClose,
  onApply,
  onClear,
}: Props) {
  const { t, messages } = useI18n()
  const h = messages.session.heat as Record<string, string>

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
            <p className="sheet__eyebrow">{h.interference}</p>
            <h2>{athleteName}</h2>
          </div>
          <button type="button" className="sheet__close" onClick={onClose} aria-label={t('common.close')}>
            ✕
          </button>
        </div>

        <p className="muted stats-panel__sub">{h.interferenceAppliesTo}</p>

        <button
          type="button"
          className="btn btn--block heat-int-btn"
          onClick={() => onApply('half-second')}
        >
          <strong>{h.halveSecondBest}</strong>
          <span className="muted">{h.halveSecondBestHint}</span>
        </button>

        <button
          type="button"
          className="btn btn--block heat-int-btn heat-int-btn--severe"
          onClick={() => onApply('drop-second')}
        >
          <strong>{h.removeSecondBest}</strong>
          <span className="muted">{h.removeSecondBestHint}</span>
        </button>

        {current ? (
          <>
            <p className="heat-int-current">
              {h.interferenceActive} <strong>{interferenceLabel(current, h)}</strong>
            </p>
            <button type="button" className="btn btn--ghost btn--block" onClick={onClear}>
              {h.clearInterference}
            </button>
          </>
        ) : null}
      </div>
    </div>
  )
}
