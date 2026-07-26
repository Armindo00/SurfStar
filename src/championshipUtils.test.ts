import { describe, expect, it } from 'vitest'
import {
  advancesFromHeat,
  buildFullChampionshipBracket,
  buildInitialChampionshipHeats,
  describeFullBracket,
  getHeatWinners,
  isValidChampionshipField,
  partitionHeatSizes,
  previewBracketRounds,
  processChampionshipRoundAdvance,
  roundHeatsReadyToStart,
  roundHeatsRunning,
  roundSupportsParallelRun,
  simulateBracketStructure,
  splitAthletesIntoHeats,
} from './championshipUtils'
import type { HeatRecord } from './types'

function mockFinishedHeat(
  athleteIds: string[],
  scores: Record<string, number>,
  round = 1,
  extra: Partial<HeatRecord> = {},
): HeatRecord {
  return {
    id: crypto.randomUUID(),
    label: 'Heat',
    athleteIds,
    durationMinutes: 15,
    timerStartedAt: new Date().toISOString(),
    endedAt: new Date().toISOString(),
    round,
    waveScores: Object.entries(scores).map(([athleteId, score]) => ({
      id: crypto.randomUUID(),
      athleteId,
      score,
      at: new Date().toISOString(),
    })),
    interferences: [],
    ...extra,
  }
}

describe('championshipUtils', () => {
  it('splits 8 athletes into quarterfinal heats of 4', () => {
    const groups = splitAthletesIntoHeats(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], 4)
    expect(groups).toEqual([
      ['a', 'b', 'c', 'd'],
      ['e', 'f', 'g', 'h'],
    ])
    const heats = buildInitialChampionshipHeats(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], 4, 15)
    expect(heats[0]?.label).toMatch(/^Quarterfinal/)
  })

  it('splits 9 athletes into three heats of 3', () => {
    expect(partitionHeatSizes(9, 4)).toEqual([3, 3, 3])
  })

  it('splits 7 athletes into 4+3 for heat size 4', () => {
    const groups = splitAthletesIntoHeats(['a', 'b', 'c', 'd', 'e', 'f', 'g'], 4)
    expect(groups).toEqual([
      ['a', 'b', 'c', 'd'],
      ['e', 'f', 'g'],
    ])
  })

  it('never creates heats of 1 surfer for any field size', () => {
    for (const heatSize of [2, 4] as const) {
      for (let count = 2; count <= 24; count++) {
        expect(isValidChampionshipField(count, heatSize)).toBe(true)

        const structure = simulateBracketStructure(count, heatSize)
        expect(structure.length).toBeGreaterThan(0)
        for (const round of structure) {
          for (const size of round.heatSizes) {
            expect(size).toBeGreaterThanOrEqual(2)
          }
        }

        const heats = buildFullChampionshipBracket(
          Array.from({ length: count }, (_, index) => `a${index}`),
          heatSize,
          15,
        )
        expect(heats.length).toBeGreaterThan(0)
        for (const heat of heats) {
          const capacity = heat.bracketCapacity ?? heat.athleteIds.length
          expect(capacity).toBeGreaterThanOrEqual(2)
        }
      }
    }
  })

  it('balances odd fields in 2-mode without solo heats', () => {
    expect(partitionHeatSizes(5, 2)).toEqual([3, 2])
    expect(partitionHeatSizes(7, 2)).toEqual([3, 2, 2])
    expect(simulateBracketStructure(3, 2)).toEqual([
      { round: 1, label: 'Final', heatSizes: [3], isFinal: true },
    ])
  })

  it('describes the full bracket for 6 surfers', () => {
    expect(describeFullBracket(6, 4)).toBe(
      'Quarterfinal: 2 heats of 3 → Semifinal: 1 heat of 4 → Final: 1 heat of 2',
    )
  })

  it('rejects fields smaller than 2 surfers', () => {
    expect(isValidChampionshipField(1, 4)).toBe(false)
    expect(partitionHeatSizes(1, 4)).toEqual([])
  })

  it('advances 1 from heat of 2 and 2 from heat of 4', () => {
    expect(advancesFromHeat(2, 2)).toBe(1)
    expect(advancesFromHeat(4, 4)).toBe(2)
    expect(advancesFromHeat(4, 3)).toBe(2)
    expect(advancesFromHeat(2, 1)).toBe(0)
  })

  it('builds full bracket for 6 surfers: 2×3 → semi of 4 → final of 2', () => {
    const ids = ['a', 'b', 'c', 'd', 'e', 'f']
    const structure = simulateBracketStructure(6, 4)
    expect(structure).toHaveLength(3)
    expect(structure[0]?.heatSizes).toEqual([3, 3])
    expect(structure[1]?.heatSizes).toEqual([4])
    expect(structure[2]?.isFinal).toBe(true)

    const heats = buildFullChampionshipBracket(ids, 4, 15)
    expect(heats).toHaveLength(4)
    expect(heats.filter((h) => h.round === 1)).toHaveLength(2)
    expect(heats.filter((h) => h.round === 2)).toHaveLength(1)
    expect(heats.filter((h) => h.round === 3)).toHaveLength(1)
    expect(heats[2]?.bracketLocked).toBe(true)
    expect(heats[2]?.bracketCapacity).toBe(4)
    expect(heats[3]?.isFinal).toBe(true)
    expect(heats[3]?.bracketLocked).toBe(true)
  })

  it('builds initial bracket heats', () => {
    const heats = buildInitialChampionshipHeats(['a', 'b', 'c', 'd', 'e'], 4, 15)
    expect(heats.length).toBeGreaterThan(2)
    expect(heats[0]?.athleteIds).toHaveLength(3)
    expect(heats[1]?.athleteIds).toHaveLength(2)
  })

  it('fills pre-built final when opening round completes', () => {
    const bracket = buildFullChampionshipBracket(['a', 'b', 'c', 'd'], 2, 15)
    const done1 = mockFinishedHeat(['a', 'b'], { a: 15, b: 10 }, 1, { id: bracket[0]!.id })
    const done2 = mockFinishedHeat(['c', 'd'], { c: 12, d: 8 }, 1, { id: bracket[1]!.id })
    const finalSlot = bracket[2]!
    const result = processChampionshipRoundAdvance(
      [done1, done2, finalSlot],
      { heatSize: 2, status: 'active', championAthleteId: null },
      15,
    )
    expect(result.advancedToNextRound).toBe(true)
    const final = result.heats.find((h) => h.isFinal)
    expect(final?.label).toBe('Final')
    expect(final?.athleteIds).toEqual(['a', 'c'])
    expect(final?.bracketLocked).toBe(false)
  })

  it('crowns champion after final heat', () => {
    const final = mockFinishedHeat(['a', 'b'], { a: 16, b: 14 }, 2)
    final.isFinal = true
    final.label = 'Final'
    const result = processChampionshipRoundAdvance(
      [final],
      { heatSize: 2, status: 'active', championAthleteId: null },
      15,
    )
    expect(result.championship.status).toBe('complete')
    expect(result.championship.championAthleteId).toBe('a')
  })

  it('previews bracket rounds for 8 surfers in 4-mode', () => {
    expect(previewBracketRounds(8, 4)).toEqual(['Quarterfinal', 'Semifinal', 'Final'])
  })

  it('previews bracket rounds for 6 surfers in 4-mode', () => {
    expect(previewBracketRounds(6, 4)).toEqual(['Quarterfinal', 'Semifinal', 'Final'])
  })

  it('detects parallel-ready heats in the same round', () => {
    const heats = buildFullChampionshipBracket(
      ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
      4,
      15,
    )
    expect(roundSupportsParallelRun(heats, 1)).toBe(true)
    expect(roundHeatsReadyToStart(heats, 1)).toHaveLength(2)
    expect(roundHeatsRunning(heats, 1)).toHaveLength(0)
  })

  it('picks heat winners by total score', () => {
    const heat = mockFinishedHeat(['a', 'b', 'c', 'd'], { a: 10, b: 18, c: 16, d: 8 })
    expect(getHeatWinners(heat, 4)).toEqual(['b', 'c'])
  })
})
