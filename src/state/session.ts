import { encryptWithKey, decryptWithKey } from '../lib/crypto'

/**
 * Holds the unlocked account for the current tab, in memory only. Locking or
 * closing the tab wipes the key — nothing readable is left behind at rest.
 */

interface Session {
  accountId: string
  displayName: string
  key: CryptoKey | null // null = plaintext fallback (no WebCrypto / sandbox)
}

let session: Session | null = null
const listeners = new Set<() => void>()

export function getSession(): Session | null {
  return session
}

export function setSession(s: Session): void {
  session = s
  listeners.forEach((l) => l())
}

export function clearSession(): void {
  session = null
  listeners.forEach((l) => l())
}

export function subscribeSession(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** Encrypt a plaintext string for storage with the session key (or pass through in fallback). */
export async function sessionEncrypt(plaintext: string): Promise<string> {
  if (!session) throw new Error('no-session')
  if (!session.key) return `plain:${plaintext}`
  return `enc:${await encryptWithKey(session.key, plaintext)}`
}

export async function sessionDecrypt(stored: string): Promise<string | null> {
  if (!session) return null
  if (stored.startsWith('plain:')) return stored.slice(6)
  if (stored.startsWith('enc:')) {
    if (!session.key) return null
    try {
      return await decryptWithKey(session.key, stored.slice(4))
    } catch {
      return null
    }
  }
  return null
}
