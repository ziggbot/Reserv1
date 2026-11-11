import pg from 'pg'
import { createApp } from './app.mjs'

const { DATABASE_URL, NEON_AUTH_BASE_URL } = process.env
const appOrigin = process.env.APP_ORIGIN || process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000'
if (!DATABASE_URL || !NEON_AUTH_BASE_URL) throw new Error('DATABASE_URL and NEON_AUTH_BASE_URL are required')
const pool = new pg.Pool({ connectionString: DATABASE_URL, max: 5, connectionTimeoutMillis: 10000, idleTimeoutMillis: 30000 })
pool.on('error', () => console.error('Database connection interrupted'))
const app = createApp({ pool, authUrl: NEON_AUTH_BASE_URL, appOrigin })
const server = app.listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.log('FitBlueprint ready'))
process.on('SIGTERM', () => {
  server.close(async () => { await pool.end(); process.exit(0) })
  setTimeout(() => process.exit(1), 25000).unref()
})
