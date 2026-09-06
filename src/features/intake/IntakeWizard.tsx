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
import { tr } from '../../i18n'

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

const STEP_COUNT = 6

function stepName(step: number): string {
  return [
    tr('About you', 'Om dig'),
    tr('Your goal', 'Ditt mål'),
    tr('Health screen', 'Hälsokoll'),
    tr('Training setup', 'Träningsupplägg'),
    tr('Lifestyle', 'Livsstil'),
    tr('Diet', 'Kost'),
  ][step]
}

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
      name: d.name.trim() || tr('Athlete', 'Atlet'),
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
      <h1>{tr('Let’s build your fitness system', 'Nu bygger vi ditt träningssystem')}</h1>
      <p className="muted">
        {tr(
          'A real coach interviews before prescribing. Six quick steps — every answer changes your plan.',
          'En riktig coach intervjuar innan hen ordinerar. Sex snabba steg – varje svar påverkar din plan.',
        )}
      </p>
      <div className="progress-track" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={STEP_COUNT}>
        <div className="progress-fill" style={{ width: `${((step + 1) / STEP_COUNT) * 100}%` }} />
      </div>
      <h2>
        {tr(`Step ${step + 1} of ${STEP_COUNT}`, `Steg ${step + 1} av ${STEP_COUNT}`)}: {stepName(step)}
      </h2>

      {step === 0 && (
        <>
          <Field label={tr('Name (optional)', 'Namn (valfritt)')}>
            <input type="text" value={d.name} onChange={(e) => up({ name: e.target.value })} placeholder={tr('What should I call you?', 'Vad ska jag kalla dig?')} />
          </Field>
          <Field label={tr('Age', 'Ålder')} hint="16–90">
            <input type="number" value={d.age} onChange={(e) => up({ age: e.target.value })} placeholder={tr('e.g. 35', 't.ex. 35')} />
          </Field>
          <Field label={tr('Sex (for metabolic calculation)', 'Kön (för ämnesomsättningsberäkning)')}>
            <ChoiceRow
              options={[
                { v: 'male', label: tr('Male', 'Man') },
                { v: 'female', label: tr('Female', 'Kvinna') },
              ]}
              value={d.sex}
              onSelect={(v) => up({ sex: v as Sex })}
            />
          </Field>
          <Field label={tr('Height (cm)', 'Längd (cm)')}>
            <input type="number" value={d.heightCm} onChange={(e) => up({ heightCm: e.target.value })} placeholder={tr('e.g. 180', 't.ex. 180')} />
          </Field>
          <Field label={tr('Weight (kg)', 'Vikt (kg)')}>
            <input type="number" value={d.weightKg} onChange={(e) => up({ weightKg: e.target.value })} placeholder={tr('e.g. 85', 't.ex. 85')} />
          </Field>
          <Field
            label={tr('Body fat % (optional)', 'Kroppsfett % (valfritt)')}
            hint={tr('Skip if unknown — an estimate from a scale or photos is fine', 'Hoppa över om du inte vet – en uppskattning från våg eller foton duger')}
          >
            <input type="number" value={d.bodyFatPct} onChange={(e) => up({ bodyFatPct: e.target.value })} placeholder={tr('e.g. 22', 't.ex. 22')} />
          </Field>
        </>
      )}

      {step === 1 && (
        <>
          <Field label={tr('Primary goal', 'Huvudmål')}>
            <ChoiceRow
              options={[
                { v: 'fat_loss', label: tr('Lose fat', 'Gå ner i fett'), desc: tr('Drop fat, keep muscle', 'Tappa fett, behåll muskler') },
                { v: 'muscle_gain', label: tr('Build muscle', 'Bygga muskler'), desc: tr('Gain lean size & strength', 'Mer muskelmassa & styrka') },
                { v: 'recomp', label: tr('Recomposition', 'Recomp'), desc: tr('Same weight, better body', 'Samma vikt, bättre kropp') },
                { v: 'general_fitness', label: tr('General fitness', 'Allmän hälsa'), desc: tr('Health, energy, longevity', 'Hälsa, energi, långt liv') },
              ]}
              value={d.goal}
              onSelect={(v) => up({ goal: v as Goal })}
            />
          </Field>
          {(d.goal === 'fat_loss' || d.goal === 'muscle_gain') && (
            <Field label={tr('Goal weight (kg, optional)', 'Målvikt (kg, valfritt)')} hint={tr('Used to project a realistic timeline', 'Används för att räkna fram en realistisk tidsplan')}>
              <input type="number" value={d.goalWeightKg} onChange={(e) => up({ goalWeightKg: e.target.value })} placeholder={tr('e.g. 78', 't.ex. 78')} />
            </Field>
          )}
          <Field label={tr('Training experience', 'Träningsvana')}>
            <ChoiceRow
              options={[
                { v: 'beginner', label: tr('Beginner', 'Nybörjare'), desc: tr('< 1 year consistent lifting', '< 1 år regelbunden styrketräning') },
                { v: 'intermediate', label: tr('Intermediate', 'Medel'), desc: tr('1–3 years', '1–3 år') },
                { v: 'advanced', label: tr('Advanced', 'Avancerad'), desc: tr('3+ years', '3+ år') },
              ]}
              value={d.fitnessLevel}
              onSelect={(v) => up({ fitnessLevel: v as FitnessLevel })}
            />
          </Field>
        </>
      )}

      {step === 2 && (
        <>
          <Field
            label={tr('Any of these medical conditions?', 'Har du något av dessa tillstånd?')}
            hint={tr('Select all that apply — they adjust the plan and its cautions', 'Välj alla som stämmer – de justerar planen och dess varningar')}
          >
            <MultiChoice
              options={[
                { v: 'hypertension', label: tr('High blood pressure', 'Högt blodtryck') },
                { v: 'diabetes', label: tr('Diabetes (1 or 2)', 'Diabetes (typ 1 eller 2)') },
                { v: 'heart_condition', label: tr('Heart condition', 'Hjärtsjukdom') },
                { v: 'asthma', label: tr('Asthma', 'Astma') },
                { v: 'pregnancy', label: tr('Pregnancy / postpartum', 'Graviditet / nyförlöst') },
                { v: 'other', label: tr('Other condition', 'Annat tillstånd') },
              ]}
              values={d.medicalConditions}
              onToggle={(v) =>
                up({
                  medicalConditions: toggle(d.medicalConditions, v as MedicalCondition),
                })
              }
            />
          </Field>
          <Field
            label={tr('Current injuries or painful joints?', 'Skador eller leder som gör ont just nu?')}
            hint={tr('Exercise selection will avoid loading these', 'Övningsvalet undviker att belasta dessa')}
          >
            <MultiChoice
              options={[
                { v: 'knee', label: tr('Knee', 'Knä') },
                { v: 'shoulder', label: tr('Shoulder', 'Axel') },
                { v: 'lower_back', label: tr('Lower back', 'Ländrygg') },
                { v: 'hip', label: tr('Hip', 'Höft') },
                { v: 'wrist_elbow', label: tr('Wrist / elbow', 'Handled / armbåge') },
                { v: 'ankle', label: tr('Ankle', 'Fotled') },
              ]}
              values={d.injuries}
              onToggle={(v) => up({ injuries: toggle(d.injuries, v as Injury) })}
            />
          </Field>
          {(d.medicalConditions.includes('heart_condition') || d.medicalConditions.includes('pregnancy')) && (
            <div className="banner warn">
              {tr(
                'With this condition, please get explicit clearance from your physician before starting — this app will keep prescriptions conservative, but it cannot replace that conversation.',
                'Med det här tillståndet – be din läkare om uttryckligt klartecken innan du börjar. Appen håller rekommendationerna försiktiga, men den kan inte ersätta det samtalet.',
              )}
            </div>
          )}
        </>
      )}

      {step === 3 && (
        <>
          <Field label={tr('Available equipment', 'Tillgänglig utrustning')}>
            <ChoiceRow
              options={[
                { v: 'none', label: tr('Bodyweight only', 'Bara kroppsvikt'), desc: tr('Home, no gear', 'Hemma, ingen utrustning') },
                { v: 'dumbbells', label: tr('Dumbbells / bands', 'Hantlar / gummiband'), desc: tr('Home gym basics', 'Enkelt hemmagym') },
                { v: 'full_gym', label: tr('Full gym', 'Fullt gym'), desc: tr('Barbells, machines, cables', 'Skivstänger, maskiner, kablar') },
              ]}
              value={d.equipment}
              onSelect={(v) => up({ equipment: v as Equipment })}
            />
          </Field>
          <Field
            label={tr('Training days per week you can truly commit to', 'Träningsdagar per vecka du verkligen kan hålla')}
            hint={tr('Pick the number that survives your worst week, not your best', 'Välj antalet som håller din sämsta vecka, inte din bästa')}
          >
            <ChoiceRow
              options={[2, 3, 4, 5, 6].map((n) => ({ v: String(n), label: tr(`${n} days`, `${n} dagar`) }))}
              value={String(d.daysPerWeek)}
              onSelect={(v) => up({ daysPerWeek: Number(v) })}
            />
          </Field>
          <Field label={tr('Minutes per session', 'Minuter per pass')}>
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
          <Field label={tr('Average sleep per night (hours)', 'Sömn per natt i snitt (timmar)')}>
            <input type="number" step="0.5" value={d.sleepHours} onChange={(e) => up({ sleepHours: e.target.value })} />
          </Field>
          <Field label={tr('Stress level (typical week)', 'Stressnivå (en vanlig vecka)')}>
            <ChoiceRow
              options={[
                { v: 'low', label: tr('Low', 'Låg') },
                { v: 'moderate', label: tr('Moderate', 'Måttlig') },
                { v: 'high', label: tr('High', 'Hög') },
              ]}
              value={d.stressLevel}
              onSelect={(v) => up({ stressLevel: v as StressLevel })}
            />
          </Field>
          <Field label={tr('Daily activity outside training', 'Daglig aktivitet utöver träningen')}>
            <ChoiceRow
              options={[
                { v: 'sedentary', label: tr('Sedentary', 'Stillasittande'), desc: tr('Desk job, little walking', 'Kontorsjobb, går lite') },
                { v: 'light', label: tr('Light', 'Lätt'), desc: tr('Some walking daily', 'Går en del varje dag') },
                { v: 'moderate', label: tr('Moderate', 'Måttlig'), desc: tr('On feet a lot', 'På fötterna mycket') },
                { v: 'active', label: tr('Active', 'Aktiv'), desc: tr('Physical job', 'Fysiskt jobb') },
                { v: 'very_active', label: tr('Very active', 'Mycket aktiv'), desc: tr('Heavy labor / athlete', 'Tungt kroppsarbete / idrottare') },
              ]}
              value={d.activityLevel}
              onSelect={(v) => up({ activityLevel: v as ActivityLevel })}
            />
          </Field>
          <Field label={tr('Which of these sound like you?', 'Vilka av dessa stämmer på dig?')} hint={tr('Honesty here powers your Habit Builder', 'Ärlighet här driver din vanebyggare')}>
            <MultiChoice
              options={[
                { v: 'allOrNothing', label: tr('I go all-in, then quit after a slip', 'Jag kör allt eller inget, sen ger jag upp efter en miss') },
                { v: 'timeCrunched', label: tr('My schedule is packed / unpredictable', 'Mitt schema är fullt / oförutsägbart') },
                { v: 'travelsOften', label: tr('I travel often', 'Jag reser ofta') },
                { v: 'eveningSnacker', label: tr('Evenings are my snacking danger zone', 'Kvällarna är min farozon för småätande') },
                { v: 'deskJob', label: tr('I sit most of the day', 'Jag sitter större delen av dagen') },
                { v: 'trainsAlone', label: tr('No training partner or accountability', 'Ingen träningskompis eller någon som håller mig ansvarig') },
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
          <Field label={tr('Dietary preference', 'Kostpreferens')}>
            <ChoiceRow
              options={[
                { v: 'omnivore', label: tr('Omnivore', 'Allätare') },
                { v: 'vegetarian', label: tr('Vegetarian', 'Vegetarian') },
                { v: 'vegan', label: tr('Vegan', 'Vegan') },
              ]}
              value={d.dietPref}
              onSelect={(v) => up({ dietPref: v as DietPref })}
            />
          </Field>
          <Field label={tr('Meals per day you prefer', 'Måltider per dag du föredrar')}>
            <ChoiceRow
              options={[2, 3, 4, 5].map((n) => ({ v: String(n), label: tr(`${n} meals`, `${n} måltider`) }))}
              value={String(d.mealsPerDay)}
              onSelect={(v) => up({ mealsPerDay: Number(v) })}
            />
          </Field>
          <div className="banner info">
            {tr(
              'That’s everything a coach needs. Your blueprint, roadmap, nutrition plan, fat-loss strategy and habit system are generated the moment you finish — all numbers cite their research.',
              'Det är allt en coach behöver. Din plan, vägkarta, kostplan, fettförbränningsstrategi och ditt vanesystem skapas i samma stund som du är klar – alla siffror hänvisar till sin forskning.',
            )}
          </div>
        </>
      )}

      <div className="wizard-nav">
        <button className="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          {tr('Back', 'Tillbaka')}
        </button>
        {step < STEP_COUNT - 1 ? (
          <button className="primary" onClick={() => setStep((s) => s + 1)} disabled={!stepValid()}>
            {tr('Next', 'Nästa')}
          </button>
        ) : (
          <button className="primary" onClick={finish} disabled={!stepValid()}>
            {tr('Create my plan', 'Skapa min plan')}
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
