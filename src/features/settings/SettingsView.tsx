import { useState } from 'react'
import { exportableState, useAppStore } from '../../state/store'
import { getSession } from '../../state/session'
import { eraseAccount } from '../../state/accounts'
import PlanHistory from '../coach/PlanHistory'

export default function SettingsView({ onLock }: { onLock: () => void }) {
  const { profile, setProfile, resetAll, weighIns } = useAppStore()
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmErase, setConfirmErase] = useState(false)
  const [weight, setWeight] = useState(profile ? String(profile.weightKg) : '')
  const [goalWeight, setGoalWeight] = useState(profile?.goalWeightKg ? String(profile.goalWeightKg) : '')

  if (!profile) return null

  const session = getSession()

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
      <div className="card">
        <h1>Settings</h1>
        <h2>Update your stats</h2>
        <p className="muted small">
          As your weight changes, targets should follow — update it here (or it’s picked up from your
          latest weigh-ins) and every plan recalculates instantly.
        </p>
        <div className="field">
          <label>Current weight (kg)</label>
          <input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </div>
        <div className="field">
          <label>Goal weight (kg)</label>
          <input type="number" step="0.1" value={goalWeight} onChange={(e) => setGoalWeight(e.target.value)} />
        </div>
        <button
          className="primary"
          disabled={!weight || Number(weight) < 35 || Number(weight) > 300}
          onClick={() => {
            useAppStore.getState().commitPlanRevision('user', 'Updated stats')
            setProfile({
              ...profile,
              weightKg: Number(weight),
              goalWeightKg: goalWeight === '' ? undefined : Number(goalWeight),
            })
          }}
        >
          Save & recalculate
        </button>
      </div>

      <div className="card">
        <h2>🔐 Your data & privacy</h2>
        <p className="muted small">
          {weighIns.length} weigh-ins stored. Your data lives only on this device, encrypted with your
          passcode. It is never sent to any server — you are the data controller.
        </p>

        <h3>Export my data</h3>
        <p className="muted small">
          Download everything in a portable JSON file (GDPR Article 20 — data portability).
        </p>
        <button className="ghost" onClick={exportData}>
          ⬇ Export my data (JSON)
        </button>

        <h3 style={{ marginTop: 16 }}>Start over</h3>
        <p className="muted small">Redo the interview from scratch, keeping this profile.</p>
        {!confirmReset ? (
          <button className="ghost" onClick={() => setConfirmReset(true)}>
            Reset my plan…
          </button>
        ) : (
          <div>
            <div className="banner danger">This deletes your profile, logs and streaks in this profile. Sure?</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="ghost" onClick={() => setConfirmReset(false)}>
                Keep my data
              </button>
              <button className="primary" style={{ background: 'var(--danger)' }} onClick={resetAll}>
                Yes, reset
              </button>
            </div>
          </div>
        )}

        <h3 style={{ marginTop: 16 }}>Erase my account</h3>
        <p className="muted small">
          Permanently delete this profile and all its encrypted data from this device (GDPR Article 17 —
          right to erasure). This cannot be undone.
        </p>
        {!confirmErase ? (
          <button className="ghost" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={() => setConfirmErase(true)}>
            Erase account & all data…
          </button>
        ) : (
          <div>
            <div className="banner danger">
              This erases <strong>{session?.displayName ?? 'this profile'}</strong> and every trace of its
              data from this device. There is no recovery. Continue?
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="ghost" onClick={() => setConfirmErase(false)}>
                Cancel
              </button>
              <button className="primary" style={{ background: 'var(--danger)' }} onClick={eraseEverything}>
                Erase everything
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h2>🤖 AI training partner</h2>
        <p className="muted small">
          Tap the 💬 button anywhere in the app to chat with your coach about your training — it can
          propose concrete plan changes you review and apply. A full AI (LLM) dialogue is coming soon;
          the built-in coach already handles common adjustments offline.
        </p>
        <PlanHistory />
      </div>

      <div className="card">
        <h2>👤 Profile & session</h2>
        <p className="muted small">
          Signed in as <strong>{session?.displayName ?? 'Me'}</strong>. Lock to switch to another profile;
          your data stays encrypted until you unlock again.
        </p>
        <button className="ghost" onClick={onLock}>
          🔒 Lock & switch profile
        </button>
      </div>
    </main>
  )
}
