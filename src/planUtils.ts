import type { PlanId } from './plans'
import { getPlan } from './plans'
import type { TrainingMode } from './types'

const TEAM_MODES: TrainingMode[] = ['tecnico', 'combos', 'heats', 'campeonato']
const PREMIUM_MODES: TrainingMode[] = ['tecnico', 'combos', 'custom', 'heats', 'campeonato', 'sea-analysis']

export function getAllowedModes(planId: PlanId): TrainingMode[] {
  switch (planId) {
    case 'team':
      return TEAM_MODES
    case 'club':
    case 'organization':
      return PREMIUM_MODES
    default:
      return TEAM_MODES
  }
}

export function canUseTrainingMode(planId: PlanId, mode: TrainingMode): boolean {
  return getAllowedModes(planId).includes(mode)
}

export function canAccessTeamAnalytics(planId: PlanId): boolean {
  return planId === 'team' || planId === 'club' || planId === 'organization'
}

export function canUseCustomTraining(planId: PlanId): boolean {
  return canUseTrainingMode(planId, 'custom')
}

export function canManageOrganizationCoaches(planId: PlanId): boolean {
  return planId === 'organization'
}

export function getMaxAthletes(planId: PlanId): number | null {
  return getPlan(planId).maxAthletes
}

export function getMaxCoaches(planId: PlanId): number {
  return getPlan(planId).maxCoaches
}

export function canAddAthlete(planId: PlanId, activeAthleteCount: number): boolean {
  const max = getMaxAthletes(planId)
  if (max === null) return true
  return activeAthleteCount < max
}

export function canAddCoach(planId: PlanId, activeCoachCount: number): boolean {
  const max = getMaxCoaches(planId)
  return activeCoachCount < max
}

export function athleteLimitMessage(planId: PlanId): string {
  const max = getMaxAthletes(planId)
  if (max === null) return 'Unlimited athletes'
  return `Up to ${max} athletes on ${getPlan(planId).name}`
}

export function coachSeatLimitMessage(planId: PlanId): string {
  const max = getMaxCoaches(planId)
  if (max <= 1) return '1 coach account'
  return `Up to ${max} coach accounts on ${getPlan(planId).name}`
}

export function planUpgradeHint(
  planId: PlanId,
  feature: 'analytics' | 'custom' | 'heats' | 'sea' | 'athletes' | 'coaches',
): string {
  if (feature === 'analytics' && !canAccessTeamAnalytics(planId)) {
    return 'Available on Coach plan and above.'
  }
  if (feature === 'custom' && !canUseCustomTraining(planId)) {
    return 'Custom training templates are available on Coach Premium and Team Academy plans.'
  }
  if (feature === 'heats' && !canUseTrainingMode(planId, 'heats')) {
    return 'Available on Coach plan and above.'
  }
  if (feature === 'sea' && planId === 'team') {
    return 'Available on Coach Premium and Team Academy plans.'
  }
  if (feature === 'athletes' && planId === 'team') {
    return 'Upgrade to Coach Premium or Team Academy for unlimited athletes.'
  }
  if (feature === 'coaches' && !canManageOrganizationCoaches(planId)) {
    return 'Multiple coach accounts are available on the Team Academy plan.'
  }
  return 'Upgrade your plan to unlock this feature.'
}
