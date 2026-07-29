import { getSupabase } from './lib/supabase'
import type { PlanId } from './plans'
import { cloudFetchOrganizationContext } from './organizationApi'

export type SubscriptionStatus = 'active' | 'trialing' | 'pending' | 'canceled'

export type CoachSubscription = {
  organizationId: string
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
  if (sub.status === 'canceled') {
    if (!sub.currentPeriodEnd) return false
    return new Date(sub.currentPeriodEnd).getTime() > Date.now()
  }
  if (sub.status !== 'active' && sub.status !== 'trialing') return false
  if (!sub.currentPeriodEnd) return true
  return new Date(sub.currentPeriodEnd).getTime() > Date.now()
}

export function isDemoSubscriptionEnabled(): boolean {
  return import.meta.env.VITE_DEMO_SUBSCRIPTION === 'true'
}

export function loadLocalSubscription(organizationId: string): CoachSubscription | null {
  return readLocalSubscriptions().find((s) => s.organizationId === organizationId) ?? null
}

export function loadLocalSubscriptionByCoach(coachId: string): CoachSubscription | null {
  return readLocalSubscriptions().find((s) => s.coachId === coachId) ?? null
}

export function saveLocalSubscription(sub: CoachSubscription): CoachSubscription {
  const next = readLocalSubscriptions().filter((s) => s.organizationId !== sub.organizationId)
  next.push(sub)
  writeLocalSubscriptions(next)
  return sub
}

function mapOrgRow(data: {
  organization_id: string
  plan_id: string
  status: string
  current_period_end: string | null
}, coachId: string): CoachSubscription {
  return {
    organizationId: data.organization_id,
    coachId,
    planId: data.plan_id as PlanId,
    status: data.status as SubscriptionStatus,
    currentPeriodEnd: data.current_period_end,
  }
}

function mapLegacyRow(data: {
  coach_id: string
  plan_id: string
  status: string
  current_period_end: string | null
}, organizationId: string): CoachSubscription {
  return {
    organizationId,
    coachId: data.coach_id,
    planId: data.plan_id as PlanId,
    status: data.status as SubscriptionStatus,
    currentPeriodEnd: data.current_period_end,
  }
}

export async function cloudFetchSubscription(
  coachId: string,
  organizationId?: string,
): Promise<CoachSubscription | null> {
  const orgId = organizationId ?? (await cloudFetchOrganizationContext())?.organizationId
  if (orgId) {
    const { data, error } = await getSupabase()
      .from('organization_subscriptions')
      .select('organization_id, plan_id, status, current_period_end')
      .eq('organization_id', orgId)
      .maybeSingle()

    if (!error && data) {
      return mapOrgRow(data, coachId)
    }
  }

  const { data, error } = await getSupabase()
    .from('coach_subscriptions')
    .select('coach_id, plan_id, status, current_period_end')
    .eq('coach_id', coachId)
    .maybeSingle()

  if (error || !data) return null
  return mapLegacyRow(data, orgId ?? coachId)
}

export async function cloudCreatePendingSubscription(
  planId: PlanId,
  orgName?: string,
): Promise<CoachSubscription> {
  const { data, error } = await getSupabase().rpc('create_pending_organization_subscription', {
    p_plan_id: planId,
    p_org_name: orgName ?? null,
  })

  if (error) throw new Error(error.message)
  if (!data?.ok) throw new Error(data?.error ?? 'Failed to start checkout')

  const coachId = (await getSupabase().auth.getUser()).data.user?.id ?? ''

  return {
    organizationId: data.organization_id,
    coachId,
    planId: data.plan_id as PlanId,
    status: data.status as SubscriptionStatus,
    currentPeriodEnd: data.current_period_end ?? null,
  }
}

export async function cloudActivateDemoSubscription(
  planId: PlanId,
  orgName?: string,
): Promise<CoachSubscription> {
  const { data, error } = await getSupabase().rpc('activate_organization_subscription_demo', {
    p_plan_id: planId,
    p_org_name: orgName ?? null,
  })

  if (error) throw new Error(error.message)
  if (!data?.ok) throw new Error(data?.error ?? 'Failed to activate subscription')

  const coachId = (await getSupabase().auth.getUser()).data.user?.id ?? ''

  return {
    organizationId: data.organization_id,
    coachId,
    planId: data.plan_id as PlanId,
    status: data.status as SubscriptionStatus,
    currentPeriodEnd: data.current_period_end ?? null,
  }
}

export function activateLocalSubscription(
  coachId: string,
  organizationId: string,
  planId: PlanId,
): CoachSubscription {
  const periodEnd = new Date()
  periodEnd.setMonth(periodEnd.getMonth() + 1)

  return saveLocalSubscription({
    organizationId,
    coachId,
    planId,
    status: 'active',
    currentPeriodEnd: periodEnd.toISOString(),
  })
}

export async function fetchCoachSubscription(
  coachId: string,
  cloudMode: boolean,
  organizationId?: string,
): Promise<CoachSubscription | null> {
  if (cloudMode) {
    try {
      return await cloudFetchSubscription(coachId, organizationId)
    } catch {
      return null
    }
  }
  if (organizationId) {
    return loadLocalSubscription(organizationId)
  }
  return loadLocalSubscriptionByCoach(coachId)
}

export async function startCoachCheckout(
  coachId: string,
  organizationId: string,
  planId: PlanId,
  cloudMode: boolean,
  orgName?: string,
): Promise<CoachSubscription> {
  if (cloudMode) {
    return cloudCreatePendingSubscription(planId, orgName)
  }
  return activateLocalSubscription(coachId, organizationId, planId)
}

export async function activateCoachSubscription(
  coachId: string,
  organizationId: string,
  planId: PlanId,
  cloudMode: boolean,
  orgName?: string,
): Promise<CoachSubscription> {
  if (cloudMode) {
    return cloudActivateDemoSubscription(planId, orgName)
  }
  return activateLocalSubscription(coachId, organizationId, planId)
}

export function buildStripeCheckoutUrl(
  baseLink: string,
  coachId: string,
  email: string,
  planId: PlanId,
  organizationId?: string,
  billingInterval: 'monthly' | 'annual' = 'monthly',
): string {
  const url = new URL(baseLink)
  url.searchParams.set('client_reference_id', coachId)
  if (email.trim()) url.searchParams.set('prefilled_email', email.trim())
  url.searchParams.set('metadata[plan_id]', planId)
  url.searchParams.set('metadata[coach_id]', coachId)
  url.searchParams.set('metadata[billing_interval]', billingInterval)
  if (organizationId) url.searchParams.set('metadata[organization_id]', organizationId)
  return url.toString()
}

export function getStripeBillingPortalUrl(): string | null {
  const value = import.meta.env.VITE_STRIPE_BILLING_PORTAL_URL
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

type ManageResult =
  | { ok: true; url?: string; requires_checkout?: boolean; use_portal?: boolean; message?: string; cancel_at_period_end?: boolean; current_period_end?: string | null; plan_id?: PlanId; unchanged?: boolean }
  | { ok: false; error: string }

function appReturnUrl(): string {
  return `${window.location.origin}${window.location.pathname}`
}

async function invokeSubscriptionManage(body: Record<string, unknown>): Promise<ManageResult> {
  const { data, error } = await getSupabase().functions.invoke('subscription-manage', {
    body: { ...body, return_url: appReturnUrl() },
  })

  if (error) {
    return { ok: false, error: error.message }
  }

  if (!data?.ok) {
    return { ok: false, error: data?.error ?? 'Request failed.' }
  }

  return data as ManageResult & { ok: true }
}

export async function cloudOpenBillingPortal(): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const staticPortal = getStripeBillingPortalUrl()
  const result = await invokeSubscriptionManage({ action: 'portal' })
  if (result.ok && result.url) {
    return { ok: true, url: result.url }
  }
  if (staticPortal) {
    return { ok: true, url: staticPortal }
  }
  return { ok: false, error: result.ok ? 'Billing portal unavailable.' : result.error }
}

export async function cloudCancelSubscription(): Promise<
  { ok: true; currentPeriodEnd?: string | null } | { ok: false; error: string }
> {
  const result = await invokeSubscriptionManage({ action: 'cancel' })
  if (!result.ok) return result
  return {
    ok: true,
    currentPeriodEnd: result.current_period_end ?? null,
  }
}

export async function cloudCancelManualSubscription(): Promise<
  { ok: true; currentPeriodEnd?: string | null; alreadyCanceled?: boolean } | { ok: false; error: string }
> {
  const { data, error } = await getSupabase().rpc('coach_cancel_manual_subscription')
  if (error) {
    if (error.message.includes('coach_cancel_manual_subscription')) {
      return { ok: false, error: 'Manual cancellation is not configured yet. Contact contact@surfstar.app.' }
    }
    return { ok: false, error: error.message }
  }
  if (!data?.ok) {
    return { ok: false, error: data?.error ?? 'Could not cancel subscription.' }
  }
  return {
    ok: true,
    currentPeriodEnd: (data.current_period_end as string | null | undefined) ?? null,
    alreadyCanceled: Boolean(data.already_canceled),
  }
}

export async function cloudChangeSubscriptionPlanDirect(planId: PlanId): Promise<
  { ok: true } | { ok: false; error: string }
> {
  try {
    await cloudActivateDemoSubscription(planId)
    return { ok: true }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not change plan.',
    }
  }
}

export async function cloudChangeSubscriptionPlan(planId: PlanId): Promise<
  | { ok: true; requiresCheckout?: boolean; portalUrl?: string; message?: string; unchanged?: boolean }
  | { ok: false; error: string }
> {
  const result = await invokeSubscriptionManage({ action: 'change_plan', plan_id: planId })
  if (!result.ok) return result

  if (result.unchanged) {
    return { ok: true, unchanged: true }
  }

  if (result.url) {
    return {
      ok: true,
      portalUrl: result.url,
      message: result.message,
    }
  }

  if (result.requires_checkout) {
    return { ok: true, requiresCheckout: true }
  }

  return { ok: true }
}

export function cancelLocalSubscription(organizationId: string, coachId: string): CoachSubscription {
  const existing = loadLocalSubscription(organizationId)
  const periodEnd = existing?.currentPeriodEnd ?? new Date().toISOString()
  return saveLocalSubscription({
    organizationId,
    coachId,
    planId: existing?.planId ?? 'team',
    status: 'canceled',
    currentPeriodEnd: periodEnd,
  })
}

export function changeLocalSubscriptionPlan(
  organizationId: string,
  coachId: string,
  planId: PlanId,
): CoachSubscription {
  const existing = loadLocalSubscription(organizationId)
  if (!existing) {
    return activateLocalSubscription(coachId, organizationId, planId)
  }
  return saveLocalSubscription({
    ...existing,
    planId,
    status: 'active',
  })
}
