import { useAppStore, todayIso } from '../../state/store'
import { buildHabitPlan, currentStreak } from '../../lib/habits'
import EvidencePanel from '../shared/EvidencePanel'
import { tr, useLocale } from '../../i18n'

export default function HabitsView() {
  useLocale()
  const { profile, habitChecks, toggleHabit } = useAppStore()
  if (!profile) return null

  const plan = buildHabitPlan(profile)
  const today = todayIso()

  return (
    <main>
      <div className="card">
        <h1>{tr('Habit Builder', 'Vanebyggaren')}</h1>
        <p>
          {tr(
            'Consistency is not a personality trait — it’s a system design problem. Based on your lifestyle answers, here is what’s working against you and the habit system that routes around it, ',
            'Konsekvens är inget personlighetsdrag — det är ett systemdesignproblem. Utifrån dina livsstilssvar: här är det som jobbar emot dig och vanesystemet som tar vägen runt det, ',
          )}
          <strong>{tr('built on habits rather than willpower', 'byggt på vanor i stället för viljestyrka')}</strong>.
        </p>
      </div>

      <div className="card">
        <h2>{tr('🔍 What’s breaking your consistency', '🔍 Det som bryter din konsekvens')}</h2>
        {plan.findings.map((f) => (
          <div key={f.title} style={{ marginBottom: 10 }}>
            <h3>{f.title}</h3>
            <p className="muted">{f.detail}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <h2>
          {tr('🧱 Today’s checklist', '🧱 Dagens checklista')} ({today})
        </h2>
        <p className="muted small">
          {tr(
            'Check habits off here every day — streaks build below each one.',
            'Bocka av vanorna här varje dag — dagar i rad räknas under varje vana.',
          )}
        </p>
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
                {streak > 0 && (
                  <span className="streak">
                    🔥 {tr(`${streak} day${streak > 1 ? 's' : ''}`, `${streak} dag${streak > 1 ? 'ar' : ''} i rad`)}
                  </span>
                )}
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
        <h2>{tr('📜 Operating principles', '📜 Grundprinciper')}</h2>
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
