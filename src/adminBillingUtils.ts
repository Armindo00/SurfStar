import type { BillingInterval, PlanId } from './plans'
import { formatPlanTotalPrice, getPlan } from './plans'

export type RenewalStatus = 'ok' | 'due_soon' | 'overdue' | 'unknown'

export function getRenewalStatus(periodEnd: string | null | undefined): RenewalStatus {
  if (!periodEnd) return 'unknown'
  const end = new Date(periodEnd).getTime()
  const now = Date.now()
  const sevenDays = 7 * 24 * 60 * 60 * 1000
  if (end < now) return 'overdue'
  if (end - now <= sevenDays) return 'due_soon'
  return 'ok'
}

export function renewalStatusLabel(status: RenewalStatus): string {
  switch (status) {
    case 'overdue':
      return 'Overdue'
    case 'due_soon':
      return 'Due within 7 days'
    case 'ok':
      return 'Paid up'
    default:
      return 'No renewal date'
  }
}

export function renewalStatusTone(status: RenewalStatus): string {
  switch (status) {
    case 'overdue':
      return 'blocked'
    case 'due_soon':
      return 'awaiting'
    case 'ok':
      return 'activated'
    default:
      return 'read'
  }
}

export function subscriptionAmount(planId: PlanId, billingInterval: BillingInterval): string {
  try {
    return formatPlanTotalPrice(getPlan(planId), billingInterval)
  } catch {
    return '—'
  }
}

export function daysUntilRenewal(periodEnd: string | null | undefined): number | null {
  if (!periodEnd) return null
  const diff = new Date(periodEnd).getTime() - Date.now()
  return Math.ceil(diff / (24 * 60 * 60 * 1000))
}
