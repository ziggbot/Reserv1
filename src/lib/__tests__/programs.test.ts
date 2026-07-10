import { describe, expect, it } from 'vitest'
import { buildProgram, pickExercise } from '../programs'
import { buildRoadmap } from '../roadmap'
import { buildHabitPlan, currentStreak } from '../habits'
import type { Profile } from '../types'

const profile: Profile = {
  name: 'Test',
  age: 40,
  sex: 'female',
  heightCm: 168,
  weightKg: 70,
  goal: 'fat_loss',
  goalWeightKg: 63,
  fitnessLevel: 'beginner',
  medicalConditions: ['hypertension'],
  injuries: ['knee'],
  equipment: 'dumbbells',
  daysPerWeek: 3,
  minutesPerSession: 45,
  sleepHours: 6,
  stressLevel: 'high',
  activityLevel: 'sedentary',
  dietPref: 'vegetarian',
  mealsPerDay: 3,
  lifestyle: {
    allOrNothing: true,
    timeCrunched: true,
    travelsOften: false,
    eveningSnacker: true,
    deskJob: true,
    trainsAlone: true,
  },
}

describe('buildProgram', () => {
  it('creates the right number of sessions for the split', () => {
    expect(buildProgram(profile).sessions).toHaveLength(3)
    expect(buildProgram({ ...profile, daysPerWeek: 4 }).sessions).toHaveLength(4)
    expect(buildProgram({ ...profile, daysPerWeek: 6 }).sessions).toHaveLength(6)
  })

  it('respects equipment: no barbell work for dumbbell users', () => {
    const names = buildProgram(profile)
      .sessions.flatMap((s) => s.exercises)
      .map((e) => e.name.toLowerCase())
    expect(names.some((n) => n.includes('barbell'))).toBe(false)
    expect(names.some((n) => n.includes('lat pulldown'))).toBe(false)
  })

  it('avoids knee-loading exercises for a knee injury', () => {
    const names = buildProgram(profile)
      .sessions.flatMap((s) => s.exercises)
      .map((e) => e.name.toLowerCase())
    expect(names.some((n) => n.includes('lunge') && !n.includes('pain-free'))).toBe(false)
    expect(names.some((n) => n.includes('goblet squat') && !n.includes('pain-free'))).toBe(false)
  })

  it('adds hypertension caution', () => {
    expect(buildProgram(profile).cautions.join(' ')).toMatch(/valsalva/i)
  })

  it('pickExercise falls back gracefully when everything is contraindicated', () => {
    const pick = pickExercise('squat', 'none', ['knee', 'lower_back', 'hip', 'ankle', 'shoulder', 'wrist_elbow'])
    expect(pick.length).toBeGreaterThan(0)
  })
})

describe('buildRoadmap', () => {
  it('produces phases and a plausible ETA for fat loss', () => {
    const r = buildRoadmap(profile) // 7 kg at 0.49 kg/wk ≈ 15 weeks
    expect(r.phases.length).toBeGreaterThanOrEqual(3)
    expect(r.etaWeeks).toBeGreaterThanOrEqual(10)
    expect(r.etaWeeks).toBeLessThanOrEqual(20)
    expect(r.weeklyRateKg).toBeLessThan(0)
  })
  it('handles muscle gain with positive rate', () => {
    const r = buildRoadmap({ ...profile, goal: 'muscle_gain', goalWeightKg: 74 })
    expect(r.weeklyRateKg).toBeGreaterThan(0)
  })
})

describe('habit engine', () => {
  it('diagnoses friction from lifestyle flags', () => {
    const plan = buildHabitPlan(profile)
    const titles = plan.findings.map((f) => f.title.toLowerCase()).join(' ')
    expect(titles).toMatch(/all-or-nothing/)
    expect(titles).toMatch(/sleep/)
    expect(titles).toMatch(/stress/)
  })
  it('caps habits at 6 and includes a sleep habit for short sleepers', () => {
    const plan = buildHabitPlan(profile)
    expect(plan.habits.length).toBeLessThanOrEqual(6)
    expect(plan.habits.some((h) => h.id === 'sleep_alarm')).toBe(true)
  })
  it('computes streaks with today unchecked not breaking the chain', () => {
    expect(currentStreak(['2026-07-07', '2026-07-08', '2026-07-09'], '2026-07-10')).toBe(3)
    expect(currentStreak(['2026-07-08', '2026-07-09', '2026-07-10'], '2026-07-10')).toBe(3)
    expect(currentStreak([], '2026-07-10')).toBe(0)
  })
})
