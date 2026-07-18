import { useState } from 'react'
import { useAppStore, todayIso, weeksSince } from '../../state/store'
import { buildProgram } from '../../lib/programs'
import { buildHabitPlan, currentStreak } from '../../lib/habits'
import { analyzeProgress, rollingAverage } from '../../lib/fatloss'
import { macroTargets } from '../../lib/calculations'
import type { Tab } from '../../App'

export default function Dashboard({ onNavigate }: { onNavigate: (t: Tab) => void }) {
  const {
    profile,
    weighIns,
    workoutLog,
    habitChecks,
    planStartDate,
    customProgram,
    addWeighIn,
    toggleWorkout,
    toggleHabit,
  } = useAppStore()
  const [weight, setWeight] = useState('')
  const today = todayIso()

  if (!profile) return null
  const program = customProgram ?? buildProgram(profile)
  const habitPlan = buildHabitPlan(profile)
  const targets = macroTargets(profile)

  const todayWeighIn = weighIns.find((w) => w.date === today)
  const avg = rollingAverage(weighIns, today)
  const analysis =
    profile.goal === 'fat_loss'
      ? analyzeProgress(weighIns, today, profile.weightKg, weeksSince(planStartDate, today))
      : null

  const statusPill = analysis && analysis.status !== 'insufficient_data' && (
    <span
      className={`pill ${
        analysis.status === 'on_track' ? 'ok' : analysis.status === 'stalled' ? 'danger' : 'warn'
      }`}
    >
      {analysis.status.replace('_', ' ')}
    </span>
  )

  const doneToday = (name: string) => workoutLog.some((e) => e.date === today && e.sessionName === name)
  const thisWeekCount = workoutLog.filter((e) => weeksSince(e.date, today) === 0).length

  return (
    <main>
      <div className="card">
        <h2>Hi {profile.name} 👋</h2>
        <div className="stat-row">
          <div className="stat">
            <div className="value">{targets.calories}</div>
            <div className="label">kcal target</div>
          </div>
          <div className="stat">
            <div className="value">{targets.proteinG} g</div>
            <div className="label">protein</div>
          </div>
          <div className="stat">
            <div className="value">{avg ?? '—'}</div>
            <div className="label">7-day avg kg</div>
          </div>
          <div className="stat">
            <div className="value">{thisWeekCount}/{profile.daysPerWeek}</div>
            <div className="label">workouts this wk</div>
          </div>
        </div>
        {analysis && analysis.status !== 'insufficient_data' && (
          <p className="small">
            Trend check: {statusPill} — see{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('progress') }}>
              Progress
            </a>{' '}
            for the recommendation.
          </p>
        )}
      </div>

      <div className="card">
        <h2>⚖️ Morning weigh-in</h2>
        {todayWeighIn ? (
          <p>
            Logged <strong>{todayWeighIn.weightKg} kg</strong> today. Only the weekly average matters —
            single days are water, not fat.
          </p>
        ) : (
          <div className="weigh-form">
            <input
              type="number"
              step="0.1"
              placeholder="Weight (kg)"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              aria-label="Today's weight in kg"
            />
            <button
              className="primary"
              disabled={!weight || Number(weight) < 35 || Number(weight) > 300}
              onClick={() => {
                addWeighIn({ date: today, weightKg: Number(weight) })
                setWeight('')
              }}
            >
              Log
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <h2>🏋️ This week’s sessions</h2>
        <p className="muted small">
          {program.splitName} · start a logged workout in Action, or tick off sessions done elsewhere.
        </p>
        {program.sessions.map((s) => (
          <div className="check-row" key={s.name}>
            <input
              type="checkbox"
              id={`w-${s.name}`}
              checked={doneToday(s.name)}
              onChange={() => toggleWorkout(today, s.name)}
            />
            <label htmlFor={`w-${s.name}`}>
              <strong>{s.name}</strong> <span className="muted small">— {s.focus}</span>
            </label>
          </div>
        ))}
        <button className="primary" onClick={() => onNavigate('action')}>
          ▶ Start a workout
        </button>
      </div>

      <div className="card">
        <h2>✅ Today’s habits</h2>
        {habitPlan.habits.map((h) => {
          const checks = habitChecks[h.id] ?? []
          const streak = currentStreak(checks, today)
          return (
            <div className="check-row" key={h.id}>
              <input
                type="checkbox"
                id={`h-${h.id}`}
                checked={checks.includes(today)}
                onChange={() => toggleHabit(h.id, today)}
              />
              <label htmlFor={`h-${h.id}`}>{h.title}</label>
              {streak > 0 && <span className="streak">🔥 {streak}d</span>}
            </div>
          )
        })}
        <p className="small muted">Rule of the house: never miss twice.</p>
      </div>
    </main>
  )
}
