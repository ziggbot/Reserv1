import type { Session } from '@supabase/supabase-js'
import { getSupabase } from '../lib/cloud/supabase'
import { exportableState, importCloudState, useAppStore } from './store'
import { rawStorage } from './storage'

/**
 * Mirrors the unlocked profile's data to Supabase (table app_state, one row per
 * auth user). Local storage stays the source you work from; the cloud row is a
 * copy that follows you between devices. Newest write wins, compared by the
 * row's updated_at against the moment we last pushed or pulled.
 *
 * Coach API keys are deliberately left out of the upload — they stay on the
 * device that entered them.
 */

export type CloudStatus =
  | { state: 'unconfigured' }
  | { state: 'signed_out' }
  | { state: 'syncing'; email: string }
  | { state: 'synced'; email: string; at: string }
  | { state: 'error'; email: string | null; message: string }

const listeners = new Set<(s: CloudStatus) => void>()
let status: CloudStatus = { state: 'unconfigured' }
let unsubscribeStore: (() => void) | null = null
let pushTimer: ReturnType<typeof setTimeout> | null = null
let pushing = false
let dirtyWhilePushing = false

export function cloudStatus(): CloudStatus {
  return status
}

export function subscribeCloud(fn: (s: CloudStatus) => void): () => void {
  listeners.add(fn)
  fn(status)
  return () => listeners.delete(fn)
}

function setStatus(s: CloudStatus) {
  status = s
  listeners.forEach((l) => l(s))
}

const LAST_SYNC_KEY = 'fitblueprint-cloud-last-sync'
function lastSyncAt(): string | null {
  return rawStorage.getItem(LAST_SYNC_KEY)
}
function markSynced(iso: string) {
  rawStorage.setItem(LAST_SYNC_KEY, iso)
}

/** Everything the cloud row holds: app data minus device-only secrets. */
export function cloudPayload(): Record<string, unknown> {
  const { coachApiKeys: _keys, ...rest } = exportableState()
  return rest
}

export async function currentSession(): Promise<Session | null> {
  const sb = getSupabase()
  if (!sb) return null
  const { data } = await sb.auth.getSession()
  return data.session
}

export async function signIn(email: string, password: string): Promise<string | null> {
  const sb = getSupabase()
  if (!sb) return 'Supabase is not configured.'
  const { error } = await sb.auth.signInWithPassword({ email, password })
  if (error) return error.message
  await startSync()
  return null
}

export async function signUp(email: string, password: string): Promise<string | null> {
  const sb = getSupabase()
  if (!sb) return 'Supabase is not configured.'
  const { data, error } = await sb.auth.signUp({ email, password })
  if (error) return error.message
  if (!data.session) return 'Check your inbox and confirm the email, then sign in.'
  await startSync()
  return null
}

export async function signOut(): Promise<void> {
  const sb = getSupabase()
  stopSync()
  if (sb) await sb.auth.signOut()
  rawStorage.removeItem(LAST_SYNC_KEY)
  setStatus(sb ? { state: 'signed_out' } : { state: 'unconfigured' })
}

/**
 * Called once a profile is unlocked (and after sign-in). Pulls the cloud row if
 * it is newer than what we have, pushes if we are newer, then keeps pushing on
 * every change (debounced).
 */
export async function startSync(): Promise<void> {
  const sb = getSupabase()
  if (!sb) {
    setStatus({ state: 'unconfigured' })
    return
  }
  const session = await currentSession()
  if (!session) {
    setStatus({ state: 'signed_out' })
    return
  }
  const email = session.user.email ?? ''
  setStatus({ state: 'syncing', email })

  try {
    const { data, error } = await sb.from('app_state').select('data, updated_at').eq('user_id', session.user.id).maybeSingle()
    if (error) throw new Error(error.message)

    const local = lastSyncAt()
    const localHasData = useAppStore.getState().profile !== null
    if (data && (!local || data.updated_at > local || !localHasData)) {
      importCloudState(data.data as Record<string, unknown>)
      markSynced(data.updated_at)
    } else {
      await pushNow(session.user.id)
    }
    setStatus({ state: 'synced', email, at: lastSyncAt() ?? new Date().toISOString() })
  } catch (e) {
    setStatus({ state: 'error', email, message: e instanceof Error ? e.message : 'sync failed' })
  }

  unsubscribeStore?.()
  unsubscribeStore = useAppStore.subscribe(() => schedulePush(session.user.id))
}

export function stopSync(): void {
  unsubscribeStore?.()
  unsubscribeStore = null
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = null
}

function schedulePush(userId: string) {
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(() => void pushNow(userId), 1500)
}

async function pushNow(userId: string): Promise<void> {
  const sb = getSupabase()
  if (!sb) return
  if (pushing) {
    dirtyWhilePushing = true
    return
  }
  pushing = true
  try {
    const updated_at = new Date().toISOString()
    const { error } = await sb.from('app_state').upsert({ user_id: userId, data: cloudPayload(), updated_at })
    if (error) throw new Error(error.message)
    markSynced(updated_at)
    if (status.state !== 'unconfigured' && status.state !== 'signed_out') {
      setStatus({ state: 'synced', email: status.email ?? '', at: updated_at })
    }
  } catch (e) {
    if (status.state !== 'unconfigured' && status.state !== 'signed_out') {
      setStatus({ state: 'error', email: status.email, message: e instanceof Error ? e.message : 'push failed' })
    }
  } finally {
    pushing = false
    if (dirtyWhilePushing) {
      dirtyWhilePushing = false
      schedulePush(userId)
    }
  }
}

/** Manual "Sync now": push local data, regardless of timers. */
export async function syncNow(): Promise<void> {
  const session = await currentSession()
  if (session) await pushNow(session.user.id)
}
