import type { Session } from '@supabase/supabase-js'
import { getSupabase } from '../lib/cloud/supabase'
import { mergeAppData, stableJson } from '../lib/cloud/merge'
import { exportableState, importCloudState, useAppStore } from './store'
import { getSession } from './session'
import { rawStorage } from './storage'

/**
 * Mirrors the unlocked profile's data to Supabase (table app_state, one row per
 * auth user). Local storage stays the source you work from; the cloud row is a
 * copy that follows you between devices.
 *
 *  - Every change is pushed after a short debounce (fetch keepalive, so a
 *    closing tab still delivers it).
 *  - The row is pulled on unlock, on sign-in, whenever the tab becomes visible
 *    and every minute while visible. A newer row is MERGED into local data:
 *    workouts, weigh-ins, habit ticks, chat and history are unioned, so
 *    nothing logged on either device is lost; single-valued things (profile,
 *    program, settings) come from the side that wrote last.
 *  - Coach API keys never leave the device.
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
let pollTimer: ReturnType<typeof setInterval> | null = null
let pushing = false
let dirtyWhilePushing = false
let applyingRemote = false
let lastPayloadJson: string | null = null
let activeUserId: string | null = null
let listenersInstalled = false

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

function email(): string {
  return status.state === 'unconfigured' || status.state === 'signed_out' ? '' : (status.email ?? '')
}

/** Last successful sync per local profile, so two profiles on one device do not share a clock. */
function lastSyncKey(): string {
  return `fitblueprint-cloud-last-sync:${getSession()?.accountId ?? 'anon'}`
}
function lastSyncAt(): string | null {
  return rawStorage.getItem(lastSyncKey())
}
function markSynced(iso: string) {
  rawStorage.setItem(lastSyncKey(), iso)
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
  rawStorage.removeItem(lastSyncKey())
  lastPayloadJson = null
  setStatus(sb ? { state: 'signed_out' } : { state: 'unconfigured' })
}

/** Called once a profile is unlocked (and after sign-in). */
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
  activeUserId = session.user.id
  setStatus({ state: 'syncing', email: session.user.email ?? '' })
  await pullNow(session.user.id, session.user.email ?? '')

  unsubscribeStore?.()
  unsubscribeStore = useAppStore.subscribe(() => {
    if (!applyingRemote) schedulePush(session.user.id)
  })
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = setInterval(() => {
    if (typeof document === 'undefined' || document.visibilityState === 'visible') void pullNow(session.user.id, session.user.email ?? '')
  }, 60_000)
  installWindowListeners()
}

export function stopSync(): void {
  unsubscribeStore?.()
  unsubscribeStore = null
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = null
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = null
  activeUserId = null
}

function installWindowListeners() {
  if (listenersInstalled || typeof window === 'undefined') return
  listenersInstalled = true
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && activeUserId) void pullNow(activeUserId, email())
    if (document.visibilityState === 'hidden' && activeUserId && pushTimer) {
      clearTimeout(pushTimer)
      pushTimer = null
      void pushNow(activeUserId)
    }
  })
  window.addEventListener('pagehide', () => {
    if (activeUserId && pushTimer) {
      clearTimeout(pushTimer)
      pushTimer = null
      void pushNow(activeUserId)
    }
  })
}

/**
 * Fetch the row. Newer than our last sync (or we have nothing yet) → merge it
 * into local data and, if local had anything the row lacked, push the merge
 * back. Otherwise push local if it changed since the last sync.
 */
export async function pullNow(userId: string, who: string): Promise<void> {
  const sb = getSupabase()
  if (!sb || pushing) return
  try {
    const { data, error } = await sb.from('app_state').select('data, updated_at').eq('user_id', userId).maybeSingle()
    if (error) throw new Error(friendly(error.message))

    const local = cloudPayload()
    const localJson = stableJson(local)
    const localHasData = useAppStore.getState().profile !== null
    const since = lastSyncAt()

    if (data && (!since || data.updated_at > since || !localHasData)) {
      const remote = data.data as Record<string, unknown>
      const merged = mergeAppData(local, remote, true)
      const mergedJson = stableJson(merged)
      applyingRemote = true
      try {
        importCloudState(merged)
      } finally {
        applyingRemote = false
      }
      markSynced(data.updated_at)
      lastPayloadJson = stableJson(remote)
      if (mergedJson !== lastPayloadJson) await pushNow(userId) // local had extras the cloud lacked
      else setStatus({ state: 'synced', email: who, at: data.updated_at })
    } else if (!data || localJson !== lastPayloadJson) {
      await pushNow(userId)
    } else {
      setStatus({ state: 'synced', email: who, at: since ?? new Date().toISOString() })
    }
  } catch (e) {
    setStatus({ state: 'error', email: who, message: e instanceof Error ? e.message : 'sync failed' })
  }
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
    const payload = cloudPayload()
    const json = stableJson(payload)
    const updated_at = new Date().toISOString()
    if (json !== lastPayloadJson) {
      const { error } = await sb.from('app_state').upsert({ user_id: userId, data: payload, updated_at })
      if (error) throw new Error(friendly(error.message))
      lastPayloadJson = json
      markSynced(updated_at)
    }
    setStatus({ state: 'synced', email: email(), at: lastSyncAt() ?? updated_at })
  } catch (e) {
    setStatus({ state: 'error', email: email() || null, message: e instanceof Error ? e.message : 'push failed' })
  } finally {
    pushing = false
    if (dirtyWhilePushing) {
      dirtyWhilePushing = false
      schedulePush(userId)
    }
  }
}

/** Manual "Sync now": pull (merge) and push. */
export async function syncNow(): Promise<void> {
  const session = await currentSession()
  if (session) await pullNow(session.user.id, session.user.email ?? '')
}

function friendly(message: string): string {
  if (/app_state/.test(message) && /does not exist|schema cache/.test(message)) {
    return 'Table app_state is missing — run supabase/schema.sql in the Supabase SQL editor once.'
  }
  return message
}
