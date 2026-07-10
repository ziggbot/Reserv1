import { targetMonthlyGainKg, targetWeeklyLossKg, weeksToGoal, round1 } from './calculations'
import type { Profile, Roadmap, RoadmapPhase } from './types'

const TRACKING_PROTOCOL = [
  'Weigh in daily (morning, after bathroom, before food) — judge only the 7-day average, never a single day.',
  'Log every workout: exercises, weights, reps. Strength trend is your muscle-retention signal.',
  'Weekly review (same day each week): average weight, workouts completed, habit streaks, energy and sleep.',
  'Monthly: progress photos (same light, same pose) and waist measurement — the scale misses recomposition.',
]

export function buildRoadmap(profile: Profile): Roadmap {
  const eta = weeksToGoal(profile)
  const phases: RoadmapPhase[] = []
  let weeklyRateKg = 0
  let summary: string

  if (profile.goal === 'fat_loss') {
    weeklyRateKg = -targetWeeklyLossKg(profile.weightKg)
    const total = eta ?? 12
    summary = eta
      ? `Losing ~${targetWeeklyLossKg(profile.weightKg)} kg/week (0.7% of bodyweight — the fastest rate that reliably spares muscle), you reach ${profile.goalWeightKg} kg in roughly ${eta} weeks. Faster exists; faster also rebounds.`
      : `Sustainable fat loss at ~${targetWeeklyLossKg(profile.weightKg)} kg/week while holding on to muscle.`
    phases.push(
      {
        name: 'Phase 1 — Foundation',
        weeks: 'Weeks 1–4',
        focus: 'Install the system: training rhythm, protein habit, daily weigh-ins.',
        trainingEmphasis: 'Learn the movements, log everything, finish every planned session.',
        nutritionEmphasis: 'Hit calories ±100 and protein ±20 g at least 6 days/week.',
        checkpoints: ['All planned workouts done 3 of 4 weeks', 'Scale trend moving down by week 3–4'],
      },
      {
        name: 'Phase 2 — Momentum',
        weeks: `Weeks 5–${Math.min(10, Math.max(6, Math.ceil(total * 0.6)))}`,
        focus: 'Progressive overload while the deficit does its work.',
        trainingEmphasis: 'Add weight or reps most weeks; deload week 5 or 9 as needed.',
        nutritionEmphasis: 'First stall check: if the 2-week trend is flat, apply the adjustment protocol.',
        checkpoints: ['Strength maintained or up on main lifts', 'On pace vs. the projected rate (±30%)'],
      },
      {
        name: 'Phase 3 — Diet break & push',
        weeks: `Weeks ${Math.min(11, Math.max(7, Math.ceil(total * 0.6) + 1))}–${total}`,
        focus: '1 week at maintenance calories (hormonal + psychological reset), then the final push.',
        trainingEmphasis: 'Intensity stays high — the diet break is not a training break.',
        nutritionEmphasis: 'Return to the deficit after the break; recalculate targets at your new weight.',
        checkpoints: ['Goal weight or waist target reached', 'Exit plan: reverse to maintenance over 2–3 weeks'],
      },
    )
  } else if (profile.goal === 'muscle_gain') {
    weeklyRateKg = round1(targetMonthlyGainKg(profile.weightKg, profile.fitnessLevel) / 4.33)
    summary = eta
      ? `Gaining ~${targetMonthlyGainKg(profile.weightKg, profile.fitnessLevel)} kg/month (the realistic ${profile.fitnessLevel} rate — anything faster is mostly fat), you reach ${profile.goalWeightKg} kg in roughly ${eta} weeks.`
      : `Lean gaining at ~${targetMonthlyGainKg(profile.weightKg, profile.fitnessLevel)} kg/month with a small surplus.`
    phases.push(
      {
        name: 'Phase 1 — Volume base',
        weeks: 'Weeks 1–6',
        focus: 'Establish training volume (10+ hard sets/muscle/week) and the eating rhythm.',
        trainingEmphasis: '8–12 rep hypertrophy focus, perfect technique, log everything.',
        nutritionEmphasis: 'Small surplus; protein every meal; scale should creep up ~0.25–0.5%/month.',
        checkpoints: ['All sessions completed', 'Weight trending up slowly, waist roughly stable'],
      },
      {
        name: 'Phase 2 — Overload',
        weeks: 'Weeks 7–12',
        focus: 'Push loads: this is where the growth stimulus compounds.',
        trainingEmphasis: 'Add a set to lagging muscles; 5–8 rep strength work on main lifts. Deload week 12.',
        nutritionEmphasis: 'If weight is flat 2+ weeks, add ~150 kcal (mostly carbs around training).',
        checkpoints: ['Main lifts up 5–10%', 'On pace for the monthly gain target'],
      },
      {
        name: 'Phase 3 — Assess & continue',
        weeks: 'Weeks 13+',
        focus: 'Repeat 6-week blocks until goal; mini-cut only if waist outpaces strength.',
        trainingEmphasis: 'Rotate exercise variants to keep progressing without joint wear.',
        nutritionEmphasis: 'Recalculate surplus at your new bodyweight each block.',
        checkpoints: ['Photos/measurements every 4 weeks', 'Strength per kg bodyweight improving'],
      },
    )
  } else {
    weeklyRateKg = 0
    summary =
      profile.goal === 'recomp'
        ? 'Recomposition: maintenance calories, high protein, progressive training — weight stays put while the mirror and the bar change.'
        : 'General fitness: build the habit, the strength base and the engine. The scale is not the scoreboard here.'
    phases.push(
      {
        name: 'Phase 1 — Consistency',
        weeks: 'Weeks 1–4',
        focus: 'Make training a fixed part of the week. Nothing else matters yet.',
        trainingEmphasis: 'Complete every planned session, even shortened ones.',
        nutritionEmphasis: 'Protein target daily; no other food rules yet.',
        checkpoints: ['≥90% of planned sessions done'],
      },
      {
        name: 'Phase 2 — Strength & engine',
        weeks: 'Weeks 5–12',
        focus: 'Progressive overload plus 150+ min weekly cardio.',
        trainingEmphasis: 'Double progression on all main lifts; add one cardio session.',
        nutritionEmphasis: 'Tighten food quality: protein + plants at most meals.',
        checkpoints: ['Measurable strength gain on 4+ exercises', 'Resting heart rate trending down'],
      },
      {
        name: 'Phase 3 — Specialize',
        weeks: 'Weeks 13+',
        focus: 'Pick the next specific goal (strength number, race, physique) and re-plan.',
        trainingEmphasis: 'Blocks aimed at the new goal.',
        nutritionEmphasis: 'Match intake to the new goal.',
        checkpoints: ['New goal defined with a number and a date'],
      },
    )
  }

  return { etaWeeks: eta, weeklyRateKg, summary, phases, trackingProtocol: TRACKING_PROTOCOL }
}
