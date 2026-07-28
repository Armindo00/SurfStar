import { getSupabase } from './lib/supabase'
import {
  normalizeBillingAddress,
  type BillingAddress,
} from './billingUtils'
import { getBillingCountryName } from './billingCountries'
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
  billingAddress: BillingAddress
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
  billing_street: string | null
  billing_address_line2: string | null
  billing_postal_code: string | null
  billing_city: string | null
  billing_region: string | null
  billing_country: string | null
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
      `Tax ID / VAT: ${request.taxId}`,
      `Address line 1: ${request.billingAddress.street}`,
      request.billingAddress.addressLine2
        ? `Address line 2: ${request.billingAddress.addressLine2}`
        : '',
      `Postal / ZIP: ${request.billingAddress.postalCode}`,
      `City: ${request.billingAddress.city}`,
      request.billingAddress.region ? `Region: ${request.billingAddress.region}` : '',
      `Country: ${getBillingCountryName(request.billingAddress.countryCode)} (${request.billingAddress.countryCode})`,
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
  const address = normalizeBillingAddress(request.billingAddress)
  const { data, error } = await getSupabase().rpc('submit_organization_plan_request', {
    p_contact_name: request.contactName.trim(),
    p_email: request.email.trim().toLowerCase(),
    p_organization_name: request.organizationName.trim(),
    p_coaches_count: request.coachesCount ?? null,
    p_message: request.message?.trim() ?? null,
    p_plan_id: request.planId ?? 'organization',
    p_billing_interval: request.billingInterval ?? 'monthly',
    p_tax_id: request.taxId.trim(),
    p_billing_street: address.street,
    p_billing_address_line2: address.addressLine2 ?? null,
    p_billing_postal_code: address.postalCode,
    p_billing_city: address.city,
    p_billing_region: address.region ?? null,
    p_billing_country: address.countryCode,
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
