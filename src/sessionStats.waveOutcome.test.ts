import { describe, expect, it } from 'vitest'
import { computeWaveStats, waveIsCommitted } from './sessionStats'
import type { TrainingSession, WaveRecord } from './types'

function wave(partial: Partial<WaveRecord> & Pick<WaveRecord, 'id' | 'hasPotential' | 'outcome'>): WaveRecord {
  return {
    athleteId: 'a1',
    multiManeuver: true,
    startedAt: '2026-11-24T10:00:00.000Z',
    maneuvers: [],
    comboAttempts: [],
    customAttempts: [],
    ...partial,
  }
}

function session(waves: WaveRecord[]): TrainingSession {
  return {
    id: 's1',
    coachId: 'c1',
    organizationId: 'o1',
    mode: 'tecnico',
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
  it('counts potential and outcome independently', () => {
    const waves = [
      wave({ id: '1', hasPotential: true, outcome: 'surfed', maneuvers: [
        { id: 'm1', kind: 'rail', side: 'frontside', level: 1, success: true, at: '2026-11-24T10:01:00.000Z' },
      ] }),
      wave({ id: '2', hasPotential: true, outcome: 'wasted' }),
      wave({ id: '3', hasPotential: false, outcome: 'surfed', maneuvers: [
        { id: 'm2', kind: 'rail', side: 'frontside', level: 1, success: false, at: '2026-11-24T10:02:00.000Z' },
      ] }),
      wave({ id: '4', hasPotential: false, outcome: 'wasted' }),
    ]

    expect(computeWaveStats(session(waves))).toEqual({
      totalWaves: 4,
      withPotential: 2,
      withoutPotential: 2,
      surfed: 2,
      wasted: 2,
    })
  })

  it('treats wasted waves as committed even without attempts', () => {
    const wasted = wave({ id: 'w', hasPotential: true, outcome: 'wasted' })
    const emptySurfed = wave({ id: 's', hasPotential: true, outcome: 'surfed' })
    expect(waveIsCommitted(wasted, 'tecnico')).toBe(true)
    expect(waveIsCommitted(emptySurfed, 'tecnico')).toBe(false)
  })
})
