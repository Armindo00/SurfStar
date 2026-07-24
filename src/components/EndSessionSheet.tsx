import { useState } from 'react'
import { useApp } from '../AppContext'

export function EndSessionSheet() {
  const { endSessionSheetOpen, closeEndSessionSheet, confirmEndSession } = useApp()
  const [notes, setNotes] = useState('')

  if (!endSessionSheetOpen) return null

  const finish = () => {
    confirmEndSession(notes)
    setNotes('')
  }

  const close = () => {
    closeEndSessionSheet()
    setNotes('')
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={close}>
      <div
        className="modal sheet sheet--form"
        role="dialog"
        aria-modal="true"
        aria-labelledby="end-session-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet__head sheet__head--pro">
          <div>
            <p className="sheet__eyebrow">Finish session</p>
            <h2 id="end-session-title">Session notes</h2>
          </div>
          <button type="button" className="sheet__close" onClick={close} aria-label="Close">
            ✕
          </button>
        </div>

        <p className="muted end-session-sheet__intro">
          Optional — write a quick summary for this training (focus, goals, feedback for next
          session).
        </p>

        <label className="field field--pro">
          <span>Coach notes</span>
          <textarea
            className="end-session-sheet__textarea"
            rows={5}
            placeholder="e.g. Strong rail work today. Next time focus on backside top turns."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>

        <div className="sea-confirm-actions">
          <button type="button" className="btn btn--primary btn--block btn--lg" onClick={finish}>
            Save & finish session
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--block"
            onClick={() => {
              confirmEndSession('')
              setNotes('')
            }}
          >
            Finish without notes
          </button>
        </div>
      </div>
    </div>
  )
}
