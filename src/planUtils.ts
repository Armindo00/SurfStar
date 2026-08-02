import type { PlanId } from './plans'
import { getPlan } from './plans'
import { getLocale } from './i18n'
import { getMessages } from './i18n/messages'
import type { SupportedLocale } from './i18n/types'
import type { TrainingMode } from './types'

const TEAM_MODES: TrainingMode[] = ['tecnico', 'combos', 'heats', 'campeonato']
const PREMIUM_MODES: TrainingMode[] = ['tecnico', 'combos', 'custom', 'heats', 'campeonato', 'sea-analysis']

function interpolate(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) =>
    params[name] == null ? '' : String(params[name]),
  )
}

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

/** Post-session psychology questionnaire — Coach Premium & Team Academy only. */
export function canUsePsychologyCheckins(planId: PlanId): boolean {
  return planId === 'club' || planId === 'organization'
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

export function athleteLimitMessage(planId: PlanId, locale: SupportedLocale = getLocale()): string {
  const { limits } = getMessages(locale).plans
  const max = getMaxAthletes(planId)
  if (max === null) return limits.unlimitedAthletes
  return interpolate(limits.upToAthletes, { max, planName: getPlan(planId).name })
}

export function coachSeatLimitMessage(planId: PlanId, locale: SupportedLocale = getLocale()): string {
  const { limits } = getMessages(locale).plans
  const max = getMaxCoaches(planId)
  if (max <= 1) return limits.oneCoachAccount
  return interpolate(limits.upToCoachAccounts, { max, planName: getPlan(planId).name })
}

export function planUpgradeHint(
  planId: PlanId,
  feature: 'analytics' | 'custom' | 'heats' | 'sea' | 'athletes' | 'coaches' | 'psychology',
  locale: SupportedLocale = getLocale(),
): string {
  const hints = getMessages(locale).plans.upgradeHints

  if (feature === 'analytics' && !canAccessTeamAnalytics(planId)) {
    return hints.analytics
  }
  if (feature === 'custom' && !canUseCustomTraining(planId)) {
    return hints.custom
  }
  if (feature === 'heats' && !canUseTrainingMode(planId, 'heats')) {
    return hints.heats
  }
  if (feature === 'sea' && planId === 'team') {
    return hints.sea
  }
  if (feature === 'athletes' && planId === 'team') {
    return hints.athletes
  }
  if (feature === 'coaches' && !canManageOrganizationCoaches(planId)) {
    return hints.coaches
  }
  if (feature === 'psychology' && !canUsePsychologyCheckins(planId)) {
    return hints.psychology
  }
  return hints.generic
}
