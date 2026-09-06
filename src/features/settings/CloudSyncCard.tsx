import { useEffect, useState } from 'react'
import { activeConfig, envConfig, saveStoredConfig, storedConfig } from '../../lib/cloud/supabase'
import { cloudStatus, signIn, signOut, signUp, startSync, subscribeCloud, syncNow, type CloudStatus } from '../../state/cloudSync'

/** Settings card: connect a Supabase project and sign in so this profile follows you between devices. */
export default function CloudSyncCard() {
  const [status, setStatus] = useState<CloudStatus>(cloudStatus())
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [showConfig, setShowConfig] = useState(!activeConfig())
  const [url, setUrl] = useState(storedConfig()?.url ?? '')
  const [anonKey, setAnonKey] = useState(storedConfig()?.anonKey ?? '')

  useEffect(() => subscribeCloud(setStatus), [])

  async function run(fn: () => Promise<string | null | void>) {
    setBusy(true)
    setMessage(null)
    try {
      const err = await fn()
      if (typeof err === 'string') setMessage(err)
    } finally {
      setBusy(false)
    }
  }

  const configured = status.state !== 'unconfigured'
  const signedIn = status.state === 'syncing' || status.state === 'synced' || (status.state === 'error' && status.email)

  return (
    <div className="card">
      <h2>☁️ Cloud sync</h2>
      <p className="muted small">
        Optional. Sign in and this profile’s workouts, weigh-ins and program are mirrored to your own
        Supabase project, so the same data shows up on your phone and laptop. Without it, everything
        stays on this device only.
      </p>

      {status.state === 'synced' && (
        <div className="banner ok small">
          Synced as <strong>{status.email}</strong> · last {new Date(status.at).toLocaleString()}
        </div>
      )}
      {status.state === 'syncing' && <div className="banner info small">Syncing as {status.email}…</div>}
      {status.state === 'error' && (
        <div className="banner danger small">
          Sync problem{status.email ? ` for ${status.email}` : ''}: {status.message}
        </div>
      )}
      {message && <div className="banner warn small">{message}</div>}

      {configured && !signedIn && (
        <>
          <div className="field">
            <label>Email</label>
            <input type="text" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <div className="hint">This is your Supabase login, separate from the profile passcode.</div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="primary" disabled={busy || !email || password.length < 6} onClick={() => run(() => signIn(email, password))}>
              Sign in
            </button>
            <button className="ghost" disabled={busy || !email || password.length < 6} onClick={() => run(() => signUp(email, password))}>
              Create account
            </button>
          </div>
        </>
      )}

      {signedIn && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="ghost" disabled={busy} onClick={() => run(() => syncNow())}>
            Sync now
          </button>
          <button className="ghost" disabled={busy} onClick={() => run(() => signOut())}>
            Sign out
          </button>
        </div>
      )}

      <p className="small" style={{ marginTop: 12 }}>
        <button className="link" onClick={() => setShowConfig((v) => !v)}>
          {showConfig ? 'Hide project settings' : 'Project settings'}
        </button>
      </p>
      {showConfig && (
        <div className="coach-provider-config">
          <p className="muted small">
            Paste the Project URL and anon key from Supabase → Project Settings → API. Then run{' '}
            <code>supabase/schema.sql</code> from the repo once in the SQL editor.
            {envConfig() && ' A project is already built into this deployment; values here override it.'}
          </p>
          <div className="field">
            <label>Project URL</label>
            <input type="text" placeholder="https://xxxx.supabase.co" value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
          <div className="field">
            <label>Anon key</label>
            <input type="text" placeholder="eyJ…" value={anonKey} onChange={(e) => setAnonKey(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              className="primary"
              disabled={!url.trim() || !anonKey.trim()}
              onClick={() => {
                saveStoredConfig({ url: url.trim(), anonKey: anonKey.trim() })
                setShowConfig(false)
                void startSync()
              }}
            >
              Save project
            </button>
            {storedConfig() && (
              <button
                className="ghost"
                onClick={() => {
                  saveStoredConfig(null)
                  setUrl('')
                  setAnonKey('')
                  void signOut()
                }}
              >
                Remove
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
