import { useEffect, useState } from 'react'
import { cloudAuth, listCloudBackups, removeCloudBackup, restoreCloudBackup, saveCloudBackup, type CloudBackup } from '../../lib/cloud'
import { getSession } from '../../state/session'

export default function CloudBackupCard() {
  const [enabled, setEnabled] = useState(false)
  const [user, setUser] = useState<string | null>(null)
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [otp, setOtp] = useState('')
  const [consent, setConsent] = useState(false)
  const [backups, setBackups] = useState<CloudBackup[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [confirm, setConfirm] = useState<{ kind: 'restore' | 'delete'; id: string } | null>(null)
  const current = getSession()

  async function refresh() { setBackups(await listCloudBackups()) }
  async function run(action: () => Promise<void>) {
    setBusy(true); setMessage('')
    try { await action() } catch (error) { setMessage(error instanceof Error ? error.message : 'Försök igen om en stund.') }
    finally { setBusy(false) }
  }

  useEffect(() => {
    let active = true
    fetch('/api/config', { cache: 'no-store' }).then(r => r.json()).then(async config => {
      if (!active || !config.cloudEnabled) return
      setEnabled(true)
      const { data } = await cloudAuth.getSession()
      if (active && data?.user) { setUser(data.user.email); const rows = await listCloudBackups(); if (active) setBackups(rows) }
    }).catch(() => { if (active) setMessage('Molnkontot kunde inte laddas. Du kan fortsätta med din lokala profil.') })
    return () => { active = false }
  }, [])

  if (!enabled) return null
  return <section className="card" aria-label="Molnkonto och säkerhetskopior">
    <h2>☁️ Ditt molnkonto</h2>
    <p className="muted small">FitBlueprint fungerar utan ChatGPT. Träna med din lokala profil och spara en krypterad säkerhetskopia i Neon när du vill. Ingen automatisk synkronisering sker.</p>
    {!user ? <form onSubmit={event => { event.preventDefault(); void run(async () => {
      if (mode === 'reset') {
        const result = otp
          ? await cloudAuth.emailOtp.resetPassword({ email, otp, password })
          : await cloudAuth.emailOtp.sendVerificationOtp({ email, type: 'forget-password' })
        if (result.error) throw new Error(result.error.message || 'Återställningen misslyckades.')
        setMessage(otp ? 'Lösenordet är återställt. Logga in med det nya lösenordet.' : 'Om kontot finns skickas en kod till din e-post. Fyll i den och ett nytt lösenord.')
        if (otp) { setMode('signin'); setOtp(''); setPassword('') }
        return
      }
      const result = mode === 'signup'
        ? await cloudAuth.signUp.email({ email, password, name: email.split('@')[0] })
        : await cloudAuth.signIn.email({ email, password })
      if (result.error) throw new Error(result.error.message || 'Kontrollera e-post och lösenord.')
      const session = await cloudAuth.getSession()
      if (!session.data?.user) throw new Error('Inloggningen kunde inte bekräftas.')
      setUser(session.data.user.email); setPassword(''); await refresh()
    }) }}>
      <label className="field">E-post<input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
      {(mode !== 'reset' || otp) && <label className="field">{mode === 'reset' ? 'Nytt lösenord' : 'Lösenord för molnkontot'}<input type="password" minLength={mode === 'signin' ? 1 : 8} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} required /></label>}
      {mode === 'reset' && <label className="field">Återställningskod från e-post (lämna tomt för att begära en kod)<input inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={e => setOtp(e.target.value)} /></label>}
      {mode === 'signup' && <label className="consent-row"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} required /><span>Jag vill skapa ett separat molnkonto hos Neon. Säkerhetskopior skickas bara när jag väljer Spara. <a href="/cloud-privacy.html" target="_blank" rel="noreferrer">Läs om molndata</a>.</span></label>}
      <div className="wizard-nav"><button className="primary" disabled={busy || (mode === 'signup' && !consent)}>{busy ? 'Arbetar…' : mode === 'signup' ? 'Skapa molnkonto' : mode === 'reset' ? (otp ? 'Byt lösenord' : 'Skicka återställningskod') : 'Logga in'}</button><button type="button" className="ghost" disabled={busy} onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setMessage('') }}>{mode === 'signup' ? 'Har redan konto' : 'Skapa konto'}</button></div>
      <button type="button" className="ghost" disabled={busy} onClick={() => { setMode(mode === 'reset' ? 'signin' : 'reset'); setOtp(''); setMessage('') }}>{mode === 'reset' ? 'Tillbaka till inloggning' : 'Glömt molnlösenordet?'}</button>
    </form> : <>
      <p>Inloggad som <strong>{user}</strong></p>
      <p className="small">Säkerhetskopian innehåller träningsdata krypterade med profilkoden. Namn, profil-ID och datum lagras som metadata. Separata AI-nycklar följer inte med.</p>
      <div className="wizard-nav"><button className="primary" disabled={busy || !current?.key} onClick={() => void run(async () => {
        const previous = backups.find(b => b.profile_id === current?.accountId)
        await saveCloudBackup(previous?.revision ?? 0); await refresh(); setMessage('Säkerhetskopian är sparad i Neon.')
      })}>Spara upplåst profil till Neon</button><button className="ghost" disabled={busy} onClick={() => void run(refresh)}>Uppdatera listan</button></div>
      {!current && <p className="small muted">Skapa eller lås upp en lokal profil för att spara den. Du kan hämta en tidigare kopia här.</p>}
      {backups.length === 0 && <p className="muted">Inga säkerhetskopior ännu.</p>}
      {backups.map(backup => <div className="card" key={backup.profile_id}><strong>{backup.metadata.displayName}</strong><p className="small">Sparad {new Date(backup.updated_at).toLocaleString()} · version {backup.revision}</p><div className="wizard-nav"><button className="ghost" disabled={busy} onClick={() => { setCode(''); setConfirm({ kind: 'restore', id: backup.profile_id }) }}>Hämta till den här enheten</button><button className="ghost" disabled={busy} onClick={() => setConfirm({ kind: 'delete', id: backup.profile_id })}>Radera molnkopian</button></div></div>)}
      {confirm && <div className="banner warn"><p>{confirm.kind === 'restore' ? 'Detta ersätter den lokala kopian av samma profil och laddar om appen. Exportera lokala ändringar först om du vill behålla dem. Ange profilkoden som användes när kopian sparades.' : 'Radera denna säkerhetskopia från Neon? Den lokala profilen påverkas inte. Äldre databasbackuper kan finnas kvar under hostingens historikfönster.'}</p>{confirm.kind === 'restore' && <label className="field">Profilkod<input type="password" autoComplete="off" value={code} onChange={e => setCode(e.target.value)} /></label>}<div className="wizard-nav"><button className="primary" disabled={busy || (confirm.kind === 'restore' && !code)} onClick={() => void run(async () => { if (confirm.kind === 'restore') { await restoreCloudBackup(confirm.id, code); window.location.reload() } else { await removeCloudBackup(confirm.id); setConfirm(null); await refresh(); setMessage('Molnkopian är raderad.') } })}>Bekräfta {confirm.kind === 'restore' ? 'hämtning' : 'radering'}</button><button className="ghost" disabled={busy} onClick={() => { setConfirm(null); setCode('') }}>Avbryt</button></div></div>}
      <button className="ghost" disabled={busy} onClick={() => void run(async () => { const result = await cloudAuth.signOut(); if (result.error) throw new Error('Utloggningen misslyckades.'); setUser(null); setBackups([]); setConfirm(null); setCode(''); setMessage('Utloggad från molnkontot.') })}>Logga ut från molnkontot</button>
    </>}
    {message && <p role="status" className="banner info">{message}</p>}
  </section>
}
