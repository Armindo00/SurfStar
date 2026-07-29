import { getBillingCountryName } from '../../billingCountries'
import { formatAppDateTime } from '../../dateFormat'
import {
  formatPlanPriceWithSuffix,
  formatPlanTotalPrice,
  getPlan,
  type BillingInterval,
  type PlanId,
} from '../../plans'
import type { AdminAccount, AdminPlanRequest } from '../../adminApi'

export function formatAdminDate(value: string | null): string {
  if (!value) return '—'
  return formatAppDateTime(value, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function planLabel(planId: string | null): string {
  if (!planId) return '—'
  try {
    return getPlan(planId as PlanId).name
  } catch {
    return planId
  }
}

export function billingIntervalLabel(interval: BillingInterval | string | null | undefined): string {
  return interval === 'annual' ? 'Annual' : 'Monthly'
}

export function planRequestSummary(planId: PlanId, billingInterval: BillingInterval): string {
  const plan = getPlan(planId)
  const price =
    billingInterval === 'annual'
      ? `${formatPlanTotalPrice(plan, 'annual')}/year`
      : `${formatPlanPriceWithSuffix(plan, 'monthly')}`
  return `${plan.name} · ${billingIntervalLabel(billingInterval)} · ${price}`
}

export function requestAmount(request: AdminPlanRequest): string {
  try {
    return formatPlanTotalPrice(getPlan(request.plan_id), request.billing_interval)
  } catch {
    return '—'
  }
}

export function requestPhase(request: AdminPlanRequest): { label: string; tone: string } {
  if (request.activated_at) return { label: 'Activated', tone: 'activated' }
  if (request.status === 'pending') return { label: 'Pending review', tone: 'pending' }
  if (request.status === 'approved' && request.payment_status === 'unpaid') {
    return { label: 'Awaiting payment', tone: 'awaiting' }
  }
  if (request.status === 'rejected') return { label: 'Rejected', tone: 'rejected' }
  if (request.status === 'approved') return { label: 'Approved', tone: 'approved' }
  return { label: request.status, tone: 'pending' }
}

export function accountPlanSummary(account: AdminAccount): string {
  if (account.plan_id && (account.plan_status === 'active' || account.plan_status === 'trialing')) {
    const interval = billingIntervalLabel(account.billing_interval ?? account.requested_billing_interval)
    const renewal = account.current_period_end
      ? `Renews ${formatAdminDate(account.current_period_end)}`
      : 'Active'
    return `${planLabel(account.plan_id)} · ${interval} · ${renewal}`
  }
  if (account.requested_plan_id) {
    try {
      return `Requested: ${planRequestSummary(
        account.requested_plan_id as PlanId,
        (account.requested_billing_interval ?? 'monthly') as BillingInterval,
      )}`
    } catch {
      return `Requested: ${planLabel(account.requested_plan_id)}`
    }
  }
  return 'No active plan'
}

export function formatBillingAddress(request: AdminPlanRequest): string | null {
  if (request.billing_street) {
    return [
      request.billing_street,
      request.billing_address_line2,
      [request.billing_postal_code, request.billing_city].filter(Boolean).join(' '),
      request.billing_region,
      request.billing_country
        ? `${getBillingCountryName(request.billing_country)} (${request.billing_country})`
        : null,
    ]
      .filter(Boolean)
      .join(', ')
  }
  return request.billing_address ?? null
}
