import type { PlanId } from './plans'
import { getPlan } from './plans'
import type { TrainingMode } from './types'

const STARTER_MODES: TrainingMode[] = ['tecnico', 'combos']
const TEAM_MODES: TrainingMode[] = ['tecnico', 'combos']
const CLUB_MODES: TrainingMode[] = ['tecnico', 'combos', 'heats', 'campeonato', 'sea-analysis']

export function getAllowedModes(planId: PlanId): TrainingMode[] {
  switch (planId) {
    case 'starter':
      return STARTER_MODES
    case 'team':
      return TEAM_MODES
    case 'club':
      return CLUB_MODES
    default:
      return STARTER_MODES
  }
}

export function canUseTrainingMode(planId: PlanId, mode: TrainingMode): boolean {
  return getAllowedModes(planId).includes(mode)
}

export function canAccessTeamAnalytics(planId: PlanId): boolean {
  return planId === 'team' || planId === 'club'
}

export function getMaxAthletes(planId: PlanId): number | null {
  return getPlan(planId).maxAthletes
}

export function canAddAthlete(planId: PlanId, activeAthleteCount: number): boolean {
  const max = getMaxAthletes(planId)
  if (max === null) return true
  return activeAthleteCount < max
}

export function athleteLimitMessage(planId: PlanId): string {
  const max = getMaxAthletes(planId)
  if (max === null) return 'Atletas ilimitados'
  return `Até ${max} atletas no pack ${getPlan(planId).name}`
}

export function planUpgradeHint(planId: PlanId, feature: 'analytics' | 'heats' | 'sea' | 'athletes'): string {
  if (feature === 'analytics' && !canAccessTeamAnalytics(planId)) {
    return 'Disponível a partir do pack Team.'
  }
  if ((feature === 'heats' || feature === 'sea') && planId !== 'club') {
    return 'Disponível no pack Club.'
  }
  if (feature === 'athletes' && planId === 'starter') {
    return 'Faz upgrade para Team (20 atletas) ou Club (ilimitado).'
  }
  return 'Faz upgrade de pack para desbloquear.'
}
