import { describe, expect, it } from 'vitest'
import {
  formatEffectiveMonthlyFromAnnual,
  formatPlanPriceWithSuffix,
  getPlan,
  getPlanPrice,
} from './plans'

describe('plans pricing', () => {
  it('uses updated monthly prices', () => {
    expect(getPlan('team').priceMonthly).toBe(49)
    expect(getPlan('club').priceMonthly).toBe(89)
    expect(getPlan('organization').priceMonthly).toBe(179)
  })

  it('annual prices include two months free', () => {
    expect(getPlan('team').priceAnnual).toBe(490)
    expect(getPlan('club').priceAnnual).toBe(890)
    expect(getPlan('organization').priceAnnual).toBe(1790)
  })

  it('formats prices with billing suffix', () => {
    const team = getPlan('team')
    expect(formatPlanPriceWithSuffix(team, 'monthly')).toBe('€49/mo')
    expect(formatPlanPriceWithSuffix(team, 'annual')).toBe('€490/yr')
    expect(getPlanPrice(team, 'annual')).toBe(490)
  })

  it('shows effective monthly rate for annual billing', () => {
    expect(formatEffectiveMonthlyFromAnnual(getPlan('club'))).toBe('€74')
  })
})
