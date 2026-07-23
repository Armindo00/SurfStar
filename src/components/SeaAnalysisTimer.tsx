import { useEffect, useState } from 'react'
import { formatElapsedMs, seaRemainingMs } from '../seaAnalysisStats'
import { SEA_ANALYSIS_DURATION_MINUTES, type SeaAnalysisState } from '../types'

function formatClock(ms: number) {
  const totalSec = Math.ceil(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min}:${sec.toString().padStart(2, '0')}`
}

type Props = {
  state: SeaAnalysisState
  onTimeUp?: () => void
}

export function SeaAnalysisTimer({ state, onTimeUp }: Props) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!state.timerStartedAt || state.endedAt) return
    const id = window.setInterval(() => setNow(Date.now()), 200)
    return () => window.clearInterval(id)
  }, [state.timerStartedAt, state.endedAt])

  const remaining = seaRemainingMs(state, now)

  useEffect(() => {
    if (remaining === 0 && state.timerStartedAt && !state.endedAt) {
      onTimeUp?.()
    }
  }, [remaining, state.timerStartedAt, state.endedAt, onTimeUp])

  if (!state.timerStartedAt) {
    return (
      <div className="heat-timer heat-timer--idle">
        <span className="heat-timer__label">Session length</span>
        <strong className="heat-timer__value">{SEA_ANALYSIS_DURATION_MINUTES} min</strong>
        <span className="muted heat-timer__hint">Start the clock when you begin watching the peaks</span>
      </div>
    )
  }

  if (state.endedAt) {
    const elapsed = state.timerStartedAt
      ? formatElapsedMs(new Date(state.endedAt).getTime() - new Date(state.timerStartedAt).getTime())
      : '0:00'
    return (
      <div className="heat-timer heat-timer--done">
        <span className="heat-timer__label">Analysis finished</span>
        <strong className="heat-timer__value">{elapsed}</strong>
        <span className="muted heat-timer__hint">Total elapsed</span>
      </div>
    )
  }

  const ms = remaining ?? 0
  const urgent = ms <= 120_000

  return (
    <div className={urgent ? 'heat-timer heat-timer--urgent' : 'heat-timer heat-timer--run'}>
      <span className="heat-timer__label">Time remaining</span>
      <strong className="heat-timer__value" aria-live="polite">
        {formatClock(ms)}
      </strong>
      <span className="muted heat-timer__hint">Log each wave with potential as you see it</span>
    </div>
  )
}
