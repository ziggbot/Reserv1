import { useState } from 'react'
import { cryptoAvailable } from '../../lib/crypto'
import {
  clearLegacyState,
  createAccount,
  listAccounts,
  readLegacyState,
  storageNameFor,
  unlockAccount,
  type AccountMeta,
} from '../../state/accounts'
import { setSession } from '../../state/session'
import { bindAccountStorage, importLegacyState, todayIso } from '../../state/store'
import { storageIsPersistent } from '../../state/storage'
import { currentSession, signIn, signUp, startSync } from '../../state/cloudSync'
import { activeConfig } from '../../lib/cloud/supabase'
import { ensureCloudAccount } from '../../state/accounts'
import { tr, fmtDate } from '../../i18n'
import LanguageToggle from '../../i18n/LanguageToggle'

type Mode = 'list' | 'create' | 'unlock' | 'cloud'

export default function AccountGate({ onReady }: { onReady: () => void }) {
  const [accounts, setAccounts] = useState<AccountMeta[]>(() => listAccounts())
  const cloudConfigured = activeConfig() !== null
  const [mode, setMode] = useState<Mode>(accounts.length ? 'list' : cloudConfigured ? 'cloud' : 'create')
  const [selected, setSelected] = useState<AccountMeta | null>(null)
  const hasCrypto = cryptoAvailable()

  /** A cloud-bound profile needs no passcode: being signed in to Supabase is the unlock. */
  async function openCloudAccount(meta: AccountMeta) {
    const session = await currentSession()
    if (session && session.user.id === meta.cloudUserId) await finishUnlock(meta, null)
    else setMode('cloud')
  }

  async function finishUnlock(meta: AccountMeta, key: CryptoKey | null) {
    setSession({ accountId: meta.id, displayName: meta.displayName, key })
    await bindAccountStorage(storageNameFor(meta.id))
    void startSync()
    onReady()
  }

  return (
    <div className="card auth-card">
      <div className="app-header" style={{ padding: '4px 0 12px' }}>
        <span style={{ fontSize: '1.6rem' }}>🔒</span>
        <div>
          <div className="title">FitBlueprint</div>
          <div className="subtitle">{tr('Private, encrypted profiles', 'Privata, krypterade profiler')}</div>
        </div>
        <LanguageToggle />
      </div>

      {!hasCrypto && (
        <div className="banner warn">
          {tr(
            'Secure encryption isn’t available in this browser/sandbox, so profiles can’t be encrypted or saved between visits here. You can still try the app for this session. On the installed app your data is encrypted at rest.',
            'Säker kryptering finns inte i den här webbläsaren/sandlådan, så profiler kan inte krypteras eller sparas mellan besök här. Du kan ändå testa appen under den här sessionen. I den installerade appen krypteras din data när den lagras.',
          )}
        </div>
      )}
      {hasCrypto && !storageIsPersistent && (
        <div className="banner info">
          {tr(
            'This preview can’t save to disk, so anything you enter lasts only for this session. The installed app stores your encrypted data permanently on your device.',
            'Den här förhandsvisningen kan inte spara till disk, så allt du anger finns bara kvar under den här sessionen. Den installerade appen sparar din krypterade data permanent på din enhet.',
          )}
        </div>
      )}

      {mode === 'list' && (
        <>
          <h2>{tr('Choose your profile', 'Välj din profil')}</h2>
          <div className="account-list">
            {accounts.map((a) => (
              <button
                key={a.id}
                className="choice account-row"
                onClick={() => {
                  setSelected(a)
                  if (a.cloudUserId) void openCloudAccount(a)
                  else setMode('unlock')
                }}
              >
                <span className="account-avatar" aria-hidden>
                  {a.displayName.charAt(0).toUpperCase()}
                </span>
                <span>
                  {a.displayName}
                  <span className="desc">
                    {tr('Created', 'Skapad')} {fmtDate(a.createdAt, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </span>
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {cloudConfigured && (
              <button className="primary" onClick={() => setMode('cloud')}>
                ☁ {tr('Sign in with email', 'Logga in med e-post')}
              </button>
            )}
            <button className={cloudConfigured ? 'ghost' : 'primary'} onClick={() => setMode('create')}>
              + {tr('Local profile', 'Lokal profil')}
            </button>
          </div>
        </>
      )}

      {mode === 'cloud' && (
        <CloudForm
          onBack={accounts.length ? () => setMode('list') : () => setMode('create')}
          onSignedIn={async (uid, email) => {
            const meta = ensureCloudAccount(uid, email, todayIso())
            setAccounts(listAccounts())
            await finishUnlock(meta, null)
          }}
        />
      )}

      {mode === 'unlock' && selected && (
        <UnlockForm
          account={selected}
          onBack={() => setMode('list')}
          onUnlocked={(key) => finishUnlock(selected, key)}
        />
      )}

      {mode === 'create' && (
        <CreateForm
          hasCrypto={hasCrypto}
          onBack={accounts.length ? () => setMode('list') : undefined}
          onCreated={async (meta, key) => {
            // Offer a one-time import of pre-accounts data into the first profile.
            const legacy = readLegacyState()
            if (legacy && accounts.length === 0) {
              importLegacyState(legacy as Record<string, unknown>)
              clearLegacyState()
            }
            setAccounts(listAccounts())
            await finishUnlock(meta, key)
          }}
        />
      )}
    </div>
  )
}

function CloudForm({ onBack, onSignedIn }: { onBack: () => void; onSignedIn: (uid: string, email: string) => Promise<void> }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function go(kind: 'in' | 'up') {
    setBusy(true)
    setError('')
    const err = kind === 'in' ? await signIn(email.trim(), password) : await signUp(email.trim(), password)
    if (err) {
      setError(err)
      setBusy(false)
      return
    }
    const session = await currentSession()
    if (!session) {
      setError(tr('Signed in, but no session was returned. Try again.', 'Inloggad, men ingen session returnerades. Försök igen.'))
      setBusy(false)
      return
    }
    await onSignedIn(session.user.id, session.user.email ?? email.trim())
  }

  return (
    <>
      <h2>☁ {tr('Sign in', 'Logga in')}</h2>
      <p className="muted small">
        {tr(
          'One account for the web app and for the coach inside ChatGPT or Claude. Your data is stored in your Supabase project and cached on this device.',
          'Ett konto för webbappen och för coachen inne i ChatGPT eller Claude. Dina data lagras i ditt Supabase-projekt och cachas på den här enheten.',
        )}
      </p>
      <div className="field">
        <label>{tr('Email', 'E-post')}</label>
        <input type="text" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="field">
        <label>{tr('Password', 'Lösenord')}</label>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && email && password.length >= 6 && consent && go('in')}
        />
        <div className="hint">{tr('At least 6 characters.', 'Minst 6 tecken.')}</div>
      </div>
      <label className="consent-row">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>
          {tr(
            'I consent to FitBlueprint storing my fitness and health data in my Supabase project and on this device to provide coaching.',
            'Jag samtycker till att FitBlueprint lagrar mina tränings- och hälsodata i mitt Supabase-projekt och på den här enheten för att ge coachning.',
          )}
        </span>
      </label>
      {error && <div className="banner danger">{error}</div>}
      <div className="wizard-nav">
        <button className="ghost" onClick={onBack}>
          {tr('Back', 'Tillbaka')}
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="ghost" disabled={busy || !email || password.length < 6 || !consent} onClick={() => go('up')}>
            {tr('Create account', 'Skapa konto')}
          </button>
          <button className="primary" disabled={busy || !email || password.length < 6 || !consent} onClick={() => go('in')}>
            {busy ? tr('Signing in…', 'Loggar in…') : tr('Sign in', 'Logga in')}
          </button>
        </div>
      </div>
    </>
  )
}

function UnlockForm({
  account,
  onBack,
  onUnlocked,
}: {
  account: AccountMeta
  onBack: () => void
  onUnlocked: (key: CryptoKey | null) => void
}) {
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function attempt() {
    setBusy(true)
    setError('')
    const key = await unlockAccount(account.id, passcode)
    setBusy(false)
    if (key) onUnlocked(key)
    else setError(tr('Wrong passcode. Try again.', 'Fel kod. Försök igen.'))
  }

  return (
    <>
      <h2>{tr(`Unlock ${account.displayName}`, `Lås upp ${account.displayName}`)}</h2>
      <div className="field">
        <label>{tr('Passcode', 'Kod')}</label>
        <input
          type="password"
          value={passcode}
          autoFocus
          onChange={(e) => setPasscode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && passcode && attempt()}
        />
      </div>
      {error && <div className="banner danger">{error}</div>}
      <div className="wizard-nav">
        <button className="ghost" onClick={onBack}>
          {tr('Back', 'Tillbaka')}
        </button>
        <button className="primary" disabled={!passcode || busy} onClick={attempt}>
          {busy ? tr('Unlocking…', 'Låser upp…') : tr('Unlock', 'Lås upp')}
        </button>
      </div>
    </>
  )
}

function CreateForm({
  hasCrypto,
  onBack,
  onCreated,
}: {
  hasCrypto: boolean
  onBack?: () => void
  onCreated: (meta: AccountMeta, key: CryptoKey | null) => void
}) {
  const [name, setName] = useState('')
  const [passcode, setPasscode] = useState('')
  const [confirm, setConfirm] = useState('')
  const [consent, setConsent] = useState(false)
  const [showNotice, setShowNotice] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const valid = name.trim() && (!hasCrypto || (passcode.length >= 6 && passcode === confirm)) && consent

  async function create() {
    setBusy(true)
    setError('')
    try {
      if (hasCrypto) {
        const { meta, key } = await createAccount(name, passcode, todayIso())
        onCreated(meta, key)
      } else {
        // Fallback: ephemeral in-memory profile, no encryption, no persistence.
        onCreated(
          {
            id: 'ephemeral',
            displayName: name.trim() || tr('Me', 'Jag'),
            saltB64: '',
            verifierB64: '',
            createdAt: todayIso(),
            consentAt: todayIso(),
          },
          null,
        )
      }
    } catch {
      setError(tr('Could not create the profile in this browser.', 'Kunde inte skapa profilen i den här webbläsaren.'))
      setBusy(false)
    }
  }

  return (
    <>
      <h2>{tr('Create your profile', 'Skapa din profil')}</h2>
      <div className="field">
        <label>{tr('Display name', 'Visningsnamn')}</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={tr('e.g. Peter', 't.ex. Peter')} />
      </div>
      {hasCrypto && (
        <>
          <div className="field">
            <label>{tr('Passcode (min 6 characters)', 'Kod (minst 6 tecken)')}</label>
            <input type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} />
            <div className="hint">
              {tr(
                'This passcode encrypts your data. We can’t recover it — if you forget it, the data is gone.',
                'Koden krypterar din data. Vi kan inte återställa den – glömmer du koden är datan borta.',
              )}
            </div>
          </div>
          <div className="field">
            <label>{tr('Confirm passcode', 'Bekräfta kod')}</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            {confirm && confirm !== passcode && (
              <div className="hint" style={{ color: 'var(--danger)' }}>
                {tr('Passcodes don’t match.', 'Koderna matchar inte.')}
              </div>
            )}
          </div>
        </>
      )}

      <label className="consent-row">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>
          {tr(
            'I consent to FitBlueprint storing my fitness and health data on this device to provide coaching.',
            'Jag samtycker till att FitBlueprint lagrar mina tränings- och hälsodata på den här enheten för att ge coachning.',
          )}{' '}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              setShowNotice((v) => !v)
            }}
          >
            {showNotice ? tr('Hide privacy notice', 'Dölj integritetsmeddelande') : tr('Read privacy notice', 'Läs integritetsmeddelande')}
          </a>
        </span>
      </label>
      {showNotice && (
        <div className="banner info small">
          <strong>{tr('Privacy notice.', 'Integritetsmeddelande.')}</strong>{' '}
          {tr(
            'Your data (profile, weigh-ins, workouts, habits) is stored only on this device, encrypted with a key derived from your passcode (PBKDF2 + AES-256-GCM). It is never sent to any server — there are no third-party processors and no transfers. You are the data controller. You can export all your data or erase it entirely at any time from Settings (GDPR Articles 17 & 20). Legal basis: your consent (Article 6(1)(a)), withdrawable anytime by erasing your profile.',
            'Din data (profil, invägningar, pass, vanor) lagras endast på den här enheten, krypterad med en nyckel som härleds från din kod (PBKDF2 + AES-256-GCM). Den skickas aldrig till någon server – det finns inga tredjepartsbiträden och inga överföringar. Du är personuppgiftsansvarig. Du kan när som helst exportera all din data eller radera den helt under Inställningar (GDPR artikel 17 & 20). Rättslig grund: ditt samtycke (artikel 6.1 a), som du kan återkalla när som helst genom att radera din profil.',
          )}
        </div>
      )}
      {error && <div className="banner danger">{error}</div>}

      <div className="wizard-nav">
        {onBack ? (
          <button className="ghost" onClick={onBack}>
            {tr('Back', 'Tillbaka')}
          </button>
        ) : (
          <span />
        )}
        <button className="primary" disabled={!valid || busy} onClick={create}>
          {busy ? tr('Creating…', 'Skapar…') : tr('Create & continue', 'Skapa & fortsätt')}
        </button>
      </div>
    </>
  )
}
