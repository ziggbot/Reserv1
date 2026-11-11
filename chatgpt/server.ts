import { buildNutritionPlan } from '../src/lib/calculations'
import { recommendProgram } from '../src/lib/programMatrix'
import { buildRoadmap } from '../src/lib/roadmap'
import { buildHabitPlan } from '../src/lib/habits'
import { analyzeProgress } from '../src/lib/fatloss'
import { parseDate, parseProfile, parseWeighIns, profileSchema, validate } from './validation'
import widget from './widget.html?raw'

const uri = 'ui://fitblueprint/plan.html'
const annotations = { readOnlyHint: true, destructiveHint: false, openWorldHint: false }
const tools = [
  { name: 'open_fitblueprint', title: 'FitBlueprint', description: 'Open the fitness app. Explains how to create a plan in chat.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations,
    _meta: { ui: { resourceUri: uri }, 'openai/ui': { entrypoints: [{ type: 'global' }, { type: 'thread' }] } } },
  { name: 'create_fitness_plan', title: 'Skapa träningsplan', description: 'Generate an adult fitness plan using FitBlueprint’s existing engine: training, nutrition estimates, habits and roadmap. Ask for required profile inputs; never invent measurements or medical history. No data is saved. Not medical care.',
    inputSchema: { type: 'object', properties: { profile: profileSchema }, required: ['profile'], additionalProperties: false }, annotations, _meta: { ui: { resourceUri: uri } } },
  { name: 'analyze_weight_trend', title: 'Analysera vikttrend', description: 'Analyze user-supplied weigh-ins for an adult fat-loss goal. Requires a real YYYY-MM-DD today date, start weight and weeks dieting. Does not store weigh-ins.',
    inputSchema: { type: 'object', additionalProperties: false, required: ['weighIns', 'today', 'startWeightKg', 'weeksDieting'], properties: {
      weighIns: { type: 'array', maxItems: 366, items: { type: 'object', additionalProperties: false, required: ['date', 'weightKg'], properties: { date: { type: 'string' }, weightKg: { type: 'number', minimum: 35, maximum: 300 } } } },
      today: { type: 'string' }, startWeightKg: { type: 'number', minimum: 35, maximum: 300 }, weeksDieting: { type: 'integer', minimum: 0, maximum: 104 },
    } }, annotations, _meta: { ui: { resourceUri: uri } } },
]

function callTool(name: string, args: unknown) {
  const tool = tools.find(item => item.name === name)
  if (!tool) throw new Error('Unknown tool')
  validate(args, tool.inputSchema)
  const input = args as Record<string, unknown>
  let data: Record<string, unknown>
  if (name === 'open_fitblueprint') data = { kind: 'welcome', message: 'Berätta om ditt mål, din träningsvana, utrustning och tid. ChatGPT hjälper dig samla uppgifterna för din plan.' }
  else if (name === 'create_fitness_plan') {
    const profile = parseProfile(input.profile)
    if (profile.medicalConditions.length) {
      data = { kind: 'guidance', message: 'Den automatiska planen är inte anpassad för medicinska tillstånd eller graviditet. Be vården om individuella tränings- och kostråd innan du använder personliga mål.' }
    } else {
      const recommendation = recommendProgram(profile)
      // The legacy engine sometimes proposes more days than requested.
      const program = { ...recommendation.program, sessions: recommendation.program.sessions.slice(0, profile.daysPerWeek) }
      data = { kind: 'plan', program, rationale: recommendation.rationale, sourceUrl: recommendation.sourceUrl, nutrition: buildNutritionPlan(profile), roadmap: buildRoadmap(profile), habits: buildHabitPlan(profile), notice: 'Allmän träningsinformation för vuxna. Energi- och näringsmål är uppskattningar. Avbryt övningar som gör ont.' }
    }
  } else {
    const today = parseDate(input.today)
    data = { kind: 'trend', analysis: analyzeProgress(parseWeighIns(input.weighIns, today), today, input.startWeightKg as number, input.weeksDieting as number) }
  }
  return { content: [{ type: 'text', text: JSON.stringify(data) }], structuredContent: data }
}

const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } })
export default {
  async fetch(request: Request): Promise<Response> {
    const path = new URL(request.url).pathname
    if (path === '/health') return json({ status: 'ok', app: 'FitBlueprint' })
    if (path !== '/mcp') return new Response('FitBlueprint ChatGPT app. MCP endpoint: /mcp', { headers: { 'content-type': 'text/plain; charset=utf-8' } })
    if (request.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST' } })
    // Trust this header only behind the Sites authenticated ingress. Never expose
    // this Worker directly without equivalent identity enforcement.
    if (!request.headers.get('oai-authenticated-user-id')) return json({ error: 'Authentication required' }, 401)
    if (Number(request.headers.get('content-length')) > 65536) return json({ error: 'Request too large' }, 413)
    const body = await request.text()
    if (new TextEncoder().encode(body).length > 65536) return json({ error: 'Request too large' }, 413)
    let rpc: Record<string, unknown>
    try { rpc = JSON.parse(body) } catch { return json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }) }
    if (!rpc || typeof rpc !== 'object' || Array.isArray(rpc) || rpc.jsonrpc !== '2.0' || typeof rpc.method !== 'string' || (rpc.id !== undefined && typeof rpc.id !== 'string' && typeof rpc.id !== 'number')) return json({ jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Invalid request' } })
    if (rpc.id === undefined) return new Response(null, { status: 202 })
    const result = (value: unknown) => json({ jsonrpc: '2.0', id: rpc.id, result: value })
    const params = rpc.params as Record<string, unknown> | undefined
    switch (rpc.method) {
      case 'server/discover': return result({ supportedVersions: ['2026-07-28'], capabilities: { tools: {}, resources: {} }, serverInfo: { name: 'fitblueprint', version: '1.0.0' } })
      case 'initialize': return result({ protocolVersion: '2025-11-25', capabilities: { tools: {}, resources: {} }, serverInfo: { name: 'fitblueprint', version: '1.0.0' } })
      case 'ping': return result({})
      case 'tools/list': return result({ tools })
      case 'tools/call':
        try { return result(callTool(String(params?.name), params?.arguments ?? {})) }
        catch (error) { return result({ isError: true, content: [{ type: 'text', text: error instanceof Error ? error.message : 'Invalid input' }] }) }
      case 'resources/list': return result({ resources: [{ uri, name: 'FitBlueprint', mimeType: 'text/html;profile=mcp-app' }] })
      case 'resources/read':
        if (params?.uri === uri) return result({ contents: [{ uri, mimeType: 'text/html;profile=mcp-app', text: widget, _meta: { ui: { csp: { connectDomains: [], resourceDomains: [] } }, 'openai/ui': { preferredDisplayMode: 'fullscreen', availableDisplayModes: ['inline', 'fullscreen'] } } }] })
        return json({ jsonrpc: '2.0', id: rpc.id, error: { code: -32602, message: 'Unknown resource' } })
      default: return json({ jsonrpc: '2.0', id: rpc.id, error: { code: -32601, message: 'Method not found' } })
    }
  },
}
