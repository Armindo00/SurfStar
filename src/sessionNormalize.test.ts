import { describe, expect, it } from 'vitest'
import { normalizeWaveRecord } from './sessionNormalize'
import type { WaveRecord } from './types'

describe('normalizeWaveRecord', () => {
  it('migrates legacy no-potential waves to classified wasted', () => {
    const raw = {
      id: 'w1',
      athleteId: 'a1',
      startedAt: '2026-11-25T10:00:00.000Z',
      kind: 'no-potential',
      multiManeuver: false,
      maneuvers: [],
      comboAttempts: [],
    } as unknown as WaveRecord

    expect(normalizeWaveRecord(raw)).toMatchObject({
      hasPotential: false,
      outcome: 'wasted',
      classified: true,
    })
  })

  it('treats missing classified as true', () => {
    const raw = {
      id: 'w2',
      athleteId: 'a1',
      startedAt: '2026-11-25T10:00:00.000Z',
      hasPotential: true,
      multiManeuver: true,
      maneuvers: [
        {
          id: 'm1',
          kind: 'rail',
          side: 'frontside',
          level: 1,
          success: true,
          at: '2026-11-25T10:01:00.000Z',
        },
      ],
      comboAttempts: [],
    } as unknown as WaveRecord

    expect(normalizeWaveRecord(raw).classified).toBe(true)
    expect(normalizeWaveRecord(raw).outcome).toBe('surfed')
  })
})
