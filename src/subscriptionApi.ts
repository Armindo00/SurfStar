import { getSupabase } from './lib/supabase'
import type { PlanId } from './plans'

export type SubscriptionStatus = 'active' | 'trialing' | 'pending' | 'canceled'

export type CoachSubscription = {
  coachId: string
  planId: PlanId
  status: SubscriptionStatus
  currentPeriodEnd: string | null
}

const LOCAL_KEY = 'surfstar-subscriptions'

function readLocalSubscriptions(): CoachSubscription[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CoachSubscription[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeLocalSubscriptions(subs: CoachSubscription[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(subs))
}

export function isSubscriptionActive(sub: CoachSubscription | null | undefined): boolean {
  if (!sub) return false
  if (sub.status !== 'active' && sub.status !== 'trialing') return false
  if (!sub.currentPeriodEnd) return true
  return new Date(sub.currentPeriodEnd).getTime() > Date.now()
}

export function isDemoSubscriptionEnabled(): boolean {
  return import.meta.env.VITE_DEMO_SUBSCRIPTION === 'true'
}

export function loadLocalSubscription(coachId: string): CoachSubscription | null {
  return readLocalSubscriptions().find((s) => s.coachId === coachId) ?? null
}

export function saveLocalSubscription(sub: CoachSubscription): CoachSubscription {
  const next = readLocalSubscriptions().filter((s) => s.coachId !== sub.coachId)
  next.push(sub)
  writeLocalSubscriptions(next)
  return sub
}

function mapRow(data: {
  coach_id: string
  plan_id: string
  status: string
  current_period_end: string | null
}): CoachSubscription {
  return {
    coachId: data.coach_id,
    planId: data.plan_id as PlanId,
    status: data.status as SubscriptionStatus,
    currentPeriodEnd: data.current_period_end,
  }
}

export async function cloudFetchSubscription(coachId: string): Promise<CoachSubscription | null> {
  const { data, error } = await getSupabase()
    .from('coach_subscriptions')
    .select('coach_id, plan_id, status, current_period_end')
    .eq('coach_id', coachId)
    .maybeSingle()

  if (error || !data) return null
  return mapRow(data)
}

export async function cloudCreatePendingSubscription(planId: PlanId): Promise<CoachSubscription> {
  const { data, error } = await getSupabase().rpc('create_pending_coach_subscription', {
    p_plan_id: planId,
  })

  if (error) throw new Error(error.message)
  if (!data?.ok) throw new Error(data?.error ?? 'Failed to start checkout')

  return {
    coachId: data.coach_id,
    planId: data.plan_id as PlanId,
    status: data.status as SubscriptionStatus,
    currentPeriodEnd: data.current_period_end ?? null,
  }
}

export async function cloudActivateDemoSubscription(planId: PlanId): Promise<CoachSubscription> {
  const { data, error } = await getSupabase().rpc('activate_coach_subscription_demo', {
    p_plan_id: planId,
  })

  if (error) throw new Error(error.message)
  if (!data?.ok) throw new Error(data?.error ?? 'Failed to activate subscription')

  return {
    coachId: data.coach_id,
    planId: data.plan_id as PlanId,
    status: data.status as SubscriptionStatus,
    currentPeriodEnd: data.current_period_end ?? null,
  }
}

export function activateLocalSubscription(coachId: string, planId: PlanId): CoachSubscription {
  const periodEnd = new Date()
  periodEnd.setMonth(periodEnd.getMonth() + 1)

  return saveLocalSubscription({
    coachId,
    planId,
    status: 'active',
    currentPeriodEnd: periodEnd.toISOString(),
  })
}

export async function fetchCoachSubscription(
  coachId: string,
  cloudMode: boolean,
): Promise<CoachSubscription | null> {
  if (cloudMode) {
    try {
      return await cloudFetchSubscription(coachId)
    } catch {
      return null
    }
  }
  return loadLocalSubscription(coachId)
}

export async function startCoachCheckout(
  coachId: string,
  planId: PlanId,
  cloudMode: boolean,
): Promise<CoachSubscription> {
  if (cloudMode) {
    return cloudCreatePendingSubscription(planId)
  }
  return activateLocalSubscription(coachId, planId)
}

export async function activateCoachSubscription(
  coachId: string,
  planId: PlanId,
  cloudMode: boolean,
): Promise<CoachSubscription> {
  if (cloudMode) {
    return cloudActivateDemoSubscription(planId)
  }
  return activateLocalSubscription(coachId, planId)
}

export function buildStripeCheckoutUrl(
  baseLink: string,
  coachId: string,
  email: string,
  planId: PlanId,
): string {
  const url = new URL(baseLink)
  url.searchParams.set('client_reference_id', coachId)
  if (email.trim()) url.searchParams.set('prefilled_email', email.trim())
  url.searchParams.set('metadata[plan_id]', planId)
  url.searchParams.set('metadata[coach_id]', coachId)
  return url.toString()
}

export function getStripeBillingPortalUrl(): string | null {
  const value = import.meta.env.VITE_STRIPE_BILLING_PORTAL_URL
  return typeof value === 'string' && value.trim() ? value.trim() : null
}
