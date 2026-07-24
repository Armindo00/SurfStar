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
    name: 'Starter',
    priceMonthly: 19,
    currency: 'EUR',
    tagline: 'Para treinadores individuais',
    maxAthletes: 5,
    features: [
      'Até 5 atletas',
      'Treino técnico e combos',
      'Histórico de sessões',
      'Gestão de spots',
    ],
  },
  {
    id: 'team',
    name: 'Team',
    priceMonthly: 39,
    currency: 'EUR',
    tagline: 'Para equipas e escolas',
    maxAthletes: 20,
    highlighted: true,
    features: [
      'Até 20 atletas',
      'Tudo do Starter',
      'Team analytics (6 meses)',
      'Pairing multi-treinador',
      'Partilha de stats com atletas',
    ],
  },
  {
    id: 'club',
    name: 'Club',
    priceMonthly: 79,
    currency: 'EUR',
    tagline: 'Para clubes e academias',
    maxAthletes: null,
    features: [
      'Atletas ilimitados',
      'Tudo do Team',
      'Heats e campeonato',
      'Análise de mar',
      'Suporte prioritário',
    ],
  },
]

export function getPlan(planId: PlanId): SubscriptionPlan {
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId)
  if (!plan) throw new Error(`Unknown plan: ${planId}`)
  return plan
}

export function formatPlanPrice(plan: SubscriptionPlan): string {
  return new Intl.NumberFormat('pt-PT', {
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
