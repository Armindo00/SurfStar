import { describe, expect, it } from 'vitest'
import { computeWaveStats, waveIsCommitted } from './sessionStats'
import type { TrainingSession, WaveRecord } from './types'

function wave(
  partial: Partial<WaveRecord> & Pick<WaveRecord, 'id' | 'hasPotential' | 'outcome'>,
): WaveRecord {
  return {
    athleteId: 'a1',
    classified: true,
    multiManeuver: true,
    startedAt: '2026-11-24T10:00:00.000Z',
    maneuvers: [],
    comboAttempts: [],
    customAttempts: [],
    ...partial,
  }
}

function session(
  waves: WaveRecord[],
  mode: TrainingSession['mode'] = 'tecnico',
): TrainingSession {
  return {
    id: 's1',
    coachId: 'c1',
    organizationId: 'o1',
    mode,
    athleteIds: ['a1'],
    spotId: 'sp1',
    spotName: 'Test spot',
    condition: 'clean',
    startedAt: '2026-11-24T10:00:00.000Z',
    waves,
    comboEntries: [],
    heats: [],
    seaAnalysis: null,
    endedAt: null,
    coachNotes: null,
  }
}

describe('wave outcome stats', () => {
  it('counts matrix, aproveitamento and valorizacao', () => {
    const waves = [
      wave({
        id: '1',
        hasPotential: true,
        outcome: 'surfed',
        maneuvers: [
          {
            id: 'm1',
            kind: 'rail',
            side: 'frontside',
            level: 1,
            success: true,
            at: '2026-11-24T10:01:00.000Z',
          },
        ],
      }),
      wave({
        id: '1b',
        hasPotential: true,
        outcome: 'surfed',
        maneuvers: [
          {
            id: 'm1b',
            kind: 'rail',
            side: 'frontside',
            level: 1,
            success: false,
            at: '2026-11-24T10:01:30.000Z',
          },
        ],
      }),
      wave({ id: '2', hasPotential: true, outcome: 'wasted' }),
      wave({
        id: '3',
        hasPotential: false,
        outcome: 'surfed',
        maneuvers: [
          {
            id: 'm2',
            kind: 'rail',
            side: 'frontside',
            level: 3,
            success: true,
            at: '2026-11-24T10:02:00.000Z',
          },
        ],
      }),
      wave({
        id: '3b',
        hasPotential: false,
        outcome: 'surfed',
        maneuvers: [
          {
            id: 'm2b',
            kind: 'rail',
            side: 'frontside',
            level: 1,
            success: true,
            at: '2026-11-24T10:02:30.000Z',
          },
        ],
      }),
      wave({ id: '4', hasPotential: false, outcome: 'wasted' }),
    ]

    expect(computeWaveStats(session(waves))).toEqual({
      totalWaves: 6,
      withPotential: 3,
      withoutPotential: 3,
      surfed: 4,
      wasted: 2,
      matrix: {
        potentialSurfed: 2,
        potentialWasted: 1,
        noPotentialSurfed: 2,
        noPotentialWasted: 1,
      },
      wellExecutedPotential: 1,
      valuedNoPotential: 1,
      aproveitamentoRate: 33,
      valorizacaoRate: 50,
    })
  })

  it('ignores draft unclassified waves but keeps legacy missing classified', () => {
    const draft = wave({
      id: 'u',
      hasPotential: true,
      outcome: 'surfed',
      classified: false,
    })
    const legacy = wave({
      id: 'legacy',
      hasPotential: true,
      outcome: 'wasted',
      classified: undefined as unknown as boolean,
    })
    const wasted = wave({ id: 'w', hasPotential: true, outcome: 'wasted' })
    const emptySurfed = wave({ id: 's', hasPotential: true, outcome: 'surfed' })

    expect(computeWaveStats(session([draft, wasted]))).toMatchObject({
      totalWaves: 1,
      withPotential: 1,
      withoutPotential: 0,
      surfed: 0,
      wasted: 1,
      aproveitamentoRate: 0,
      valorizacaoRate: null,
    })
    expect(computeWaveStats(session([legacy]))).toMatchObject({
      totalWaves: 1,
      wasted: 1,
    })
    expect(waveIsCommitted(draft, 'tecnico')).toBe(false)
    expect(waveIsCommitted(wasted, 'tecnico')).toBe(true)
    expect(waveIsCommitted(emptySurfed, 'tecnico')).toBe(false)
  })

  it('combo mode: aproveitamento with complete combos and valorizacao with Comb2+', () => {
    const waves = [
      wave({
        id: 'c1',
        hasPotential: true,
        outcome: 'surfed',
        comboAttempts: [
          {
            id: 'x1',
            side: 'frontside',
            level: 1,
            success: true,
            at: '2026-11-24T10:01:00.000Z',
          },
        ],
      }),
      wave({
        id: 'c1b',
        hasPotential: true,
        outcome: 'surfed',
        comboAttempts: [
          {
            id: 'x1b',
            side: 'frontside',
            level: 2,
            success: false,
            at: '2026-11-24T10:01:30.000Z',
          },
        ],
      }),
      wave({ id: 'c2', hasPotential: true, outcome: 'wasted' }),
      wave({
        id: 'c3',
        hasPotential: false,
        outcome: 'surfed',
        comboAttempts: [
          {
            id: 'x2',
            side: 'frontside',
            level: 2,
            success: true,
            at: '2026-11-24T10:02:00.000Z',
          },
        ],
      }),
      wave({
        id: 'c3b',
        hasPotential: false,
        outcome: 'surfed',
        comboAttempts: [
          {
            id: 'x2b',
            side: 'frontside',
            level: 1,
            success: true,
            at: '2026-11-24T10:02:30.000Z',
          },
        ],
      }),
      wave({
        id: 'c3c',
        hasPotential: false,
        outcome: 'surfed',
        // Técnico would value level 3 maneuvers; combo mode ignores maneuvers.
        maneuvers: [
          {
            id: 'm3',
            kind: 'rail',
            side: 'frontside',
            level: 3,
            success: true,
            at: '2026-11-24T10:02:45.000Z',
          },
        ],
      }),
    ]

    expect(computeWaveStats(session(waves, 'combos'))).toMatchObject({
      withPotential: 3,
      wellExecutedPotential: 1,
      aproveitamentoRate: 33,
      valuedNoPotential: 1,
      valorizacaoRate: 33,
      matrix: {
        noPotentialSurfed: 3,
      },
    })
  })
})
