import { getAppSiteUrl } from './config'
import { getLocale } from './i18n'
import { getMessages } from './i18n/messages'
import type { SupportedLocale } from './i18n/types'
import { trainingModeLabel } from './i18n/labels'
import type { PlanId } from './plans'
import type { TrainingMode } from './types'

export type TrainingHelpGuide = {
  mode: TrainingMode
  planLabel: string
  summary: string
  steps: readonly string[]
}

function interpolate(template: string, params: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) => params[name] ?? '')
}

export function getCoachQuickTips(locale: SupportedLocale = getLocale()): readonly string[] {
  return getMessages(locale).help.coachQuickTips
}

export function getTrainingHelpGuides(locale: SupportedLocale = getLocale()): TrainingHelpGuide[] {
  const guides = getMessages(locale).help.trainingGuides
  return (Object.keys(guides) as TrainingMode[]).map((mode) => ({
    mode,
    ...guides[mode],
  }))
}

/** @deprecated Use getTrainingHelpGuides(locale) */
export const TRAINING_HELP_GUIDES: TrainingHelpGuide[] = getTrainingHelpGuides()

/** @deprecated Use getCoachQuickTips(locale) */
export const COACH_QUICK_TIPS = [...getCoachQuickTips()]

export function getAthleteHelpSections(locale: SupportedLocale = getLocale()) {
  const help = getMessages(locale).athlete.help
  return [help.pairingCode, help.statsFromCoaches, help.leavingCoach]
}

/** @deprecated Use getAthleteHelpSections(locale) */
export const ATHLETE_HELP_SECTIONS = getAthleteHelpSections()

export function getInstallHelp(locale: SupportedLocale = getLocale()) {
  const install = getMessages(locale).help.install
  const siteHost = getAppSiteUrl().replace(/^https?:\/\//, '')
  return {
    title: install.title,
    lead: install.lead,
    iphone: {
      title: install.iphone.title,
      steps: install.iphone.steps.map((step) => interpolate(step, { siteHost })),
    },
    android: {
      title: install.android.title,
      steps: install.android.steps.map((step) => interpolate(step, { siteHost })),
    },
    note: install.note,
  }
}

/** @deprecated Use getInstallHelp(locale) */
export const INSTALL_HELP = getInstallHelp()

export function trainingGuideLabel(mode: TrainingMode): string {
  return trainingModeLabel(mode)
}

export function planBadgeForMode(
  mode: TrainingMode,
  planId: PlanId,
  locale: SupportedLocale = getLocale(),
): string | null {
  const guides = getMessages(locale).help.trainingGuides
  const labels = getMessages(locale).plans.planLabels
  const guide = guides[mode]
  if (!guide) return null
  if (mode === 'tecnico' || mode === 'combos') return null
  if (
    (mode === 'heats' || mode === 'campeonato') &&
    (planId === 'team' || planId === 'club' || planId === 'organization')
  ) {
    return labels.includedInPlan
  }
  if (mode === 'custom' || mode === 'sea-analysis') {
    return planId === 'club' || planId === 'organization' ? labels.includedInPlan : guide.planLabel
  }
  if (mode === 'heats' || mode === 'campeonato') return guide.planLabel
  return guide.planLabel
}
