import { useApp } from '../AppContext'
import { useI18n } from '../i18n'

export function LeaveSessionConfirmSheet() {
  const { leaveSessionConfirmOpen, closeLeaveSessionConfirm, confirmLeaveActiveSession } = useApp()
  const { messages, t } = useI18n()
  const s = messages.components.leaveSessionConfirm

  if (!leaveSessionConfirmOpen) return null

  return (
    <div className="modal-backdrop" role="presentation" onClick={closeLeaveSessionConfirm}>
      <div
        className="modal sheet sheet--form leave-session-sheet"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="leave-session-title"
        aria-describedby="leave-session-desc"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet__head sheet__head--pro">
          <div>
            <p className="sheet__eyebrow">{s.eyebrow}</p>
            <h2 id="leave-session-title">{s.title}</h2>
          </div>
          <button
            type="button"
            className="sheet__close"
            onClick={closeLeaveSessionConfirm}
            aria-label={t('common.close')}
          >
            ✕
          </button>
        </div>

        <p id="leave-session-desc" className="muted leave-session-sheet__intro">
          {s.intro}
        </p>

        <div className="sea-confirm-actions">
          <button
            type="button"
            className="btn btn--danger btn--block btn--lg"
            onClick={confirmLeaveActiveSession}
          >
            {s.leaveWithoutSaving}
          </button>
          <button type="button" className="btn btn--ghost btn--block" onClick={closeLeaveSessionConfirm}>
            {s.stayInSession}
          </button>
        </div>
      </div>
    </div>
  )
}
