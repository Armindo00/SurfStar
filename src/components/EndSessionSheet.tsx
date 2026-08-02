import { useState } from 'react'
import { useApp } from '../AppContext'
import { useI18n } from '../i18n'

export function EndSessionSheet() {
  const { endSessionSheetOpen, closeEndSessionSheet, confirmEndSession } = useApp()
  const { messages, t } = useI18n()
  const s = messages.components.endSessionSheet
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
            <p className="sheet__eyebrow">{s.eyebrow}</p>
            <h2 id="end-session-title">{s.title}</h2>
          </div>
          <button type="button" className="sheet__close" onClick={close} aria-label={t('common.close')}>
            ✕
          </button>
        </div>

        <p className="muted end-session-sheet__intro">{s.intro}</p>

        <label className="field field--pro">
          <span>{s.coachNotes}</span>
          <textarea
            className="end-session-sheet__textarea"
            rows={5}
            placeholder={s.placeholder}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>

        <div className="sea-confirm-actions">
          <button type="button" className="btn btn--primary btn--block btn--lg" onClick={finish}>
            {s.saveAndFinish}
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--block"
            onClick={() => {
              confirmEndSession('')
              setNotes('')
            }}
          >
            {s.finishWithoutNotes}
          </button>
        </div>
      </div>
    </div>
  )
}
