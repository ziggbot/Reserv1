import {
  calorieTarget,
  hydrationMlPerDay,
  proteinPerKg,
  round1,
  targetMonthlyGainKg,
  targetWeeklyLossKg,
  tdee,
  weeksToGoal,
} from './calculations'
import { buildWeeklySchedule } from './weeklySchedule'
import type { Directive, Profile, WorkoutProgram } from './types'

/**
 * "What matters for your goal" — the whole plan compressed into concrete,
 * numeric marching orders. Everything else in the app is detail behind these.
 * Training/conditioning directives are derived from the reconciled weekly
 * schedule, so they always respect the user's training-day budget.
 */
export function buildOverview(profile: Profile, program: WorkoutProgram): Directive[] {
  const d: Directive[] = []
  const schedule = buildWeeklySchedule(profile, program)
  const eta = weeksToGoal(profile)
  const maintenance = tdee(profile)
  const calories = calorieTarget(profile)

  // 1. The goal, quantified
  if (profile.goal === 'fat_loss') {
    const delta = profile.goalWeightKg ? round1(profile.weightKg - profile.goalWeightKg) : null
    d.push({
      icon: '🎯',
      headline: delta
        ? `Lose ${delta} kg (${profile.weightKg} → ${profile.goalWeightKg} kg)`
        : `Lose ~${targetWeeklyLossKg(profile.weightKg)} kg per week`,
      detail: eta
        ? `At the muscle-safe rate of ~${targetWeeklyLossKg(profile.weightKg)} kg/week that's roughly ${eta} weeks — goal date around week ${eta}.`
        : `0.5–1% of bodyweight per week is the fastest rate that spares muscle.`,
    })
  } else if (profile.goal === 'muscle_gain') {
    const delta = profile.goalWeightKg ? round1(profile.goalWeightKg - profile.weightKg) : null
    d.push({
      icon: '🎯',
      headline: delta
        ? `Gain ${delta} kg of lean mass (${profile.weightKg} → ${profile.goalWeightKg} kg)`
        : `Gain ~${targetMonthlyGainKg(profile.weightKg, profile.fitnessLevel)} kg per month`,
      detail: eta
        ? `At the realistic ${profile.fitnessLevel} rate (~${targetMonthlyGainKg(profile.weightKg, profile.fitnessLevel)} kg/month) that's roughly ${eta} weeks.`
        : 'Slow on purpose — faster gaining is mostly fat.',
    })
  } else if (profile.goal === 'recomp') {
    d.push({
      icon: '🎯',
      headline: 'Recomposition: same scale weight, different body',
      detail: 'Judge progress by waist, photos and strength — not the scale.',
    })
  } else {
    d.push({
      icon: '🎯',
      headline: 'Build all-round fitness and energy',
      detail: 'Scoreboard: sessions completed, strength trend and resting heart rate.',
    })
  }

  // 2. Train — the exact reconciled week (never over-prescribes vs. the day budget)
  const strengthDays = schedule.days.filter((x) => x.kind === 'strength').length
  d.push({
    icon: '🏋️',
    headline: `Train ${profile.daysPerWeek}×/week, ${profile.minutesPerSession} min`,
    detail: `Your week: ${schedule.summaryLine}. Progressive overload on the big lifts is the engine — see “Your training week” below and the Action tab.`,
  })

  // 3. Conditioning — placed inside the budget, or folded into finishers + steps
  if (schedule.conditioning.placement === 'separate') {
    const c = schedule.conditioning
    d.push({
      icon: '🫀',
      headline:
        c.hiitPerWeek > 0
          ? `${c.zone2PerWeek}× zone 2 + ${c.hiitPerWeek}× HIIT per week`
          : `${c.zone2PerWeek}× zone-2 cardio per week`,
      detail: c.note,
    })
  } else {
    d.push({
      icon: '🫀',
      headline: `Conditioning as a finisher (${strengthDays} training day${strengthDays > 1 ? 's' : ''})`,
      detail: schedule.conditioning.note,
    })
  }

  // 4. Steps
  d.push({
    icon: '👟',
    headline: `${schedule.dailySteps.toLocaleString()} steps every day`,
    detail: 'Daily movement is the biggest controllable side of energy balance — and the first lever when progress stalls.',
  })

  // 5. Eat
  const perKg = proteinPerKg(profile.goal, profile.bodyFatPct)
  const proteinLow = Math.round(profile.weightKg * (perKg - 0.2))
  const proteinHigh = Math.round(profile.weightKg * (perKg + 0.3))
  d.push({
    icon: '🍽️',
    headline: `${calories} kcal & ${proteinLow}–${proteinHigh} g protein daily`,
    detail:
      profile.goal === 'fat_loss'
        ? `A ${maintenance - calories} kcal deficit from your ~${maintenance} kcal maintenance; protein at ${perKg}+ g/kg guards your muscle while you cut.`
        : profile.goal === 'muscle_gain'
          ? `A small ${calories - maintenance} kcal surplus over your ~${maintenance} kcal maintenance; protein at ~${perKg} g/kg builds the new tissue.`
          : `Maintenance calories with protein at ~${perKg} g/kg (${Math.round(profile.weightKg * perKg)} g) to support training.`,
  })

  // 6. Sleep
  d.push({
    icon: '😴',
    headline: 'Sleep 7–9 hours',
    detail:
      profile.sleepHours < 7
        ? `You average ${profile.sleepHours} h — fixing this is your highest-leverage move: short sleep makes weight loss come from muscle and doubles the willpower cost of everything above.`
        : `You average ${profile.sleepHours} h — protect it; it's where training turns into results.`,
  })

  // 7. Hydration
  d.push({
    icon: '💧',
    headline: `Drink ~${Math.round(hydrationMlPerDay(profile.weightKg, false) / 100) / 10} L/day (+0.5 L on training days)`,
    detail: '~33 ml per kg bodyweight. Practical check: pale-straw urine.',
  })

  return d
}
