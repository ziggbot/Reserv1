import { useAppStore } from '../../state/store'
import { buildProgram } from '../../lib/programs'
import { buildNutritionPlan } from '../../lib/calculations'
import { buildHabitPlan } from '../../lib/habits'
import EvidencePanel from '../shared/EvidencePanel'

const GOAL_LABEL: Record<string, string> = {
  fat_loss: 'lose fat while keeping muscle',
  muscle_gain: 'build muscle',
  recomp: 'recomposition — trade fat for muscle at the same weight',
  general_fitness: 'all-round fitness and health',
}

export default function Blueprint() {
  const profile = useAppStore((s) => s.profile)
  if (!profile) return null

  const program = buildProgram(profile)
  const nutrition = buildNutritionPlan(profile)
  const habits = buildHabitPlan(profile)

  return (
    <main>
      <div className="card">
        <h1>Your Complete Fitness Blueprint</h1>
        <p>
          Built from your interview: {profile.age} y, {profile.heightCm} cm, {profile.weightKg} kg,{' '}
          {profile.fitnessLevel}, training {profile.daysPerWeek}×/week ({profile.minutesPerSession} min) with{' '}
          {profile.equipment === 'none' ? 'bodyweight only' : profile.equipment === 'dumbbells' ? 'dumbbells' : 'a full gym'} —
          goal: <strong>{GOAL_LABEL[profile.goal]}</strong>.
        </p>
        {program.cautions.map((c) => (
          <div className="banner warn" key={c}>
            {c}
          </div>
        ))}
      </div>

      <div className="card">
        <h2>🏋️ Training — {program.splitName}</h2>
        {program.sessions.map((s) => (
          <div className="session-card" key={s.name}>
            <h3>
              {s.name} <span className="pill info">{s.focus}</span>
            </h3>
            <p className="small muted">Warm-up: {s.warmup.join(' · ')}</p>
            <div className="table-scroll">
              <table className="exercise-table">
                <thead>
                  <tr>
                    <th>Exercise</th>
                    <th>Sets</th>
                    <th>Reps</th>
                    <th>Effort</th>
                  </tr>
                </thead>
                <tbody>
                  {s.exercises.map((e, i) => (
                    <tr key={i}>
                      <td>{e.name}</td>
                      <td>{e.sets}</td>
                      <td>{e.reps}</td>
                      <td>{e.rpe}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="small muted">Mobility finisher (5 min): {s.mobilityFinisher.join(' · ')}</p>
          </div>
        ))}
        <h3>Cardio & movement</h3>
        <p>{program.cardio.description}</p>
        <p>
          Daily step floor: <strong>{program.cardio.stepsTarget.toLocaleString()}</strong> steps.
        </p>
        <h3>Progression</h3>
        <ul>
          {program.progressionRules.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <p>
          <strong>Deload:</strong> {program.deloadRule}
        </p>
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
          Maintenance ≈ {nutrition.maintenanceCalories} kcal (Mifflin–St Jeor × activity). Details and meal
          ideas live in the Nutrition tab.
        </p>
      </div>

      <div className="card">
        <h2>😴 Recovery</h2>
        <ul>
          <li>
            <strong>Sleep:</strong> 7–9 h target.{' '}
            {profile.sleepHours < 7
              ? `You reported ${profile.sleepHours} h — this is the single highest-leverage fix in your entire plan: short sleep blunts fat loss, muscle growth and willpower simultaneously.`
              : `You reported ${profile.sleepHours} h — keep protecting it; it is a performance enhancer.`}
          </li>
          <li>
            <strong>Stress:</strong>{' '}
            {profile.stressLevel === 'high'
              ? 'High — your zone 2 cardio and daily walks are prescribed as stress treatment too. On brutal days, do the 10-minute minimum session rather than skipping.'
              : 'Manageable — keep an eye on it during hard training blocks.'}
          </li>
          <li>
            <strong>Rest days:</strong> at least {Math.max(1, 7 - profile.daysPerWeek - 1)}–{7 - profile.daysPerWeek} full days/week.
            Muscle is built between sessions, not during them.
          </li>
          <li>
            <strong>Deload week</strong> every ~5 weeks (see Training) — fatigue masks fitness.
          </li>
        </ul>
      </div>

      <div className="card">
        <h2>🤸 Mobility</h2>
        <p>
          Five minutes after every session (already in your workouts above), targeting the areas your
          training and {profile.lifestyle.deskJob ? 'desk job' : 'daily life'} stiffen: hips, ankles and
          thoracic spine. Consistency beats hour-long stretching sessions you won’t do.
        </p>
      </div>

      <div className="card">
        <h2>✅ Habit system (summary)</h2>
        <ul>
          {habits.habits.map((h) => (
            <li key={h.id}>{h.title}</li>
          ))}
        </ul>
        <p className="muted small">Full behavioral plan — including why these specific habits — in the Habits tab.</p>
      </div>

      <EvidencePanel />
    </main>
  )
}
