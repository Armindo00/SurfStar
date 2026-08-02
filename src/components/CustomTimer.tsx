import { useEffect, useState } from 'react'
import {
  customTimerDurationMs,
  customTimerRemainingMs,
} from '../customTrainingUtils'
import { useI18n } from '../i18n'
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
  const { t, messages } = useI18n()
  const ct = messages.ui.customTimer as Record<string, string>

  const [now, setNow] = useState(() => Date.now())
  const timer = session.customTemplateSnapshot?.timer
  const label = timer?.label?.trim() || ct.sessionTimer
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
        <strong className="heat-timer__value">{t('ui.customTimer.durationMin', { minutes: durationMin })}</strong>
        <span className="muted heat-timer__hint">{ct.startWhenBegins}</span>
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
        <span className="heat-timer__label">
          {label} · {ct.finished}
        </span>
        <strong className="heat-timer__value">{elapsed}</strong>
        <span className="muted heat-timer__hint">{ct.totalElapsed}</span>
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
      <span className="muted heat-timer__hint">{ct.timeRemaining}</span>
    </div>
  )
}
