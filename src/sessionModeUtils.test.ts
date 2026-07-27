import { describe, expect, it } from 'vitest'
import {
  isHeatLikeSession,
  liveStatsBackView,
  resolveSessionMode,
} from './sessionModeUtils'
import type { TrainingSession } from './types'

function baseSession(overrides: Partial<TrainingSession> = {}): TrainingSession {
  return {
    id: 's1',
    coachId: 'c1',
    organizationId: 'o1',
    mode: 'tecnico',
    spotId: 'spot1',
    spotName: 'Beach',
    condition: 'Clean',
    startedAt: '2026-07-27T10:00:00.000Z',
    athleteIds: ['a1'],
    waves: [],
    comboEntries: [],
    heats: [],
    seaAnalysis: null,
    championship: null,
    customTemplateId: null,
    customTemplateName: null,
    customTemplateSnapshot: null,
    customTimerStartedAt: null,
    customTimerEndedAt: null,
    endedAt: null,
    coachNotes: null,
    ...overrides,
  }
}

describe('resolveSessionMode', () => {
  it('detects heat sessions even when mode was saved as technical', () => {
    const session = baseSession({
      mode: 'tecnico',
      heats: [
        {
          id: 'h1',
          label: 'Heat',
          athleteIds: ['a1', 'a2'],
          durationMinutes: 15,
          timerStartedAt: null,
          endedAt: null,
          waveScores: [],
          interferences: [],
        },
      ],
    })

    expect(resolveSessionMode(session)).toBe('heats')
    expect(isHeatLikeSession(session)).toBe(true)
    expect(liveStatsBackView(session)).toBe('heats')
  })

  it('keeps campeonato sessions distinct from single heats', () => {
    const session = baseSession({
      mode: 'campeonato',
      championship: { heatSize: 4, status: 'active', championAthleteId: null },
      heats: [
        {
          id: 'h1',
          label: 'Final',
          athleteIds: ['a1', 'a2'],
          durationMinutes: 15,
          timerStartedAt: null,
          endedAt: null,
          waveScores: [],
          interferences: [],
        },
      ],
    })

    expect(resolveSessionMode(session)).toBe('campeonato')
    expect(liveStatsBackView(session)).toBe('campeonato')
  })
})
