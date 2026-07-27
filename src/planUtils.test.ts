import { describe, expect, it } from 'vitest'
import {
  canAccessTeamAnalytics,
  canAddAthlete,
  canAddCoach,
  canManageOrganizationCoaches,
  canUsePsychologyCheckins,
  canUseTrainingMode,
  getAllowedModes,
  getMaxCoaches,
} from './planUtils'

describe('planUtils', () => {
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

  it('organization allows premium modes and multiple coaches', () => {
    expect(canUseTrainingMode('organization', 'sea-analysis')).toBe(true)
    expect(canUseTrainingMode('organization', 'custom')).toBe(true)
    expect(canManageOrganizationCoaches('organization')).toBe(true)
    expect(getMaxCoaches('organization')).toBe(5)
  })

  it('enforces athlete limits', () => {
    expect(canAddAthlete('team', 19)).toBe(true)
    expect(canAddAthlete('team', 20)).toBe(false)
    expect(canAddAthlete('club', 999)).toBe(true)
    expect(canAddAthlete('organization', 999)).toBe(true)
  })

  it('enforces coach seat limits', () => {
    expect(canAddCoach('team', 0)).toBe(true)
    expect(canAddCoach('team', 1)).toBe(false)
    expect(canAddCoach('organization', 4)).toBe(true)
    expect(canAddCoach('organization', 5)).toBe(false)
  })

  it('gates team analytics by plan', () => {
    expect(canAccessTeamAnalytics('team')).toBe(true)
    expect(canAccessTeamAnalytics('organization')).toBe(true)
  })

  it('gates psychology check-ins to premium plans', () => {
    expect(canUsePsychologyCheckins('team')).toBe(false)
    expect(canUsePsychologyCheckins('club')).toBe(true)
    expect(canUsePsychologyCheckins('organization')).toBe(true)
  })
})
