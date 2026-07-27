import { describe, expect, it } from 'vitest'
import { computeSeaAnalysisStats } from './seaAnalysisStats'
import type { SeaAnalysisState } from './types'

const START = '2026-07-27T10:00:00.000Z'

function buildState(overrides: Partial<SeaAnalysisState> = {}): SeaAnalysisState {
  return {
    timerStartedAt: START,
    endedAt: null,
    logs: [
      {
        id: '1',
        peak: 'peak-1',
        waveType: 'set',
        at: '2026-07-27T10:05:00.000Z',
      },
      {
        id: '2',
        peak: 'peak-1',
        waveType: 'pequena',
        at: '2026-07-27T10:12:00.000Z',
      },
    ],
    ...overrides,
  }
}

describe('computeSeaAnalysisStats', () => {
  it('freezes arrival scores when analysis endedAt is set', () => {
    const state = buildState({ endedAt: '2026-07-27T10:15:00.000Z' })
    const first = computeSeaAnalysisStats(state, { now: Date.parse('2026-07-27T11:00:00.000Z') })
    const later = computeSeaAnalysisStats(state, { now: Date.parse('2026-07-27T12:00:00.000Z') })

    expect(later.recommendation.scores['peak-1'].weightedArrivalScore).toBe(
      first.recommendation.scores['peak-1'].weightedArrivalScore,
    )
    expect(later.recommendation.scores['peak-1'].compositeScore).toBe(
      first.recommendation.scores['peak-1'].compositeScore,
    )
  })

  it('freezes arrival scores when session endedAt is passed as frozenAt', () => {
    const state = buildState()
    const frozenAt = '2026-07-27T10:20:00.000Z'
    const first = computeSeaAnalysisStats(state, {
      frozenAt,
      now: Date.parse('2026-07-27T11:00:00.000Z'),
    })
    const later = computeSeaAnalysisStats(state, {
      frozenAt,
      now: Date.parse('2026-07-27T13:00:00.000Z'),
    })

    expect(later.recommendation.scores['peak-2'].compositeScore).toBe(
      first.recommendation.scores['peak-2'].compositeScore,
    )
  })

  it('freezes scores after the 30-minute window even without endedAt', () => {
    const state = buildState()
    const afterWindow = Date.parse('2026-07-27T10:45:00.000Z')
    const muchLater = Date.parse('2026-07-27T12:00:00.000Z')

    const first = computeSeaAnalysisStats(state, { now: afterWindow })
    const later = computeSeaAnalysisStats(state, { now: muchLater })

    expect(later.recommendation.scores['peak-1'].compositeScore).toBe(
      first.recommendation.scores['peak-1'].compositeScore,
    )
  })
})
