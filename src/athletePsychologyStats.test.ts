import { describe, expect, it } from 'vitest'
import { buildAthletePsychologyAnalytics } from './athletePsychologyStats'
import type { SessionAthleteFeedback, TrainingSession } from './types'

function session(id: string, endedAt: string): TrainingSession {
  return {
    id,
    coachId: 'coach-1',
    mode: 'tecnico',
    spotId: 'spot-1',
    spotName: 'Beach',
    condition: 'Clean',
    startedAt: endedAt,
    endedAt,
    athleteIds: ['a1'],
    waves: [],
    comboEntries: [],
    heats: [],
    seaAnalysis: null,
    coachNotes: null,
  }
}

function feedback(
  sessionId: string,
  mentalState: SessionAthleteFeedback['mentalState'],
  submittedAt: string,
): SessionAthleteFeedback {
  return {
    id: `fb-${sessionId}`,
    sessionId,
    athleteId: 'a1',
    coachId: 'coach-1',
    boardId: null,
    finId: null,
    mentalState,
    writtenNote: null,
    submittedAt,
  }
}

describe('buildAthletePsychologyAnalytics', () => {
  it('aggregates mental states and feedback rate for the selected period', () => {
    const sessions = [
      session('s1', '2026-07-20T12:00:00.000Z'),
      session('s2', '2026-07-22T12:00:00.000Z'),
    ]
    const rows = [
      feedback('s1', 'focused', '2026-07-20T12:30:00.000Z'),
      feedback('s2', 'anxious', '2026-07-22T12:30:00.000Z'),
    ]

    const analytics = buildAthletePsychologyAnalytics(rows, sessions, 'coach-1', 'a1', '1m')

    expect(analytics.checkIns).toBe(2)
    expect(analytics.feedbackRate).toBe(100)
    expect(analytics.positiveRate).toBe(50)
    expect(analytics.challengingRate).toBe(50)
    expect(analytics.byState).toHaveLength(2)
    expect(analytics.timeline).toHaveLength(2)
  })
})
