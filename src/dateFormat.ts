import { getLocale } from './i18n/I18nContext'
import type { SupportedLocale } from './i18n/types'

const INTL_LOCALES: Record<SupportedLocale, string> = {
  en: 'en-GB',
  pt: 'pt-PT',
  fr: 'fr-FR',
  es: 'es-ES',
}

export function appIntlLocale(): string {
  return INTL_LOCALES[getLocale()]
}

export function formatAppDate(
  value: string | Date,
  options: Intl.DateTimeFormatOptions,
): string {
  const date = value instanceof Date ? value : new Date(value)
  return date.toLocaleDateString(appIntlLocale(), options)
}

export function formatAppDateTime(
  value: string | Date,
  options: Intl.DateTimeFormatOptions,
): string {
  const date = value instanceof Date ? value : new Date(value)
  return date.toLocaleString(appIntlLocale(), options)
}

export function formatAppTime(
  value: string | Date,
  options: Intl.DateTimeFormatOptions,
): string {
  const date = value instanceof Date ? value : new Date(value)
  return date.toLocaleTimeString(appIntlLocale(), options)
}

export function formatShortDate(value: string | Date): string {
  return formatAppDate(value, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatShortDateTime(value: string | Date): string {
  return formatAppDateTime(value, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatWeekdayShort(value: string | Date): string {
  return formatAppDate(value, { weekday: 'short' })
}

export function formatMonthShort(value: string | Date): string {
  return formatAppDate(value, { month: 'short' })
}

export function formatDayMonth(value: string | Date): string {
  return formatAppDate(value, { day: 'numeric', month: 'short' })
}

/** @deprecated Use appIntlLocale() */
export const APP_LOCALE = 'en-GB'
