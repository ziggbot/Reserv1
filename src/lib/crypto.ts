/**
 * Client-side encryption for per-user data at rest.
 * Passcode → PBKDF2-SHA256 (310k iters) → AES-256-GCM key. The passcode itself
 * is never stored; a separately derived verifier lets us recognize a correct
 * passcode without keeping it. All primitives are WebCrypto (SubtleCrypto).
 */

const PBKDF2_ITERATIONS = 310_000 // OWASP 2023 floor for PBKDF2-HMAC-SHA256
const enc = new TextEncoder()
const dec = new TextDecoder()

export function cryptoAvailable(): boolean {
  return typeof crypto !== 'undefined' && !!crypto.subtle && typeof crypto.getRandomValues === 'function'
}

export function randomBytes(n: number): Uint8Array {
  const b = new Uint8Array(n)
  crypto.getRandomValues(b)
  return b
}

export function toBase64(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s)
}

export function fromBase64(b64: string): Uint8Array {
  const s = atob(b64)
  const out = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i)
  return out
}

async function deriveKey(passcode: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey('raw', enc.encode(passcode), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

/**
 * A verifier proves a passcode is correct without storing it: we encrypt a fixed
 * token with the derived key; on unlock we re-derive and try to decrypt it.
 */
const VERIFIER_TOKEN = 'fitblueprint-verifier-v1'

export interface DerivedIdentity {
  key: CryptoKey
  saltB64: string
  verifierB64: string
}

export async function createIdentity(passcode: string): Promise<DerivedIdentity> {
  const salt = randomBytes(16)
  const key = await deriveKey(passcode, salt)
  const verifierB64 = await encryptWithKey(key, VERIFIER_TOKEN)
  return { key, saltB64: toBase64(salt), verifierB64 }
}

/** Returns the AES key if the passcode is correct, else null. */
export async function unlockIdentity(
  passcode: string,
  saltB64: string,
  verifierB64: string,
): Promise<CryptoKey | null> {
  const key = await deriveKey(passcode, fromBase64(saltB64))
  try {
    const token = await decryptWithKey(key, verifierB64)
    return token === VERIFIER_TOKEN ? key : null
  } catch {
    return null // GCM auth failure = wrong passcode
  }
}

/** IV is prepended to the ciphertext; whole blob is base64. */
export async function encryptWithKey(key: CryptoKey, plaintext: string): Promise<string> {
  const iv = randomBytes(12)
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, enc.encode(plaintext)),
  )
  const combined = new Uint8Array(iv.length + ct.length)
  combined.set(iv, 0)
  combined.set(ct, iv.length)
  return toBase64(combined)
}

export async function decryptWithKey(key: CryptoKey, blobB64: string): Promise<string> {
  const combined = fromBase64(blobB64)
  const iv = combined.slice(0, 12)
  const ct = combined.slice(12)
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, ct as BufferSource)
  return dec.decode(pt)
}

export async function encryptJson(key: CryptoKey, value: unknown): Promise<string> {
  return encryptWithKey(key, JSON.stringify(value))
}

export async function decryptJson<T>(key: CryptoKey, blobB64: string): Promise<T> {
  return JSON.parse(await decryptWithKey(key, blobB64)) as T
}
