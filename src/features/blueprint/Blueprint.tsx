import { useAppStore, todayIso, weeksSince } from '../../state/store'
import { defaultProgram } from '../../lib/threeDayFullBody'
import { buildNutritionPlan } from '../../lib/calculations'
import { buildHabitPlan } from '../../lib/habits'
import { buildOverview } from '../../lib/overview'
import { buildRoadmap } from '../../lib/roadmap'
import EvidencePanel from '../shared/EvidencePanel'
import type { Tab } from '../../App'

const GOAL_LABEL: Record<string, string> = {
  fat_loss: 'lose fat while keeping muscle',
  muscle_gain: 'build muscle',
  recomp: 'recomposition — trade fat for muscle at the same weight',
  general_fitness: 'all-round fitness and health',
}

export default function Blueprint({ onNavigate }: { onNavigate: (t: Tab) => void }) {
  const profile = useAppStore((s) => s.profile)
  const planStartDate = useAppStore((s) => s.planStartDate)
  const customProgram = useAppStore((s) => s.customProgram)
  if (!profile) return null

  const program = defaultProgram(profile, customProgram)
  const nutrition = buildNutritionPlan(profile)
  const habits = buildHabitPlan(profile)
  const overview = buildOverview(profile)
  const roadmap = buildRoadmap(profile)
  const currentWeek = weeksSince(planStartDate, todayIso()) + 1

  return (
    <main>
      <div className="card">
        <h1>Blueprint & Roadmap</h1>
        <p className="muted">
          {profile.age} y · {profile.heightCm} cm · {profile.weightKg} kg · {profile.fitnessLevel} · goal:{' '}
          <strong>{GOAL_LABEL[profile.goal]}</strong>
        </p>
        {program.cautions.map((c) => (
          <div className="banner warn" key={c}>
            {c}
          </div>
        ))}
      </div>

      <div className="card">
        <h2>⭐ What matters — your marching orders</h2>
        <p className="muted small">
          Do these {overview.length} things consistently and everything else is optimization detail.
        </p>
        {overview.map((d) => (
          <div className="directive" key={d.headline}>
            <span className="directive-icon" aria-hidden>
              {d.icon}
            </span>
            <div>
              <strong>{d.headline}</strong>
              <p className="muted small">{d.detail}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2>🗺️ Roadmap — the realistic path</h2>
        <p>{roadmap.summary}</p>
        <div className="stat-row">
          <div className="stat">
            <div className="value">{currentWeek}</div>
            <div className="label">current week</div>
          </div>
          <div className="stat">
            <div className="value">{roadmap.etaWeeks ?? '—'}</div>
            <div className="label">weeks to goal</div>
          </div>
          <div className="stat">
            <div className="value">
              {roadmap.weeklyRateKg > 0 ? '+' : ''}
              {roadmap.weeklyRateKg}
            </div>
            <div className="label">kg / week pace</div>
          </div>
        </div>
        {roadmap.phases.map((p) => (
          <div className="phase" key={p.name}>
            <div className="weeks">{p.weeks}</div>
            <h3>{p.name}</h3>
            <p>{p.focus}</p>
            <ul>
              <li>
                <strong>Training:</strong> {p.trainingEmphasis}
              </li>
              <li>
                <strong>Nutrition:</strong> {p.nutritionEmphasis}
              </li>
              <li>
                <strong>Checkpoints:</strong> {p.checkpoints.join(' · ')}
              </li>
            </ul>
          </div>
        ))}
        <div className="banner info">
          This is the <strong>fastest realistic path</strong> — the rates come from studies on preserving
          muscle, not marketing. Faster trades muscle, adherence and rebound risk for a calendar date.
        </div>
        <details className="evidence">
          <summary>📋 Weekly tracking protocol</summary>
          <ul>
            {roadmap.trackingProtocol.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <p className="muted small">
            Log weigh-ins and sessions in the Progress and Action tabs — the engine turns them into
            adjustment calls automatically.
          </p>
        </details>
      </div>

      <div className="card">
        <h2>🏋️ Training — {program.splitName}</h2>
        <p>
          {program.sessions.length} strength sessions:{' '}
          {program.sessions.map((s) => s.name).join(' · ')} — plus{' '}
          {program.cardio.sessionsPerWeek}× zone-2 cardio
          {program.cardio.hiitSessionsPerWeek > 0 ? ` and ${program.cardio.hiitSessionsPerWeek}× HIIT` : ''}.
        </p>
        <ul>
          {program.progressionRules.slice(0, 2).map((r) => (
            <li key={r}>{r}</li>
          ))}
          <li>{program.deloadRule}</li>
        </ul>
        <button className="primary" onClick={() => onNavigate('action')}>
          Open programs & start a workout →
        </button>
      </div>

      <div className="card">
        <h2>🍽️ Nutrition targets</h2>
        <div className="stat-row">
          <div className="stat">
            <div className="value">{nutrition.targets.calories}</div>
            <div className="label">kcal / day</div>
          </div>
          <div className="stat">
            <div className="value">{nutrition.targets.proteinG} g</div>
            <div className="label">protein</div>
          </div>
          <div className="stat">
            <div className="value">{nutrition.targets.fatG} g</div>
            <div className="label">fat</div>
          </div>
          <div className="stat">
            <div className="value">{nutrition.targets.carbsG} g</div>
            <div className="label">carbs</div>
          </div>
        </div>
        <p className="muted small">
          Maintenance ≈ {nutrition.maintenanceCalories} kcal (Mifflin–St Jeor × activity). Meal ideas and
          supplement guidance live in the Nutrition tab.
        </p>
      </div>

      <div className="card">
        <h2>😴 Recovery</h2>
        <ul>
          <li>
            <strong>Sleep:</strong> 7–9 h target.{' '}
            {profile.sleepHours < 7
              ? `You reported ${profile.sleepHours} h — this is the single highest-leverage fix in your entire plan.`
              : `You reported ${profile.sleepHours} h — keep protecting it.`}
          </li>
          <li>
            <strong>Stress:</strong>{' '}
            {profile.stressLevel === 'high'
              ? 'High — your cardio doubles as stress treatment. On brutal days, do the 10-minute minimum instead of skipping.'
              : 'Manageable — watch it during hard training blocks.'}
          </li>
          <li>
            <strong>Rest days:</strong> at least {Math.max(1, 7 - profile.daysPerWeek - 1)}–{7 - profile.daysPerWeek} full days/week.
          </li>
          <li>
            <strong>Mobility:</strong> 5 minutes after every session (built into your programs), targeting
            hips, ankles and thoracic spine.
          </li>
        </ul>
      </div>

      <div className="card">
        <h2>✅ Habit system (summary)</h2>
        <ul>
          {habits.habits.map((h) => (
            <li key={h.id}>{h.title}</li>
          ))}
        </ul>
        <p className="muted small">Full behavioral plan in the Habits tab.</p>
      </div>

      <EvidencePanel />
    </main>
  )
}
