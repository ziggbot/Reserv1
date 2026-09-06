import { useAppStore } from '../../state/store'
import { buildNutritionPlan, hydrationMlPerDay } from '../../lib/calculations'
import { mealsBySlot, SLOT_ORDER, sustainableEatingHabits, type MealSlot } from '../../lib/mealIdeas'
import { recommendSupplements, supplementPrinciples } from '../../lib/supplements'
import EvidencePanel from '../shared/EvidencePanel'
import { tr, L, useLocale } from '../../i18n'
import type { DietPref, EvidenceGrade } from '../../lib/types'

const GRADE_CLS: Record<EvidenceGrade, string> = { strong: 'ok', moderate: 'info', emerging: 'warn' }

function gradeLabel(grade: EvidenceGrade): string {
  switch (grade) {
    case 'strong':
      return tr('Strong evidence', 'Stark evidens')
    case 'moderate':
      return tr('Moderate evidence', 'Måttlig evidens')
    case 'emerging':
    default:
      return tr('Emerging evidence', 'Ny evidens')
  }
}

function slotLabel(slot: MealSlot): string {
  switch (slot) {
    case 'breakfast':
      return tr('Breakfast', 'Frukost')
    case 'lunch':
      return tr('Lunch', 'Lunch')
    case 'dinner':
      return tr('Dinner', 'Middag')
    case 'snack':
    default:
      return tr('Snacks', 'Mellanmål')
  }
}

function dietLabel(pref: DietPref): string {
  switch (pref) {
    case 'vegetarian':
      return tr('vegetarian', 'vegetarisk')
    case 'vegan':
      return tr('vegan', 'vegansk')
    case 'omnivore':
    default:
      return tr('omnivore', 'allätare')
  }
}

export default function NutritionView() {
  useLocale()
  const profile = useAppStore((s) => s.profile)
  if (!profile) return null

  const plan = buildNutritionPlan(profile)
  const grouped = mealsBySlot(profile.dietPref)
  const supplements = recommendSupplements(profile)
  const litres = Math.round(hydrationMlPerDay(profile.weightKg, false) / 100) / 10
  const proteinPerMeal = Math.round(plan.targets.proteinG / profile.mealsPerDay)

  return (
    <main>
      <div className="card">
        <h1>{tr('Nutrition Coach', 'Kostcoach')}</h1>
        <p>
          {tr(
            'A plan that supports training, recovery and long-term health — designed around ',
            'En plan som stöttar träning, återhämtning och långsiktig hälsa — byggd kring ',
          )}
          <strong>{tr('sustainable eating, not restriction', 'hållbara matvanor, inte restriktioner')}</strong>.
        </p>
        <div className="stat-row">
          <div className="stat">
            <div className="value">{plan.targets.calories}</div>
            <div className="label">{tr('kcal / day', 'kcal / dag')}</div>
          </div>
          <div className="stat">
            <div className="value">{plan.targets.proteinG} g</div>
            <div className="label">{tr('protein', 'protein')} ({plan.proteinPerKg} g/kg)</div>
          </div>
          <div className="stat">
            <div className="value">{plan.targets.fatG} g</div>
            <div className="label">{tr('fat', 'fett')}</div>
          </div>
          <div className="stat">
            <div className="value">{plan.targets.carbsG} g</div>
            <div className="label">{tr('carbs', 'kolhydrater')}</div>
          </div>
        </div>
        <p className="muted small">
          {tr(
            `Maintenance ≈ ${plan.maintenanceCalories} kcal/day. Your calorie number is `,
            `Underhållskalorier ≈ ${plan.maintenanceCalories} kcal/dag. Ditt kaloriantal är `,
          )}
          {plan.targets.calories === plan.maintenanceCalories
            ? tr('set at maintenance for your goal', 'satt till underhållsnivå för ditt mål')
            : plan.targets.calories < plan.maintenanceCalories
              ? tr(
                  'a moderate deficit sized to lose ~0.5–1% of bodyweight per week',
                  'ett måttligt kaloriunderskott för att gå ner ~0,5–1 % av kroppsvikten per vecka',
                )
              : tr(
                  'a small surplus — muscle is built slowly or not at all',
                  'ett litet överskott — muskler byggs långsamt eller inte alls',
                )}
          .
        </p>
      </div>

      <div className="card">
        <h2>{tr('💧 Hydration', '💧 Vätska')}</h2>
        <p>
          {tr('Baseline ', 'Grundnivå ')}
          <strong>
            {litres} {tr('L/day', 'L/dag')}
          </strong>{' '}
          {tr(
            '(~33 ml/kg), plus ~0.5 L around each training session. Pale-straw urine is the practical check — thirst lags behind need during training.',
            '(~33 ml/kg), plus ~0,5 L kring varje träningspass. Ljusgul urin är det praktiska testet — törsten släpar efter behovet under träning.',
          )}
        </p>
      </div>

      <div className="card">
        <h2>{tr('🍽️ Meal ideas', '🍽️ Måltidsidéer')} ({dietLabel(profile.dietPref)})</h2>
        <p className="muted small">
          {tr(
            `Mix and match to land near ${plan.targets.calories} kcal and ${plan.targets.proteinG} g protein across ${profile.mealsPerDay} meals (~${proteinPerMeal} g protein per meal).`,
            `Kombinera fritt för att landa nära ${plan.targets.calories} kcal och ${plan.targets.proteinG} g protein fördelat på ${profile.mealsPerDay} måltider (~${proteinPerMeal} g protein per måltid).`,
          )}
        </p>
        {SLOT_ORDER.map((slot) => (
          <div key={slot}>
            <h3>{slotLabel(slot)}</h3>
            <div className="table-scroll">
              <table className="exercise-table">
                <thead>
                  <tr>
                    <th>{tr('Meal', 'Måltid')}</th>
                    <th>{tr('Protein', 'Protein')}</th>
                    <th>≈ kcal</th>
                  </tr>
                </thead>
                <tbody>
                  {grouped[slot].map((m) => (
                    <tr key={m.name}>
                      <td>{L(m.name)}</td>
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
        <h2>{tr('💊 Supplements worth considering', '💊 Tillskott värda att överväga')}</h2>
        <p className="muted small">
          {tr(
            'Selected for your goal, diet and health screen — graded by the strength of the research. Food first; these close gaps.',
            'Utvalda efter ditt mål, din kost och din hälsoscreening — graderade efter forskningens styrka. Mat först; de här täpper till luckor.',
          )}
        </p>
        {supplements.map((s) => (
          <div key={s.name} style={{ marginBottom: 14 }}>
            <h3>
              {L(s.name)} <span className={`pill ${GRADE_CLS[s.grade]}`}>{gradeLabel(s.grade)}</span>
            </h3>
            <p className="small">
              <strong>{tr('Dose:', 'Dos:')}</strong> {L(s.dose)} · <strong>{tr('When:', 'När:')}</strong> {L(s.timing)}
            </p>
            <p className="muted small">{L(s.why)}</p>
            {s.caution && (
              <p className="small" style={{ color: 'var(--warn)' }}>
                ⚠ {L(s.caution)}
              </p>
            )}
          </div>
        ))}
        <ul>
          {supplementPrinciples().map((p) => (
            <li key={p} className="small">
              {L(p)}
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h2>{tr('🌱 Sustainable eating habits', '🌱 Hållbara matvanor')}</h2>
        <ul>
          {sustainableEatingHabits().map((h) => (
            <li key={h}>{L(h)}</li>
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
