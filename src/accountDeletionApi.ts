import { getSupabase } from './lib/supabase'

export type AccountDeletionRequest = {
  id: string
  user_id?: string
  profile_id?: string
  email?: string
  role: 'treinador' | 'atleta'
  reason: string | null
  status: 'pending' | 'completed' | 'rejected'
  created_at: string
  processed_at: string | null
  admin_notes: string | null
}

export async function cloudRequestAccountDeletion(
  reason?: string,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const { data, error } = await getSupabase().rpc('request_account_deletion', {
    p_reason: reason?.trim() ?? null,
  })
  if (error) {
    if (error.message.includes('request_account_deletion')) {
      return { ok: false, error: 'Account deletion is not configured yet. Email contact@surfstar.app.' }
    }
    return { ok: false, error: error.message }
  }
  if (!data?.ok) return { ok: false, error: data?.error ?? 'Could not submit request.' }
  return { ok: true, id: data.id as string }
}

export async function cloudFetchMyAccountDeletionRequest(): Promise<
  { ok: true; request: AccountDeletionRequest | null } | { ok: false; error: string }
> {
  const { data, error } = await getSupabase().rpc('fetch_my_account_deletion_request')
  if (error) {
    if (error.message.includes('fetch_my_account_deletion_request')) {
      return { ok: true, request: null }
    }
    return { ok: false, error: error.message }
  }
  if (!data?.ok) return { ok: false, error: data?.error ?? 'Could not load request.' }
  return { ok: true, request: (data.request as AccountDeletionRequest | null) ?? null }
}

export async function adminFetchAccountDeletionRequests(
  status: 'pending' | 'completed' | 'rejected' = 'pending',
): Promise<{ ok: true; requests: AccountDeletionRequest[] } | { ok: false; error: string }> {
  const { data, error } = await getSupabase().rpc('admin_list_account_deletion_requests', {
    p_status: status,
    p_limit: 50,
  })
  if (error) return { ok: false, error: error.message }
  if (!data?.ok) return { ok: false, error: data?.error ?? 'Could not load requests.' }
  return { ok: true, requests: (data.requests as AccountDeletionRequest[]) ?? [] }
}

export async function adminProcessAccountDeletionRequest(
  requestId: string,
  action: 'approve' | 'reject',
  notes?: string,
): Promise<{ ok: true; status: string } | { ok: false; error: string }> {
  const { data, error } = await getSupabase().rpc('admin_process_account_deletion_request', {
    p_request_id: requestId,
    p_action: action,
    p_notes: notes?.trim() ?? null,
  })
  if (error) return { ok: false, error: error.message }
  if (!data?.ok) return { ok: false, error: data?.error ?? 'Could not process request.' }
  return { ok: true, status: data.status as string }
}
