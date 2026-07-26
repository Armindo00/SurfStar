import { createEmptyCustomTemplate } from './customTrainingUtils'
import { getSupabase } from './lib/supabase'
import { buildCoachAthletesFromLinks } from './localPairing'
import type { PlanId } from './plans'
import type {
  AuthSession,
  CoachAccount,
  Organization,
  OrganizationMember,
  OrganizationRole,
} from './types'
import { store } from './store'

export type OrganizationContext = {
  organizationId: string
  organizationName: string
  role: OrganizationRole
  planId: PlanId
  subscriptionStatus: string
  currentPeriodEnd: string | null
  maxCoaches: number
}

export function mapOrganizationMember(
  row: {
    id: string
    profile_id?: string | null
    role: OrganizationRole
    status: 'pending' | 'active'
    invited_email?: string | null
    name?: string | null
    email?: string | null
    accepted_at?: string | null
    created_at?: string | null
  },
  organizationId: string,
): OrganizationMember {
  return {
    id: row.id,
    organizationId,
    profileId: row.profile_id ?? null,
    role: row.role,
    status: row.status,
    invitedEmail: row.invited_email ?? null,
    name: row.name ?? row.invited_email ?? 'Coach',
    email: row.email ?? row.invited_email ?? '',
    acceptedAt: row.accepted_at ?? null,
    createdAt: row.created_at ?? undefined,
  }
}

export async function cloudFetchOrganizationContext(): Promise<OrganizationContext | null> {
  const { data, error } = await getSupabase().rpc('get_my_organization_context')
  if (error || !data?.ok) return null

  return {
    organizationId: data.organization_id,
    organizationName: data.organization_name,
    role: data.role,
    planId: data.plan_id as PlanId,
    subscriptionStatus: data.subscription_status,
    currentPeriodEnd: data.current_period_end ?? null,
    maxCoaches: data.max_coaches ?? 1,
  }
}

export async function cloudEnsureOrganization(orgName?: string): Promise<string | null> {
  const { data, error } = await getSupabase().rpc('ensure_coach_organization', {
    p_org_name: orgName ?? null,
  })
  if (error || !data?.ok) return null
  return data.organization_id as string
}

export async function cloudAcceptOrganizationInvites(): Promise<number> {
  const { data, error } = await getSupabase().rpc('accept_organization_invites')
  if (error || !data?.ok) return 0
  return Number(data.accepted ?? 0)
}

export async function cloudListOrganizationMembers(): Promise<OrganizationMember[]> {
  const { data, error } = await getSupabase().rpc('list_organization_members')
  if (error || !data?.ok || !Array.isArray(data.members)) return []

  const orgId = (await cloudFetchOrganizationContext())?.organizationId ?? ''
  return (data.members as Array<Record<string, unknown>>).map((row) =>
    mapOrganizationMember(
      {
        id: String(row.id),
        profile_id: row.profile_id as string | null,
        role: row.role as OrganizationRole,
        status: row.status as 'pending' | 'active',
        invited_email: row.invited_email as string | null,
        name: row.name as string | null,
        email: row.email as string | null,
        accepted_at: row.accepted_at as string | null,
        created_at: row.created_at as string | null,
      },
      orgId,
    ),
  )
}

export async function cloudInviteOrganizationCoach(
  email: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await getSupabase().rpc('invite_organization_coach', { p_email: email })
  if (error) return { ok: false, error: error.message }
  if (!data?.ok) return { ok: false, error: data?.error ?? 'Could not send invite.' }
  return { ok: true }
}

export async function cloudRemoveOrganizationMember(
  memberId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await getSupabase().rpc('remove_organization_member', {
    p_member_id: memberId,
  })
  if (error) return { ok: false, error: error.message }
  if (!data?.ok) return { ok: false, error: data?.error ?? 'Could not remove member.' }
  return { ok: true }
}

export async function cloudUpdateOrganizationName(
  name: string,
): Promise<{ ok: true; name: string } | { ok: false; error: string }> {
  const { data, error } = await getSupabase().rpc('update_organization_name', { p_name: name })
  if (error) return { ok: false, error: error.message }
  if (!data?.ok) return { ok: false, error: data?.error ?? 'Could not update name.' }
  return { ok: true, name: data.name as string }
}

export function localGetOrganization(orgId: string): Organization | null {
  return store.getOrganizations().find((o) => o.id === orgId) ?? null
}

export function localEnsureCoachOrganization(
  coachId: string,
  coachName: string,
  orgName?: string,
): Organization {
  const coaches = store.getCoaches()
  const coach = coaches.find((c) => c.id === coachId)
  if (coach?.organizationId) {
    const existing = localGetOrganization(coach.organizationId)
    if (existing) return existing
  }

  const org: Organization = {
    id: crypto.randomUUID(),
    name: orgName?.trim() || `${coachName}'s Team`,
    createdAt: new Date().toISOString(),
  }

  store.saveOrganizations([...store.getOrganizations(), org])
  store.saveOrganizationMembers([
    ...store.getOrganizationMembers(),
    {
      id: crypto.randomUUID(),
      organizationId: org.id,
      profileId: coachId,
      role: 'owner',
      status: 'active',
      name: coachName,
      email: coach?.email ?? '',
      acceptedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
  ])

  if (coach) {
    store.saveCoaches(coaches.map((c) => (c.id === coachId ? { ...c, organizationId: org.id } : c)))
  }

  store.ensureOrgData(org.id)
  return org
}

export function localListOrganizationMembers(orgId: string): OrganizationMember[] {
  return store.getOrganizationMembers().filter((m) => m.organizationId === orgId)
}

export function localInviteOrganizationCoach(
  orgId: string,
  email: string,
): { ok: true } | { ok: false; error: string } {
  const normalized = email.trim().toLowerCase()
  if (!normalized.includes('@')) {
    return { ok: false, error: 'Enter a valid email.' }
  }

  const members = store.getOrganizationMembers()
  const coaches = store.getCoaches()
  const existingCoach = coaches.find((c) => c.email === normalized)

  if (
    members.some(
      (m) => m.organizationId === orgId && m.email.toLowerCase() === normalized && m.status === 'active',
    )
  ) {
    return { ok: false, error: 'This coach is already on your team.' }
  }

  if (
    members.some(
      (m) =>
        m.organizationId === orgId &&
        m.invitedEmail?.toLowerCase() === normalized &&
        m.status === 'pending',
    )
  ) {
    return { ok: false, error: 'An invite is already pending for this email.' }
  }

  const member: OrganizationMember = {
    id: crypto.randomUUID(),
    organizationId: orgId,
    profileId: existingCoach?.id ?? null,
    role: 'coach',
    status: existingCoach ? 'active' : 'pending',
    invitedEmail: normalized,
    name: existingCoach?.name ?? normalized,
    email: normalized,
    acceptedAt: existingCoach ? new Date().toISOString() : null,
    createdAt: new Date().toISOString(),
  }

  store.saveOrganizationMembers([...members, member])

  if (existingCoach && !existingCoach.organizationId) {
    store.saveCoaches(
      coaches.map((c) => (c.id === existingCoach.id ? { ...c, organizationId: orgId } : c)),
    )
  }

  return { ok: true }
}

export function localRemoveOrganizationMember(
  orgId: string,
  memberId: string,
): { ok: true } | { ok: false; error: string } {
  const members = store.getOrganizationMembers()
  const member = members.find((m) => m.id === memberId && m.organizationId === orgId)
  if (!member) return { ok: false, error: 'Member not found.' }
  if (member.role === 'owner') return { ok: false, error: 'Cannot remove the organization owner.' }

  store.saveOrganizationMembers(members.filter((m) => m.id !== memberId))

  if (member.profileId) {
    const coaches = store.getCoaches()
    store.saveCoaches(
      coaches.map((c) => (c.id === member.profileId ? { ...c, organizationId: undefined } : c)),
    )
  }

  return { ok: true }
}

export function localAcceptOrganizationInvites(email: string): number {
  const normalized = email.trim().toLowerCase()
  const coaches = store.getCoaches()
  const coach = coaches.find((c) => c.email === normalized)
  if (!coach) return 0

  let accepted = 0
  const members = store.getOrganizationMembers().map((m) => {
    if (m.status === 'pending' && m.invitedEmail?.toLowerCase() === normalized) {
      accepted++
      return {
        ...m,
        profileId: coach.id,
        status: 'active' as const,
        acceptedAt: new Date().toISOString(),
        name: coach.name,
        email: coach.email,
      }
    }
    return m
  })

  if (accepted > 0) {
    store.saveOrganizationMembers(members)
    const pending = members.find(
      (m) =>
        m.status === 'active' &&
        m.profileId === coach.id &&
        m.invitedEmail?.toLowerCase() === normalized,
    )
    if (pending && !coach.organizationId) {
      store.saveCoaches(
        coaches.map((c) => (c.id === coach.id ? { ...c, organizationId: pending.organizationId } : c)),
      )
      store.ensureOrgData(pending.organizationId)
    }
  }

  return accepted
}

export function localUpdateOrganizationName(
  orgId: string,
  name: string,
): { ok: true; name: string } | { ok: false; error: string } {
  const trimmed = name.trim()
  if (trimmed.length < 2) return { ok: false, error: 'Enter a valid name.' }

  const orgs = store.getOrganizations().map((o) => (o.id === orgId ? { ...o, name: trimmed } : o))
  store.saveOrganizations(orgs)
  return { ok: true, name: trimmed }
}

export function buildLocalCoachAuthSession(
  coach: CoachAccount,
): Extract<AuthSession, { role: 'treinador' }> {
  localAcceptOrganizationInvites(coach.email)
  const updatedCoach = store.getCoaches().find((c) => c.id === coach.id) ?? coach
  const org = localEnsureCoachOrganization(updatedCoach.id, updatedCoach.name)
  const member = localListOrganizationMembers(org.id).find((m) => m.profileId === updatedCoach.id)

  return {
    role: 'treinador',
    coachId: updatedCoach.id,
    organizationId: org.id,
    organizationRole: member?.role ?? 'owner',
    organizationName: org.name,
    name: updatedCoach.name,
    email: updatedCoach.email,
  }
}

export function loadLocalCoachData(organizationId: string) {
  const links = store.getPairings().filter((l) => l.organizationId === organizationId)
  const athletes = store.getAthletes()
  const templates = store.getCustomTemplatesForOrg(organizationId)
  return {
    athletes: buildCoachAthletesFromLinks(links, athletes),
    links,
    spots: store.getSpotsForOrg(organizationId),
    conditions: store.getConditionsForOrg(organizationId),
    trainingSessions: store.getTrainingSessionsForOrg(organizationId),
    customTemplates: templates.length > 0 ? templates : [createEmptyCustomTemplate()],
  }
}

export function buildLocalOrganizationContext(
  coachId: string,
  subscriptionPlanId: PlanId,
): OrganizationContext | null {
  const coach = store.getCoaches().find((c) => c.id === coachId)
  if (!coach?.organizationId) return null
  const org = localGetOrganization(coach.organizationId)
  if (!org) return null

  const member = store
    .getOrganizationMembers()
    .find((m) => m.organizationId === org.id && m.profileId === coachId && m.status === 'active')

  return {
    organizationId: org.id,
    organizationName: org.name,
    role: member?.role ?? 'owner',
    planId: subscriptionPlanId,
    subscriptionStatus: 'active',
    currentPeriodEnd: null,
    maxCoaches: subscriptionPlanId === 'organization' ? 5 : 1,
  }
}

export function filterLinksForOrganization(
  links: OrganizationMember[] | import('./types').CoachAthleteLink[],
  organizationId: string,
) {
  return (links as import('./types').CoachAthleteLink[]).filter(
    (l) => l.organizationId === organizationId,
  )
}
