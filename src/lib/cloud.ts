import { createAuthClient } from '@neon/auth'
import { BetterAuthReactAdapter } from '@neon/auth/react/adapters'
import { listAccounts, registerRestoredAccount, type AccountMeta } from '../state/accounts'
import { getSession, sessionEncrypt } from '../state/session'
import { exportableState } from '../state/store'
import { decryptWithKey, unlockIdentity } from './crypto'

const client = createAuthClient(`${window.location.origin}/api/auth`, {
  adapter: BetterAuthReactAdapter({ fetchOptions: { credentials: 'include' } }),
})
type ManagedResult<T> = Promise<{ data: T | null; error: { message?: string } | null }>
// These are built-in Managed Auth methods. This SDK release loses their plugin
// types under the app's TypeScript version; no custom auth plugins are added.
export const cloudAuth = client as typeof client & {
  token(): ManagedResult<{ token: string }>
  emailOtp: {
    resetPassword(input: { email: string; otp: string; password: string }): ManagedResult<unknown>
    sendVerificationOtp(input: { email: string; type: 'forget-password' }): ManagedResult<unknown>
  }
}

export interface CloudBackup {
  profile_id: string
  metadata: AccountMeta
  revision: number
  updated_at: string
}

async function cloudRequest(path = '', options: RequestInit = {}) {
  const { data, error } = await cloudAuth.token()
  if (error || !data?.token) throw new Error('Logga in på ditt molnkonto igen.')
  const response = await fetch(`/api/backups${path}`, { ...options, headers: { ...options.headers, 'Content-Type': 'application/json', Authorization: `Bearer ${data.token}` }, cache: 'no-store' })
  if (response.status === 204) return null
  const result = await response.json()
  if (!response.ok) throw new Error(response.status === 409 ? 'En nyare kopia finns i molnet. Uppdatera listan och välj sedan vilken version du vill spara.' : result.error || 'Molntjänsten svarar inte.')
  return result
}

export async function listCloudBackups(): Promise<CloudBackup[]> { return (await cloudRequest()).backups }

export async function saveCloudBackup(expectedRevision: number) {
  const session = getSession()
  if (!session?.key) throw new Error('Lås upp en krypterad lokal profil först.')
  const metadata = listAccounts().find(account => account.id === session.accountId)
  if (!metadata) throw new Error('Profilen kunde inte hittas.')
  const state = exportableState()
  // Provider keys stay on the device even inside an encrypted cloud snapshot.
  state.coachApiKeys = {}
  const ciphertext = await sessionEncrypt(JSON.stringify({ state, version: 0 }))
  return cloudRequest(`/${metadata.id}`, { method: 'PUT', body: JSON.stringify({ metadata, ciphertext, expectedRevision }) })
}

export async function restoreCloudBackup(id: string, passcode: string) {
  const backup = await cloudRequest(`/${id}`)
  if (!backup?.metadata || !backup.ciphertext?.startsWith('enc:')) throw new Error('Ogiltig säkerhetskopia.')
  const key = await unlockIdentity(passcode, backup.metadata.saltB64, backup.metadata.verifierB64)
  if (!key) throw new Error('Fel profilkod. Molnlösenordet och profilkoden kan vara olika.')
  const data = JSON.parse(await decryptWithKey(key, backup.ciphertext.slice(4)))
  if (!data || typeof data.state !== 'object' || !data.state || !('profile' in data.state)) throw new Error('Säkerhetskopian kunde inte läsas.')
  registerRestoredAccount(backup.metadata, backup.ciphertext)
}

export async function removeCloudBackup(id: string) { await cloudRequest(`/${id}`, { method: 'DELETE' }) }
