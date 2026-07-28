import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useApp } from '../AppContext'
import { formatShortDate } from '../dateFormat'
import {
  createDefaultPsychologySurveyScores,
  PSYCHOLOGY_SURVEY_COACH_NOTE_PROMPT,
  PSYCHOLOGY_SURVEY_QUESTIONS,
  type PsychologySurveyKey,
  type PsychologySurveyScores,
} from '../psychologySurvey'
import { TRAINING_MODE_LABELS } from '../types'
import type { TrainingSession } from '../types'

type Props = {
  session: TrainingSession
  onSubmitted: () => void
  onSkip: () => void
}

function PsychologyScaleRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div className="psych-survey-row">
      <p className="psych-survey-row__label">{label}</p>
      <div className="psych-survey-row__scale" role="group" aria-label={label}>
        {[0, 1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            className={value === score ? 'psych-survey-row__btn psych-survey-row__btn--active' : 'psych-survey-row__btn'}
            aria-pressed={value === score}
            onClick={() => onChange(score)}
          >
            {score}
          </button>
        ))}
      </div>
    </div>
  )
}

export function SessionFeedbackSheet({ session, onSubmitted, onSkip }: Props) {
  const { submitSessionFeedback } = useApp()
  const [scores, setScores] = useState<PsychologySurveyScores>(createDefaultPsychologySurveyScores)
  const [writtenNote, setWrittenNote] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const errorRef = useRef<HTMLParagraphElement>(null)

  const sessionLabel = useMemo(() => {
    const endedAt = session.endedAt ?? session.startedAt
    return `${TRAINING_MODE_LABELS[session.mode]} · ${formatShortDate(endedAt)}`
  }, [session])

  useEffect(() => {
    setScores(createDefaultPsychologySurveyScores())
    setWrittenNote('')
    setError('')
    setBusy(false)
  }, [session.id])

  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [error])

  const setScore = (key: PsychologySurveyKey, value: number) => {
    setScores((current) => ({ ...current, [key]: value }))
  }

  const submit = async () => {
    if (busy) return
    setError('')
    setBusy(true)
    try {
      const result = await submitSessionFeedback({
        sessionId: session.id,
        coachId: session.coachId,
        psychologyScores: scores,
        writtenNote: writtenNote.trim() || null,
      })
      if (!result.ok) {
        setError(result.error || 'Could not submit check-in. Please try again.')
        return
      }
      onSubmitted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit check-in. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const content = (
    <div
      className="session-feedback-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-feedback-title"
    >
      <form
        className="session-feedback-sheet ss-card"
        onSubmit={(event) => {
          event.preventDefault()
          void submit()
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="session-feedback-title" className="page-title">
          Quick check-in
        </h2>
        <p className="muted">{sessionLabel}</p>
        <p className="muted session-feedback-sheet__lead">
          Rate each item from 0 to 5 — it takes less than a minute.
        </p>

        <div className="psych-survey-list">
          {PSYCHOLOGY_SURVEY_QUESTIONS.map((question) => (
            <PsychologyScaleRow
              key={question.id}
              label={question.label}
              value={scores[question.id]}
              onChange={(value) => setScore(question.id, value)}
            />
          ))}
        </div>

        <label className="field field--pro">
          <span>{PSYCHOLOGY_SURVEY_COACH_NOTE_PROMPT} (optional)</span>
          <textarea
            rows={3}
            value={writtenNote}
            onChange={(e) => setWrittenNote(e.target.value)}
            placeholder="Optional comment for your coach…"
          />
        </label>

        {error ? (
          <p ref={errorRef} className="login-error session-feedback-sheet__error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="session-feedback-sheet__actions">
          <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
            {busy ? 'Sending…' : 'Submit check-in'}
          </button>
          <button type="button" className="btn btn--ghost btn--block" disabled={busy} onClick={onSkip}>
            Skip for now
          </button>
        </div>
      </form>
    </div>
  )

  return createPortal(content, document.body)
}
