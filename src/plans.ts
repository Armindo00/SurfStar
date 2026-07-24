export type PlanId = 'starter' | 'team' | 'club'

export type SubscriptionPlan = {
  id: PlanId
  name: string
  priceMonthly: number
  currency: 'EUR'
  maxAthletes: number | null
  highlighted?: boolean
}

export type PlanComparisonFeature = {
  label: string
  includedIn: PlanId[]
}

/** Full feature matrix shown on every pricing card (green = included, red = not included). */
export const PLAN_COMPARISON_FEATURES: PlanComparisonFeature[] = [
  { label: 'Up to 5 athletes', includedIn: ['starter'] },
  { label: 'Up to 20 athletes', includedIn: ['team'] },
  { label: 'Unlimited athletes', includedIn: ['club'] },
  { label: 'Technical training & combos', includedIn: ['starter', 'team', 'club'] },
  { label: 'Session history', includedIn: ['starter', 'team', 'club'] },
  { label: 'Spot management', includedIn: ['starter', 'team', 'club'] },
  { label: 'Team analytics (6 months)', includedIn: ['team', 'club'] },
  { label: 'Multi-coach pairing', includedIn: ['team', 'club'] },
  { label: 'Share stats with athletes', includedIn: ['team', 'club'] },
  { label: 'Heats & championship', includedIn: ['club'] },
  { label: 'Sea analysis', includedIn: ['club'] },
  { label: 'Priority support', includedIn: ['club'] },
]

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    priceMonthly: 19,
    currency: 'EUR',
    maxAthletes: 5,
  },
  {
    id: 'team',
    name: 'Coach',
    priceMonthly: 39,
    currency: 'EUR',
    maxAthletes: 20,
  },
  {
    id: 'club',
    name: 'Coach Premium',
    priceMonthly: 79,
    currency: 'EUR',
    maxAthletes: null,
    highlighted: true,
  },
]

export function planHasComparisonFeature(planId: PlanId, feature: PlanComparisonFeature): boolean {
  return feature.includedIn.includes(planId)
}

export function getIncludedFeatureLabels(planId: PlanId): string[] {
  return PLAN_COMPARISON_FEATURES.filter((f) => planHasComparisonFeature(planId, f)).map((f) => f.label)
}

export function getPlan(planId: PlanId): SubscriptionPlan {
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId)
  if (!plan) throw new Error(`Unknown plan: ${planId}`)
  return plan
}

export function formatPlanPrice(plan: SubscriptionPlan): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: plan.currency,
    maximumFractionDigits: 0,
  }).format(plan.priceMonthly)
}

export function getStripePaymentLink(planId: PlanId): string | null {
  const envKey = `VITE_STRIPE_LINK_${planId.toUpperCase()}` as const
  const value = import.meta.env[envKey]
  return typeof value === 'string' && value.trim() ? value.trim() : null
}
