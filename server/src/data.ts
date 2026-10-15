import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js'
import { mergeAppData } from '../../src/lib/cloud/merge'

/**
 * Data access for one authenticated user. The MCP server reads and writes the
 * same `app_state` row as the web app, under the user's own token so Supabase
 * row-level security applies exactly as in the browser.
 */

export interface Env {
  supabaseUrl: string
  supabaseAnonKey: string
}

export function env(): Env {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set')
  return { supabaseUrl, supabaseAnonKey }
}

/** A client that acts as the user (RLS enforced), built from their Bearer token. */
export function userClient(token: string): SupabaseClient {
  const e = env()
  return createClient(e.supabaseUrl, e.supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** Verify a Supabase access token by asking Supabase who it belongs to. */
export async function verifySupabaseToken(token: string): Promise<AuthInfo> {
  const sb = userClient(token)
  const { data, error } = await sb.auth.getUser(token)
  if (error || !data.user) throw new Error(error?.message ?? 'invalid token')
  // Supabase access tokens are JWTs with `exp`; for an opaque token assume Supabase's default 1 h.
  let expiresAt = Math.floor(Date.now() / 1000) + 3600
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64url').toString('utf8'))
    if (typeof payload.exp === 'number') expiresAt = payload.exp
  } catch {
    /* opaque token: keep the default */
  }
  return { token, clientId: data.user.id, scopes: ['fitblueprint'], expiresAt, extra: { userId: data.user.id, email: data.user.email } }
}

export type AppData = Record<string, unknown>

export async function readData(token: string, userId: string): Promise<AppData | null> {
  const sb = userClient(token)
  const { data, error } = await sb.from('app_state').select('data').eq('user_id', userId).maybeSingle()
  if (error) throw new Error(error.message)
  return (data?.data as AppData) ?? null
}

/**
 * Read → mutate → write, merging with whatever is in the row at write time so a
 * concurrent push from the web app is not lost.
 */
export async function updateData(token: string, userId: string, mutate: (d: AppData) => AppData): Promise<AppData> {
  const sb = userClient(token)
  const current = (await readData(token, userId)) ?? {}
  const next = mutate(structuredClone(current))
  const merged = mergeAppData(current, next, true)
  const updated_at = new Date().toISOString()
  const { error } = await sb.from('app_state').upsert({ user_id: userId, data: merged, updated_at })
  if (error) throw new Error(error.message)
  return merged
}
