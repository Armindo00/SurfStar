import { useEffect, useState } from 'react'
import {
  customTimerDurationMs,
  customTimerRemainingMs,
} from '../customTrainingUtils'
import type { TrainingSession } from '../types'

function formatClock(ms: number) {
  const totalSec = Math.ceil(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min}:${sec.toString().padStart(2, '0')}`
}

function formatElapsedMs(ms: number) {
  const totalSec = Math.floor(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min}:${sec.toString().padStart(2, '0')}`
}

type Props = {
  session: TrainingSession
  onTimeUp?: () => void
}

export function CustomTimer({ session, onTimeUp }: Props) {
  const [now, setNow] = useState(() => Date.now())
  const timer = session.customTemplateSnapshot?.timer
  const label = timer?.label?.trim() || 'Session timer'
  const durationMin = timer?.durationMinutes ?? 15

  useEffect(() => {
    if (!session.customTimerStartedAt || session.customTimerEndedAt) return
    const id = window.setInterval(() => setNow(Date.now()), 200)
    return () => window.clearInterval(id)
  }, [session.customTimerStartedAt, session.customTimerEndedAt])

  const remaining = customTimerRemainingMs(session, now)

  useEffect(() => {
    if (remaining === 0 && session.customTimerStartedAt && !session.customTimerEndedAt) {
      onTimeUp?.()
    }
  }, [remaining, session.customTimerStartedAt, session.customTimerEndedAt, onTimeUp])

  if (!timer?.enabled) return null

  if (!session.customTimerStartedAt) {
    return (
      <div className="heat-timer heat-timer--idle">
        <span className="heat-timer__label">{label}</span>
        <strong className="heat-timer__value">{durationMin} min</strong>
        <span className="muted heat-timer__hint">Start the timer when the session begins</span>
      </div>
    )
  }

  if (session.customTimerEndedAt) {
    const elapsed =
      session.customTimerStartedAt
        ? formatElapsedMs(
            new Date(session.customTimerEndedAt).getTime() -
              new Date(session.customTimerStartedAt).getTime(),
          )
        : '0:00'
    return (
      <div className="heat-timer heat-timer--done">
        <span className="heat-timer__label">{label} · finished</span>
        <strong className="heat-timer__value">{elapsed}</strong>
        <span className="muted heat-timer__hint">Total elapsed</span>
      </div>
    )
  }

  const ms = remaining ?? customTimerDurationMs(session.customTemplateSnapshot)
  const urgent = ms <= 120_000

  return (
    <div className={urgent ? 'heat-timer heat-timer--urgent' : 'heat-timer heat-timer--run'}>
      <span className="heat-timer__label">{label}</span>
      <strong className="heat-timer__value" aria-live="polite">
        {formatClock(ms)}
      </strong>
      <span className="muted heat-timer__hint">Time remaining</span>
    </div>
  )
}
