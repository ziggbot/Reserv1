import { describe, expect, it } from 'vitest'
import {
  calorieTarget,
  hydrationMlPerDay,
  macroTargets,
  mifflinStJeor,
  proteinPerKg,
  targetWeeklyLossKg,
  tdee,
  weeksToGoal,
} from '../calculations'
import type { Profile } from '../types'

const baseProfile: Profile = {
  name: 'Test',
  age: 30,
  sex: 'male',
  heightCm: 180,
  weightKg: 80,
  goal: 'fat_loss',
  goalWeightKg: 74,
  fitnessLevel: 'intermediate',
  medicalConditions: [],
  injuries: [],
  equipment: 'full_gym',
  daysPerWeek: 4,
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

describe('mifflinStJeor', () => {
  it('matches hand-computed male value', () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
    expect(mifflinStJeor('male', 80, 180, 30)).toBe(1780)
  })
  it('matches hand-computed female value', () => {
    // 10*60 + 6.25*165 - 5*28 - 161 = 600 + 1031.25 - 140 - 161 = 1330.25 → 1330
    expect(mifflinStJeor('female', 60, 165, 28)).toBe(1330)
  })
})

describe('tdee', () => {
  it('applies the activity factor', () => {
    expect(tdee(baseProfile)).toBe(Math.round(1780 * 1.375))
  })
})

describe('calorieTarget', () => {
  it('creates a 300–600 kcal deficit for fat loss', () => {
    const maintenance = tdee(baseProfile)
    const target = calorieTarget(baseProfile)
    expect(maintenance - target).toBeGreaterThanOrEqual(300)
    expect(maintenance - target).toBeLessThanOrEqual(600)
  })
  it('never goes below the sex-specific floor', () => {
    const tiny: Profile = { ...baseProfile, sex: 'female', weightKg: 45, heightCm: 150, age: 60, activityLevel: 'sedentary' }
    expect(calorieTarget(tiny)).toBeGreaterThanOrEqual(1200)
  })
  it('adds a small surplus for muscle gain', () => {
    const bulk: Profile = { ...baseProfile, goal: 'muscle_gain' }
    const maintenance = tdee(bulk)
    const target = calorieTarget(bulk)
    expect(target).toBeGreaterThan(maintenance)
    expect(target - maintenance).toBeLessThanOrEqual(300)
  })
  it('uses maintenance for recomp', () => {
    expect(calorieTarget({ ...baseProfile, goal: 'recomp' })).toBe(tdee(baseProfile))
  })
})

describe('proteinPerKg', () => {
  it('is in the evidence-based 1.6–2.6 band for all goals', () => {
    for (const goal of ['fat_loss', 'muscle_gain', 'recomp', 'general_fitness'] as const) {
      const p = proteinPerKg(goal)
      expect(p).toBeGreaterThanOrEqual(1.6)
      expect(p).toBeLessThanOrEqual(2.6)
    }
  })
  it('is higher for lean people who are cutting', () => {
    expect(proteinPerKg('fat_loss', 15)).toBeGreaterThan(proteinPerKg('fat_loss', 30))
  })
})

describe('macroTargets', () => {
  it('macros approximately sum to the calorie target', () => {
    const t = macroTargets(baseProfile)
    const kcalFromMacros = t.proteinG * 4 + t.fatG * 9 + t.carbsG * 4
    expect(Math.abs(kcalFromMacros - t.calories)).toBeLessThanOrEqual(10) // rounding slack
  })
  it('carbs never go negative', () => {
    const heavy: Profile = { ...baseProfile, weightKg: 150, activityLevel: 'sedentary', sex: 'female' }
    expect(macroTargets(heavy).carbsG).toBeGreaterThanOrEqual(0)
  })
})

describe('targetWeeklyLossKg', () => {
  it('is between 0.5 and 1 percent of bodyweight', () => {
    const rate = targetWeeklyLossKg(80)
    expect(rate).toBeGreaterThanOrEqual(80 * 0.005)
    expect(rate).toBeLessThanOrEqual(80 * 0.01)
  })
})

describe('weeksToGoal', () => {
  it('projects a plausible fat-loss ETA', () => {
    const weeks = weeksToGoal(baseProfile)! // 6 kg at ~0.56 kg/wk ≈ 11 weeks
    expect(weeks).toBeGreaterThanOrEqual(8)
    expect(weeks).toBeLessThanOrEqual(14)
  })
  it('returns null without a goal weight', () => {
    expect(weeksToGoal({ ...baseProfile, goalWeightKg: undefined })).toBeNull()
  })
  it('returns null for contradictory goal direction', () => {
    expect(weeksToGoal({ ...baseProfile, goalWeightKg: 90 })).toBeNull() // gain while goal=fat_loss
  })
})

describe('hydration', () => {
  it('scales with bodyweight and adds training bump', () => {
    expect(hydrationMlPerDay(80, false)).toBe(2640)
    expect(hydrationMlPerDay(80, true)).toBe(3140)
  })
})
