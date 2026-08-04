import { useApp } from '../AppContext'
import { useI18n } from '../i18n'

export function CloseWaveConfirmSheet() {
  const { closeWaveConfirmOpen, waveConfirmAction, closeCloseWaveConfirm, confirmCloseActiveWave } =
    useApp()
  const { messages, t } = useI18n()
  const s =
    waveConfirmAction === 'no-potential'
      ? messages.components.noPotentialWaveConfirm
      : messages.components.closeWaveConfirm

  if (!closeWaveConfirmOpen) return null

  return (
    <div className="modal-backdrop" role="presentation" onClick={closeCloseWaveConfirm}>
      <div
        className="modal sheet sheet--form close-wave-sheet"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="close-wave-title"
        aria-describedby="close-wave-desc"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet__head sheet__head--pro">
          <div>
            <p className="sheet__eyebrow">{s.eyebrow}</p>
            <h2 id="close-wave-title">{s.title}</h2>
          </div>
          <button
            type="button"
            className="sheet__close"
            onClick={closeCloseWaveConfirm}
            aria-label={t('common.close')}
          >
            ✕
          </button>
        </div>

        <p id="close-wave-desc" className="muted leave-session-sheet__intro">
          {s.intro}
        </p>

        <div className="sea-confirm-actions">
          <button
            type="button"
            className="btn btn--primary btn--block btn--lg"
            onClick={confirmCloseActiveWave}
          >
            {s.yes}
          </button>
          <button type="button" className="btn btn--ghost btn--block" onClick={closeCloseWaveConfirm}>
            {s.no}
          </button>
        </div>
      </div>
    </div>
  )
}
