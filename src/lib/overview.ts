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
import type { Directive, FitnessLevel, Profile, WorkoutProgram } from './types'
import { tr } from '../i18n'
import { describeWeek } from './trainingDays'

const LEVEL_SV: Record<FitnessLevel, string> = {
  beginner: 'nybörjare',
  intermediate: 'medelnivå',
  advanced: 'avancerade',
}

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
    const rate = targetWeeklyLossKg(profile.weightKg)
    d.push({
      icon: '🎯',
      headline: delta
        ? tr(
            `Lose ${delta} kg (${profile.weightKg} → ${profile.goalWeightKg} kg)`,
            `Gå ner ${delta} kg (${profile.weightKg} → ${profile.goalWeightKg} kg)`,
          )
        : tr(`Lose ~${rate} kg per week`, `Gå ner ~${rate} kg per vecka`),
      detail: eta
        ? tr(
            `At the muscle-safe rate of ~${rate} kg/week that's roughly ${eta} weeks — goal date around week ${eta}.`,
            `I den muskelsparande takten ~${rate} kg/vecka tar det ungefär ${eta} veckor — måldatum runt vecka ${eta}.`,
          )
        : tr(
            `0.5–1% of bodyweight per week is the fastest rate that spares muscle.`,
            `0,5–1 % av kroppsvikten per vecka är den snabbaste takten som sparar musklerna.`,
          ),
    })
  } else if (profile.goal === 'muscle_gain') {
    const delta = profile.goalWeightKg ? round1(profile.goalWeightKg - profile.weightKg) : null
    const rate = targetMonthlyGainKg(profile.weightKg, profile.fitnessLevel)
    d.push({
      icon: '🎯',
      headline: delta
        ? tr(
            `Gain ${delta} kg of lean mass (${profile.weightKg} → ${profile.goalWeightKg} kg)`,
            `Öka ${delta} kg muskelmassa (${profile.weightKg} → ${profile.goalWeightKg} kg)`,
          )
        : tr(`Gain ~${rate} kg per month`, `Öka ~${rate} kg per månad`),
      detail: eta
        ? tr(
            `At the realistic ${profile.fitnessLevel} rate (~${rate} kg/month) that's roughly ${eta} weeks.`,
            `I den realistiska takten för ${LEVEL_SV[profile.fitnessLevel]} (~${rate} kg/månad) tar det ungefär ${eta} veckor.`,
          )
        : tr('Slow on purpose — faster gaining is mostly fat.', 'Långsamt med flit — snabbare viktökning är mest fett.'),
    })
  } else if (profile.goal === 'recomp') {
    d.push({
      icon: '🎯',
      headline: tr('Recomposition: same scale weight, different body', 'Rekomposition: samma vikt på vågen, annan kropp'),
      detail: tr(
        'Judge progress by waist, photos and strength — not the scale.',
        'Bedöm framstegen på midjemått, bilder och styrka — inte vågen.',
      ),
    })
  } else {
    d.push({
      icon: '🎯',
      headline: tr('Build all-round fitness and energy', 'Bygg allsidig kondition och energi'),
      detail: tr(
        'Scoreboard: sessions completed, strength trend and resting heart rate.',
        'Resultattavla: genomförda pass, styrketrend och vilopuls.',
      ),
    })
  }

  // 2. Train — the exact reconciled week (never over-prescribes vs. the day budget)
  const strengthDays = schedule.days.filter((x) => x.kind === 'strength').length
  d.push({
    icon: '🏋️',
    headline: tr(
      `Train ${describeWeek(profile)}, ${profile.minutesPerSession} min`,
      `Träna ${describeWeek(profile)}, ${profile.minutesPerSession} min`,
    ),
    detail: tr(
      `Your week: ${schedule.summaryLine}. Progressive overload on the big lifts is the engine — see “Your training week” below and the Action tab.`,
      `Din vecka: ${schedule.summaryLine}. Progressiv överbelastning i de stora lyften är motorn — se ”Din träningsvecka” nedan och fliken Träna.`,
    ),
  })

  // 3. Conditioning — placed inside the budget, or folded into finishers + steps
  if (schedule.conditioning.placement === 'separate') {
    const c = schedule.conditioning
    d.push({
      icon: '🫀',
      headline:
        c.hiitPerWeek > 0
          ? tr(
              `${c.zone2PerWeek}× zone 2 + ${c.hiitPerWeek}× HIIT per week`,
              `${c.zone2PerWeek}× zon 2 + ${c.hiitPerWeek}× HIIT per vecka`,
            )
          : tr(`${c.zone2PerWeek}× zone-2 cardio per week`, `${c.zone2PerWeek}× zon 2-kondition per vecka`),
      detail: c.note,
    })
  } else {
    d.push({
      icon: '🫀',
      headline: tr(
        `Conditioning as a finisher (${strengthDays} training day${strengthDays > 1 ? 's' : ''})`,
        `Kondition som avslut (${strengthDays} träningsdag${strengthDays > 1 ? 'ar' : ''})`,
      ),
      detail: schedule.conditioning.note,
    })
  }

  // 4. Steps
  d.push({
    icon: '👟',
    headline: tr(
      `${schedule.dailySteps.toLocaleString()} steps every day`,
      `${schedule.dailySteps.toLocaleString()} steg varje dag`,
    ),
    detail: tr(
      'Daily movement is the biggest controllable side of energy balance — and the first lever when progress stalls.',
      'Daglig rörelse är den största påverkbara sidan av energibalansen — och den första spaken när framstegen stannar av.',
    ),
  })

  // 5. Eat
  const perKg = proteinPerKg(profile.goal, profile.bodyFatPct)
  const proteinLow = Math.round(profile.weightKg * (perKg - 0.2))
  const proteinHigh = Math.round(profile.weightKg * (perKg + 0.3))
  d.push({
    icon: '🍽️',
    headline: tr(
      `${calories} kcal & ${proteinLow}–${proteinHigh} g protein daily`,
      `${calories} kcal & ${proteinLow}–${proteinHigh} g protein dagligen`,
    ),
    detail:
      profile.goal === 'fat_loss'
        ? tr(
            `A ${maintenance - calories} kcal deficit from your ~${maintenance} kcal maintenance; protein at ${perKg}+ g/kg guards your muscle while you cut.`,
            `Ett kaloriunderskott på ${maintenance - calories} kcal från dina ~${maintenance} kcal underhållskalorier; protein på ${perKg}+ g/kg skyddar musklerna medan du deffar.`,
          )
        : profile.goal === 'muscle_gain'
          ? tr(
              `A small ${calories - maintenance} kcal surplus over your ~${maintenance} kcal maintenance; protein at ~${perKg} g/kg builds the new tissue.`,
              `Ett litet överskott på ${calories - maintenance} kcal över dina ~${maintenance} kcal underhållskalorier; protein på ~${perKg} g/kg bygger den nya vävnaden.`,
            )
          : tr(
              `Maintenance calories with protein at ~${perKg} g/kg (${Math.round(profile.weightKg * perKg)} g) to support training.`,
              `Underhållskalorier med protein på ~${perKg} g/kg (${Math.round(profile.weightKg * perKg)} g) för att stötta träningen.`,
            ),
  })

  // 6. Sleep
  d.push({
    icon: '😴',
    headline: tr('Sleep 7–9 hours', 'Sov 7–9 timmar'),
    detail:
      profile.sleepHours < 7
        ? tr(
            `You average ${profile.sleepHours} h — fixing this is your highest-leverage move: short sleep makes weight loss come from muscle and doubles the willpower cost of everything above.`,
            `Du sover i snitt ${profile.sleepHours} h — att fixa det är ditt mest lönsamma drag: kort sömn gör att viktnedgången tas från musklerna och fördubblar viljestyrkekostnaden för allt ovan.`,
          )
        : tr(
            `You average ${profile.sleepHours} h — protect it; it's where training turns into results.`,
            `Du sover i snitt ${profile.sleepHours} h — skydda den; det är där träningen blir till resultat.`,
          ),
  })

  // 7. Hydration
  const litres = Math.round(hydrationMlPerDay(profile.weightKg, false) / 100) / 10
  d.push({
    icon: '💧',
    headline: tr(`Drink ~${litres} L/day (+0.5 L on training days)`, `Drick ~${litres} L/dag (+0,5 L på träningsdagar)`),
    detail: tr('~33 ml per kg bodyweight. Practical check: pale-straw urine.', '~33 ml per kg kroppsvikt. Praktiskt test: halmgul urin.'),
  })

  return d
}
