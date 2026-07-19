import { describe, expect, it } from 'vitest'
import { webcrypto } from 'node:crypto'
import {
  createIdentity,
  cryptoAvailable,
  decryptJson,
  encryptJson,
  unlockIdentity,
} from '../crypto'
import { LONGEVITY_SECTIONS, longevityNudges } from '../longevity'
import type { Profile } from '../types'

// Node's WebCrypto stands in for the browser's in this test environment.
if (!(globalThis as { crypto?: Crypto }).crypto) {
  ;(globalThis as unknown as { crypto: Crypto }).crypto = webcrypto as unknown as Crypto
}

describe('crypto', () => {
  it('reports availability', () => {
    expect(cryptoAvailable()).toBe(true)
  })

  it('round-trips encrypted JSON with the correct passcode', async () => {
    const { key, saltB64, verifierB64 } = await createIdentity('correct horse battery')
    const blob = await encryptJson(key, { weighIns: [{ date: '2026-07-19', weightKg: 92 }] })
    expect(blob).not.toContain('92') // ciphertext, not plaintext

    const key2 = await unlockIdentity('correct horse battery', saltB64, verifierB64)
    expect(key2).not.toBeNull()
    const decoded = await decryptJson<{ weighIns: { weightKg: number }[] }>(key2!, blob)
    expect(decoded.weighIns[0].weightKg).toBe(92)
  })

  it('rejects the wrong passcode via the verifier (no plaintext compare)', async () => {
    const { saltB64, verifierB64 } = await createIdentity('right-passcode')
    expect(await unlockIdentity('wrong-passcode', saltB64, verifierB64)).toBeNull()
  })

  it('produces different ciphertext each write (random IV)', async () => {
    const { key } = await createIdentity('pw')
    const a = await encryptJson(key, { x: 1 })
    const b = await encryptJson(key, { x: 1 })
    expect(a).not.toBe(b)
  })
})

const profile: Profile = {
  name: 'Peter',
  age: 48,
  sex: 'male',
  heightCm: 182,
  weightKg: 92,
  goal: 'fat_loss',
  fitnessLevel: 'intermediate',
  medicalConditions: [],
  injuries: [],
  equipment: 'full_gym',
  daysPerWeek: 3,
  minutesPerSession: 60,
  sleepHours: 6,
  stressLevel: 'high',
  activityLevel: 'sedentary',
  dietPref: 'omnivore',
  mealsPerDay: 3,
  lifestyle: {
    allOrNothing: false,
    timeCrunched: false,
    travelsOften: false,
    eveningSnacker: false,
    deskJob: true,
    trainsAlone: false,
  },
}

describe('longevity content', () => {
  it('every claim has a grade and a well-formed https source URL', () => {
    const claims = LONGEVITY_SECTIONS.flatMap((s) => s.claims)
    expect(claims.length).toBeGreaterThan(20)
    for (const c of claims) {
      expect(['strong', 'moderate', 'emerging']).toContain(c.grade)
      expect(c.url).toMatch(/^https:\/\/[^/]+\.[a-z]{2,}/i)
      expect(c.sourceName.length).toBeGreaterThan(3)
    }
  })

  it('has all five sections', () => {
    expect(LONGEVITY_SECTIONS.map((s) => s.id)).toEqual([
      'big-rocks',
      'food',
      'supplements',
      'routines',
      'medical',
    ])
  })

  it('personalized nudges react to profile flags', () => {
    const text = longevityNudges(profile)
      .map((n) => n.text)
      .join(' ')
    expect(text).toMatch(/sleep/i) // 6 h sleeper
    expect(text).toMatch(/stress/i) // high stress
    expect(text).toMatch(/[Ss]itting|step/) // desk job
    expect(text).toMatch(/screening|colorectal/i) // age 48
  })

  it('drops the screening nudge for a young user', () => {
    const text = longevityNudges({ ...profile, age: 30 })
      .map((n) => n.text)
      .join(' ')
    expect(text).not.toMatch(/colorectal/i)
  })
})
