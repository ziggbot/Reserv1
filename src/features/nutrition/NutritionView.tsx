import { useAppStore } from '../../state/store'
import { buildNutritionPlan, hydrationMlPerDay } from '../../lib/calculations'
import { mealsBySlot, SLOT_LABEL, SLOT_ORDER, SUSTAINABLE_EATING_HABITS } from '../../lib/mealIdeas'
import { recommendSupplements, SUPPLEMENT_PRINCIPLES } from '../../lib/supplements'
import EvidencePanel from '../shared/EvidencePanel'

const GRADE_LABEL = { strong: 'Strong evidence', moderate: 'Moderate evidence', emerging: 'Emerging evidence' }
const GRADE_CLS = { strong: 'ok', moderate: 'info', emerging: 'warn' }

export default function NutritionView() {
  const profile = useAppStore((s) => s.profile)
  if (!profile) return null

  const plan = buildNutritionPlan(profile)
  const grouped = mealsBySlot(profile.dietPref)
  const supplements = recommendSupplements(profile)

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
        {SLOT_ORDER.map((slot) => (
          <div key={slot}>
            <h3>{SLOT_LABEL[slot]}</h3>
            <div className="table-scroll">
              <table className="exercise-table">
                <thead>
                  <tr>
                    <th>Meal</th>
                    <th>Protein</th>
                    <th>≈ kcal</th>
                  </tr>
                </thead>
                <tbody>
                  {grouped[slot].map((m) => (
                    <tr key={m.name}>
                      <td>{m.name}</td>
                      <td>{m.proteinG} g</td>
                      <td>{m.approxKcal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2>💊 Supplements worth considering</h2>
        <p className="muted small">
          Selected for your goal, diet and health screen — graded by the strength of the research. Food
          first; these close gaps.
        </p>
        {supplements.map((s) => (
          <div key={s.name} style={{ marginBottom: 14 }}>
            <h3>
              {s.name} <span className={`pill ${GRADE_CLS[s.grade]}`}>{GRADE_LABEL[s.grade]}</span>
            </h3>
            <p className="small">
              <strong>Dose:</strong> {s.dose} · <strong>When:</strong> {s.timing}
            </p>
            <p className="muted small">{s.why}</p>
            {s.caution && <p className="small" style={{ color: 'var(--warn)' }}>⚠ {s.caution}</p>}
          </div>
        ))}
        <ul>
          {SUPPLEMENT_PRINCIPLES.map((p) => (
            <li key={p} className="small">
              {p}
            </li>
          ))}
        </ul>
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
