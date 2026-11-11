import { describe, expect, it } from 'vitest'
import server from './server'

const profile = { age: 35, sex: 'male', heightCm: 180, weightKg: 80, goal: 'general_fitness', fitnessLevel: 'beginner', equipment: 'dumbbells', daysPerWeek: 2, minutesPerSession: 30, activityLevel: 'moderate' }
async function rpc(method: string, params = {}, authenticated = true) {
  return server.fetch(new Request('https://test.invalid/mcp', { method: 'POST', headers: { 'content-type': 'application/json', ...(authenticated ? { 'oai-authenticated-user-id': 'synthetic-test-user' } : {}) }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) }))
}
async function call(name: string, args: unknown) { return (await (await rpc('tools/call', { name, arguments: args })).json()).result }

describe('ChatGPT MCP boundary', () => {
  it('requires the trusted hosting identity', async () => { expect((await rpc('tools/list', {}, false)).status).toBe(401) })
  it('discovers versions and exposes read-only tools', async () => {
    expect((await (await rpc('server/discover')).json()).result.supportedVersions).toContain('2026-07-28')
    const tools = (await (await rpc('tools/list')).json()).result.tools
    expect(tools).toHaveLength(3)
    expect(tools.every((t: { annotations: { readOnlyHint: boolean } }) => t.annotations.readOnlyHint)).toBe(true)
  })
  it('returns the mobile app resource and a working empty entrypoint', async () => {
    const uri = (await (await rpc('resources/list')).json()).result.resources[0].uri
    const resource = (await (await rpc('resources/read', { uri })).json()).result.contents[0]
    expect(resource.mimeType).toBe('text/html;profile=mcp-app')
    expect(resource.text).toContain('ui/initialize')
    expect((await call('open_fitblueprint', {})).structuredContent.kind).toBe('welcome')
  })
  it('reuses the engine without exposing personal seed weights or overbooking days', async () => {
    const result = await call('create_fitness_plan', { profile })
    expect(result.isError).toBeUndefined()
    expect(result.structuredContent.program.sessions).toHaveLength(2)
    expect(result.structuredContent.nutrition.targets.proteinG).toBe(128)
    expect(JSON.stringify(result)).not.toContain('SEED_MEMORY')
  })
  it('supports bodyweight and advanced gym profiles', async () => {
    for (const variation of [{ equipment: 'none', goal: 'fat_loss' }, { fitnessLevel: 'advanced', equipment: 'full_gym', goal: 'muscle_gain', daysPerWeek: 6 }]) {
      const result = await call('create_fitness_plan', { profile: { ...profile, ...variation } })
      expect(result.structuredContent.kind).toBe('plan')
      expect(result.structuredContent.program.sessions.length).toBeGreaterThan(0)
    }
  })
  it('rejects minors, out-of-range inputs, unknown fields and invalid enums', async () => {
    for (const change of [{ age: 17 }, { weightKg: -2 }, { sex: 'invalid' }, { daysPerWeek: 2.5 }, { arbitrary: true }]) {
      expect((await call('create_fitness_plan', { profile: { ...profile, ...change } })).isError).toBe(true)
    }
    expect((await call('create_fitness_plan', {})).isError).toBe(true)
  })
  it('provides a medical referral instead of unsupported personalized targets', async () => {
    const result = await call('create_fitness_plan', { profile: { ...profile, medicalConditions: ['pregnancy'] } })
    expect(result.structuredContent.kind).toBe('guidance')
    expect(result.structuredContent.nutrition).toBeUndefined()
  })
  it('analyzes real trend fixtures and rejects impossible, future or duplicate dates', async () => {
    const args = { today: '2026-11-11', startWeightKg: 80, weeksDieting: 2, weighIns: Array.from({ length: 14 }, (_, i) => ({ date: new Date(Date.UTC(2026, 9, 29 + i)).toISOString().slice(0, 10), weightKg: 80 - i * .07 })) }
    expect((await call('analyze_weight_trend', args)).structuredContent.analysis.status).not.toBe('insufficient_data')
    for (const rows of [[{ date: '2026-02-30', weightKg: 80 }], [{ date: '2026-11-12', weightKg: 80 }], [{ date: '2026-11-01', weightKg: 80 }, { date: '2026-11-01', weightKg: 79 }]]) {
      expect((await call('analyze_weight_trend', { ...args, weighIns: rows })).isError).toBe(true)
    }
  })
  it('returns protocol errors for invalid JSON, missing methods and unknown resources', async () => {
    expect((await (await rpc('not-a-method')).json()).error.code).toBe(-32601)
    expect((await (await rpc('resources/read', { uri: 'ui://unknown' })).json()).error.code).toBe(-32602)
    const response = await server.fetch(new Request('https://test.invalid/mcp', { method: 'POST', headers: { 'oai-authenticated-user-id': 'test' }, body: '{' }))
    expect((await response.json()).error.code).toBe(-32700)
  })
})
