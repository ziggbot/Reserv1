import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { rawStorage } from '../../state/storage'

/**
 * Supabase connection. Credentials come from build-time env (VITE_SUPABASE_URL,
 * VITE_SUPABASE_ANON_KEY — set as GitHub secrets for the Pages build) or from
 * values pasted into Settings, which win so a deployed build can be pointed at
 * a project without rebuilding. The anon key is public by design; row-level
 * security on the table is what protects each user's data.
 */

export interface SupabaseConfig {
  url: string
  anonKey: string
}

const CONFIG_KEY = 'fitblueprint-supabase'

export function envConfig(): SupabaseConfig | null {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  return url && anonKey ? { url, anonKey } : null
}

export function storedConfig(): SupabaseConfig | null {
  try {
    const raw = rawStorage.getItem(CONFIG_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<SupabaseConfig>
    return parsed.url && parsed.anonKey ? { url: parsed.url, anonKey: parsed.anonKey } : null
  } catch {
    return null
  }
}

export function saveStoredConfig(cfg: SupabaseConfig | null): void {
  if (cfg) rawStorage.setItem(CONFIG_KEY, JSON.stringify(cfg))
  else rawStorage.removeItem(CONFIG_KEY)
  client = undefined
}

export function activeConfig(): SupabaseConfig | null {
  return storedConfig() ?? envConfig()
}

let client: SupabaseClient | null | undefined

/** The shared client, or null when no credentials are configured. */
export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client
  const cfg = activeConfig()
  client = cfg ? createClient(cfg.url, cfg.anonKey) : null
  return client
}
