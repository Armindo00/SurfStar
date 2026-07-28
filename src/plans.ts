import { isManualPaymentsEnabled } from './config'

export type PlanId = 'team' | 'club' | 'organization'

export type BillingInterval = 'monthly' | 'annual'

/** Months included free when paying annually (annual = monthly × (12 − free months)). */
export const ANNUAL_FREE_MONTHS = 2

export type SubscriptionPlan = {
  id: PlanId
  name: string
  priceMonthly: number
  priceAnnual: number
  currency: 'EUR'
  maxAthletes: number | null
  maxCoaches: number
  highlighted?: boolean
  /** Cannot self-checkout — contact / manual approval required */
  requiresApproval?: boolean
}

export type PlanComparisonFeature = {
  label: string
  includedIn: PlanId[]
  /** Omit this row on specific plan cards (e.g. lower-tier limits on higher plans). */
  hiddenOn?: PlanId[]
}

/** Full feature matrix shown on every pricing card (green = included, red = not included). */
export const PLAN_COMPARISON_FEATURES: PlanComparisonFeature[] = [
  { label: 'Up to 20 athletes', includedIn: ['team'], hiddenOn: ['club', 'organization'] },
  { label: 'Unlimited athletes', includedIn: ['club', 'organization'] },
  { label: '1 coach account', includedIn: ['team', 'club'], hiddenOn: ['organization'] },
  { label: 'Up to 5 coach accounts', includedIn: ['organization'], hiddenOn: ['team', 'club'] },
  { label: 'Shared roster & database', includedIn: ['organization'] },
  { label: 'Technical training & combos', includedIn: ['team', 'club', 'organization'] },
  { label: 'Custom training templates', includedIn: ['club', 'organization'] },
  { label: 'Session history', includedIn: ['team', 'club', 'organization'] },
  { label: 'Spot management', includedIn: ['team', 'club', 'organization'] },
  { label: 'Team analytics (6 months)', includedIn: ['team', 'club', 'organization'] },
  { label: 'Share stats with athletes', includedIn: ['team', 'club', 'organization'] },
  { label: 'Heats & championship', includedIn: ['team', 'club', 'organization'] },
  { label: 'Sea analysis', includedIn: ['club', 'organization'] },
  { label: 'Psychology check-ins (0–5 survey)', includedIn: ['club', 'organization'] },
  { label: 'Athlete gear quiver', includedIn: ['team', 'club', 'organization'] },
  { label: 'Equipment speed & control ratings', includedIn: ['team', 'club', 'organization'] },
  { label: 'Priority support', includedIn: ['club', 'organization'] },
]

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'team',
    name: 'Coach',
    priceMonthly: 49,
    priceAnnual: 490,
    currency: 'EUR',
    maxAthletes: 20,
    maxCoaches: 1,
  },
  {
    id: 'club',
    name: 'Coach Premium',
    priceMonthly: 89,
    priceAnnual: 890,
    currency: 'EUR',
    maxAthletes: null,
    maxCoaches: 1,
    highlighted: true,
  },
  {
    id: 'organization',
    name: 'Team Academy',
    priceMonthly: 179,
    priceAnnual: 1790,
    currency: 'EUR',
    maxAthletes: null,
    maxCoaches: 5,
    requiresApproval: true,
  },
]

export function planHasComparisonFeature(planId: PlanId, feature: PlanComparisonFeature): boolean {
  return feature.includedIn.includes(planId)
}

export function getVisibleComparisonFeatures(planId: PlanId): PlanComparisonFeature[] {
  return PLAN_COMPARISON_FEATURES.filter((feature) => !feature.hiddenOn?.includes(planId))
}

export function getIncludedFeatureLabels(planId: PlanId): string[] {
  return PLAN_COMPARISON_FEATURES.filter((f) => planHasComparisonFeature(planId, f)).map((f) => f.label)
}

export function getPlan(planId: PlanId): SubscriptionPlan {
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId)
  if (!plan) throw new Error(`Unknown plan: ${planId}`)
  return plan
}

function formatCurrency(amount: number, currency: SubscriptionPlan['currency']): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function getPlanPrice(plan: SubscriptionPlan, interval: BillingInterval): number {
  return interval === 'annual' ? plan.priceAnnual : plan.priceMonthly
}

/** Price shown in the UI (annual plans display the effective monthly rate). */
export function getPlanDisplayPrice(plan: SubscriptionPlan, interval: BillingInterval): number {
  return interval === 'annual' ? plan.priceAnnual / 12 : plan.priceMonthly
}

export function formatPlanPrice(plan: SubscriptionPlan, interval: BillingInterval = 'monthly'): string {
  return formatCurrency(getPlanDisplayPrice(plan, interval), plan.currency)
}

export function formatPlanPriceSuffix(_interval: BillingInterval = 'monthly'): string {
  return '/mo'
}

export function formatPlanPriceWithSuffix(plan: SubscriptionPlan, interval: BillingInterval): string {
  return `${formatPlanPrice(plan, interval)}${formatPlanPriceSuffix(interval)}`
}

export function formatEffectiveMonthlyFromAnnual(plan: SubscriptionPlan): string {
  return formatCurrency(plan.priceAnnual / 12, plan.currency)
}

export function formatAnnualBillingNote(plan: SubscriptionPlan): string {
  return `Billed ${formatCurrency(plan.priceAnnual, plan.currency)}/year · ${getAnnualSavingsLabel()}`
}

export function getAnnualSavingsLabel(): string {
  return `${ANNUAL_FREE_MONTHS} months free`
}

export function getStripePaymentLink(planId: PlanId, interval: BillingInterval = 'monthly'): string | null {
  if (isManualPaymentsEnabled()) return null
  if (isApprovalRequiredPlan(planId)) return null
  const intervalSuffix = interval === 'annual' ? '_ANNUAL' : ''
  const envKey = `VITE_STRIPE_LINK_${planId.toUpperCase()}${intervalSuffix}` as const
  const value = import.meta.env[envKey]
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export function isStripeConfigured(): boolean {
  return getSelfServePlans().some(
    (id) => Boolean(getStripePaymentLink(id, 'monthly')) || Boolean(getStripePaymentLink(id, 'annual')),
  )
}

export function isApprovalRequiredPlan(planId: PlanId): boolean {
  return Boolean(getPlan(planId).requiresApproval)
}

export function usesManualPaymentFlow(): boolean {
  return isManualPaymentsEnabled()
}

export function getSelfServePlans(): PlanId[] {
  return SUBSCRIPTION_PLANS.filter((p) => !p.requiresApproval).map((p) => p.id)
}

export function getCheckoutPlans(): PlanId[] {
  return SUBSCRIPTION_PLANS.map((p) => p.id)
}

export function getPlanTotalPrice(plan: SubscriptionPlan, interval: BillingInterval): number {
  return interval === 'annual' ? plan.priceAnnual : plan.priceMonthly
}

export function formatPlanTotalPrice(plan: SubscriptionPlan, interval: BillingInterval): string {
  const amount = getPlanTotalPrice(plan, interval)
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: plan.currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

import { getContactEmail } from './config'

export function getTeamAcademyContactEmail(): string {
  return getContactEmail()
}

export function isOrganizationPlan(planId: PlanId): boolean {
  return planId === 'organization'
}

export function coachSeatLabel(planId: PlanId): string {
  const plan = getPlan(planId)
  if (plan.maxCoaches <= 1) return '1 coach account'
  return `Up to ${plan.maxCoaches} coaches`
}
