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

  it('team allows analytics, heats and championship but not custom training', () => {
    expect(getAllowedModes('team')).toEqual(['tecnico', 'combos', 'heats', 'campeonato'])
    expect(canUseTrainingMode('team', 'heats')).toBe(true)
    expect(canUseTrainingMode('team', 'campeonato')).toBe(true)
    expect(canUseTrainingMode('team', 'custom')).toBe(false)
  })

  it('club allows premium modes', () => {
    expect(canUseTrainingMode('club', 'sea-analysis')).toBe(true)
    expect(canUseTrainingMode('club', 'campeonato')).toBe(true)
    expect(canUseTrainingMode('club', 'custom')).toBe(true)
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
