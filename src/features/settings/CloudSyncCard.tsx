import { useEffect, useState } from 'react'
import { activeConfig, envConfig, saveStoredConfig, storedConfig } from '../../lib/cloud/supabase'
import { cloudStatus, signIn, signOut, signUp, startSync, subscribeCloud, syncNow, type CloudStatus } from '../../state/cloudSync'
import { tr, dateLocale, useLocale } from '../../i18n'

/** Settings card: connect a Supabase project and sign in so this profile follows you between devices. */
export default function CloudSyncCard() {
  useLocale()
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
      <h2>{tr('☁️ Cloud sync', '☁️ Molnsynk')}</h2>
      <p className="muted small">
        {tr(
          'Optional. Sign in and this profile’s workouts, weigh-ins and program are mirrored to your own Supabase project, so the same data shows up on your phone and laptop. Without it, everything stays on this device only.',
          'Valfritt. Logga in så speglas den här profilens pass, invägningar och program till ditt eget Supabase-projekt, så att samma data dyker upp på både mobilen och datorn. Utan det stannar allt på den här enheten.',
        )}
      </p>

      {status.state === 'synced' && (
        <div className="banner ok small">
          {tr('Synced as ', 'Synkad som ')}
          <strong>{status.email}</strong> · {tr('last', 'senast')} {new Date(status.at).toLocaleString(dateLocale())}
        </div>
      )}
      {status.state === 'syncing' && (
        <div className="banner info small">
          {tr('Syncing as', 'Synkar som')} {status.email}…
        </div>
      )}
      {status.state === 'error' && (
        <div className="banner danger small">
          {tr('Sync problem', 'Synkproblem')}
          {status.email ? ` ${tr('for', 'för')} ${status.email}` : ''}: {status.message}
        </div>
      )}
      {message && <div className="banner warn small">{message}</div>}

      {configured && !signedIn && (
        <>
          <div className="field">
            <label>{tr('Email', 'E-post')}</label>
            <input type="text" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label>{tr('Password', 'Lösenord')}</label>
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <div className="hint">
              {tr(
                'This is your Supabase login, separate from the profile passcode.',
                'Det här är din Supabase-inloggning, skild från profilens kod.',
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="primary" disabled={busy || !email || password.length < 6} onClick={() => run(() => signIn(email, password))}>
              {tr('Sign in', 'Logga in')}
            </button>
            <button className="ghost" disabled={busy || !email || password.length < 6} onClick={() => run(() => signUp(email, password))}>
              {tr('Create account', 'Skapa konto')}
            </button>
          </div>
        </>
      )}

      {signedIn && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="ghost" disabled={busy} onClick={() => run(() => syncNow())}>
            {tr('Sync now', 'Synka nu')}
          </button>
          <button className="ghost" disabled={busy} onClick={() => run(() => signOut())}>
            {tr('Sign out', 'Logga ut')}
          </button>
        </div>
      )}

      <p className="small" style={{ marginTop: 12 }}>
        <button className="link" onClick={() => setShowConfig((v) => !v)}>
          {showConfig ? tr('Hide project settings', 'Dölj projektinställningar') : tr('Project settings', 'Projektinställningar')}
        </button>
      </p>
      {showConfig && (
        <div className="coach-provider-config">
          <p className="muted small">
            {tr(
              'Paste the Project URL and anon key from Supabase → Project Settings → API. Then run ',
              'Klistra in Project URL och anon key från Supabase → Project Settings → API. Kör sedan ',
            )}
            <code>supabase/schema.sql</code>
            {tr(' from the repo once in the SQL editor.', ' från repot en gång i SQL-editorn.')}
            {envConfig() &&
              tr(
                ' A project is already built into this deployment; values here override it.',
                ' Ett projekt är redan inbyggt i den här distributionen; värden här åsidosätter det.',
              )}
          </p>
          <div className="field">
            <label>{tr('Project URL', 'Projekt-URL')}</label>
            <input type="text" placeholder="https://xxxx.supabase.co" value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
          <div className="field">
            <label>{tr('Anon key', 'Anon-nyckel')}</label>
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
              {tr('Save project', 'Spara projekt')}
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
                {tr('Remove', 'Ta bort')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
