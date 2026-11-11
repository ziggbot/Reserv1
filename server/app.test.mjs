import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { createApp, validateBackup } from './app.mjs'

const metadata = { id: '0123456789abcdef', displayName: 'Test', saltB64: 'AAAAAAAAAAAAAAAAAAAAAA==', verifierB64: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==', createdAt: '2026-11-11', consentAt: '2026-11-11' }
const backup = { metadata, ciphertext: `enc:${'A'.repeat(80)}`, expectedRevision: 0 }
const query = vi.fn()
let server, base
beforeAll(async () => {
  const app = createApp({ pool: { query }, authUrl: 'https://auth.invalid/db/auth', appOrigin: 'https://app.invalid', verifyToken: async token => { if (token !== 'synthetic-valid') throw new Error(); return 'owner-a' } })
  server = await new Promise(resolve => { const listening = app.listen(0, '127.0.0.1', () => resolve(listening)) })
  base = `http://127.0.0.1:${server.address().port}`
})
afterAll(() => new Promise(resolve => server.close(resolve)))
const request = (path, init = {}) => fetch(base + path, { ...init, headers: { authorization: 'Bearer synthetic-valid', 'content-type': 'application/json', ...init.headers } })

describe('standalone cloud API', () => {
  it('serves health and cloud capabilities without exposing secrets', async () => {
    expect(await (await request('/health')).json()).toEqual({ status: 'ok', app: 'FitBlueprint' })
    expect(await (await request('/api/config')).json()).toEqual({ cloudEnabled: true })
  })
  it('rejects unauthenticated and forged-token access before database reads', async () => {
    query.mockClear()
    expect((await fetch(base + '/api/backups')).status).toBe(401)
    expect((await request('/api/backups', { headers: { authorization: 'Bearer invalid' } })).status).toBe(401)
    expect(query).not.toHaveBeenCalled()
  })
  it('always scopes reads to the verified user and returns no-store responses', async () => {
    query.mockResolvedValueOnce({ rows: [] })
    const response = await request('/api/backups')
    expect(response.status).toBe(200)
    expect(query.mock.lastCall[1]).toEqual(['owner-a'])
    expect(response.headers.get('cache-control')).toBe('no-store')
    query.mockResolvedValueOnce({ rows: [] })
    expect((await request('/api/backups/other-owner-profile')).status).toBe(404)
    expect(query.mock.lastCall[1]).toEqual(['owner-a', 'other-owner-profile'])
  })
  it('rejects plaintext, malformed profile IDs, metadata and revision inputs', async () => {
    for (const value of [{ ...backup, ciphertext: 'plain:private-data' }, { ...backup, expectedRevision: -1 }, { ...backup, metadata: { ...metadata, id: '../escape' } }]) {
      expect(() => validateBackup(value)).toThrow()
      expect((await request('/api/backups/' + metadata.id, { method: 'PUT', body: JSON.stringify(value) })).status).toBe(400)
    }
  })
  it('uses owner-scoped optimistic concurrency and reports a stale backup', async () => {
    query.mockResolvedValueOnce({ rows: [] })
    expect((await request('/api/backups/' + metadata.id, { method: 'PUT', body: JSON.stringify({ ...backup, expectedRevision: 2 }) })).status).toBe(409)
    expect(query.mock.lastCall[0]).toContain('user_id = $1 AND profile_id = $2 AND revision = $5')
    expect(query.mock.lastCall[1][0]).toBe('owner-a')
    query.mockResolvedValueOnce({ rows: [{ revision: 1 }] })
    expect((await request('/api/backups/' + metadata.id, { method: 'PUT', body: JSON.stringify(backup) })).status).toBe(200)
  })
  it('scopes deletion to the verified user', async () => {
    query.mockResolvedValueOnce({ rows: [] })
    expect((await request('/api/backups/' + metadata.id, { method: 'DELETE' })).status).toBe(204)
    expect(query.mock.lastCall[1]).toEqual(['owner-a', metadata.id])
  })
  it('blocks cross-origin auth writes and unsupported proxy routes', async () => {
    expect((await request('/api/auth/sign-in/email', { method: 'POST', headers: { origin: 'https://attacker.invalid' }, body: '{}' })).status).toBe(403)
    expect((await request('/api/auth/admin/delete-user', { method: 'POST', body: '{}' })).status).toBe(404)
  })
  it('returns a controlled error for malformed JSON', async () => {
    expect((await request('/api/backups/' + metadata.id, { method: 'PUT', body: '{' })).status).toBe(400)
  })
})
