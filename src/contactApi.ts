import { getSupabase } from './lib/supabase'
import type { ContactMessage, ContactMessageKind, UserRole } from './types'
import { contactStore } from './contactStore'

type RpcResult = { ok: boolean; error?: string; id?: string }

type ContactRow = {
  id: string
  kind: ContactMessageKind
  name: string
  email: string
  subject: string
  message: string
  user_id: string | null
  user_role: UserRole | null
  status: ContactMessage['status']
  created_at: string
}

function mapContactMessage(row: ContactRow | ContactMessage): ContactMessage {
  if ('createdAt' in row) return row
  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    email: row.email,
    subject: row.subject,
    message: row.message,
    userId: row.user_id,
    userRole: row.user_role,
    status: row.status,
    createdAt: row.created_at,
  }
}

export async function cloudSubmitContactMessage(input: {
  kind: ContactMessageKind
  name: string
  email: string
  subject: string
  message: string
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const { data, error } = await getSupabase().rpc('submit_contact_message', {
    p_kind: input.kind,
    p_name: input.name,
    p_email: input.email,
    p_subject: input.subject,
    p_message: input.message,
  })

  if (error) return { ok: false, error: error.message }
  const result = data as RpcResult
  if (!result?.ok) return { ok: false, error: result.error ?? 'Could not send message.' }
  return { ok: true, id: result.id ?? crypto.randomUUID() }
}

export async function adminFetchContactMessages(
  status?: 'new' | 'read' | 'resolved' | null,
): Promise<{ ok: true; messages: ContactMessage[] } | { ok: false; error: string }> {
  const { data, error } = await getSupabase().rpc('admin_list_contact_messages', {
    p_status: status ?? null,
    p_limit: 100,
  })
  if (error) return { ok: false, error: error.message }
  const result = data as { ok: boolean; error?: string; messages?: ContactRow[] }
  if (!result?.ok) return { ok: false, error: result.error ?? 'Could not load messages.' }
  const rows = result.messages ?? []
  return { ok: true, messages: rows.map(mapContactMessage) }
}

export async function adminUpdateContactMessageStatus(
  messageId: string,
  status: 'new' | 'read' | 'resolved',
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await getSupabase().rpc('admin_update_contact_message_status', {
    p_message_id: messageId,
    p_status: status,
  })
  if (error) return { ok: false, error: error.message }
  const result = data as RpcResult
  if (!result?.ok) return { ok: false, error: result.error ?? 'Could not update message.' }
  return { ok: true }
}

export function localSubmitContactMessage(input: {
  kind: ContactMessageKind
  name: string
  email: string
  subject: string
  message: string
  userId?: string | null
  userRole?: 'treinador' | 'atleta' | null
}): string {
  return contactStore.save({
    id: crypto.randomUUID(),
    kind: input.kind,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    subject: input.subject.trim(),
    message: input.message.trim(),
    userId: input.userId ?? null,
    userRole: input.userRole ?? null,
    status: 'new',
    createdAt: new Date().toISOString(),
  }).id
}

export function localFetchContactMessages(): ContactMessage[] {
  return contactStore.list()
}
