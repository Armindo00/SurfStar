import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TrainingSession } from './types'
import {
  loadSessionCache,
  mergeTrainingSessions,
  pickPreferredSession,
  saveSessionCache,
  sessionActivityScore,
} from './sessionCacheStore'

const storage = new Map<string, string>()

function makeSession(
  id: string,
  overrides: Partial<TrainingSession> = {},
): TrainingSession {
  return {
    id,
    coachId: 'coach-1',
    organizationId: 'org-1',
    mode: 'tecnico',
    spotId: 'guincho',
    spotName: 'Guincho',
    condition: 'Clean',
    startedAt: '2026-08-07T10:00:00.000Z',
    athleteIds: ['athlete-1'],
    waves: [],
    comboEntries: [],
    heats: [],
    seaAnalysis: null,
    endedAt: null,
    coachNotes: null,
    ...overrides,
  }
}

beforeEach(() => {
  storage.clear()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value)
    },
    removeItem: (key: string) => {
      storage.delete(key)
    },
    clear: () => {
      storage.clear()
    },
  })
})

describe('sessionActivityScore', () => {
  it('counts logged wave attempts', () => {
    const empty = makeSession('s1')
    const withLogs = makeSession('s1', {
      waves: [
        {
          id: 'w1',
          athleteId: 'athlete-1',
          hasPotential: true,
          multiManeuver: false,
          startedAt: '2026-08-07T10:01:00.000Z',
          maneuvers: [{ id: 'm1', kind: 'rail', level: 1, side: 'frontside', success: true, at: '2026-08-07T10:01:00.000Z' }],
          comboAttempts: [],
        },
      ],
    })

    expect(sessionActivityScore(withLogs)).toBeGreaterThan(sessionActivityScore(empty))
  })
})

describe('pickPreferredSession', () => {
  it('prefers an active session over a completed one', () => {
    const active = makeSession('s1', { endedAt: null })
    const completed = makeSession('s1', { endedAt: '2026-08-07T11:00:00.000Z' })
    expect(pickPreferredSession(active, completed)).toBe(active)
  })

  it('prefers the session with more logged activity', () => {
    const sparse = makeSession('s1')
    const rich = makeSession('s1', {
      waves: [
        {
          id: 'w1',
          athleteId: 'athlete-1',
          hasPotential: true,
          multiManeuver: false,
          startedAt: '2026-08-07T10:01:00.000Z',
          maneuvers: [{ id: 'm1', kind: 'rail', level: 1, side: 'frontside', success: true, at: '2026-08-07T10:01:00.000Z' }],
          comboAttempts: [],
        },
      ],
    })

    expect(pickPreferredSession(sparse, rich)).toBe(rich)
  })
})

describe('mergeTrainingSessions', () => {
  it('keeps a local-only active session missing from cloud', () => {
    const cloud = [makeSession('old', { endedAt: '2026-08-06T10:00:00.000Z' })]
    const local = [makeSession('active', { startedAt: '2026-08-07T10:00:00.000Z' })]

    const merged = mergeTrainingSessions(cloud, local)
    expect(merged.some((session) => session.id === 'active')).toBe(true)
  })

  it('prefers the richer local copy when ids match', () => {
    const cloud = makeSession('s1')
    const local = makeSession('s1', {
      waves: [
        {
          id: 'w1',
          athleteId: 'athlete-1',
          hasPotential: true,
          multiManeuver: false,
          startedAt: '2026-08-07T10:01:00.000Z',
          maneuvers: [{ id: 'm1', kind: 'rail', level: 1, side: 'frontside', success: true, at: '2026-08-07T10:01:00.000Z' }],
          comboAttempts: [],
        },
      ],
    })

    const merged = mergeTrainingSessions([cloud], [local])
    expect(merged[0]?.waves).toHaveLength(1)
  })
})

describe('session cache persistence', () => {
  it('round-trips sessions per organization', () => {
    const sessions = [makeSession('s1')]
    saveSessionCache('org-1', sessions)
    expect(loadSessionCache('org-1')).toEqual(sessions)
    expect(loadSessionCache('org-2')).toEqual([])
  })
})
