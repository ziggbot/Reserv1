import type { ExercisePrescription, Profile, WorkoutProgram, WorkoutSession } from './types'
import { buildCardio, buildCautions } from './programs'
import { recommendProgram } from './programMatrix'
import { tr } from '../i18n'

/**
 * The user's own "3 Day Full Body" program (based on svensktkosttillskott.se's
 * 3-day schedule), with their latest logged sets×reps@weight as seed defaults.
 * This is the default strength program; generated presets remain available.
 */

export const PROGRAM_SOURCE_URL = 'https://www.svensktkosttillskott.se/traningsschema-for-3-dagar-i-veckan'

const EFFORT = '1–2 reps in reserve'

function ex(name: string, sets: number, reps: string, notes?: string): ExercisePrescription {
  return { name, sets, reps, rpe: EFFORT, notes, linkUrl: PROGRAM_SOURCE_URL }
}

const WARMUP = [
  '3–5 min easy cardio to raise body temperature',
  'Dynamic drills: leg swings, arm circles, hip openers (5 min)',
  'First exercise: 2 light ramp-up sets before working sets',
]

const PASS_1: WorkoutSession = {
  name: 'Pass 1 — Ben',
  focus: 'Legs & core',
  warmup: WARMUP,
  exercises: [
    ex('Knäböj', 3, '15'),
    ex('Raka marklyft', 3, '15'),
    ex('Utfall', 3, '12/ben', 'Vikt: skiva'),
    ex('Step-ups', 3, '12/ben', 'Stor låda, utan vikt'),
    ex('Lårcurl', 3, '10', 'Maskin 39'),
    ex('Benspark', 3, '10', 'Maskin 42'),
    ex('Vadpress sittande', 3, '20'),
    ex('Knäböj maskin', 3, '15', 'Maskin 24'),
    ex('Plankan', 3, '30 s', 'Mage'),
  ],
  mobilityFinisher: ['3D-matta', 'Couch stretch 1 min/sida', '90/90 höftväxlingar ×10'],
}

const PASS_2: WorkoutSession = {
  name: 'Pass 2 — Bröst, axlar, triceps',
  focus: 'Chest, shoulders, triceps',
  warmup: WARMUP,
  exercises: [
    ex('Bänkpress', 3, '12'),
    ex('Militärpress', 3, '12'),
    ex('Lutande hantelpress', 3, '12', 'Vikt per hantel'),
    ex('Hantelflyes', 3, '12', 'Vikt per hantel'),
    ex('Sidolyft', 3, '12', 'Vikt per hantel'),
    ex('Tricepsextension', 3, '12'),
    ex('Armhävningar', 3, 'max', 'Valfri finisher'),
  ],
  mobilityFinisher: ['Doorway pec stretch 45 s/sida', 'Wall slides ×10', 'Band pull-aparts ×15'],
}

const PASS_3: WorkoutSession = {
  name: 'Pass 3 — Rygg, axlar, biceps',
  focus: 'Back, rear delts, biceps',
  warmup: WARMUP,
  exercises: [
    ex('Marklyft', 3, '12', 'Alt: Marklyft med kettlebell 3×20 @ 24 kg'),
    ex('Latsdrag / chins', 3, '15'),
    ex('Skivstångsrodd', 3, '15', 'Alt: Hantelrodd per arm 3×10 @ 18 kg'),
    ex('Face pulls', 3, '13'),
    ex('Omvända flyes', 3, '12', 'Vikt per hantel'),
    ex('Bicepscurl Z-stång', 3, '12', 'Alt: Hammercurl 3×12 @ 9 kg'),
  ],
  mobilityFinisher: ['Thoracic extension på foamroller 1 min', 'Child’s pose 1 min', 'Cat–camel ×10'],
}

export function threeDayFullBody(profile: Profile): WorkoutProgram {
  return {
    splitName: '3 Day Full Body',
    sessions: [PASS_1, PASS_2, PASS_3],
    cardio: buildCardio(profile),
    progressionRules: [
      tr(
        'Double progression: when you hit the top of the rep target on all sets with good form, add weight (2.5–5%) next time.',
        'Dubbel progression: när du når toppen av repsmålet på alla set med bra teknik, lägg på vikt (2,5–5 %) nästa gång.',
      ),
      tr(
        'Log every session — the app remembers your last weights and prefills them.',
        'Logga varje pass — appen kommer ihåg dina senaste vikter och fyller i dem åt dig.',
      ),
      tr(
        'A grinding, form-breaking rep counts as a failed rep. Stay 1–2 reps shy of failure on most sets.',
        'En rep som maler och där tekniken brister räknas som misslyckad. Håll dig 1–2 reps från failure på de flesta set.',
      ),
    ],
    deloadRule: tr(
      'Every 5th week, or whenever sleep/joints/motivation tank: cut sets in half and keep weights at ~70% for one week.',
      'Var 5:e vecka, eller när sömn/leder/motivation dyker: halvera antalet set och håll vikterna på ~70 % i en vecka.',
    ),
    cautions: buildCautions(profile),
  }
}

/**
 * Latest logged numbers per exercise (only the LAST entry of each progression),
 * used to prefill the workout logger until real in-app history exists.
 */
export const SEED_MEMORY: Record<string, { weightKg: number | null; reps: number | null }[]> = {
  // Pass 1 — Ben
  Knäböj: seed(45, 15),
  'Raka marklyft': seed(40, 15),
  Utfall: seed(10, 12),
  'Step-ups': seed(0, 12),
  Lårcurl: seed(31, 10),
  Benspark: seed(30, 10),
  'Vadpress sittande': seed(30, 20),
  'Knäböj maskin': seed(0, 15),
  Plankan: seed(0, 30), // reps = seconds
  // Pass 2 — Bröst, axlar, triceps
  Bänkpress: seed(40, 12),
  Militärpress: seed(17.5, 12),
  'Lutande hantelpress': seed(10, 12),
  Hantelflyes: seed(9, 12),
  Sidolyft: seed(6, 12),
  Tricepsextension: seed(12.5, 12),
  Armhävningar: seed(0, 12),
  // Pass 3 — Rygg, axlar, biceps
  Marklyft: seed(40, 12),
  'Latsdrag / chins': seed(40, 15),
  Skivstångsrodd: seed(30, 15),
  'Face pulls': seed(20, 13),
  'Omvända flyes': seed(6, 12),
  'Bicepscurl Z-stång': seed(8, 12),
}

function seed(weightKg: number, reps: number): { weightKg: number | null; reps: number | null }[] {
  return Array.from({ length: 3 }, () => ({ weightKg, reps }))
}

/** The strength program in effect: user customization wins, else the research-matrix recommendation. */
export function defaultProgram(profile: Profile, customProgram: WorkoutProgram | null): WorkoutProgram {
  return customProgram ?? recommendProgram(profile).program
}
