import { useMemo, useState } from 'react'
import { useApp } from '../AppContext'
import {
  createDefaultPsychologySurveyScores,
  PSYCHOLOGY_SURVEY_COACH_NOTE_PROMPT,
  PSYCHOLOGY_SURVEY_QUESTIONS,
  type PsychologySurveyKey,
  type PsychologySurveyScores,
} from '../psychologySurvey'
import { TRAINING_MODE_LABELS } from '../types'
import type { TrainingSession } from '../types'

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

  const sessionLabel = useMemo(() => {
    const endedAt = session.endedAt ?? session.startedAt
    return `${TRAINING_MODE_LABELS[session.mode]} · ${formatSessionDate(endedAt)}`
  }, [session])

  const setScore = (key: PsychologySurveyKey, value: number) => {
    setScores((current) => ({ ...current, [key]: value }))
  }

  const submit = async () => {
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

        {error ? <p className="login-error">{error}</p> : null}

        <div className="session-feedback-sheet__actions">
          <button type="button" className="btn btn--primary btn--block" disabled={busy} onClick={() => void submit()}>
            {busy ? 'Sending…' : 'Submit check-in'}
          </button>
          <button type="button" className="btn btn--ghost btn--block" onClick={onSkip}>
            Skip for now
          </button>
        </div>
      </div>
    </div>
  )
}
