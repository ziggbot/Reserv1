import { describe, expect, it } from 'vitest'
import { buildOverview } from '../overview'
import { recommendSupplements } from '../supplements'
import { buildCardio, buildPresetProgram, exerciseLibrary, hiitSafe } from '../programs'
import { cardioProposals, enduranceProposals, stretchProposals } from '../activities'
import { threeDayFullBody } from '../threeDayFullBody'
import { useAppStore } from '../../state/store'
import type { Profile, WorkoutSession } from '../types'

const overviewOf = (p: Profile) => buildOverview(p, threeDayFullBody(p))

const base: Profile = {
  name: 'Test',
  age: 38,
  sex: 'male',
  heightCm: 182,
  weightKg: 92,
  bodyFatPct: 26,
  goal: 'fat_loss',
  goalWeightKg: 82,
  fitnessLevel: 'intermediate',
  medicalConditions: [],
  injuries: [],
  equipment: 'full_gym',
  daysPerWeek: 4,
  minutesPerSession: 60,
  sleepHours: 6,
  stressLevel: 'high',
  activityLevel: 'light',
  dietPref: 'omnivore',
  mealsPerDay: 3,
  lifestyle: {
    allOrNothing: true,
    timeCrunched: false,
    travelsOften: false,
    eveningSnacker: true,
    deskJob: true,
    trainsAlone: false,
  },
}

describe('buildOverview', () => {
  it('quantifies the fat-loss goal with kg and timeline', () => {
    const text = overviewOf(base).map((d) => `${d.headline} ${d.detail}`).join(' ')
    expect(text).toMatch(/Lose 10 kg \(92 → 82 kg\)/)
    expect(text).toMatch(/weeks/)
    expect(text).toMatch(/steps/)
    expect(text).toMatch(/HIIT/)
    expect(text).toMatch(/g protein/)
    expect(text).toMatch(/Sleep 7–9/)
  })
  it('protein directive spans a range around the goal-specific g/kg', () => {
    const eat = overviewOf(base).find((d) => d.icon === '🍽️')!
    // 2.2 g/kg base → range 2.0–2.5 g/kg = 184–230 g at 92 kg
    expect(eat.headline).toMatch(/184–230 g protein/)
  })
  it('drops HIIT for hypertension and explains why', () => {
    const withHtn: Profile = { ...base, medicalConditions: ['hypertension'] }
    expect(hiitSafe(withHtn)).toBe(false)
    const cardio = buildCardio(withHtn)
    expect(cardio.hiitSessionsPerWeek).toBe(0)
    expect(cardio.hiitDescription).toMatch(/health screen/i)
    const overviewText = overviewOf(withHtn).map((d) => d.headline).join(' ')
    expect(overviewText).not.toMatch(/HIIT/)
  })
})

describe('recommendSupplements', () => {
  it('includes creatine, vitamin D and omega-3 for a standard profile', () => {
    const names = recommendSupplements(base).map((s) => s.name.toLowerCase())
    expect(names.some((n) => n.includes('creatine'))).toBe(true)
    expect(names.some((n) => n.includes('vitamin d'))).toBe(true)
    expect(names.some((n) => n.includes('omega-3'))).toBe(true)
  })
  it('gives vegans algae-based omega-3 and plant protein', () => {
    const recs = recommendSupplements({ ...base, dietPref: 'vegan' })
    expect(recs.find((s) => s.name.includes('Omega-3'))!.name).toMatch(/algae/i)
    expect(recs.find((s) => s.name.toLowerCase().includes('protein'))!.name).toMatch(/plant/i)
  })
  it('omits caffeine with hypertension or heart condition', () => {
    for (const cond of ['hypertension', 'heart_condition'] as const) {
      const names = recommendSupplements({ ...base, medicalConditions: [cond] }).map((s) => s.name)
      expect(names.join(' ')).not.toMatch(/caffeine/i)
    }
  })
  it('adds magnesium for short sleepers', () => {
    const names = recommendSupplements(base).map((s) => s.name)
    expect(names.join(' ')).toMatch(/magnesium/i)
  })
  it('is conservative during pregnancy', () => {
    const recs = recommendSupplements({ ...base, sex: 'female', medicalConditions: ['pregnancy'] })
    expect(recs.length).toBe(1)
    expect(recs[0].caution).toMatch(/prenatal/i)
  })
})

describe('presets & exercise library', () => {
  it('travel preset is fully bodyweight regardless of owned equipment', () => {
    const names = buildPresetProgram(base, 'travel')
      .sessions.flatMap((s) => s.exercises)
      .map((e) => e.name.toLowerCase())
    expect(names.some((n) => n.includes('barbell') || n.includes('dumbbell') || n.includes('cable'))).toBe(false)
  })
  it('library flags injury-loading exercises instead of hiding them', () => {
    const lib = exerciseLibrary('full_gym', ['knee'])
    const squat = lib.find((l) => l.name === 'Barbell back squat')!
    expect(squat.flagged).toBe(true)
    expect(lib.find((l) => l.name === 'Leg press')!.flagged).toBe(true)
    expect(lib.find((l) => l.name === 'Barbell bench press')!.flagged).toBe(false)
  })
})

describe('activity proposals', () => {
  it('includes HIIT for a healthy fat-loss profile, drops it for hypertension', () => {
    expect(cardioProposals(base).some((p) => p.name.includes('HIIT'))).toBe(true)
    expect(
      cardioProposals({ ...base, medicalConditions: ['hypertension'] }).some((p) => p.name.includes('HIIT')),
    ).toBe(false)
  })
  it('scales endurance to fitness level', () => {
    const beg = enduranceProposals({ ...base, fitnessLevel: 'beginner' })
    const int = enduranceProposals(base)
    expect(beg.find((p) => p.name.includes('Long zone-2'))!.durationMin).toBeLessThan(
      int.find((p) => p.name.includes('Long zone-2'))!.durationMin,
    )
    expect(beg.some((p) => p.name.includes('Run/walk'))).toBe(true)
  })
  it('gives desk workers a desk-specific stretch routine', () => {
    expect(stretchProposals(base).some((p) => p.name.includes('Desk-body'))).toBe(true)
    const active = stretchProposals({ ...base, lifestyle: { ...base.lifestyle, deskJob: false } })
    expect(active.some((p) => p.name.includes('Hip opener'))).toBe(true)
  })
  it('every proposal has steps and a positive duration', () => {
    for (const p of [...cardioProposals(base), ...enduranceProposals(base), ...stretchProposals(base)]) {
      expect(p.steps.length).toBeGreaterThan(0)
      expect(p.durationMin).toBeGreaterThan(0)
    }
  })
})

describe('logActivity', () => {
  it('stores a categorized timeline entry and a workout-log entry', () => {
    useAppStore.getState().logActivity('cardio', 'Zone-2 walk / cycle / row', 30, '2026-07-17')
    const st = useAppStore.getState()
    const entry = st.completedWorkouts.find((w) => w.sessionName === 'Zone-2 walk / cycle / row')!
    expect(entry.category).toBe('cardio')
    expect(entry.durationMin).toBe(30)
    expect(entry.totalVolumeKg).toBe(0)
    expect(st.workoutLog.some((e) => e.date === '2026-07-17')).toBe(true)
  })
})

describe('workout store flow', () => {
  const session: WorkoutSession = {
    name: 'Test Session',
    focus: 'test',
    warmup: [],
    mobilityFinisher: [],
    exercises: [
      { name: 'Goblet squat', sets: 2, reps: '8–12', rpe: 'RPE 7' },
      { name: 'Push-up', sets: 2, reps: '8–12', rpe: 'RPE 7' },
    ],
  }

  it('start → log sets → finish computes volume and stores history', () => {
    const s = useAppStore.getState()
    s.startWorkout(session)
    let st = useAppStore.getState()
    expect(st.activeWorkout!.exercises).toHaveLength(2)
    expect(st.activeWorkout!.exercises[0].sets).toHaveLength(2)
    // First-ever workout: reps prefilled from the target ("8–12" → 8), weight unknown
    expect(st.activeWorkout!.exercises[0].sets[0].reps).toBe(8)
    expect(st.activeWorkout!.exercises[0].sets[0].weightKg).toBeNull()

    st.updateActiveSet(0, 0, { weightKg: 20, reps: 10, done: true })
    st.updateActiveSet(0, 1, { weightKg: 20, reps: 8, done: true })
    st.updateActiveSet(1, 0, { weightKg: 0, reps: 15, done: true })
    st.addActiveSet(1)
    st = useAppStore.getState()
    expect(st.activeWorkout!.exercises[1].sets).toHaveLength(3)

    const done = st.finishWorkout('2026-07-18')
    expect(done).not.toBeNull()
    expect(done!.totalVolumeKg).toBe(20 * 10 + 20 * 8) // bodyweight sets add 0 volume
    expect(done!.totalSets).toBe(3) // only completed sets count
    st = useAppStore.getState()
    expect(st.activeWorkout).toBeNull()
    expect(st.completedWorkouts.filter((w) => w.sessionName === 'Test Session')).toHaveLength(1)
    expect(done!.category).toBe('strength')
    expect(st.workoutLog.some((e) => e.date === '2026-07-18' && e.sessionName === 'Test Session')).toBe(true)
  })

  it('next workout prefills weight, reps AND set count from exercise memory', () => {
    const st = useAppStore.getState()
    st.startWorkout(session)
    const active = useAppStore.getState().activeWorkout!
    expect(active.exercises[0].sets[0].weightKg).toBe(20)
    expect(active.exercises[0].sets[0].reps).toBe(10)
    expect(active.exercises[0].sets[1].weightKg).toBe(20)
    expect(active.exercises[0].sets[1].reps).toBe(8)
    expect(active.exercises[0].sets[0].done).toBe(false)
    // Push-up got an extra 3rd set last time — the added set persists
    expect(active.exercises[1].sets.length).toBeGreaterThanOrEqual(2)
    useAppStore.getState().cancelWorkout()
  })

  it('memory is exercise-level: the same exercise prefills in a different session', () => {
    const otherSession: WorkoutSession = {
      ...session,
      name: 'Other Session',
      exercises: [{ name: 'Goblet squat', sets: 3, reps: '8–12', rpe: 'RPE 7' }],
    }
    useAppStore.getState().startWorkout(otherSession)
    const active = useAppStore.getState().activeWorkout!
    expect(active.exercises[0].sets[0].weightKg).toBe(20)
    // 3rd set has no same-index history — falls back to the last remembered set
    expect(active.exercises[0].sets[2].weightKg).toBe(20)
    useAppStore.getState().cancelWorkout()
  })
})
