import { useState } from 'react'
import { exportableState, useAppStore } from '../../state/store'
import { getSession } from '../../state/session'
import { eraseAccount } from '../../state/accounts'
import { tr, useLocale } from '../../i18n'
import LanguageToggle from '../../i18n/LanguageToggle'
import CoachSettingsCard from './CoachSettingsCard'
import CloudSyncCard from './CloudSyncCard'

export default function SettingsView({ onLock }: { onLock: () => void }) {
  useLocale()
  const { profile, resetAll, weighIns } = useAppStore()
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmErase, setConfirmErase] = useState(false)

  if (!profile) return null

  const session = getSession()
  const displayName = session?.displayName ?? tr('Me', 'Jag')

  function exportData() {
    const payload = {
      exportedAt: new Date().toISOString(),
      app: 'FitBlueprint',
      profileName: session?.displayName ?? 'Me',
      data: exportableState(),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fitblueprint-${(session?.displayName ?? 'me').toLowerCase().replace(/\s+/g, '-')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function eraseEverything() {
    if (session) eraseAccount(session.accountId)
    resetAll()
    onLock()
  }

  return (
    <main>
      <div className="home-greeting">
        <h1>{tr('Settings', 'Inställningar')}</h1>
        <div className="date">
          {tr(
            'Language, cloud sync, coach, and your data. Your program lives under More → Training program; weight and goal under Progress.',
            'Språk, molnsynk, coach och dina data. Programmet finns under Mer → Träningsprogram, vikt och mål under Framsteg.',
          )}
        </div>
      </div>

      <div className="card">
        <h2>{tr('🌐 Language', '🌐 Språk')}</h2>
        <p className="muted small">
          {tr(
            'Swedish or English for the whole app. Your own program names are shown as you wrote them.',
            'Svenska eller engelska i hela appen. Dina egna programnamn visas som du skrev dem.',
          )}
        </p>
        <LanguageToggle />
      </div>

      <CloudSyncCard />

      <div className="card">
        <h2>{tr('🔐 Your data & privacy', '🔐 Dina data & integritet')}</h2>
        <p className="muted small">
          {tr(
            `${weighIns.length} weigh-ins stored. Your data lives only on this device, encrypted with your passcode. It is never sent to any server — you are the data controller.`,
            `${weighIns.length} invägningar sparade. Dina data finns bara på den här enheten, krypterade med din kod. De skickas aldrig till någon server — du är personuppgiftsansvarig.`,
          )}
        </p>

        <h3>{tr('Export my data', 'Exportera mina data')}</h3>
        <p className="muted small">
          {tr(
            'Download everything in a portable JSON file (GDPR Article 20 — data portability).',
            'Ladda ner allt som en portabel JSON-fil (GDPR artikel 20 — dataportabilitet).',
          )}
        </p>
        <button className="ghost" onClick={exportData}>
          {tr('⬇ Export my data (JSON)', '⬇ Exportera mina data (JSON)')}
        </button>

        <h3 style={{ marginTop: 16 }}>{tr('Start over', 'Börja om')}</h3>
        <p className="muted small">
          {tr('Redo the interview from scratch, keeping this profile.', 'Gör om intervjun från början men behåll den här profilen.')}
        </p>
        {!confirmReset ? (
          <button className="ghost" onClick={() => setConfirmReset(true)}>
            {tr('Reset my plan…', 'Återställ min plan…')}
          </button>
        ) : (
          <div>
            <div className="banner danger">
              {tr(
                'This deletes your profile, logs and streaks in this profile. Sure?',
                'Det här raderar din profil, dina loggar och dina dagar i rad i den här profilen. Säker?',
              )}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="ghost" onClick={() => setConfirmReset(false)}>
                {tr('Keep my data', 'Behåll mina data')}
              </button>
              <button className="primary" style={{ background: 'var(--danger)' }} onClick={resetAll}>
                {tr('Yes, reset', 'Ja, återställ')}
              </button>
            </div>
          </div>
        )}

        <h3 style={{ marginTop: 16 }}>{tr('Erase my account', 'Radera mitt konto')}</h3>
        <p className="muted small">
          {tr(
            'Permanently delete this profile and all its encrypted data from this device (GDPR Article 17 — right to erasure). This cannot be undone.',
            'Ta bort den här profilen och alla dess krypterade data från enheten permanent (GDPR artikel 17 — rätten till radering). Det går inte att ångra.',
          )}
        </p>
        {!confirmErase ? (
          <button className="ghost" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={() => setConfirmErase(true)}>
            {tr('Erase account & all data…', 'Radera konto & alla data…')}
          </button>
        ) : (
          <div>
            <div className="banner danger">
              {tr('This erases ', 'Det här raderar ')}
              <strong>{session?.displayName ?? tr('this profile', 'den här profilen')}</strong>
              {tr(
                ' and every trace of its data from this device. There is no recovery. Continue?',
                ' och varje spår av dess data från den här enheten. Det finns ingen återställning. Fortsätta?',
              )}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="ghost" onClick={() => setConfirmErase(false)}>
                {tr('Cancel', 'Avbryt')}
              </button>
              <button className="primary" style={{ background: 'var(--danger)' }} onClick={eraseEverything}>
                {tr('Erase everything', 'Radera allt')}
              </button>
            </div>
          </div>
        )}
      </div>

      <CoachSettingsCard />

      <div className="card">
        <h2>{tr('👤 Profile & session', '👤 Profil & session')}</h2>
        <p className="muted small">
          {tr('Signed in as ', 'Inloggad som ')}
          <strong>{displayName}</strong>
          {tr(
            '. Lock to switch to another profile; your data stays encrypted until you unlock again.',
            '. Lås för att byta till en annan profil; dina data förblir krypterade tills du låser upp igen.',
          )}
        </p>
        <button className="ghost" onClick={onLock}>
          {tr('🔒 Lock & switch profile', '🔒 Lås & byt profil')}
        </button>
      </div>
    </main>
  )
}
