import { getSupabase } from './lib/supabase'
import { getTeamAcademyContactEmail } from './plans'

export type OrganizationPlanRequest = {
  contactName: string
  email: string
  organizationName: string
  coachesCount?: number | null
  message?: string
}

export function buildTeamAcademyMailtoLink(request: OrganizationPlanRequest): string {
  const subject = encodeURIComponent(`Team Academy request — ${request.organizationName}`)
  const body = encodeURIComponent(
    [
      'Team Academy access request',
      '',
      `Contact: ${request.contactName}`,
      `Email: ${request.email}`,
      `Organization: ${request.organizationName}`,
      request.coachesCount ? `Coaches needed: ${request.coachesCount}` : '',
      '',
      request.message?.trim() ? `Message:\n${request.message.trim()}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
  )
  return `mailto:${getTeamAcademyContactEmail()}?subject=${subject}&body=${body}`
}

export async function cloudSubmitOrganizationPlanRequest(
  request: OrganizationPlanRequest,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await getSupabase().rpc('submit_organization_plan_request', {
    p_contact_name: request.contactName.trim(),
    p_email: request.email.trim().toLowerCase(),
    p_organization_name: request.organizationName.trim(),
    p_coaches_count: request.coachesCount ?? null,
    p_message: request.message?.trim() ?? null,
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

export async function submitOrganizationPlanRequest(
  request: OrganizationPlanRequest,
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
