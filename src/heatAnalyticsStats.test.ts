import { describe, expect, it } from 'vitest'
import {
  analyzeHeatTiming,
  buildAthleteHeatAnalytics,
  EARLY_HEAT_TOTAL_TARGET,
  MAJOR_HEAT_WAVE_SCORE,
} from './heatAnalyticsStats'
import type { HeatRecord, TrainingSession } from './types'

function mockHeat(
  athleteId: string,
  waves: { score: number; minute: number }[],
  durationMinutes: 15 | 20 = 15,
): HeatRecord {
  const timerStartedAt = new Date('2026-01-01T10:00:00.000Z').toISOString()
  return {
    id: 'heat-1',
    label: 'Heat 1',
    athleteIds: [athleteId, 'other'],
    durationMinutes,
    timerStartedAt,
    endedAt: new Date('2026-01-01T10:20:00.000Z').toISOString(),
    waveScores: waves.map((wave, index) => ({
      id: `wave-${index}`,
      athleteId,
      score: wave.score,
      at: new Date(new Date(timerStartedAt).getTime() + wave.minute * 60_000).toISOString(),
    })),
    interferences: [],
  }
}

describe('analyzeHeatTiming', () => {
  it('detects 10+ pt early total within 10 minutes from top-2 waves', () => {
    const heat = mockHeat('a1', [
      { score: 7.5, minute: 2 },
      { score: 7.2, minute: 8 },
      { score: 5.0, minute: 14 },
    ])

    const metrics = analyzeHeatTiming(heat, 'a1')

    expect(metrics.earlyTotalFirst10Min).toBe(14.7)
    expect(metrics.reachedTenPointsInEarlyWindow).toBe(true)
    expect(metrics.timeToFirstWaveMin).toBe(2)
    expect(metrics.bestWaveOpening).toBe(7.5)
    expect(metrics.timeToTwoMajorMin).toBe(8)
    expect(metrics.bestWaveClosing).toBe(5)
    expect(metrics.majorInClosingWindow).toBe(false)
  })

  it('marks early window as below target when top-2 total is under 10 pts', () => {
    const heat = mockHeat('a1', [
      { score: 6.0, minute: 3 },
      { score: 3.5, minute: 9 },
    ])

    const metrics = analyzeHeatTiming(heat, 'a1')

    expect(metrics.earlyTotalFirst10Min).toBe(9.5)
    expect(metrics.reachedTenPointsInEarlyWindow).toBe(false)
  })

  it('detects closing major scores in the last 5 minutes', () => {
    const heat = mockHeat('a1', [
      { score: 6.0, minute: 3 },
      { score: 5.5, minute: 11 },
      { score: 8.1, minute: 16 },
    ])

    const metrics = analyzeHeatTiming(heat, 'a1')

    expect(metrics.bestWaveClosing).toBe(8.1)
    expect(metrics.majorInClosingWindow).toBe(true)
    expect(metrics.reachedTenPointsInEarlyWindow).toBe(false)
  })

  it('returns null timing when heat timer was never started', () => {
    const heat = mockHeat('a1', [{ score: 8.0, minute: 2 }])
    heat.timerStartedAt = null

    const metrics = analyzeHeatTiming(heat, 'a1')

    expect(metrics.hasTimerData).toBe(false)
    expect(metrics.earlyTotalFirst10Min).toBeNull()
  })
})

describe('buildAthleteHeatAnalytics', () => {
  it('aggregates averages and rates across sessions', () => {
    const athleteId = 'a1'
    const session: TrainingSession = {
      id: 'session-1',
      coachId: 'coach-1',
      mode: 'heats',
      spotId: 'spot-1',
      spotName: 'Beach',
      condition: 'Clean',
      startedAt: '2026-01-01T09:00:00.000Z',
      endedAt: '2026-01-01T11:00:00.000Z',
      athleteIds: [athleteId],
      waves: [],
      comboEntries: [],
      heats: [
        mockHeat(athleteId, [
          { score: MAJOR_HEAT_WAVE_SCORE, minute: 1 },
          { score: MAJOR_HEAT_WAVE_SCORE + 0.5, minute: 6 },
          { score: 8.0, minute: 14 },
        ]),
        mockHeat(athleteId, [
          { score: 6.0, minute: 4 },
          { score: 7.5, minute: 13 },
        ]),
      ],
      seaAnalysis: null,
      coachNotes: null,
    }

    const summary = buildAthleteHeatAnalytics([session], athleteId)

    expect(summary.heatsTotal).toBe(2)
    expect(summary.heatsWithTiming).toBe(2)
    expect(summary.earlyTenPointsRate).toBe(50)
    expect(summary.avgEarlyTotalFirst10Min).toBe(10.25)
    expect(summary.avgTimeToFirstWaveMin).toBe(2.5)
    expect(summary.closingMajorRate).toBe(100)
    expect(summary.avgTimeToTwoMajorMin).toBe(6)
    expect(EARLY_HEAT_TOTAL_TARGET).toBe(10)
  })
})
