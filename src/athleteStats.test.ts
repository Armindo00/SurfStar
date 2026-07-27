import { describe, expect, it } from 'vitest'
import { computeAthleteGeneralStats } from './athleteStats'
import type { TrainingSession } from './types'

function baseSession(overrides: Partial<TrainingSession> = {}): TrainingSession {
  return {
    id: 'session-1',
    coachId: 'coach-1',
    organizationId: 'org-1',
    mode: 'campeonato',
    spotId: 'spot-1',
    spotName: 'Beach',
    condition: 'Clean',
    startedAt: '2026-07-27T10:00:00.000Z',
    endedAt: '2026-07-27T12:00:00.000Z',
    coachNotes: null,
    athleteIds: ['a1', 'a2'],
    waves: [],
    comboEntries: [],
    heats: [],
    seaAnalysis: null,
    championship: null,
    ...overrides,
  }
}

describe('computeAthleteGeneralStats', () => {
  it('counts completed championship titles for the winning athlete', () => {
    const sessions = [
      baseSession({
        id: 'champ-1',
        championship: {
          heatSize: 4,
          status: 'complete',
          championAthleteId: 'a1',
        },
      }),
      baseSession({
        id: 'champ-2',
        championship: {
          heatSize: 2,
          status: 'complete',
          championAthleteId: 'a2',
        },
      }),
    ]

    expect(computeAthleteGeneralStats(sessions, 'a1').championshipWins).toBe(1)
    expect(computeAthleteGeneralStats(sessions, 'a2').championshipWins).toBe(1)
    expect(computeAthleteGeneralStats(sessions, 'a3').championshipWins).toBe(0)
  })
})
