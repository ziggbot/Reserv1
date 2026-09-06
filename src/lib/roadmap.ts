import { targetMonthlyGainKg, targetWeeklyLossKg, weeksToGoal, round1 } from './calculations'
import type { FitnessLevel, Profile, Roadmap, RoadmapPhase } from './types'
import { tr } from '../i18n'

const LEVEL_SV: Record<FitnessLevel, string> = {
  beginner: 'nybörjare',
  intermediate: 'medelnivå',
  advanced: 'avancerade',
}

/** Built at call time so the active language applies (a module constant would freeze it). */
function trackingProtocol(): string[] {
  return [
    tr(
      'Weigh in daily (morning, after bathroom, before food) — judge only the 7-day average, never a single day.',
      'Väg dig dagligen (på morgonen, efter toalettbesök, före mat) — bedöm bara 7-dagarssnittet, aldrig en enskild dag.',
    ),
    tr(
      'Log every workout: exercises, weights, reps. Strength trend is your muscle-retention signal.',
      'Logga varje pass: övningar, vikter, reps. Styrketrenden är din signal på att musklerna behålls.',
    ),
    tr(
      'Weekly review (same day each week): average weight, workouts completed, habit streaks, energy and sleep.',
      'Veckogenomgång (samma dag varje vecka): snittvikt, genomförda pass, vanestreaks, energi och sömn.',
    ),
    tr(
      'Monthly: progress photos (same light, same pose) and waist measurement — the scale misses recomposition.',
      'Månadsvis: framstegsbilder (samma ljus, samma pose) och midjemått — vågen missar rekomposition.',
    ),
  ]
}

export function buildRoadmap(profile: Profile): Roadmap {
  const eta = weeksToGoal(profile)
  const phases: RoadmapPhase[] = []
  let weeklyRateKg = 0
  let summary: string

  if (profile.goal === 'fat_loss') {
    const rate = targetWeeklyLossKg(profile.weightKg)
    weeklyRateKg = -rate
    const total = eta ?? 12
    summary = eta
      ? tr(
          `Losing ~${rate} kg/week (0.7% of bodyweight — the fastest rate that reliably spares muscle), you reach ${profile.goalWeightKg} kg in roughly ${eta} weeks. Faster exists; faster also rebounds.`,
          `Med ~${rate} kg/vecka (0,7 % av kroppsvikten — den snabbaste takten som pålitligt sparar musklerna) når du ${profile.goalWeightKg} kg på ungefär ${eta} veckor. Snabbare finns; snabbare studsar också tillbaka.`,
        )
      : tr(
          `Sustainable fat loss at ~${rate} kg/week while holding on to muscle.`,
          `Hållbar fettförbränning på ~${rate} kg/vecka medan du behåller musklerna.`,
        )
    const p2End = Math.min(10, Math.max(6, Math.ceil(total * 0.6)))
    const p3Start = Math.min(11, Math.max(7, Math.ceil(total * 0.6) + 1))
    phases.push(
      {
        name: tr('Phase 1 — Foundation', 'Fas 1 — Grunden'),
        weeks: tr('Weeks 1–4', 'Vecka 1–4'),
        focus: tr(
          'Install the system: training rhythm, protein habit, daily weigh-ins.',
          'Installera systemet: träningsrytm, proteinvana, dagliga vägningar.',
        ),
        trainingEmphasis: tr(
          'Learn the movements, log everything, finish every planned session.',
          'Lär dig rörelserna, logga allt, genomför varje planerat pass.',
        ),
        nutritionEmphasis: tr(
          'Hit calories ±100 and protein ±20 g at least 6 days/week.',
          'Träffa kalorierna ±100 och proteinet ±20 g minst 6 dagar/vecka.',
        ),
        checkpoints: [
          tr('All planned workouts done 3 of 4 weeks', 'Alla planerade pass gjorda 3 av 4 veckor'),
          tr('Scale trend moving down by week 3–4', 'Vågtrenden på väg ner vecka 3–4'),
        ],
      },
      {
        name: tr('Phase 2 — Momentum', 'Fas 2 — Momentum'),
        weeks: tr(`Weeks 5–${p2End}`, `Vecka 5–${p2End}`),
        focus: tr(
          'Progressive overload while the deficit does its work.',
          'Progressiv överbelastning medan kaloriunderskottet gör sitt jobb.',
        ),
        trainingEmphasis: tr(
          'Add weight or reps most weeks; deload week 5 or 9 as needed.',
          'Lägg på vikt eller reps de flesta veckor; deload-vecka vecka 5 eller 9 vid behov.',
        ),
        nutritionEmphasis: tr(
          'First stall check: if the 2-week trend is flat, apply the adjustment protocol.',
          'Första stagnationskollen: om 2-veckorstrenden är platt, använd justeringsprotokollet.',
        ),
        checkpoints: [
          tr('Strength maintained or up on main lifts', 'Styrkan bibehållen eller upp i huvudlyften'),
          tr('On pace vs. the projected rate (±30%)', 'I fas med den beräknade takten (±30 %)'),
        ],
      },
      {
        name: tr('Phase 3 — Diet break & push', 'Fas 3 — Dietpaus & slutspurt'),
        weeks: tr(`Weeks ${p3Start}–${total}`, `Vecka ${p3Start}–${total}`),
        focus: tr(
          '1 week at maintenance calories (hormonal + psychological reset), then the final push.',
          '1 vecka på underhållskalorier (hormonell + psykologisk återställning), sedan slutspurten.',
        ),
        trainingEmphasis: tr(
          'Intensity stays high — the diet break is not a training break.',
          'Intensiteten förblir hög — dietpausen är ingen träningspaus.',
        ),
        nutritionEmphasis: tr(
          'Return to the deficit after the break; recalculate targets at your new weight.',
          'Tillbaka till kaloriunderskottet efter pausen; räkna om målen vid din nya vikt.',
        ),
        checkpoints: [
          tr('Goal weight or waist target reached', 'Målvikt eller midjemål nått'),
          tr('Exit plan: reverse to maintenance over 2–3 weeks', 'Utgångsplan: trappa upp till underhållskalorier över 2–3 veckor'),
        ],
      },
    )
  } else if (profile.goal === 'muscle_gain') {
    const rate = targetMonthlyGainKg(profile.weightKg, profile.fitnessLevel)
    weeklyRateKg = round1(rate / 4.33)
    summary = eta
      ? tr(
          `Gaining ~${rate} kg/month (the realistic ${profile.fitnessLevel} rate — anything faster is mostly fat), you reach ${profile.goalWeightKg} kg in roughly ${eta} weeks.`,
          `Med ~${rate} kg/månad (den realistiska takten för ${LEVEL_SV[profile.fitnessLevel]} — allt snabbare är mest fett) når du ${profile.goalWeightKg} kg på ungefär ${eta} veckor.`,
        )
      : tr(
          `Lean gaining at ~${rate} kg/month with a small surplus.`,
          `Ren muskelökning på ~${rate} kg/månad med ett litet överskott.`,
        )
    phases.push(
      {
        name: tr('Phase 1 — Volume base', 'Fas 1 — Volymbas'),
        weeks: tr('Weeks 1–6', 'Vecka 1–6'),
        focus: tr(
          'Establish training volume (10+ hard sets/muscle/week) and the eating rhythm.',
          'Etablera träningsvolymen (10+ hårda set per muskel och vecka) och ätrytmen.',
        ),
        trainingEmphasis: tr(
          '8–12 rep hypertrophy focus, perfect technique, log everything.',
          'Hypertrofifokus på 8–12 reps, perfekt teknik, logga allt.',
        ),
        nutritionEmphasis: tr(
          'Small surplus; protein every meal; scale should creep up ~0.25–0.5%/month.',
          'Litet överskott; protein i varje måltid; vågen ska krypa uppåt ~0,25–0,5 %/månad.',
        ),
        checkpoints: [
          tr('All sessions completed', 'Alla pass genomförda'),
          tr('Weight trending up slowly, waist roughly stable', 'Vikten trendar långsamt uppåt, midjan ungefär stabil'),
        ],
      },
      {
        name: tr('Phase 2 — Overload', 'Fas 2 — Överbelastning'),
        weeks: tr('Weeks 7–12', 'Vecka 7–12'),
        focus: tr(
          'Push loads: this is where the growth stimulus compounds.',
          'Pressa belastningen: här är det tillväxtstimulit förstärks.',
        ),
        trainingEmphasis: tr(
          'Add a set to lagging muscles; 5–8 rep strength work on main lifts. Deload week 12.',
          'Lägg till ett set på eftersläpande muskler; styrkearbete på 5–8 reps i huvudlyften. Deload-vecka vecka 12.',
        ),
        nutritionEmphasis: tr(
          'If weight is flat 2+ weeks, add ~150 kcal (mostly carbs around training).',
          'Om vikten står stilla 2+ veckor, lägg till ~150 kcal (mest kolhydrater runt träningen).',
        ),
        checkpoints: [
          tr('Main lifts up 5–10%', 'Huvudlyften upp 5–10 %'),
          tr('On pace for the monthly gain target', 'I fas med det månatliga ökningsmålet'),
        ],
      },
      {
        name: tr('Phase 3 — Assess & continue', 'Fas 3 — Utvärdera & fortsätt'),
        weeks: tr('Weeks 13+', 'Vecka 13+'),
        focus: tr(
          'Repeat 6-week blocks until goal; mini-cut only if waist outpaces strength.',
          'Upprepa 6-veckorsblock till målet; minideff bara om midjan växer snabbare än styrkan.',
        ),
        trainingEmphasis: tr(
          'Rotate exercise variants to keep progressing without joint wear.',
          'Rotera övningsvarianter för att fortsätta progrediera utan att slita på lederna.',
        ),
        nutritionEmphasis: tr(
          'Recalculate surplus at your new bodyweight each block.',
          'Räkna om överskottet vid din nya kroppsvikt varje block.',
        ),
        checkpoints: [
          tr('Photos/measurements every 4 weeks', 'Bilder/mått var 4:e vecka'),
          tr('Strength per kg bodyweight improving', 'Styrka per kg kroppsvikt förbättras'),
        ],
      },
    )
  } else {
    weeklyRateKg = 0
    summary =
      profile.goal === 'recomp'
        ? tr(
            'Recomposition: maintenance calories, high protein, progressive training — weight stays put while the mirror and the bar change.',
            'Rekomposition: underhållskalorier, högt proteinintag, progressiv träning — vikten står stilla medan spegeln och stången förändras.',
          )
        : tr(
            'General fitness: build the habit, the strength base and the engine. The scale is not the scoreboard here.',
            'Allmän kondition: bygg vanan, styrkebasen och motorn. Vågen är inte resultattavlan här.',
          )
    phases.push(
      {
        name: tr('Phase 1 — Consistency', 'Fas 1 — Konsekvens'),
        weeks: tr('Weeks 1–4', 'Vecka 1–4'),
        focus: tr(
          'Make training a fixed part of the week. Nothing else matters yet.',
          'Gör träningen till en fast del av veckan. Inget annat spelar roll än.',
        ),
        trainingEmphasis: tr(
          'Complete every planned session, even shortened ones.',
          'Genomför varje planerat pass, även förkortade.',
        ),
        nutritionEmphasis: tr('Protein target daily; no other food rules yet.', 'Proteinmål dagligen; inga andra matregler än.'),
        checkpoints: [tr('≥90% of planned sessions done', '≥90 % av planerade pass gjorda')],
      },
      {
        name: tr('Phase 2 — Strength & engine', 'Fas 2 — Styrka & motor'),
        weeks: tr('Weeks 5–12', 'Vecka 5–12'),
        focus: tr(
          'Progressive overload plus 150+ min weekly cardio.',
          'Progressiv överbelastning plus 150+ min kondition per vecka.',
        ),
        trainingEmphasis: tr(
          'Double progression on all main lifts; add one cardio session.',
          'Dubbel progression i alla huvudlyft; lägg till ett konditionspass.',
        ),
        nutritionEmphasis: tr(
          'Tighten food quality: protein + plants at most meals.',
          'Skärp matkvaliteten: protein + växter i de flesta måltider.',
        ),
        checkpoints: [
          tr('Measurable strength gain on 4+ exercises', 'Mätbar styrkeökning i 4+ övningar'),
          tr('Resting heart rate trending down', 'Vilopulsen trendar nedåt'),
        ],
      },
      {
        name: tr('Phase 3 — Specialize', 'Fas 3 — Specialisera'),
        weeks: tr('Weeks 13+', 'Vecka 13+'),
        focus: tr(
          'Pick the next specific goal (strength number, race, physique) and re-plan.',
          'Välj nästa specifika mål (styrkesiffra, lopp, fysik) och planera om.',
        ),
        trainingEmphasis: tr('Blocks aimed at the new goal.', 'Block riktade mot det nya målet.'),
        nutritionEmphasis: tr('Match intake to the new goal.', 'Anpassa intaget till det nya målet.'),
        checkpoints: [tr('New goal defined with a number and a date', 'Nytt mål definierat med en siffra och ett datum')],
      },
    )
  }

  return { etaWeeks: eta, weeklyRateKg, summary, phases, trackingProtocol: trackingProtocol() }
}
