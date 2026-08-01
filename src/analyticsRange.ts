import { formatDayMonth, formatMonthShort, formatShortDate, formatWeekdayShort } from './dateFormat'
import type { AnalyticsPeriod } from './teamAnalyticsStats'
import { ANALYTICS_PERIOD_OPTIONS, TEAM_ANALYTICS_MONTHS } from './teamAnalyticsStats'

export type AnalyticsPresetPeriod = AnalyticsPeriod

export type AnalyticsRange =
  | { kind: 'preset'; period: AnalyticsPresetPeriod }
  | { kind: 'custom'; fromDate: string; toDate: string; title: string }

export function presetAnalyticsRange(period: AnalyticsPresetPeriod = '6m'): AnalyticsRange {
  return { kind: 'preset', period }
}

export function customAnalyticsRange(fromDate: string, toDate: string, title = ''): AnalyticsRange {
  return { kind: 'custom', fromDate, toDate, title: title.trim() }
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

export function isoDateDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().slice(0, 10)
}

export function defaultCustomDateBounds(): { fromDate: string; toDate: string } {
  return { fromDate: isoDateDaysAgo(9), toDate: todayIsoDate() }
}

export function defaultCustomAnalyticsRange(): AnalyticsRange {
  const { fromDate, toDate } = defaultCustomDateBounds()
  return customAnalyticsRange(fromDate, toDate)
}

function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function normalizeCustomDateRange(fromDate: string, toDate: string): { fromDate: string; toDate: string } {
  const from = parseIsoDate(fromDate)
  const to = parseIsoDate(toDate)
  from.setHours(0, 0, 0, 0)
  to.setHours(23, 59, 59, 999)
  if (from.getTime() <= to.getTime()) {
    return { fromDate, toDate }
  }
  return { fromDate: toDate, toDate: fromDate }
}

export function parseAnalyticsRangeBounds(range: AnalyticsRange): { start: Date; end: Date } {
  if (range.kind === 'custom') {
    const normalized = normalizeCustomDateRange(range.fromDate, range.toDate)
    const start = parseIsoDate(normalized.fromDate)
    start.setHours(0, 0, 0, 0)
    const end = parseIsoDate(normalized.toDate)
    end.setHours(23, 59, 59, 999)
    return { start, end }
  }

  const end = new Date()
  end.setHours(23, 59, 59, 999)
  const start = new Date()
  start.setHours(0, 0, 0, 0)

  if (range.period === '6m') {
    start.setMonth(start.getMonth() - TEAM_ANALYTICS_MONTHS)
  } else if (range.period === '1m') {
    start.setMonth(start.getMonth() - 1)
  } else {
    start.setDate(start.getDate() - 7)
  }

  return { start, end }
}

export function sessionTimestamp(session: { endedAt?: string | null; startedAt: string }): number {
  return new Date(session.endedAt ?? session.startedAt).getTime()
}

export function isTimestampInAnalyticsRange(iso: string, range: AnalyticsRange): boolean {
  const { start, end } = parseAnalyticsRangeBounds(range)
  const when = new Date(iso).getTime()
  return when >= start.getTime() && when <= end.getTime()
}

export function describeAnalyticsRange(range: AnalyticsRange): string {
  if (range.kind === 'preset') {
    return ANALYTICS_PERIOD_OPTIONS.find((option) => option.id === range.period)?.shortLabel ?? range.period
  }
  const normalized = normalizeCustomDateRange(range.fromDate, range.toDate)
  return `${formatShortDate(normalized.fromDate)} – ${formatShortDate(normalized.toDate)}`
}

export function describeAnalyticsRangeLong(range: AnalyticsRange): string {
  if (range.kind === 'custom' && range.title) return range.title
  if (range.kind === 'preset') {
    return ANALYTICS_PERIOD_OPTIONS.find((option) => option.id === range.period)?.label ?? 'Custom period'
  }
  return `Custom range · ${describeAnalyticsRange(range)}`
}

export function evolutionColumnLabel(range: AnalyticsRange): string {
  if (range.kind === 'preset') {
    if (range.period === '6m') return 'Month'
    if (range.period === '1m') return 'Week'
    return 'Day'
  }

  const { start, end } = parseAnalyticsRangeBounds(range)
  const dayCount = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1
  if (dayCount <= 14) return 'Day'
  if (dayCount <= 90) return 'Week'
  return 'Month'
}

export function evolutionChartTitle(range: AnalyticsRange): string {
  if (range.kind === 'preset') {
    if (range.period === '6m') return 'Evolution over 6 months'
    if (range.period === '1m') return 'Evolution over 4 weeks'
    return 'Evolution over 7 days'
  }
  return `Evolution · ${describeAnalyticsRange(range)}`
}

type EvolutionSlot = {
  periodKey: string
  label: string
  match: (iso: string) => boolean
}

function dayKeyFromIso(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10)
}

function monthKeyFromIso(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function eachDayBetween(start: Date, end: Date): Date[] {
  const days: Date[] = []
  const cursor = new Date(start)
  cursor.setHours(0, 0, 0, 0)
  const endDay = new Date(end)
  endDay.setHours(0, 0, 0, 0)

  while (cursor.getTime() <= endDay.getTime()) {
    days.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  return days
}

function weekStartMonday(date: Date): Date {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  const day = copy.getDay()
  const diff = day === 0 ? -6 : 1 - day
  copy.setDate(copy.getDate() + diff)
  return copy
}

function buildDailySlots(start: Date, end: Date): EvolutionSlot[] {
  return eachDayBetween(start, end).map((day) => {
    const slotStart = new Date(day)
    slotStart.setHours(0, 0, 0, 0)
    const slotEnd = new Date(day)
    slotEnd.setHours(23, 59, 59, 999)
    const iso = slotStart.toISOString()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    let label = formatWeekdayShort(day)
    if (day.getTime() === today.getTime()) label = 'Today'
    else if (day.getTime() === yesterday.getTime()) label = 'Yesterday'
    else if (eachDayBetween(start, end).length > 7) label = formatDayMonth(day)

    return {
      periodKey: dayKeyFromIso(iso),
      label,
      match: (whenIso: string) => {
        const when = new Date(whenIso).getTime()
        return when >= slotStart.getTime() && when <= slotEnd.getTime()
      },
    }
  })
}

function buildWeeklySlots(start: Date, end: Date): EvolutionSlot[] {
  const slots: EvolutionSlot[] = []
  let cursor = weekStartMonday(start)
  const endTime = end.getTime()

  while (cursor.getTime() <= endTime) {
    const slotStart = new Date(cursor)
    slotStart.setHours(0, 0, 0, 0)
    const slotEnd = new Date(cursor)
    slotEnd.setDate(slotEnd.getDate() + 6)
    slotEnd.setHours(23, 59, 59, 999)
    if (slotEnd.getTime() > endTime) slotEnd.setTime(endTime)

    slots.push({
      periodKey: `week-${dayKeyFromIso(slotStart.toISOString())}`,
      label: `${formatDayMonth(slotStart)} – ${formatDayMonth(slotEnd)}`,
      match: (whenIso: string) => {
        const when = new Date(whenIso).getTime()
        return when >= slotStart.getTime() && when <= slotEnd.getTime()
      },
    })

    cursor = new Date(cursor)
    cursor.setDate(cursor.getDate() + 7)
  }

  return slots
}

function buildMonthlySlots(start: Date, end: Date): EvolutionSlot[] {
  const slots: EvolutionSlot[] = []
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1)
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1)

  while (cursor.getTime() <= endMonth.getTime()) {
    const slotStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1, 0, 0, 0, 0)
    const slotEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59, 999)
    if (slotEnd.getTime() > end.getTime()) slotEnd.setTime(end.getTime())
    if (slotStart.getTime() < start.getTime()) slotStart.setTime(start.getTime())

    slots.push({
      periodKey: monthKeyFromIso(slotStart.toISOString()),
      label: formatMonthShort(slotStart),
      match: (whenIso: string) => {
        const when = new Date(whenIso).getTime()
        return when >= slotStart.getTime() && when <= slotEnd.getTime()
      },
    })

    cursor.setMonth(cursor.getMonth() + 1)
  }

  return slots
}

export function buildEvolutionSlotsForRange(range: AnalyticsRange): EvolutionSlot[] {
  if (range.kind === 'preset') {
    // Delegate to existing preset slot builders via teamAnalyticsStats evolutionSlotsForPeriod logic
    const { start, end } = parseAnalyticsRangeBounds(range)
    if (range.period === '6m') return buildMonthlySlots(start, end)
    if (range.period === '1m') return buildWeeklySlots(start, end)
    return buildDailySlots(start, end)
  }

  const { start, end } = parseAnalyticsRangeBounds(range)
  const dayCount = eachDayBetween(start, end).length
  if (dayCount <= 14) return buildDailySlots(start, end)
  if (dayCount <= 90) return buildWeeklySlots(start, end)
  return buildMonthlySlots(start, end)
}

export type { EvolutionSlot }
