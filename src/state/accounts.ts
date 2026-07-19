import { createIdentity, cryptoAvailable, unlockIdentity } from '../lib/crypto'
import { rawStorage } from './storage'

/**
 * Account registry. Stores only non-secret metadata: the KDF salt and a
 * verifier blob (an opaque token encrypted with the passcode-derived key).
 * The passcode and the decryption key are never persisted.
 */

export interface AccountMeta {
  id: string
  displayName: string
  saltB64: string
  verifierB64: string
  createdAt: string
  consentAt: string
}

const REGISTRY_KEY = 'fitblueprint-accounts'

export function listAccounts(): AccountMeta[] {
  try {
    const raw = rawStorage.getItem(REGISTRY_KEY)
    return raw ? (JSON.parse(raw) as AccountMeta[]) : []
  } catch {
    return []
  }
}

function writeRegistry(list: AccountMeta[]): void {
  rawStorage.setItem(REGISTRY_KEY, JSON.stringify(list))
}

function newId(): string {
  const b = new Uint8Array(8)
  crypto.getRandomValues(b)
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
}

export function storageNameFor(id: string): string {
  return `fitblueprint-user-${id}`
}

export async function createAccount(
  displayName: string,
  passcode: string,
  nowIso: string,
): Promise<{ meta: AccountMeta; key: CryptoKey }> {
  if (!cryptoAvailable()) throw new Error('crypto-unavailable')
  const { key, saltB64, verifierB64 } = await createIdentity(passcode)
  const meta: AccountMeta = {
    id: newId(),
    displayName: displayName.trim() || 'Me',
    saltB64,
    verifierB64,
    createdAt: nowIso,
    consentAt: nowIso,
  }
  writeRegistry([...listAccounts(), meta])
  return { meta, key }
}

export async function unlockAccount(id: string, passcode: string): Promise<CryptoKey | null> {
  const meta = listAccounts().find((a) => a.id === id)
  if (!meta) return null
  return unlockIdentity(passcode, meta.saltB64, meta.verifierB64)
}

/** Right to erasure (GDPR Art. 17): remove the account's data blob and its registry entry. */
export function eraseAccount(id: string): void {
  rawStorage.removeItem(storageNameFor(id))
  writeRegistry(listAccounts().filter((a) => a.id !== id))
}

export const LEGACY_KEY = 'fitblueprint-v1'

/** Plaintext state from the pre-accounts version, if present, for one-time import. */
export function readLegacyState(): unknown | null {
  try {
    const raw = rawStorage.getItem(LEGACY_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.state ?? null
  } catch {
    return null
  }
}

export function clearLegacyState(): void {
  rawStorage.removeItem(LEGACY_KEY)
}
