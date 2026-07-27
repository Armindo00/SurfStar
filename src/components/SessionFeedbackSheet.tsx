import { useMemo, useState } from 'react'
import { useApp } from '../AppContext'
import { mentalStateLabel, MENTAL_STATES } from '../mentalState'
import { TRAINING_MODE_LABELS } from '../types'
import type { MentalState, TrainingSession } from '../types'

function formatSessionDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

type Props = {
  session: TrainingSession
  onSubmitted: () => void
  onSkip: () => void
}

export function SessionFeedbackSheet({ session, onSubmitted, onSkip }: Props) {
  const { athleteBoards, athleteFins, submitSessionFeedback } = useApp()
  const [boardId, setBoardId] = useState('')
  const [finId, setFinId] = useState('')
  const [mentalState, setMentalState] = useState<MentalState>('focused')
  const [writtenNote, setWrittenNote] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const sessionLabel = useMemo(() => {
    const endedAt = session.endedAt ?? session.startedAt
    return `${TRAINING_MODE_LABELS[session.mode]} · ${formatSessionDate(endedAt)}`
  }, [session])

  const submit = async () => {
    setError('')
    setBusy(true)
    try {
      const result = await submitSessionFeedback({
        sessionId: session.id,
        coachId: session.coachId,
        boardId: boardId || null,
        finId: finId || null,
        mentalState,
        writtenNote: writtenNote.trim() || null,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      onSubmitted()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="session-feedback-overlay" role="dialog" aria-modal="true" aria-labelledby="session-feedback-title">
      <div className="session-feedback-sheet ss-card">
        <h2 id="session-feedback-title" className="page-title">
          Session feedback
        </h2>
        <p className="muted">{sessionLabel}</p>
        <p className="muted session-feedback-sheet__lead">
          Tell your coach which gear you used and how you felt during this training.
        </p>

        <label className="field field--pro">
          <span>Board used</span>
          <select value={boardId} onChange={(e) => setBoardId(e.target.value)}>
            <option value="">Not sure / other</option>
            {athleteBoards.map((board) => (
              <option key={board.id} value={board.id}>
                {board.name}
                {board.volumeLiters != null ? ` · ${board.volumeLiters}L` : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="field field--pro">
          <span>Fins used</span>
          <select value={finId} onChange={(e) => setFinId(e.target.value)}>
            <option value="">Not sure / other</option>
            {athleteFins.map((fin) => (
              <option key={fin.id} value={fin.id}>
                {fin.name}
                {fin.size ? ` · ${fin.size}` : ''}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="session-feedback-states">
          <legend>How did you feel?</legend>
          <div className="session-feedback-states__grid">
            {MENTAL_STATES.map((state) => (
              <label key={state.id} className="session-feedback-state">
                <input
                  type="radio"
                  name="mental-state"
                  checked={mentalState === state.id}
                  onChange={() => setMentalState(state.id)}
                />
                <span>{state.label}</span>
              </label>
            ))}
          </div>
          <p className="muted session-feedback-states__picked">Selected: {mentalStateLabel(mentalState)}</p>
        </fieldset>

        <label className="field field--pro">
          <span>Notes for your coach (optional)</span>
          <textarea
            rows={3}
            value={writtenNote}
            onChange={(e) => setWrittenNote(e.target.value)}
            placeholder="Energy level, focus, anything your coach should know…"
          />
        </label>

        {error ? <p className="login-error">{error}</p> : null}

        <div className="session-feedback-sheet__actions">
          <button type="button" className="btn btn--primary btn--block" disabled={busy} onClick={() => void submit()}>
            {busy ? 'Sending…' : 'Send feedback'}
          </button>
          <button type="button" className="btn btn--ghost btn--block" onClick={onSkip}>
            Skip for now
          </button>
        </div>
      </div>
    </div>
  )
}
