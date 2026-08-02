import { useI18n } from '../i18n'
import { SEA_PEAK_LABELS, SEA_WAVE_TYPE_LABELS, type SeaPeak, type SeaWaveType } from '../types'

type Props = {
  peak: SeaPeak
  waveType: SeaWaveType
  onConfirm: () => void
  onCancel: () => void
}

export function SeaObservationConfirmModal({ peak, waveType, onConfirm, onCancel }: Props) {
  const { t, messages } = useI18n()
  const s = messages.ui.seaAnalysis as Record<string, string>

  const peakLabel = SEA_PEAK_LABELS[peak]
  const typeLabel = SEA_WAVE_TYPE_LABELS[waveType]

  return (
    <div className="modal-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="modal sheet sheet--form"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sea-confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet__head sheet__head--pro">
          <div>
            <p className="sheet__eyebrow">{s.confirmLog}</p>
            <h2 id="sea-confirm-title">{s.logThisWave}</h2>
          </div>
          <button type="button" className="sheet__close" onClick={onCancel} aria-label={t('common.close')}>
            ✕
          </button>
        </div>

        <p className="sea-confirm-body">
          {t('ui.seaAnalysis.confirmLogBody', { waveType: typeLabel, peak: peakLabel })}
        </p>

        <div className="sea-confirm-actions">
          <button type="button" className="btn btn--primary btn--block btn--lg" onClick={onConfirm}>
            {t('common.confirm')}
          </button>
          <button type="button" className="btn btn--ghost btn--block" onClick={onCancel}>
            {t('session.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
