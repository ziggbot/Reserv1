import express from 'express'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import path from 'node:path'

export function validateBackup(value) {
  const meta = value?.metadata
  const b64 = /^[A-Za-z0-9+/]+={0,2}$/
  if (!meta || !/^[a-f0-9]{16}$/.test(meta.id) || typeof meta.displayName !== 'string' || meta.displayName.length > 100 ||
    typeof meta.saltB64 !== 'string' || meta.saltB64.length !== 24 || !b64.test(meta.saltB64) ||
    typeof meta.verifierB64 !== 'string' || meta.verifierB64.length > 256 || !b64.test(meta.verifierB64) ||
    typeof meta.createdAt !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(meta.createdAt) ||
    typeof meta.consentAt !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(meta.consentAt) ||
    typeof value.ciphertext !== 'string' || !value.ciphertext.startsWith('enc:') ||
    !b64.test(value.ciphertext.slice(4)) || value.ciphertext.length < 44 || value.ciphertext.length > 2097152 ||
    !Number.isInteger(value.expectedRevision) || value.expectedRevision < 0) throw new Error('Invalid encrypted backup')
  return { metadata: { id: meta.id, displayName: meta.displayName, saltB64: meta.saltB64, verifierB64: meta.verifierB64, createdAt: meta.createdAt, consentAt: meta.consentAt }, ciphertext: value.ciphertext, expectedRevision: value.expectedRevision }
}

export function makeAuthVerifier(baseUrl) {
  const origin = new URL(baseUrl).origin
  const jwks = createRemoteJWKSet(new URL(`${baseUrl}/.well-known/jwks.json`))
  return async token => {
    const { payload } = await jwtVerify(token, jwks, { algorithms: ['EdDSA'], issuer: origin, audience: origin, requiredClaims: ['sub', 'exp'] })
    if (!payload.sub || payload.banned) throw new Error('Invalid session')
    return payload.sub
  }
}

export function createApp({ pool, authUrl, appOrigin, verifyToken = authUrl ? makeAuthVerifier(authUrl) : null, staticDirectory = path.resolve('dist') }) {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', 1)
  app.use((req, res, next) => {
    res.set({ 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin', 'X-Frame-Options': 'DENY' })
    if (req.path.startsWith('/api/')) res.set('Cache-Control', 'no-store')
    next()
  })
  app.get('/health', (_req, res) => res.json({ status: 'ok', app: 'FitBlueprint' }))
  app.get('/api/config', (_req, res) => res.json({ cloudEnabled: Boolean(authUrl && pool && verifyToken) }))

  // Same-origin managed-auth proxy keeps mobile Safari from relying on third-party
  // cookies. The upstream is fixed configuration, never client-provided.
  const allowedAuthPaths = new Set(['/get-session', '/sign-in/email', '/sign-up/email', '/sign-out', '/token', '/request-password-reset', '/reset-password', '/email-otp/send-verification-otp', '/email-otp/reset-password', '/email-otp/verify-email'])
  app.use('/api/auth', express.raw({ type: '*/*', limit: '32kb' }), async (req, res) => {
    if (!authUrl) return res.status(503).json({ error: 'Cloud login unavailable' })
    const pathname = req.path
    if (!allowedAuthPaths.has(pathname) || !['GET', 'POST'].includes(req.method)) return res.status(404).json({ error: 'Unsupported auth operation' })
    if (req.method !== 'GET' && req.headers.origin !== appOrigin) return res.status(403).json({ error: 'Invalid origin' })
    try {
      const headers = { accept: 'application/json', origin: appOrigin }
      if (req.headers.cookie) headers.cookie = req.headers.cookie
      if (req.headers['content-type']) headers['content-type'] = req.headers['content-type']
      const upstream = await fetch(`${authUrl}${req.url}`, { method: req.method, headers, ...(req.method === 'POST' ? { body: req.body } : {}), redirect: 'manual', signal: AbortSignal.timeout(15000) })
      // No redirects: email/password and OTP routes return JSON.
      for (const cookie of upstream.headers.getSetCookie()) res.append('Set-Cookie', cookie.replace(/;\s*Domain=[^;]+/gi, '').replace(/;\s*SameSite=[^;]+/gi, '; SameSite=Lax'))
      if (upstream.headers.has('set-auth-jwt')) res.set('set-auth-jwt', upstream.headers.get('set-auth-jwt'))
      res.status(upstream.status).type('application/json').send(await upstream.text())
    } catch { res.status(502).json({ error: 'Login service is temporarily unavailable' }) }
  })

  app.use('/api/backups', async (req, res, next) => {
    if (!verifyToken || !pool) return res.status(503).json({ error: 'Cloud backups unavailable' })
    const token = req.headers.authorization?.match(/^Bearer (\S+)$/)?.[1]
    if (!token) return res.status(401).json({ error: 'Sign in to your cloud account' })
    try { res.locals.userId = await verifyToken(token); next() }
    catch { res.status(401).json({ error: 'Session expired. Sign in again.' }) }
  })
  app.use('/api/backups', express.json({ limit: '2200kb' }))
  app.get('/api/backups', async (_req, res) => {
    const { rows } = await pool.query('SELECT profile_id, metadata, revision, updated_at FROM fitness_backups WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 50', [res.locals.userId])
    res.json({ backups: rows })
  })
  app.get('/api/backups/:id', async (req, res) => {
    const { rows } = await pool.query('SELECT metadata, ciphertext, revision, updated_at FROM fitness_backups WHERE user_id = $1 AND profile_id = $2', [res.locals.userId, req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'Backup not found' })
    res.json(rows[0])
  })
  app.put('/api/backups/:id', async (req, res) => {
    let backup
    try { backup = validateBackup(req.body) } catch { return res.status(400).json({ error: 'Invalid encrypted backup' }) }
    if (backup.metadata.id !== req.params.id) return res.status(400).json({ error: 'Profile mismatch' })
    const values = [res.locals.userId, req.params.id, JSON.stringify(backup.metadata), backup.ciphertext, backup.expectedRevision]
    const query = backup.expectedRevision === 0
      ? 'INSERT INTO fitness_backups (user_id, profile_id, metadata, ciphertext) SELECT $1, $2, $3::jsonb, $4 WHERE $5::integer = 0 ON CONFLICT DO NOTHING RETURNING revision, updated_at'
      : 'UPDATE fitness_backups SET metadata = $3::jsonb, ciphertext = $4, revision = revision + 1, updated_at = now() WHERE user_id = $1 AND profile_id = $2 AND revision = $5 RETURNING revision, updated_at'
    const { rows } = await pool.query(query, values)
    if (!rows.length) return res.status(409).json({ error: 'Cloud backup changed. Refresh the list before saving again.' })
    res.json(rows[0])
  })
  app.delete('/api/backups/:id', async (req, res) => {
    await pool.query('DELETE FROM fitness_backups WHERE user_id = $1 AND profile_id = $2', [res.locals.userId, req.params.id])
    res.status(204).end()
  })
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }))
  app.use(express.static(staticDirectory, { setHeaders(res, filename) { if (filename.endsWith('sw.js') || filename.endsWith('index.html')) res.set('Cache-Control', 'no-cache') } }))
  app.get('/{*path}', (_req, res) => res.sendFile(path.join(staticDirectory, 'index.html')))
  app.use((error, _req, res, _next) => {
    const status = error?.type === 'entity.too.large' ? 413 : error instanceof SyntaxError ? 400 : 500
    res.status(status).json({ error: status === 413 ? 'Backup is too large' : status === 400 ? 'Invalid JSON' : 'Service temporarily unavailable' })
  })
  return app
}
