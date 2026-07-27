import { getSupabase } from './lib/supabase'

export type AdminDashboardStats = {
  coaches: number
  athletes: number
  organizations: number
  pending_requests: number
  blocked_accounts: number
}

export type AdminPlanRequest = {
  id: string
  contact_name: string
  email: string
  organization_name: string
  coaches_count: number | null
  message: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  reviewed_at: string | null
  notes: string | null
  coach_registered: boolean
}

export type AdminAccount = {
  profile_id: string
  name: string
  email: string
  role: 'treinador' | 'atleta'
  blocked: boolean
  is_platform_admin: boolean
  created_at: string
  plan_id: string | null
  plan_status: string | null
  organization_name: string | null
  organization_id: string | null
}

type RpcResult = { ok: boolean; error?: string }

function parseError(error: { message: string } | null, data: RpcResult | null): string {
  if (error) return error.message
  if (data && !data.ok && data.error) return data.error
  return 'Request failed.'
}

export async function adminFetchDashboard(): Promise<
  { ok: true; stats: AdminDashboardStats } | { ok: false; error: string }
> {
  const { data, error } = await getSupabase().rpc('admin_get_dashboard_stats')
  if (error || !data?.ok) {
    return { ok: false, error: parseError(error, data as RpcResult) }
  }
  return {
    ok: true,
    stats: {
      coaches: data.coaches as number,
      athletes: data.athletes as number,
      organizations: data.organizations as number,
      pending_requests: data.pending_requests as number,
      blocked_accounts: data.blocked_accounts as number,
    },
  }
}

export async function adminFetchPlanRequests(
  status?: 'pending' | 'approved' | 'rejected' | null,
): Promise<{ ok: true; requests: AdminPlanRequest[] } | { ok: false; error: string }> {
  const { data, error } = await getSupabase().rpc('admin_list_organization_plan_requests', {
    p_status: status ?? null,
    p_limit: 100,
  })
  if (error || !data?.ok) {
    return { ok: false, error: parseError(error, data as RpcResult) }
  }
  return { ok: true, requests: (data.requests ?? []) as AdminPlanRequest[] }
}

export async function adminReviewPlanRequest(
  requestId: string,
  action: 'approve' | 'reject',
  notes?: string,
): Promise<{ ok: true; message?: string } | { ok: false; error: string }> {
  const { data, error } = await getSupabase().rpc('admin_review_organization_plan_request', {
    p_request_id: requestId,
    p_action: action,
    p_notes: notes ?? null,
    p_activate_plan: action === 'approve',
  })
  if (error || !data?.ok) {
    return { ok: false, error: parseError(error, data as RpcResult) }
  }

  const activation = data.activation as
    | { ok?: boolean; pending_signup?: boolean; message?: string; error?: string }
    | undefined
  if (activation?.pending_signup) {
    return { ok: true, message: activation.message }
  }
  if (activation && activation.ok === false && activation.error) {
    return { ok: true, message: `Request approved but activation failed: ${activation.error}` }
  }
  if (action === 'approve') {
    return { ok: true, message: 'Request approved and Team Academy activated.' }
  }
  return { ok: true }
}

export async function adminFetchAccounts(options?: {
  role?: 'treinador' | 'atleta' | null
  search?: string
  blockedOnly?: boolean
}): Promise<{ ok: true; accounts: AdminAccount[] } | { ok: false; error: string }> {
  const { data, error } = await getSupabase().rpc('admin_list_accounts', {
    p_role: options?.role ?? null,
    p_search: options?.search ?? null,
    p_blocked_only: options?.blockedOnly ?? false,
    p_limit: 100,
  })
  if (error || !data?.ok) {
    return { ok: false, error: parseError(error, data as RpcResult) }
  }
  return { ok: true, accounts: (data.accounts ?? []) as AdminAccount[] }
}

export async function adminSetAccountBlocked(
  profileId: string,
  blocked: boolean,
  reason?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await getSupabase().rpc('admin_set_account_blocked', {
    p_profile_id: profileId,
    p_blocked: blocked,
    p_reason: reason ?? null,
  })
  if (error || !data?.ok) {
    return { ok: false, error: parseError(error, data as RpcResult) }
  }
  return { ok: true }
}

export async function adminActivateCoachPlan(
  coachId: string,
  orgName: string,
  planId: 'team' | 'club' | 'organization' = 'organization',
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await getSupabase().rpc('admin_activate_coach_plan', {
    p_coach_id: coachId,
    p_org_name: orgName,
    p_plan_id: planId,
  })
  if (error || !data?.ok) {
    return { ok: false, error: parseError(error, data as RpcResult) }
  }
  return { ok: true }
}

export async function syncPlatformAdminBootstrap(): Promise<void> {
  await getSupabase().rpc('sync_platform_admin_bootstrap')
}
