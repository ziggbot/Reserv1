import { useState, type ReactNode } from 'react'
import { useAppStore } from '../../state/store'
import type {
  ActivityLevel,
  DietPref,
  Equipment,
  FitnessLevel,
  Goal,
  Injury,
  LifestyleFlags,
  MedicalCondition,
  Profile,
  Sex,
  StressLevel,
} from '../../lib/types'

interface Draft {
  name: string
  age: string
  sex: Sex
  heightCm: string
  weightKg: string
  bodyFatPct: string
  goal: Goal
  goalWeightKg: string
  fitnessLevel: FitnessLevel
  medicalConditions: MedicalCondition[]
  injuries: Injury[]
  equipment: Equipment
  daysPerWeek: number
  minutesPerSession: number
  sleepHours: string
  stressLevel: StressLevel
  activityLevel: ActivityLevel
  dietPref: DietPref
  mealsPerDay: number
  lifestyle: LifestyleFlags
}

const INITIAL: Draft = {
  name: '',
  age: '',
  sex: 'male',
  heightCm: '',
  weightKg: '',
  bodyFatPct: '',
  goal: 'fat_loss',
  goalWeightKg: '',
  fitnessLevel: 'beginner',
  medicalConditions: [],
  injuries: [],
  equipment: 'full_gym',
  daysPerWeek: 3,
  minutesPerSession: 60,
  sleepHours: '7',
  stressLevel: 'moderate',
  activityLevel: 'light',
  dietPref: 'omnivore',
  mealsPerDay: 3,
  lifestyle: {
    allOrNothing: false,
    timeCrunched: false,
    travelsOften: false,
    eveningSnacker: false,
    deskJob: false,
    trainsAlone: false,
  },
}

const STEPS = ['About you', 'Your goal', 'Health screen', 'Training setup', 'Lifestyle', 'Diet'] as const

export default function IntakeWizard() {
  const setProfile = useAppStore((s) => s.setProfile)
  const [step, setStep] = useState(0)
  const [d, setD] = useState<Draft>(INITIAL)

  const up = (patch: Partial<Draft>) => setD((prev) => ({ ...prev, ...patch }))

  const stepValid = (): boolean => {
    if (step === 0) {
      const age = Number(d.age)
      const h = Number(d.heightCm)
      const w = Number(d.weightKg)
      return age >= 16 && age <= 90 && h >= 120 && h <= 230 && w >= 35 && w <= 300
    }
    if (step === 1 && (d.goal === 'fat_loss' || d.goal === 'muscle_gain')) {
      if (d.goalWeightKg === '') return true // optional
      const gw = Number(d.goalWeightKg)
      return gw >= 35 && gw <= 300
    }
    if (step === 4) {
      const s = Number(d.sleepHours)
      return s >= 3 && s <= 12
    }
    return true
  }

  const finish = () => {
    const profile: Profile = {
      name: d.name.trim() || 'Athlete',
      age: Number(d.age),
      sex: d.sex,
      heightCm: Number(d.heightCm),
      weightKg: Number(d.weightKg),
      bodyFatPct: d.bodyFatPct === '' ? undefined : Number(d.bodyFatPct),
      goal: d.goal,
      goalWeightKg: d.goalWeightKg === '' ? undefined : Number(d.goalWeightKg),
      fitnessLevel: d.fitnessLevel,
      medicalConditions: d.medicalConditions,
      injuries: d.injuries,
      equipment: d.equipment,
      daysPerWeek: d.daysPerWeek,
      minutesPerSession: d.minutesPerSession,
      sleepHours: Number(d.sleepHours),
      stressLevel: d.stressLevel,
      activityLevel: d.activityLevel,
      dietPref: d.dietPref,
      mealsPerDay: d.mealsPerDay,
      lifestyle: d.lifestyle,
    }
    setProfile(profile)
  }

  return (
    <div className="card">
      <h1>Let’s build your fitness system</h1>
      <p className="muted">
        A real coach interviews before prescribing. Six quick steps — every answer changes your plan.
      </p>
      <div className="progress-track" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={STEPS.length}>
        <div className="progress-fill" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
      </div>
      <h2>
        Step {step + 1} of {STEPS.length}: {STEPS[step]}
      </h2>

      {step === 0 && (
        <>
          <Field label="Name (optional)">
            <input type="text" value={d.name} onChange={(e) => up({ name: e.target.value })} placeholder="What should I call you?" />
          </Field>
          <Field label="Age" hint="16–90">
            <input type="number" value={d.age} onChange={(e) => up({ age: e.target.value })} placeholder="e.g. 35" />
          </Field>
          <Field label="Sex (for metabolic calculation)">
            <ChoiceRow
              options={[
                { v: 'male', label: 'Male' },
                { v: 'female', label: 'Female' },
              ]}
              value={d.sex}
              onSelect={(v) => up({ sex: v as Sex })}
            />
          </Field>
          <Field label="Height (cm)">
            <input type="number" value={d.heightCm} onChange={(e) => up({ heightCm: e.target.value })} placeholder="e.g. 180" />
          </Field>
          <Field label="Weight (kg)">
            <input type="number" value={d.weightKg} onChange={(e) => up({ weightKg: e.target.value })} placeholder="e.g. 85" />
          </Field>
          <Field label="Body fat % (optional)" hint="Skip if unknown — an estimate from a scale or photos is fine">
            <input type="number" value={d.bodyFatPct} onChange={(e) => up({ bodyFatPct: e.target.value })} placeholder="e.g. 22" />
          </Field>
        </>
      )}

      {step === 1 && (
        <>
          <Field label="Primary goal">
            <ChoiceRow
              options={[
                { v: 'fat_loss', label: 'Lose fat', desc: 'Drop fat, keep muscle' },
                { v: 'muscle_gain', label: 'Build muscle', desc: 'Gain lean size & strength' },
                { v: 'recomp', label: 'Recomposition', desc: 'Same weight, better body' },
                { v: 'general_fitness', label: 'General fitness', desc: 'Health, energy, longevity' },
              ]}
              value={d.goal}
              onSelect={(v) => up({ goal: v as Goal })}
            />
          </Field>
          {(d.goal === 'fat_loss' || d.goal === 'muscle_gain') && (
            <Field label="Goal weight (kg, optional)" hint="Used to project a realistic timeline">
              <input type="number" value={d.goalWeightKg} onChange={(e) => up({ goalWeightKg: e.target.value })} placeholder="e.g. 78" />
            </Field>
          )}
          <Field label="Training experience">
            <ChoiceRow
              options={[
                { v: 'beginner', label: 'Beginner', desc: '< 1 year consistent lifting' },
                { v: 'intermediate', label: 'Intermediate', desc: '1–3 years' },
                { v: 'advanced', label: 'Advanced', desc: '3+ years' },
              ]}
              value={d.fitnessLevel}
              onSelect={(v) => up({ fitnessLevel: v as FitnessLevel })}
            />
          </Field>
        </>
      )}

      {step === 2 && (
        <>
          <Field label="Any of these medical conditions?" hint="Select all that apply — they adjust the plan and its cautions">
            <MultiChoice
              options={[
                { v: 'hypertension', label: 'High blood pressure' },
                { v: 'diabetes', label: 'Diabetes (1 or 2)' },
                { v: 'heart_condition', label: 'Heart condition' },
                { v: 'asthma', label: 'Asthma' },
                { v: 'pregnancy', label: 'Pregnancy / postpartum' },
                { v: 'other', label: 'Other condition' },
              ]}
              values={d.medicalConditions}
              onToggle={(v) =>
                up({
                  medicalConditions: toggle(d.medicalConditions, v as MedicalCondition),
                })
              }
            />
          </Field>
          <Field label="Current injuries or painful joints?" hint="Exercise selection will avoid loading these">
            <MultiChoice
              options={[
                { v: 'knee', label: 'Knee' },
                { v: 'shoulder', label: 'Shoulder' },
                { v: 'lower_back', label: 'Lower back' },
                { v: 'hip', label: 'Hip' },
                { v: 'wrist_elbow', label: 'Wrist / elbow' },
                { v: 'ankle', label: 'Ankle' },
              ]}
              values={d.injuries}
              onToggle={(v) => up({ injuries: toggle(d.injuries, v as Injury) })}
            />
          </Field>
          {(d.medicalConditions.includes('heart_condition') || d.medicalConditions.includes('pregnancy')) && (
            <div className="banner warn">
              With this condition, please get explicit clearance from your physician before starting —
              this app will keep prescriptions conservative, but it cannot replace that conversation.
            </div>
          )}
        </>
      )}

      {step === 3 && (
        <>
          <Field label="Available equipment">
            <ChoiceRow
              options={[
                { v: 'none', label: 'Bodyweight only', desc: 'Home, no gear' },
                { v: 'dumbbells', label: 'Dumbbells / bands', desc: 'Home gym basics' },
                { v: 'full_gym', label: 'Full gym', desc: 'Barbells, machines, cables' },
              ]}
              value={d.equipment}
              onSelect={(v) => up({ equipment: v as Equipment })}
            />
          </Field>
          <Field label="Training days per week you can truly commit to" hint="Pick the number that survives your worst week, not your best">
            <ChoiceRow
              options={[2, 3, 4, 5, 6].map((n) => ({ v: String(n), label: `${n} days` }))}
              value={String(d.daysPerWeek)}
              onSelect={(v) => up({ daysPerWeek: Number(v) })}
            />
          </Field>
          <Field label="Minutes per session">
            <ChoiceRow
              options={[30, 45, 60, 90].map((n) => ({ v: String(n), label: `${n} min` }))}
              value={String(d.minutesPerSession)}
              onSelect={(v) => up({ minutesPerSession: Number(v) })}
            />
          </Field>
        </>
      )}

      {step === 4 && (
        <>
          <Field label="Average sleep per night (hours)">
            <input type="number" step="0.5" value={d.sleepHours} onChange={(e) => up({ sleepHours: e.target.value })} />
          </Field>
          <Field label="Stress level (typical week)">
            <ChoiceRow
              options={[
                { v: 'low', label: 'Low' },
                { v: 'moderate', label: 'Moderate' },
                { v: 'high', label: 'High' },
              ]}
              value={d.stressLevel}
              onSelect={(v) => up({ stressLevel: v as StressLevel })}
            />
          </Field>
          <Field label="Daily activity outside training">
            <ChoiceRow
              options={[
                { v: 'sedentary', label: 'Sedentary', desc: 'Desk job, little walking' },
                { v: 'light', label: 'Light', desc: 'Some walking daily' },
                { v: 'moderate', label: 'Moderate', desc: 'On feet a lot' },
                { v: 'active', label: 'Active', desc: 'Physical job' },
                { v: 'very_active', label: 'Very active', desc: 'Heavy labor / athlete' },
              ]}
              value={d.activityLevel}
              onSelect={(v) => up({ activityLevel: v as ActivityLevel })}
            />
          </Field>
          <Field label="Which of these sound like you?" hint="Honesty here powers your Habit Builder">
            <MultiChoice
              options={[
                { v: 'allOrNothing', label: 'I go all-in, then quit after a slip' },
                { v: 'timeCrunched', label: 'My schedule is packed / unpredictable' },
                { v: 'travelsOften', label: 'I travel often' },
                { v: 'eveningSnacker', label: 'Evenings are my snacking danger zone' },
                { v: 'deskJob', label: 'I sit most of the day' },
                { v: 'trainsAlone', label: 'No training partner or accountability' },
              ]}
              values={Object.entries(d.lifestyle)
                .filter(([, v]) => v)
                .map(([k]) => k)}
              onToggle={(k) =>
                up({ lifestyle: { ...d.lifestyle, [k]: !d.lifestyle[k as keyof LifestyleFlags] } })
              }
            />
          </Field>
        </>
      )}

      {step === 5 && (
        <>
          <Field label="Dietary preference">
            <ChoiceRow
              options={[
                { v: 'omnivore', label: 'Omnivore' },
                { v: 'vegetarian', label: 'Vegetarian' },
                { v: 'vegan', label: 'Vegan' },
              ]}
              value={d.dietPref}
              onSelect={(v) => up({ dietPref: v as DietPref })}
            />
          </Field>
          <Field label="Meals per day you prefer">
            <ChoiceRow
              options={[2, 3, 4, 5].map((n) => ({ v: String(n), label: `${n} meals` }))}
              value={String(d.mealsPerDay)}
              onSelect={(v) => up({ mealsPerDay: Number(v) })}
            />
          </Field>
          <div className="banner info">
            That’s everything a coach needs. Your blueprint, roadmap, nutrition plan, fat-loss strategy
            and habit system are generated the moment you finish — all numbers cite their research.
          </div>
        </>
      )}

      <div className="wizard-nav">
        <button className="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button className="primary" onClick={() => setStep((s) => s + 1)} disabled={!stepValid()}>
            Next
          </button>
        ) : (
          <button className="primary" onClick={finish} disabled={!stepValid()}>
            Create my plan
          </button>
        )}
      </div>
    </div>
  )
}

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {hint && <div className="hint">{hint}</div>}
    </div>
  )
}

function ChoiceRow({
  options,
  value,
  onSelect,
}: {
  options: { v: string; label: string; desc?: string }[]
  value: string
  onSelect: (v: string) => void
}) {
  return (
    <div className="choice-grid">
      {options.map((o) => (
        <button key={o.v} type="button" className={`choice ${value === o.v ? 'selected' : ''}`} onClick={() => onSelect(o.v)}>
          {o.label}
          {o.desc && <span className="desc">{o.desc}</span>}
        </button>
      ))}
    </div>
  )
}

function MultiChoice({
  options,
  values,
  onToggle,
}: {
  options: { v: string; label: string }[]
  values: string[]
  onToggle: (v: string) => void
}) {
  return (
    <div className="choice-grid">
      {options.map((o) => (
        <button key={o.v} type="button" className={`choice ${values.includes(o.v) ? 'selected' : ''}`} onClick={() => onToggle(o.v)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}
