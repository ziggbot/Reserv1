import express from 'express'
import { randomUUID } from 'node:crypto'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { requireBearerAuth } from '@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js'
import { mcpAuthMetadataRouter, getOAuthProtectedResourceMetadataUrl } from '@modelcontextprotocol/sdk/server/auth/router.js'
import { env, verifySupabaseToken } from './data.js'
import { registerTools } from './tools.js'

/**
 * FitBlueprint MCP server.
 *
 *  POST/GET/DELETE /mcp   — Streamable HTTP transport (one McpServer per session)
 *  GET /.well-known/oauth-protected-resource/mcp — points clients at the
 *       authorization server (Supabase Auth with its OAuth 2.1 server enabled,
 *       or any OAuth server that issues Supabase-verifiable tokens)
 *  GET /healthz
 *
 * Auth: every MCP request carries `Authorization: Bearer <Supabase access token>`.
 * The token is verified with Supabase and then used as the user for every
 * database call, so row-level security applies exactly as in the web app.
 */

const PORT = Number(process.env.PORT ?? 8787)
const PUBLIC_URL = process.env.PUBLIC_URL ?? `http://localhost:${PORT}`
const e = env()
const ISSUER = process.env.OAUTH_ISSUER ?? `${e.supabaseUrl.replace(/\/$/, '')}/auth/v1`

const app = express()
app.use(express.json({ limit: '2mb' }))

app.get('/healthz', (_req, res) => res.json({ ok: true }))

const resourceServerUrl = new URL('/mcp', PUBLIC_URL)
app.use(
  mcpAuthMetadataRouter({
    oauthMetadata: {
      issuer: ISSUER,
      authorization_endpoint: process.env.OAUTH_AUTHORIZE_URL ?? `${ISSUER}/oauth/authorize`,
      token_endpoint: process.env.OAUTH_TOKEN_URL ?? `${ISSUER}/oauth/token`,
      registration_endpoint: process.env.OAUTH_REGISTRATION_URL ?? `${ISSUER}/oauth/clients/register`,
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      code_challenge_methods_supported: ['S256'],
      token_endpoint_auth_methods_supported: ['none', 'client_secret_post'],
    },
    resourceServerUrl,
    resourceName: 'FitBlueprint',
    scopesSupported: ['fitblueprint'],
  }),
)

const auth = requireBearerAuth({
  verifier: { verifyAccessToken: verifySupabaseToken },
  resourceMetadataUrl: getOAuthProtectedResourceMetadataUrl(resourceServerUrl),
})

// One transport + server per MCP session, keyed by the session id the transport issues.
const sessions = new Map<string, StreamableHTTPServerTransport>()

app.all('/mcp', auth, async (req, res) => {
  const token = req.auth!.token
  const userId = String(req.auth!.extra?.userId)
  const sessionId = req.header('mcp-session-id')
  let transport = sessionId ? sessions.get(sessionId) : undefined

  if (!transport) {
    if (req.method !== 'POST') {
      res.status(400).json({ error: 'No MCP session; start with an initialize POST' })
      return
    }
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (id) => {
        sessions.set(id, transport!)
      },
    })
    transport.onclose = () => {
      if (transport?.sessionId) sessions.delete(transport.sessionId)
    }
    const server = new McpServer({ name: 'fitblueprint', version: '0.1.0' })
    // The token can rotate between requests of one session; always use the latest.
    const ctx = { token, userId }
    registerTools(server, () => ctx)
    await server.connect(transport)
    ;(transport as unknown as { __ctx: typeof ctx }).__ctx = ctx
  } else {
    const ctx = (transport as unknown as { __ctx: { token: string; userId: string } }).__ctx
    if (ctx.userId !== userId) {
      res.status(403).json({ error: 'Session belongs to another user' })
      return
    }
    ctx.token = token
  }
  await transport.handleRequest(req, res, req.body)
})

app.listen(PORT, () => {
  console.log(`FitBlueprint MCP server on ${PUBLIC_URL}/mcp (issuer ${ISSUER})`)
})
