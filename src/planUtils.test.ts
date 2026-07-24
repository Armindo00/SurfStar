import { describe, expect, it } from 'vitest'
import {
  canAccessTeamAnalytics,
  canAddAthlete,
  canUseTrainingMode,
  getAllowedModes,
} from './planUtils'

describe('planUtils', () => {
  it('starter allows basic modes only', () => {
    expect(getAllowedModes('starter')).toEqual(['tecnico', 'combos'])
    expect(canUseTrainingMode('starter', 'heats')).toBe(false)
  })

  it('club allows all modes', () => {
    expect(canUseTrainingMode('club', 'sea-analysis')).toBe(true)
    expect(canUseTrainingMode('club', 'campeonato')).toBe(true)
  })

  it('enforces athlete limits', () => {
    expect(canAddAthlete('starter', 4)).toBe(true)
    expect(canAddAthlete('starter', 5)).toBe(false)
    expect(canAddAthlete('club', 999)).toBe(true)
  })

  it('gates team analytics by plan', () => {
    expect(canAccessTeamAnalytics('starter')).toBe(false)
    expect(canAccessTeamAnalytics('team')).toBe(true)
  })
})
