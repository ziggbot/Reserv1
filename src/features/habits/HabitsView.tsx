import { useAppStore, todayIso } from '../../state/store'
import { buildHabitPlan, currentStreak } from '../../lib/habits'
import EvidencePanel from '../shared/EvidencePanel'

export default function HabitsView() {
  const { profile, habitChecks, toggleHabit } = useAppStore()
  if (!profile) return null

  const plan = buildHabitPlan(profile)
  const today = todayIso()

  return (
    <main>
      <div className="card">
        <h1>Habit Builder</h1>
        <p>
          Consistency is not a personality trait — it’s a system design problem. Based on your lifestyle
          answers, here is what’s working against you and the habit system that routes around it,{' '}
          <strong>built on habits rather than willpower</strong>.
        </p>
      </div>

      <div className="card">
        <h2>🔍 What’s breaking your consistency</h2>
        {plan.findings.map((f) => (
          <div key={f.title} style={{ marginBottom: 10 }}>
          <h3>{f.title}</h3>
            <p className="muted">{f.detail}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <h2>🧱 Today’s checklist ({todayIso()})</h2>
        <p className="muted small">Check habits off here every day — streaks build below each one.</p>
        {plan.habits.map((h) => {
          const checks = habitChecks[h.id] ?? []
          const streak = currentStreak(checks, today)
          return (
            <div key={h.id} style={{ marginBottom: 14 }}>
              <div className="check-row">
                <input
                  type="checkbox"
                  id={`hb-${h.id}`}
                  checked={checks.includes(today)}
                  onChange={() => toggleHabit(h.id, today)}
                />
                <label htmlFor={`hb-${h.id}`}>
                  <strong>{h.title}</strong>
                </label>
                {streak > 0 && <span className="streak">🔥 {streak} day{streak > 1 ? 's' : ''}</span>}
              </div>
              <p className="small" style={{ marginLeft: 30 }}>
                <em>“{h.anchor}”</em>
              </p>
              <p className="muted small" style={{ marginLeft: 30 }}>
                {h.why}
              </p>
            </div>
          )
        })}
      </div>

      <div className="card">
        <h2>📜 Operating principles</h2>
        <ul>
          {plan.principles.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>

      <EvidencePanel />
    </main>
  )
}
