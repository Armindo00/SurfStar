import { useApp } from '../AppContext'

export function LeaveSessionConfirmSheet() {
  const {
    leaveSessionConfirmOpen,
    closeLeaveSessionConfirm,
    confirmLeaveActiveSession,
  } = useApp()

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
            <p className="sheet__eyebrow">Active session</p>
            <h2 id="leave-session-title">Leave this session?</h2>
          </div>
          <button
            type="button"
            className="sheet__close"
            onClick={closeLeaveSessionConfirm}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <p id="leave-session-desc" className="muted leave-session-sheet__intro">
          Are you sure you want to go back? This session will not be saved and all logged data will
          be lost.
        </p>

        <div className="sea-confirm-actions">
          <button
            type="button"
            className="btn btn--danger btn--block btn--lg"
            onClick={confirmLeaveActiveSession}
          >
            Leave without saving
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--block"
            onClick={closeLeaveSessionConfirm}
          >
            Stay in session
          </button>
        </div>
      </div>
    </div>
  )
}
