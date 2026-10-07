import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { canAdminConfirmRenewalPayment, RENEWAL_ADMIN_CONFIRM_DAYS } from './adminBillingUtils'

describe('canAdminConfirmRenewalPayment', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-07T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows confirm within reminder window and when overdue', () => {
    const inFiveDays = '2026-10-12T12:00:00.000Z'
    const inSixDays = '2026-10-13T12:00:00.000Z'
    const yesterday = '2026-10-06T12:00:00.000Z'

    expect(RENEWAL_ADMIN_CONFIRM_DAYS).toBe(5)
    expect(canAdminConfirmRenewalPayment(inFiveDays)).toBe(true)
    expect(canAdminConfirmRenewalPayment(inSixDays)).toBe(false)
    expect(canAdminConfirmRenewalPayment(yesterday)).toBe(true)
  })

  it('disallows confirm when paid up with more than 5 days left', () => {
    expect(canAdminConfirmRenewalPayment('2026-11-07T12:00:00.000Z')).toBe(false)
    expect(canAdminConfirmRenewalPayment(null)).toBe(false)
  })
})
