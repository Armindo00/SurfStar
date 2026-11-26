import { describe, expect, it } from 'vitest'
import {
  buildCoachSessionAgendaMetric,
  buildCoachSessionHeadline,
  groupSessionsByMonth,
  sessionMatchesHistoryFilter,
} from './sessionHistoryUtils'
import type { TrainingSession } from './types'

function baseSession(overrides: Partial<TrainingSession> = {}): TrainingSession {
  return {
    id: 'session-1',
    coachId: 'coach-1',
    organizationId: 'org-1',
    spotId: 'spot-1',
    spotName: 'Beach',
    condition: 'Clean',
    mode: 'tecnico',
    athleteIds: ['a1'],
    startedAt: '2026-07-27T10:00:00.000Z',
    endedAt: '2026-07-27T11:00:00.000Z',
    coachNotes: null,
    waves: [],
    heats: [],
    comboEntries: [],
    championship: null,
    seaAnalysis: null,
    customTemplateId: null,
    customTemplateName: null,
    customTemplateSnapshot: null,
    ...overrides,
  }
}

describe('buildCoachSessionHeadline', () => {
  it('uses the custom template name for custom sessions', () => {
    const session = baseSession({
      mode: 'custom',
      customTemplateId: 'tpl-1',
      customTemplateName: 'Pop-up drills',
    })

    expect(buildCoachSessionHeadline(session)).toBe('Pop-up drills · 0% · 0 attempts')
  })

  it('keeps sea analysis headline for sea analysis sessions', () => {
    const session = baseSession({
      mode: 'sea-analysis',
      seaAnalysis: {
        timerStartedAt: '2026-07-27T10:00:00.000Z',
        endedAt: '2026-07-27T10:30:00.000Z',
        logs: [],
      },
    })

    expect(buildCoachSessionHeadline(session)).toBe('Sea analysis completed')
  })
})

describe('session history agenda helpers', () => {
  it('filters heats and championship together', () => {
    expect(sessionMatchesHistoryFilter('heats', 'heats')).toBe(true)
    expect(sessionMatchesHistoryFilter('campeonato', 'heats')).toBe(true)
    expect(sessionMatchesHistoryFilter('tecnico', 'heats')).toBe(false)
    expect(sessionMatchesHistoryFilter('custom', 'other')).toBe(true)
  })

  it('builds a success metric for technical sessions', () => {
    const session = baseSession({
      waves: [
        {
          id: 'w1',
          athleteId: 'a1',
          hasPotential: true,
          outcome: 'surfed',
          classified: true,
          multiManeuver: false,
          startedAt: '2026-07-27T10:10:00.000Z',
          maneuvers: [
            {
              id: 'm1',
              kind: 'rail',
              level: 2,
              side: 'frontside',
              success: true,
              at: '2026-07-27T10:10:00.000Z',
            },
          ],
          comboAttempts: [],
        },
      ],
    })
    expect(buildCoachSessionAgendaMetric(session)).toEqual({ value: '100%', kind: 'success' })
  })

  it('groups sessions by month newest groups first when sessions are sorted', () => {
    const sessions = [
      baseSession({
        id: 'nov',
        endedAt: '2025-11-26T12:00:00.000Z',
        startedAt: '2025-11-26T11:00:00.000Z',
      }),
      baseSession({
        id: 'oct',
        endedAt: '2025-10-30T12:00:00.000Z',
        startedAt: '2025-10-30T11:00:00.000Z',
      }),
    ]
    const groups = groupSessionsByMonth(sessions)
    expect(groups.map((g) => g.key)).toEqual(['2025-11', '2025-10'])
    expect(groups[0]?.sessions.map((s) => s.id)).toEqual(['nov'])
  })
})
