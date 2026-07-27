import { describe, expect, it } from 'vitest'
import { buildCoachSessionHeadline } from './sessionHistoryUtils'
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
