import { useAppStore } from '../../state/store'
import { buildNutritionPlan, hydrationMlPerDay } from '../../lib/calculations'
import { mealIdeasFor, SUSTAINABLE_EATING_HABITS } from '../../lib/mealIdeas'
import EvidencePanel from '../shared/EvidencePanel'

export default function NutritionView() {
  const profile = useAppStore((s) => s.profile)
  if (!profile) return null

  const plan = buildNutritionPlan(profile)
  const meals = mealIdeasFor(profile.dietPref)

  return (
    <main>
      <div className="card">
        <h1>Nutrition Coach</h1>
        <p>
          A plan that supports training, recovery and long-term health — designed around{' '}
          <strong>sustainable eating, not restriction</strong>.
        </p>
        <div className="stat-row">
          <div className="stat">
            <div className="value">{plan.targets.calories}</div>
            <div className="label">kcal / day</div>
          </div>
          <div className="stat">
            <div className="value">{plan.targets.proteinG} g</div>
            <div className="label">protein ({plan.proteinPerKg} g/kg)</div>
          </div>
          <div className="stat">
            <div className="value">{plan.targets.fatG} g</div>
            <div className="label">fat</div>
          </div>
          <div className="stat">
            <div className="value">{plan.targets.carbsG} g</div>
            <div className="label">carbs</div>
          </div>
        </div>
        <p className="muted small">
          Maintenance ≈ {plan.maintenanceCalories} kcal/day. Your calorie number is{' '}
          {plan.targets.calories === plan.maintenanceCalories
            ? 'set at maintenance for your goal'
            : plan.targets.calories < plan.maintenanceCalories
              ? 'a moderate deficit sized to lose ~0.5–1% of bodyweight per week'
              : 'a small surplus — muscle is built slowly or not at all'}
          .
        </p>
      </div>

      <div className="card">
        <h2>💧 Hydration</h2>
        <p>
          Baseline <strong>{Math.round(hydrationMlPerDay(profile.weightKg, false) / 100) / 10} L/day</strong>{' '}
          (~33 ml/kg), plus ~0.5 L around each training session. Pale-straw urine is the practical check —
          thirst lags behind need during training.
        </p>
      </div>

      <div className="card">
        <h2>🍽️ Meal ideas ({profile.dietPref})</h2>
        <p className="muted small">
          Mix and match to land near {plan.targets.calories} kcal and {plan.targets.proteinG} g protein across{' '}
          {profile.mealsPerDay} meals (~{Math.round(plan.targets.proteinG / profile.mealsPerDay)} g protein per meal).
        </p>
        <div className="table-scroll">
          <table className="exercise-table">
            <thead>
              <tr>
                <th>Meal</th>
                <th>Slot</th>
                <th>Protein</th>
                <th>≈ kcal</th>
              </tr>
            </thead>
            <tbody>
              {meals.map((m) => (
                <tr key={m.name}>
                  <td>{m.name}</td>
                  <td>{m.slot}</td>
                  <td>{m.proteinG} g</td>
                  <td>{m.approxKcal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2>🌱 Sustainable eating habits</h2>
        <ul>
          {SUSTAINABLE_EATING_HABITS.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
        <ul>
          {plan.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </div>

      <EvidencePanel />
    </main>
  )
}
