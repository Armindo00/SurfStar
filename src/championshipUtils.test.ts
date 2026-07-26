import { describe, expect, it } from 'vitest'
import {
  advancesFromHeat,
  buildInitialChampionshipHeats,
  getHeatWinners,
  partitionHeatSizes,
  previewBracketRounds,
  processChampionshipRoundAdvance,
  splitAthletesIntoHeats,
} from './championshipUtils'
import type { HeatRecord } from './types'

function mockFinishedHeat(
  athleteIds: string[],
  scores: Record<string, number>,
  round = 1,
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

  it('advances 1 from heat of 2 and 2 from heat of 4', () => {
    expect(advancesFromHeat(2, 2)).toBe(1)
    expect(advancesFromHeat(4, 4)).toBe(2)
    expect(advancesFromHeat(4, 3)).toBe(2)
  })

  it('builds initial bracket heats', () => {
    const heats = buildInitialChampionshipHeats(['a', 'b', 'c', 'd', 'e'], 4, 15)
    expect(heats).toHaveLength(2)
    expect(heats[0]?.athleteIds).toHaveLength(3)
    expect(heats[1]?.athleteIds).toHaveLength(2)
  })

  it('creates final when two winners remain', () => {
    const h1 = mockFinishedHeat(['a', 'b'], { a: 15, b: 10 })
    const h2 = mockFinishedHeat(['c', 'd'], { c: 12, d: 8 }, 1)
    const result = processChampionshipRoundAdvance(
      [h1, h2],
      { heatSize: 2, status: 'active', championAthleteId: null },
      15,
    )
    expect(result.advancedToNextRound).toBe(true)
    expect(result.heats).toHaveLength(3)
    expect(result.heats[2]?.label).toBe('Final')
    expect(result.heats[2]?.athleteIds).toEqual(['a', 'c'])
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

  it('picks heat winners by total score', () => {
    const heat = mockFinishedHeat(['a', 'b', 'c', 'd'], { a: 10, b: 18, c: 16, d: 8 })
    expect(getHeatWinners(heat, 4)).toEqual(['b', 'c'])
  })
})
