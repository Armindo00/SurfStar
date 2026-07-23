import { createClient, type SupabaseClient } from '@supabase/supabase-js'

function cleanEnvValue(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  let value = raw.trim().replace(/^['"]|['"]$/g, '')
  if (!value) return undefined

  // Handles accidental pastes like "VITE_SUPABASE_URL=https://..."
  if (value.includes('=') && !value.startsWith('http')) {
    const tail = value.split('=').pop()?.trim()
    if (tail?.startsWith('http')) value = tail
  }

  return value
}

const url = cleanEnvValue(import.meta.env.VITE_SUPABASE_URL as string | undefined)
const anonKey = cleanEnvValue(import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)

function assertSupabaseConfig(): { url: string; anonKey: string } {
  if (!url || !anonKey) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
  }

  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('Invalid protocol')
    }
  } catch {
    throw new Error(
      'Invalid Supabase URL in Vercel settings. Use exactly: https://msozgsmqytnejijyzoot.supabase.co',
    )
  }

  return { url, anonKey }
}

let mainClient: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  const config = assertSupabaseConfig()
  if (!mainClient) {
    mainClient = createClient(config.url, config.anonKey)
  }
  return mainClient
}

/** Sign up an athlete without replacing the coach session. */
export function getEphemeralSupabase(): SupabaseClient {
  const config = assertSupabaseConfig()
  return createClient(config.url, config.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: 'surfstar-ephemeral-auth',
    },
  })
}
