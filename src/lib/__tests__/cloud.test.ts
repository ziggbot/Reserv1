import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ getSession: vi.fn(), fetch: vi.fn() }))
vi.mock('@neon/auth', () => ({ createAuthClient: () => ({ getSession: mocks.getSession }) }))
vi.mock('@neon/auth/react/adapters', () => ({ BetterAuthReactAdapter: () => ({}) }))
let listCloudBackups: typeof import('../cloud')['listCloudBackups']
beforeAll(async () => {
  vi.stubGlobal('window', { location: { origin: 'https://test.invalid' } })
  vi.stubGlobal('fetch', mocks.fetch)
  listCloudBackups = (await import('../cloud')).listCloudBackups
})
beforeEach(() => { mocks.getSession.mockReset(); mocks.fetch.mockReset() })
afterAll(() => vi.unstubAllGlobals())

describe('Managed Auth client boundary', () => {
  it('uses the JWT from the SDK session response when reading cloud backups', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: { token: 'synthetic.signed.jwt' } }, error: null })
    mocks.fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ backups: [] }) })
    expect(await listCloudBackups()).toEqual([])
    expect(mocks.fetch).toHaveBeenCalledWith('/api/backups', expect.objectContaining({ cache: 'no-store', headers: expect.objectContaining({ Authorization: 'Bearer synthetic.signed.jwt' }) }))
  })
  it('does not send an opaque session token or missing session to the API', async () => {
    for (const data of [null, { session: { token: 'opaque-session-secret' } }]) {
      mocks.getSession.mockResolvedValue({ data, error: null })
      await expect(listCloudBackups()).rejects.toThrow('Logga in')
    }
    expect(mocks.fetch).not.toHaveBeenCalled()
  })
})
