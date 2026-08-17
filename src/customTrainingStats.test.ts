import { describe, expect, it } from 'vitest'
import { averageCustomButtonLevel, computeCustomSessionStats } from './customTrainingStats'
import {
  createCustomButton,
  createCustomLevel,
  createEmptyCustomTemplate,
  snapshotCustomTemplate,
} from './customTrainingUtils'
import type { CustomAttemptLog, TrainingSession } from './types'

describe('averageCustomButtonLevel', () => {
  it('returns null when the button has no levels', () => {
    const button = createCustomButton({ levels: [] })
    expect(averageCustomButtonLevel([], button)).toBeNull()
  })

  it('averages level positions for attempts with levelId', () => {
    const button = createCustomButton({
      levels: [
        createCustomLevel('1', 0),
        createCustomLevel('2', 1),
        createCustomLevel('3', 2),
      ],
    })
    const logs: CustomAttemptLog[] = [
      { id: 'a1', buttonId: button.id, levelId: button.levels[0].id, success: true, at: '2026-08-07T10:00:00.000Z' },
      { id: 'a2', buttonId: button.id, levelId: button.levels[2].id, success: false, at: '2026-08-07T10:01:00.000Z' },
    ]

    expect(averageCustomButtonLevel(logs, button)).toBe(2)
  })
})

describe('computeCustomSessionStats', () => {
  it('includes average level per button', () => {
    const button = createCustomButton({
      label: 'Bottom',
      levels: [createCustomLevel('1', 0), createCustomLevel('2', 1)],
    })
    const template = snapshotCustomTemplate({
      ...createEmptyCustomTemplate('Basic'),
      buttons: [button],
    })

    const session = {
      id: 's1',
      mode: 'custom' as const,
      organizationId: 'org-1',
      coachId: 'coach-1',
      spotId: 'spot-1',
      spotName: 'Offshore',
      condition: 'Clean',
      athleteIds: ['athlete-1'],
      startedAt: '2026-08-07T09:00:00.000Z',
      comboEntries: [],
      heats: [],
      seaAnalysis: null,
      endedAt: null,
      coachNotes: null,
      customTemplateId: template.id,
      customTemplateName: template.name,
      customTemplateSnapshot: template,
      waves: [
        {
          id: 'w1',
          athleteId: 'athlete-1',
          hasPotential: true,
          multiManeuver: false,
          startedAt: '2026-08-07T10:00:00.000Z',
          maneuvers: [],
          comboAttempts: [],
          customAttempts: [
            {
              id: 'a1',
              buttonId: button.id,
              levelId: button.levels[0].id,
              success: true,
              at: '2026-08-07T10:00:00.000Z',
            },
            {
              id: 'a2',
              buttonId: button.id,
              levelId: button.levels[1].id,
              success: true,
              at: '2026-08-07T10:01:00.000Z',
            },
          ],
        },
      ],
    } satisfies TrainingSession

    const stats = computeCustomSessionStats(session, 'athlete-1')
    expect(stats.byButton[0]?.averageLevel).toBe(1.5)
    expect(stats.byButton[0]?.rate).toBe(100)
  })
})
