import type { ComboLevel, ManeuverKind, ManeuverLevel, TrainingMode } from '../types'
import { getLocale, setLocaleGlobal } from './I18nContext'
import { getMessages } from './messages'
import type { SupportedLocale } from './types'

export function trainingModeLabel(mode: TrainingMode | string, locale = getLocale()): string {
  const messages = getMessages(locale)
  if (mode in messages.trainingModes) {
    return messages.trainingModes[mode as TrainingMode]
  }
  return String(mode)
}

export function maneuverLabel(kind: ManeuverKind, locale = getLocale()): string {
  return getMessages(locale).maneuvers[kind]
}

export function comboLevelLabel(level: ComboLevel, locale = getLocale()): string {
  return getMessages(locale).comboLevels[level]
}

export function levelLabel(level: ManeuverLevel, locale = getLocale()): string {
  return getMessages(locale).levels[level]
}

export function levelLabelEn(level: ManeuverLevel, locale = getLocale()): string {
  if (level === 'estrela') {
    const star: Record<SupportedLocale, string> = {
      en: 'Star ★',
      pt: 'Estrela ★',
      fr: 'Étoile ★',
      es: 'Estrella ★',
    }
    return star[locale]
  }
  const prefix: Record<SupportedLocale, string> = {
    en: 'Level',
    pt: 'Nível',
    fr: 'Niveau',
    es: 'Nivel',
  }
  return `${prefix[locale]} ${level}`
}

export { getLocale, setLocaleGlobal as setLocale }
export type { SupportedLocale }
