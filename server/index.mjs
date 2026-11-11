import pg from 'pg'
import { createApp } from './app.mjs'

const { DATABASE_URL, NEON_AUTH_BASE_URL } = process.env
const appOrigin = process.env.APP_ORIGIN || process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000'
const cloudReady = Boolean(DATABASE_URL && NEON_AUTH_BASE_URL)
const pool = cloudReady ? new pg.Pool({ connectionString: DATABASE_URL, max: 5, connectionTimeoutMillis: 10000, idleTimeoutMillis: 30000 }) : null
pool?.on('error', () => console.error('Database connection interrupted'))
if (!cloudReady) console.log('Cloud backups disabled: server configuration is incomplete. Local training remains available.')
const app = createApp({ pool, authUrl: cloudReady ? NEON_AUTH_BASE_URL : null, appOrigin })
const server = app.listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.log('FitBlueprint ready'))
process.on('SIGTERM', () => {
  server.close(async () => { await pool?.end(); process.exit(0) })
  setTimeout(() => process.exit(1), 25000).unref()
})
