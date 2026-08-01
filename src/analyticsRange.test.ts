import { describe, expect, it } from 'vitest'
import {
  buildEvolutionSlotsForRange,
  customAnalyticsRange,
  describeAnalyticsRange,
  describeAnalyticsRangeLong,
  evolutionColumnLabel,
  isTimestampInAnalyticsRange,
  normalizeCustomDateRange,
  presetAnalyticsRange,
} from './analyticsRange'

describe('analyticsRange', () => {
  it('normalizes reversed custom dates', () => {
    expect(normalizeCustomDateRange('2026-07-20', '2026-07-10')).toEqual({
      fromDate: '2026-07-10',
      toDate: '2026-07-20',
    })
  })

  it('describes preset and custom ranges', () => {
    expect(describeAnalyticsRange(presetAnalyticsRange('1w'))).toBe('1 week')
    expect(describeAnalyticsRange(customAnalyticsRange('2026-07-01', '2026-07-10'))).toContain('Jul')
    expect(
      describeAnalyticsRangeLong(customAnalyticsRange('2026-07-01', '2026-07-10', 'Maldives camp')),
    ).toBe('Maldives camp')
  })

  it('picks evolution column labels from range length', () => {
    expect(evolutionColumnLabel(presetAnalyticsRange('6m'))).toBe('Month')
    expect(evolutionColumnLabel(presetAnalyticsRange('1m'))).toBe('Week')
    expect(evolutionColumnLabel(presetAnalyticsRange('1w'))).toBe('Day')
    expect(evolutionColumnLabel(customAnalyticsRange('2026-07-01', '2026-07-05'))).toBe('Day')
    expect(evolutionColumnLabel(customAnalyticsRange('2026-07-01', '2026-08-15'))).toBe('Week')
    expect(evolutionColumnLabel(customAnalyticsRange('2026-01-01', '2026-12-31'))).toBe('Month')
  })

  it('filters timestamps inside custom bounds', () => {
    const range = customAnalyticsRange('2026-07-10', '2026-07-20')
    expect(isTimestampInAnalyticsRange('2026-07-15T12:00:00.000Z', range)).toBe(true)
    expect(isTimestampInAnalyticsRange('2026-07-09T12:00:00.000Z', range)).toBe(false)
    expect(isTimestampInAnalyticsRange('2026-07-21T12:00:00.000Z', range)).toBe(false)
  })

  it('builds daily slots for short custom ranges', () => {
    const slots = buildEvolutionSlotsForRange(customAnalyticsRange('2026-07-10', '2026-07-12'))
    expect(slots).toHaveLength(3)
    expect(slots.every((slot) => slot.periodKey && slot.label)).toBe(true)
  })
})
