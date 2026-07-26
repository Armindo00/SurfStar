export type PlanId = 'team' | 'club' | 'organization'

export type SubscriptionPlan = {
  id: PlanId
  name: string
  priceMonthly: number
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
  { label: 'Priority support', includedIn: ['club', 'organization'] },
]

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'team',
    name: 'Coach',
    priceMonthly: 39,
    currency: 'EUR',
    maxAthletes: 20,
    maxCoaches: 1,
  },
  {
    id: 'club',
    name: 'Coach Premium',
    priceMonthly: 79,
    currency: 'EUR',
    maxAthletes: null,
    maxCoaches: 1,
    highlighted: true,
  },
  {
    id: 'organization',
    name: 'Team Academy',
    priceMonthly: 149,
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

export function formatPlanPrice(plan: SubscriptionPlan): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: plan.currency,
    maximumFractionDigits: 0,
  }).format(plan.priceMonthly)
}

export function getStripePaymentLink(planId: PlanId): string | null {
  if (isApprovalRequiredPlan(planId)) return null
  const envKey = `VITE_STRIPE_LINK_${planId.toUpperCase()}` as const
  const value = import.meta.env[envKey]
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export function isStripeConfigured(): boolean {
  return getSelfServePlans().some((id) => Boolean(getStripePaymentLink(id)))
}

export function isApprovalRequiredPlan(planId: PlanId): boolean {
  return Boolean(getPlan(planId).requiresApproval)
}

export function getSelfServePlans(): PlanId[] {
  return SUBSCRIPTION_PLANS.filter((p) => !p.requiresApproval).map((p) => p.id)
}

export function getTeamAcademyContactEmail(): string {
  const value = import.meta.env.VITE_TEAM_ACADEMY_CONTACT_EMAIL
  if (typeof value === 'string' && value.trim()) return value.trim()
  return 'hello@surf-star.vercel.app'
}

export function isOrganizationPlan(planId: PlanId): boolean {
  return planId === 'organization'
}

export function coachSeatLabel(planId: PlanId): string {
  const plan = getPlan(planId)
  if (plan.maxCoaches <= 1) return '1 coach account'
  return `Up to ${plan.maxCoaches} coaches`
}
