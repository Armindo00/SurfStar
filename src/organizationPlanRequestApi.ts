import { getSupabase } from './lib/supabase'
import { getTeamAcademyContactEmail, type BillingInterval, type PlanId } from './plans'

export type PaymentStatus = 'unpaid' | 'paid' | 'waived'

export type PlanPaymentRequest = {
  contactName: string
  email: string
  organizationName: string
  coachesCount?: number | null
  message?: string
  planId?: PlanId
  billingInterval?: BillingInterval
  taxId: string
  billingAddress: string
}

export type CoachPlanRequest = {
  id: string
  contact_name: string
  email: string
  organization_name: string
  coaches_count: number | null
  message: string | null
  status: 'pending' | 'approved' | 'rejected'
  plan_id: PlanId
  billing_interval: BillingInterval
  payment_status: PaymentStatus
  tax_id: string | null
  billing_address: string | null
  created_at: string
  reviewed_at: string | null
  notes: string | null
  paid_at: string | null
  activated_at: string | null
}

export function buildTeamAcademyMailtoLink(request: PlanPaymentRequest): string {
  const subject = encodeURIComponent(`Plan request — ${request.organizationName}`)
  const body = encodeURIComponent(
    [
      'SurfStar plan access request',
      '',
      `Contact: ${request.contactName}`,
      `Email: ${request.email}`,
      `Organization: ${request.organizationName}`,
      request.planId ? `Plan: ${request.planId}` : '',
      request.billingInterval ? `Billing: ${request.billingInterval}` : '',
      request.coachesCount ? `Coaches needed: ${request.coachesCount}` : '',
      `NIF: ${request.taxId}`,
      `Billing address: ${request.billingAddress}`,
      '',
      request.message?.trim() ? `Message:\n${request.message.trim()}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
  )
  return `mailto:${getTeamAcademyContactEmail()}?subject=${subject}&body=${body}`
}

export async function cloudSubmitOrganizationPlanRequest(
  request: PlanPaymentRequest,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await getSupabase().rpc('submit_organization_plan_request', {
    p_contact_name: request.contactName.trim(),
    p_email: request.email.trim().toLowerCase(),
    p_organization_name: request.organizationName.trim(),
    p_coaches_count: request.coachesCount ?? null,
    p_message: request.message?.trim() ?? null,
    p_plan_id: request.planId ?? 'organization',
    p_billing_interval: request.billingInterval ?? 'monthly',
    p_tax_id: request.taxId.trim(),
    p_billing_address: request.billingAddress.trim(),
  })

  if (error) {
    if (error.message.includes('submit_organization_plan_request')) {
      return { ok: false, error: 'REQUESTS_NOT_CONFIGURED' }
    }
    return { ok: false, error: error.message }
  }

  if (!data?.ok) {
    return { ok: false, error: data?.error ?? 'Could not submit request.' }
  }

  return { ok: true }
}

export async function fetchCoachPlanRequest(): Promise<
  { ok: true; request: CoachPlanRequest | null } | { ok: false; error: string }
> {
  const { data, error } = await getSupabase().rpc('fetch_coach_plan_request')
  if (error) {
    if (error.message.includes('fetch_coach_plan_request')) {
      return { ok: true, request: null }
    }
    return { ok: false, error: error.message }
  }
  if (!data?.ok) {
    return { ok: false, error: data?.error ?? 'Could not load request.' }
  }
  return { ok: true, request: (data.request as CoachPlanRequest | null) ?? null }
}

export async function submitOrganizationPlanRequest(
  request: PlanPaymentRequest,
  cloudMode: boolean,
): Promise<{ ok: true; via: 'cloud' | 'email' } | { ok: false; error: string }> {
  if (cloudMode) {
    const result = await cloudSubmitOrganizationPlanRequest(request)
    if (result.ok) return { ok: true, via: 'cloud' }
    if (result.error === 'REQUESTS_NOT_CONFIGURED') {
      window.location.href = buildTeamAcademyMailtoLink(request)
      return { ok: true, via: 'email' }
    }
    return result
  }

  window.location.href = buildTeamAcademyMailtoLink(request)
  return { ok: true, via: 'email' }
}
