import type {
  Equipment,
  ExercisePrescription,
  Injury,
  Profile,
  WorkoutProgram,
  WorkoutSession,
} from './types'

/**
 * Movement-pattern based program builder.
 * Each pattern has equipment variants and injury-aware substitutions, so the
 * generated program respects what the user owns and what hurts.
 */

export type Pattern =
  | 'squat'
  | 'hinge'
  | 'lunge'
  | 'horizontal_push'
  | 'vertical_push'
  | 'horizontal_pull'
  | 'vertical_pull'
  | 'core'
  | 'carry_or_calf'

export interface ExerciseOption {
  name: string
  equipment: Equipment[]
  avoidWith: Injury[]
}

/** All exercises usable with the given equipment, flagged if they load an injured area. */
export function exerciseLibrary(
  equipment: Equipment,
  injuries: Injury[],
): { name: string; pattern: Pattern; flagged: boolean }[] {
  const out: { name: string; pattern: Pattern; flagged: boolean }[] = []
  for (const [pattern, options] of Object.entries(EXERCISES) as [Pattern, ExerciseOption[]][]) {
    for (const o of options) {
      if (!o.equipment.includes(equipment)) continue
      out.push({ name: o.name, pattern, flagged: o.avoidWith.some((i) => injuries.includes(i)) })
    }
  }
  return out
}

export const EXERCISES: Record<Pattern, ExerciseOption[]> = {
  squat: [
    { name: 'Barbell back squat', equipment: ['full_gym'], avoidWith: ['knee', 'lower_back', 'hip'] },
    { name: 'Goblet squat', equipment: ['dumbbells', 'full_gym'], avoidWith: ['knee', 'hip'] },
    { name: 'Leg press', equipment: ['full_gym'], avoidWith: ['knee'] },
    { name: 'Box squat to bench', equipment: ['none', 'dumbbells'], avoidWith: [] },
    { name: 'Bodyweight squat (tempo)', equipment: ['none'], avoidWith: ['knee'] },
  ],
  hinge: [
    { name: 'Romanian deadlift (barbell)', equipment: ['full_gym'], avoidWith: ['lower_back'] },
    { name: 'Romanian deadlift (dumbbell)', equipment: ['dumbbells'], avoidWith: ['lower_back'] },
    { name: 'Hip thrust / glute bridge', equipment: ['none', 'dumbbells', 'full_gym'], avoidWith: [] },
    { name: 'Back extension (45°)', equipment: ['full_gym'], avoidWith: [] },
  ],
  lunge: [
    { name: 'Walking lunge', equipment: ['none', 'dumbbells', 'full_gym'], avoidWith: ['knee', 'ankle'] },
    { name: 'Bulgarian split squat', equipment: ['none', 'dumbbells', 'full_gym'], avoidWith: ['knee', 'hip'] },
    { name: 'Step-up (low box)', equipment: ['none', 'dumbbells', 'full_gym'], avoidWith: ['ankle'] },
    { name: 'Glute bridge march', equipment: ['none'], avoidWith: [] },
  ],
  horizontal_push: [
    { name: 'Barbell bench press', equipment: ['full_gym'], avoidWith: ['shoulder', 'wrist_elbow'] },
    { name: 'Dumbbell bench press', equipment: ['dumbbells', 'full_gym'], avoidWith: ['shoulder'] },
    { name: 'Push-up', equipment: ['none', 'dumbbells'], avoidWith: ['wrist_elbow', 'shoulder'] },
    { name: 'Machine chest press', equipment: ['full_gym'], avoidWith: [] },
    { name: 'Incline push-up (hands elevated)', equipment: ['none'], avoidWith: [] },
  ],
  vertical_push: [
    { name: 'Overhead press (barbell)', equipment: ['full_gym'], avoidWith: ['shoulder', 'lower_back'] },
    { name: 'Seated dumbbell shoulder press', equipment: ['dumbbells', 'full_gym'], avoidWith: ['shoulder'] },
    { name: 'Pike push-up', equipment: ['none'], avoidWith: ['shoulder', 'wrist_elbow'] },
    { name: 'Landmine press', equipment: ['full_gym'], avoidWith: [] },
    { name: 'Lateral raise (light)', equipment: ['dumbbells', 'full_gym'], avoidWith: [] },
    { name: 'Wall slide + band raise', equipment: ['none'], avoidWith: [] },
  ],
  horizontal_pull: [
    { name: 'Barbell row', equipment: ['full_gym'], avoidWith: ['lower_back'] },
    { name: 'One-arm dumbbell row', equipment: ['dumbbells', 'full_gym'], avoidWith: [] },
    { name: 'Seated cable row', equipment: ['full_gym'], avoidWith: [] },
    { name: 'Inverted row (table/rings)', equipment: ['none'], avoidWith: [] },
  ],
  vertical_pull: [
    { name: 'Pull-up / assisted pull-up', equipment: ['full_gym'], avoidWith: ['shoulder'] },
    { name: 'Lat pulldown', equipment: ['full_gym'], avoidWith: [] },
    { name: 'Dumbbell pullover', equipment: ['dumbbells'], avoidWith: ['shoulder'] },
    { name: 'Doorframe row / towel row', equipment: ['none'], avoidWith: [] },
  ],
  core: [
    { name: 'Plank', equipment: ['none', 'dumbbells', 'full_gym'], avoidWith: [] },
    { name: 'Dead bug', equipment: ['none', 'dumbbells', 'full_gym'], avoidWith: [] },
    { name: 'Pallof press (cable/band)', equipment: ['full_gym'], avoidWith: [] },
    { name: 'Side plank', equipment: ['none', 'dumbbells'], avoidWith: ['shoulder'] },
  ],
  carry_or_calf: [
    { name: "Farmer's carry", equipment: ['dumbbells', 'full_gym'], avoidWith: ['wrist_elbow'] },
    { name: 'Standing calf raise', equipment: ['none', 'dumbbells', 'full_gym'], avoidWith: ['ankle'] },
  ],
}

export function pickExercise(pattern: Pattern, equipment: Equipment, injuries: Injury[]): string {
  const options = EXERCISES[pattern]
  const usable = options.filter(
    (o) => o.equipment.includes(equipment) && !o.avoidWith.some((i) => injuries.includes(i)),
  )
  if (usable.length > 0) return usable[0].name
  // Fall back to any equipment-compatible option, flagged for caution.
  const fallback = options.find((o) => o.equipment.includes(equipment))
  return fallback ? `${fallback.name} (light, pain-free range only)` : 'Coach-selected alternative'
}

interface SessionTemplate {
  name: string
  focus: string
  patterns: Pattern[]
}

function splitFor(daysPerWeek: number): { splitName: string; templates: SessionTemplate[] } {
  const fullBody = (n: number): SessionTemplate => ({
    name: `Full Body ${String.fromCharCode(64 + n)}`,
    focus: 'Whole-body strength',
    patterns:
      n % 2 === 1
        ? ['squat', 'horizontal_push', 'horizontal_pull', 'hinge', 'core']
        : ['hinge', 'vertical_push', 'vertical_pull', 'lunge', 'core'],
  })
  const upper: SessionTemplate = {
    name: 'Upper Body',
    focus: 'Chest, back, shoulders, arms',
    patterns: ['horizontal_push', 'horizontal_pull', 'vertical_push', 'vertical_pull', 'core'],
  }
  const lower: SessionTemplate = {
    name: 'Lower Body',
    focus: 'Legs, glutes, core',
    patterns: ['squat', 'hinge', 'lunge', 'carry_or_calf', 'core'],
  }
  const push: SessionTemplate = {
    name: 'Push',
    focus: 'Chest, shoulders, triceps',
    patterns: ['horizontal_push', 'vertical_push', 'horizontal_push', 'core'],
  }
  const pull: SessionTemplate = {
    name: 'Pull',
    focus: 'Back, biceps, rear delts',
    patterns: ['vertical_pull', 'horizontal_pull', 'horizontal_pull', 'core'],
  }
  const legs: SessionTemplate = {
    name: 'Legs',
    focus: 'Quads, hamstrings, glutes, calves',
    patterns: ['squat', 'hinge', 'lunge', 'carry_or_calf', 'core'],
  }

  if (daysPerWeek <= 3) {
    return {
      splitName: `Full body ×${Math.max(2, daysPerWeek)}`,
      templates: Array.from({ length: Math.max(2, daysPerWeek) }, (_, i) => fullBody(i + 1)),
    }
  }
  if (daysPerWeek === 4) {
    return {
      splitName: 'Upper / Lower ×2',
      templates: [upper, lower, { ...upper, name: 'Upper Body 2' }, { ...lower, name: 'Lower Body 2' }],
    }
  }
  if (daysPerWeek === 5) {
    return {
      splitName: 'Upper / Lower + Push / Pull / Legs',
      templates: [upper, lower, push, pull, legs],
    }
  }
  return {
    splitName: 'Push / Pull / Legs ×2',
    templates: [push, pull, legs, { ...push, name: 'Push 2' }, { ...pull, name: 'Pull 2' }, { ...legs, name: 'Legs 2' }],
  }
}

function prescriptionFor(profile: Profile, pattern: Pattern, exerciseName: string): ExercisePrescription {
  const isCompound = ['squat', 'hinge', 'horizontal_push', 'vertical_push', 'horizontal_pull', 'vertical_pull'].includes(pattern)
  const short = profile.minutesPerSession < 45
  const sets = pattern === 'core' || pattern === 'carry_or_calf' ? 2 : short ? 2 : 3
  const reps =
    pattern === 'core'
      ? '30–45 s or 8–12 slow reps'
      : isCompound && profile.fitnessLevel !== 'beginner'
        ? '5–8'
        : '8–12'
  const rpe = profile.fitnessLevel === 'beginner' ? 'RPE 6–7 (2–4 reps left in the tank)' : 'RPE 7–8 (1–3 reps in reserve)'
  return { name: exerciseName, sets, reps, rpe }
}

const WARMUP = [
  '3–5 min easy cardio to raise body temperature',
  'Dynamic drills: leg swings, arm circles, hip openers (5 min)',
  'First exercise: 2 light ramp-up sets before working sets',
]

const MOBILITY: Record<string, string[]> = {
  lower: ['Couch stretch 1 min/side', '90/90 hip switch ×10', 'Ankle rocks ×10/side'],
  upper: ['Thoracic extension on foam roller 1 min', 'Doorway pec stretch 45 s/side', 'Band pull-aparts ×15'],
  full: ['World’s greatest stretch ×5/side', 'Cat–camel ×10', 'Deep squat hold 1 min'],
}

function mobilityFor(sessionName: string): string[] {
  const n = sessionName.toLowerCase()
  if (n.includes('lower') || n.includes('legs')) return MOBILITY.lower
  if (n.includes('upper') || n.includes('push') || n.includes('pull')) return MOBILITY.upper
  return MOBILITY.full
}

export interface ProgramPreset {
  id: string
  name: string
  description: string
  overrides: Partial<Pick<Profile, 'daysPerWeek' | 'equipment' | 'minutesPerSession'>>
}

/** Ready-made templates; each is generated through the same injury/equipment-aware builder. */
export const PROGRAM_PRESETS: ProgramPreset[] = [
  { id: 'recommended', name: 'Recommended for you', description: 'Built from your interview answers', overrides: {} },
  { id: 'fullbody3', name: 'Full Body ×3', description: 'The classic 3-day plan — best value per gym hour', overrides: { daysPerWeek: 3 } },
  { id: 'upperlower4', name: 'Upper / Lower ×4', description: '4 days, more volume per muscle', overrides: { daysPerWeek: 4 } },
  { id: 'ppl6', name: 'Push / Pull / Legs ×6', description: '6 days for experienced lifters', overrides: { daysPerWeek: 6 } },
  { id: 'minimal30', name: '30-min Express', description: 'Short sessions for packed weeks', overrides: { minutesPerSession: 30 } },
  { id: 'travel', name: 'Bodyweight Travel', description: 'No equipment — hotel room friendly', overrides: { equipment: 'none' } },
]

export function buildPresetProgram(profile: Profile, presetId: string): WorkoutProgram {
  const preset = PROGRAM_PRESETS.find((p) => p.id === presetId) ?? PROGRAM_PRESETS[0]
  return buildProgram({ ...profile, ...preset.overrides })
}

/** HIIT is contraindicated (or needs medical sign-off) for these conditions — prescribe zone 2 instead. */
export function hiitSafe(profile: Profile): boolean {
  const flags: Profile['medicalConditions'] = ['heart_condition', 'hypertension', 'pregnancy']
  return !profile.medicalConditions.some((c) => flags.includes(c))
}

export function buildCardio(profile: Profile) {
  const zone2Sessions = profile.goal === 'fat_loss' ? 2 : 1
  const stepsTarget = profile.goal === 'fat_loss' ? 9000 : 7500
  const wantsHiit = profile.goal === 'fat_loss' || profile.goal === 'general_fitness'
  const hiitSessionsPerWeek = wantsHiit && hiitSafe(profile) ? 1 : 0
  return {
    sessionsPerWeek: zone2Sessions,
    description: `${zone2Sessions}× 20–30 min zone 2 (you can hold a conversation) — walk, cycle, row or swim. Target 150+ min of total weekly moderate activity (WHO guideline).`,
    stepsTarget,
    hiitSessionsPerWeek,
    hiitDescription:
      hiitSessionsPerWeek > 0
        ? '1× 15–20 min HIIT: 6–8 rounds of 30 s hard / 90 s easy (bike, rower, hill walks). Time-efficient VO₂max work — but never on legs day, and only when sleep allows.'
        : profile.medicalConditions.length > 0 && (profile.goal === 'fat_loss' || profile.goal === 'general_fitness')
          ? 'HIIT is skipped due to your health screen — extra zone 2 delivers the same fat-loss result with less cardiovascular strain. Revisit with your physician’s clearance.'
          : 'No HIIT prescribed for this goal — steps and zone 2 cover your conditioning; strength training stays the priority.',
  }
}

export function buildProgram(profile: Profile): WorkoutProgram {
  const { splitName, templates } = splitFor(profile.daysPerWeek)
  const sessions: WorkoutSession[] = templates.map((t) => ({
    name: t.name,
    focus: t.focus,
    warmup: WARMUP,
    exercises: t.patterns.map((p) =>
      prescriptionFor(profile, p, pickExercise(p, profile.equipment, profile.injuries)),
    ),
    mobilityFinisher: mobilityFor(t.name),
  }))

  const cardio = buildCardio(profile)

  const progressionRules = [
    'Double progression: when you hit the top of the rep range on all sets with good form, add weight (2.5–5%) or 1 rep next time.',
    'Log every session. Progressive overload — doing slightly more over time — is the entire engine of results.',
    'A grinding, form-breaking rep counts as a failed rep. Stay 1–3 reps shy of failure on most sets.',
  ]

  const cautions: string[] = []
  if (profile.injuries.length > 0) {
    cautions.push(
      `Exercise selection avoids loading your reported ${profile.injuries.map((i) => i.replace('_', ' ')).join(', ')} issue(s). Work in a pain-free range; pain above 3/10 that lingers next day means back off and see a physio.`,
    )
  }
  if (profile.medicalConditions.length > 0) {
    cautions.push(
      'You flagged a medical condition — get clearance from your physician before starting, and stop any session that causes chest pain, dizziness or unusual shortness of breath.',
    )
  }
  if (profile.medicalConditions.includes('hypertension')) {
    cautions.push('With hypertension: avoid breath-holding (Valsalva) on heavy lifts — keep breathing, keep loads moderate, rest fully between sets.')
  }

  return {
    splitName,
    sessions,
    cardio,
    progressionRules,
    deloadRule:
      'Every 5th week, or whenever sleep/joints/motivation tank: cut sets in half and keep weights at ~70% for one week. Deloads are when adaptations consolidate.',
    cautions,
  }
}
