import { afterEach, describe, expect, it } from 'vitest'
import { bindAccountStorage, useAppStore } from '../../state/store'
import { clearSession, setSession } from '../../state/session'
import { rawStorage } from '../../state/storage'

afterEach(() => { clearSession(); rawStorage.clear() })
const stored = (weight: number) => 'plain:' + JSON.stringify({ state: { weighIns: [{ date: '2026-11-11', weightKg: weight }] }, version: 0 })

describe('restoring and switching local account storage', () => {
  it('hydrates an existing backup without writing an empty initial state over it', async () => {
    const snapshot = stored(80)
    rawStorage.setItem('test-profile-a', snapshot)
    setSession({ accountId: 'a', displayName: 'A', key: null })
    await bindAccountStorage('test-profile-a')
    expect(useAppStore.getState().weighIns[0].weightKg).toBe(80)
    expect(rawStorage.getItem('test-profile-a')).toBe(snapshot)
  })
  it('switches profiles without overwriting the previous profile with the new session', async () => {
    const first = stored(80), second = stored(90)
    rawStorage.setItem('test-profile-a', first)
    rawStorage.setItem('test-profile-b', second)
    setSession({ accountId: 'a', displayName: 'A', key: null })
    await bindAccountStorage('test-profile-a')
    setSession({ accountId: 'b', displayName: 'B', key: null })
    await bindAccountStorage('test-profile-b')
    expect(useAppStore.getState().weighIns[0].weightKg).toBe(90)
    expect(rawStorage.getItem('test-profile-a')).toBe(first)
    expect(rawStorage.getItem('test-profile-b')).toBe(second)
  })
})
