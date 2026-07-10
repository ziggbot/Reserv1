import { useState } from 'react'
import { useAppStore } from '../../state/store'

export default function SettingsView() {
  const { profile, setProfile, resetAll, weighIns } = useAppStore()
  const [confirmReset, setConfirmReset] = useState(false)
  const [weight, setWeight] = useState(profile ? String(profile.weightKg) : '')
  const [goalWeight, setGoalWeight] = useState(profile?.goalWeightKg ? String(profile.goalWeightKg) : '')

  if (!profile) return null

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
          onClick={() =>
            setProfile({
              ...profile,
              weightKg: Number(weight),
              goalWeightKg: goalWeight === '' ? undefined : Number(goalWeight),
            })
          }
        >
          Save & recalculate
        </button>
      </div>

      <div className="card">
        <h2>Data</h2>
        <p className="muted small">
          {weighIns.length} weigh-ins stored. Everything lives in this browser only — nothing is sent
          anywhere.
        </p>
        <h2>Start over</h2>
        <p className="muted small">Redo the interview from scratch. This erases your profile, logs and streaks.</p>
        {!confirmReset ? (
          <button className="ghost" onClick={() => setConfirmReset(true)}>
            Reset everything…
          </button>
        ) : (
          <div>
            <div className="banner danger">This permanently deletes all local data. Sure?</div>
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
      </div>
    </main>
  )
}
