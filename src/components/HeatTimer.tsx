import { useEffect, useState } from 'react'
import { heatRemainingMs } from '../heatUtils'
import type { HeatRecord } from '../types'

function formatClock(ms: number) {
  const totalSec = Math.ceil(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min}:${sec.toString().padStart(2, '0')}`
}

type Props = {
  heat: HeatRecord
  onTimeUp?: () => void
}

export function HeatTimer({ heat, onTimeUp }: Props) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!heat.timerStartedAt || heat.endedAt) return
    const id = window.setInterval(() => setNow(Date.now()), 200)
    return () => window.clearInterval(id)
  }, [heat.timerStartedAt, heat.endedAt])

  const remaining = heatRemainingMs(heat, now)

  useEffect(() => {
    if (remaining === 0 && heat.timerStartedAt && !heat.endedAt) {
      onTimeUp?.()
    }
  }, [remaining, heat.timerStartedAt, heat.endedAt, onTimeUp])

  if (!heat.timerStartedAt) {
    return (
      <div className="heat-timer heat-timer--idle">
        <span className="heat-timer__label">Duration</span>
        <strong className="heat-timer__value">{heat.durationMinutes} min</strong>
        <span className="muted heat-timer__hint">Press start to run the heat clock</span>
      </div>
    )
  }

  if (heat.endedAt) {
    return (
      <div className="heat-timer heat-timer--done">
        <span className="heat-timer__label">Heat finished</span>
        <strong className="heat-timer__value">0:00</strong>
      </div>
    )
  }

  const ms = remaining ?? 0
  const urgent = ms <= 60_000

  return (
    <div className={urgent ? 'heat-timer heat-timer--urgent' : 'heat-timer heat-timer--run'}>
      <span className="heat-timer__label">Time remaining</span>
      <strong className="heat-timer__value" aria-live="polite">
        {formatClock(ms)}
      </strong>
    </div>
  )
}
