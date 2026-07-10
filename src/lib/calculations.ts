import type { ActivityLevel, Goal, MacroTargets, NutritionPlan, Profile, Sex } from './types'

/**
 * Mifflin–St Jeor resting metabolic rate (kcal/day).
 * The ADA-endorsed equation with the best validation in healthy adults.
 */
export function mifflinStJeor(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  return Math.round(sex === 'male' ? base + 5 : base - 161)
}

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

export function tdee(profile: Pick<Profile, 'sex' | 'weightKg' | 'heightCm' | 'age' | 'activityLevel'>): number {
  return Math.round(
    mifflinStJeor(profile.sex, profile.weightKg, profile.heightCm, profile.age) *
      ACTIVITY_FACTORS[profile.activityLevel],
  )
}

/** Safe weekly fat-loss rate: 0.5–1% of bodyweight; we prescribe ~0.7% as the sweet spot. */
export function targetWeeklyLossKg(weightKg: number): number {
  return round1(weightKg * 0.007)
}

/** Realistic monthly muscle gain by training age (% of bodyweight). */
export function targetMonthlyGainKg(weightKg: number, level: Profile['fitnessLevel']): number {
  const pct = level === 'beginner' ? 0.01 : level === 'intermediate' ? 0.005 : 0.0025
  return round1(weightKg * pct)
}

const KCAL_PER_KG_TISSUE = 7700
const MIN_CALORIES: Record<Sex, number> = { male: 1500, female: 1200 }

export function calorieTarget(profile: Profile): number {
  const maintenance = tdee(profile)
  switch (profile.goal) {
    case 'fat_loss': {
      const dailyDeficit = Math.min(
        600,
        Math.max(300, Math.round((targetWeeklyLossKg(profile.weightKg) * KCAL_PER_KG_TISSUE) / 7)),
      )
      return Math.max(MIN_CALORIES[profile.sex], maintenance - dailyDeficit)
    }
    case 'muscle_gain':
      // ~10% surplus, capped — larger surpluses mostly add fat.
      return maintenance + Math.min(300, Math.round(maintenance * 0.1))
    case 'recomp':
    case 'general_fitness':
      return maintenance
  }
}

/** Protein in g/kg bodyweight. Cutting uses the high end to preserve lean mass. */
export function proteinPerKg(goal: Goal, bodyFatPct?: number): number {
  switch (goal) {
    case 'fat_loss':
      // Leaner people need more protein per kg when cutting (Helms et al.)
      return bodyFatPct !== undefined && bodyFatPct < 20 ? 2.4 : 2.2
    case 'muscle_gain':
      return 1.8
    case 'recomp':
      return 2.0
    case 'general_fitness':
      return 1.6
  }
}

export function macroTargets(profile: Profile): MacroTargets {
  const calories = calorieTarget(profile)
  const perKg = proteinPerKg(profile.goal, profile.bodyFatPct)
  const proteinG = Math.round(profile.weightKg * perKg)
  // Fat: 25% of calories, floor of 0.6 g/kg for hormonal health.
  const fatG = Math.max(Math.round((calories * 0.25) / 9), Math.round(profile.weightKg * 0.6))
  const carbsG = Math.max(0, Math.round((calories - proteinG * 4 - fatG * 9) / 4))
  return { calories, proteinG, fatG, carbsG }
}

export function hydrationMlPerDay(weightKg: number, trainingDay: boolean): number {
  const base = Math.round(weightKg * 33)
  return trainingDay ? base + 500 : base
}

export function buildNutritionPlan(profile: Profile): NutritionPlan {
  const maintenance = tdee(profile)
  const targets = macroTargets(profile)
  const perKg = proteinPerKg(profile.goal, profile.bodyFatPct)
  const notes: string[] = [
    `Protein at ${perKg} g/kg — spread over ${profile.mealsPerDay} meals (~${Math.round(
      targets.proteinG / profile.mealsPerDay,
    )} g per meal) to maximize muscle protein synthesis.`,
    'These are starting targets, not rules carved in stone: weigh in, watch the weekly trend, and adjust in small steps.',
    '80/20 principle — build most meals from whole foods you actually like; nothing is forbidden.',
  ]
  if (profile.goal === 'fat_loss') {
    notes.push('Keep the deficit moderate. Crash diets lose muscle and rebound; this plan is built to be the last diet you need.')
  }
  if (profile.goal === 'muscle_gain') {
    notes.push('Expect to gain slowly. If the scale jumps fast, most of it is not muscle — hold the surplus small.')
  }
  return {
    maintenanceCalories: maintenance,
    targets,
    proteinPerKg: perKg,
    hydrationMlPerDay: hydrationMlPerDay(profile.weightKg, true),
    notes,
  }
}

/** Weeks to reach goal weight at evidence-based rates; null when no sensible ETA applies. */
export function weeksToGoal(profile: Profile): number | null {
  if (!profile.goalWeightKg || profile.goalWeightKg === profile.weightKg) return null
  const delta = profile.goalWeightKg - profile.weightKg
  if (profile.goal === 'fat_loss' && delta < 0) {
    return Math.ceil(Math.abs(delta) / targetWeeklyLossKg(profile.weightKg))
  }
  if (profile.goal === 'muscle_gain' && delta > 0) {
    const perWeek = targetMonthlyGainKg(profile.weightKg, profile.fitnessLevel) / 4.33
    return Math.ceil(delta / perWeek)
  }
  return null
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10
}
