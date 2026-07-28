/** SurfStar UI always formats dates in English, regardless of browser locale. */
export const APP_LOCALE = 'en-GB'

export function formatAppDate(
  value: string | Date,
  options: Intl.DateTimeFormatOptions,
): string {
  const date = value instanceof Date ? value : new Date(value)
  return date.toLocaleDateString(APP_LOCALE, options)
}

export function formatAppDateTime(
  value: string | Date,
  options: Intl.DateTimeFormatOptions,
): string {
  const date = value instanceof Date ? value : new Date(value)
  return date.toLocaleString(APP_LOCALE, options)
}

export function formatAppTime(
  value: string | Date,
  options: Intl.DateTimeFormatOptions,
): string {
  const date = value instanceof Date ? value : new Date(value)
  return date.toLocaleTimeString(APP_LOCALE, options)
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
