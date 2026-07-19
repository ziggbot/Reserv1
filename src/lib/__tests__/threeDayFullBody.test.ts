import { describe, expect, it } from 'vitest'
import { defaultProgram, PROGRAM_SOURCE_URL, SEED_MEMORY, threeDayFullBody } from '../threeDayFullBody'
import { buildProgram } from '../programs'
import { useAppStore } from '../../state/store'
import type { Profile } from '../types'

const profile: Profile = {
  name: 'Peter',
  age: 38,
  sex: 'male',
  heightCm: 182,
  weightKg: 92,
  goal: 'fat_loss',
  goalWeightKg: 82,
  fitnessLevel: 'intermediate',
  medicalConditions: [],
  injuries: [],
  equipment: 'full_gym',
  daysPerWeek: 3,
  minutesPerSession: 60,
  sleepHours: 7,
  stressLevel: 'moderate',
  activityLevel: 'light',
  dietPref: 'omnivore',
  mealsPerDay: 3,
  lifestyle: {
    allOrNothing: false,
    timeCrunched: false,
    travelsOften: false,
    eveningSnacker: false,
    deskJob: true,
    trainsAlone: false,
  },
}

describe('threeDayFullBody program', () => {
  const program = threeDayFullBody(profile)

  it('has the three passes with the right exercises', () => {
    expect(program.splitName).toBe('3 Day Full Body')
    expect(program.sessions.map((s) => s.name)).toEqual([
      'Pass 1 — Ben',
      'Pass 2 — Bröst, axlar, triceps',
      'Pass 3 — Rygg, axlar, biceps',
    ])
    expect(program.sessions[0].exercises).toHaveLength(9)
    expect(program.sessions[1].exercises).toHaveLength(7)
    expect(program.sessions[2].exercises).toHaveLength(6)
  })

  it('every exercise carries a link to the source schedule', () => {
    for (const s of program.sessions) {
      for (const e of s.exercises) {
        expect(e.linkUrl).toBe(PROGRAM_SOURCE_URL)
      }
    }
  })

  it('keeps alternatives and machine numbers as notes', () => {
    const all = program.sessions.flatMap((s) => s.exercises)
    expect(all.find((e) => e.name === 'Marklyft')!.notes).toMatch(/kettlebell 3×20 @ 24/i)
    expect(all.find((e) => e.name === 'Lårcurl')!.notes).toMatch(/39/)
    expect(all.find((e) => e.name === 'Skivstångsrodd')!.notes).toMatch(/Hantelrodd/)
  })

  it('is the default program; customization overrides it', () => {
    expect(defaultProgram(profile, null).splitName).toBe('3 Day Full Body')
    const custom = buildProgram(profile)
    expect(defaultProgram(profile, custom)).toBe(custom)
  })

  it('surfaces health cautions like generated programs do', () => {
    const withHtn = threeDayFullBody({ ...profile, medicalConditions: ['hypertension'] })
    expect(withHtn.cautions.join(' ')).toMatch(/valsalva/i)
  })
})

describe('seed memory (last logged numbers only)', () => {
  it('holds the LAST progression entry per exercise', () => {
    expect(SEED_MEMORY['Knäböj'][0]).toEqual({ weightKg: 45, reps: 15 })
    expect(SEED_MEMORY['Bänkpress'][0]).toEqual({ weightKg: 40, reps: 12 })
    expect(SEED_MEMORY['Militärpress'][0]).toEqual({ weightKg: 17.5, reps: 12 })
    expect(SEED_MEMORY['Marklyft'][0]).toEqual({ weightKg: 40, reps: 12 })
    expect(SEED_MEMORY['Latsdrag / chins'][0]).toEqual({ weightKg: 40, reps: 15 })
    expect(SEED_MEMORY['Tricepsextension'][0]).toEqual({ weightKg: 12.5, reps: 12 })
  })

  it('prefills a fresh workout from the seed', () => {
    const pass2 = threeDayFullBody(profile).sessions[1]
    useAppStore.getState().startWorkout(pass2)
    const active = useAppStore.getState().activeWorkout!
    const bench = active.exercises.find((e) => e.name === 'Bänkpress')!
    expect(bench.sets[0]).toEqual({ weightKg: 40, reps: 12, done: false })
    expect(bench.linkUrl).toBe(PROGRAM_SOURCE_URL)
    useAppStore.getState().cancelWorkout()
  })

  it('real logged history overrides the seed', () => {
    const pass2 = threeDayFullBody(profile).sessions[1]
    const st = useAppStore.getState()
    st.startWorkout(pass2)
    st.updateActiveSet(0, 0, { weightKg: 42.5, reps: 12, done: true })
    st.finishWorkout('2026-07-19')
    useAppStore.getState().startWorkout(pass2)
    const bench = useAppStore.getState().activeWorkout!.exercises.find((e) => e.name === 'Bänkpress')!
    expect(bench.sets[0].weightKg).toBe(42.5)
    useAppStore.getState().cancelWorkout()
  })
})
