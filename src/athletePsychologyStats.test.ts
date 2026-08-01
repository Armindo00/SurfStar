import { describe, expect, it } from 'vitest'
import { presetAnalyticsRange } from './analyticsRange'
import { buildAthletePsychologyAnalytics } from './athletePsychologyStats'
import { createDefaultPsychologySurveyScores } from './psychologySurvey'
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

function feedback(sessionId: string, submittedAt: string): SessionAthleteFeedback {
  return {
    id: `fb-${sessionId}`,
    sessionId,
    athleteId: 'a1',
    coachId: 'coach-1',
    psychologyScores: {
      ...createDefaultPsychologySurveyScores(),
      mood: 5,
      focusDuring: 4,
    },
    writtenNote: 'Felt good overall.',
    submittedAt,
  }
}

describe('buildAthletePsychologyAnalytics', () => {
  it('aggregates 0-5 psychology survey scores for the selected period', () => {
    const sessions = [
      session('s1', '2026-07-20T12:00:00.000Z'),
      session('s2', '2026-07-22T12:00:00.000Z'),
    ]
    const rows = [
      feedback('s1', '2026-07-20T12:30:00.000Z'),
      feedback('s2', '2026-07-22T12:30:00.000Z'),
    ]

    const analytics = buildAthletePsychologyAnalytics(
      rows,
      sessions,
      'coach-1',
      'a1',
      presetAnalyticsRange('1m'),
    )

    expect(analytics.checkIns).toBe(2)
    expect(analytics.feedbackRate).toBe(100)
    expect(analytics.averageOverall).not.toBeNull()
    expect(analytics.byQuestion.find((item) => item.key === 'mood')?.average).toBe(5)
    expect(analytics.byQuestion.find((item) => item.key === 'focusDuring')?.average).toBe(4)
    expect(analytics.notesCount).toBe(2)
    expect(analytics.timeline).toHaveLength(2)
  })
})
