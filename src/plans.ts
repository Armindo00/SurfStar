export type PlanId = 'starter' | 'team' | 'club'

export type SubscriptionPlan = {
  id: PlanId
  name: string
  priceMonthly: number
  currency: 'EUR'
  tagline: string
  maxAthletes: number | null
  features: string[]
  highlighted?: boolean
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Soft',
    priceMonthly: 19,
    currency: 'EUR',
    tagline: 'For individual coaches',
    maxAthletes: 5,
    features: [
      'Up to 5 athletes',
      'Technical training & combos',
      'Session history',
      'Spot management',
    ],
  },
  {
    id: 'team',
    name: 'Coach',
    priceMonthly: 39,
    currency: 'EUR',
    tagline: 'For teams and surf schools',
    maxAthletes: 20,
    highlighted: true,
    features: [
      'Up to 20 athletes',
      'Everything in Soft',
      'Team analytics (6 months)',
      'Multi-coach pairing',
      'Share stats with athletes',
    ],
  },
  {
    id: 'club',
    name: 'Coach Premium',
    priceMonthly: 79,
    currency: 'EUR',
    tagline: 'For clubs and academies',
    maxAthletes: null,
    features: [
      'Unlimited athletes',
      'Everything in Coach',
      'Heats & championship',
      'Sea analysis',
      'Priority support',
    ],
  },
]

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
