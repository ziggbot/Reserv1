import { targetWeeklyLossKg } from './calculations'
import type { ProgressAnalysis, ProgressStatus, WeighIn } from './types'
import { tr } from '../i18n'

/**
 * Fat-loss adjustment engine.
 * Works on 7-day rolling averages of daily weigh-ins — single days are noise
 * (water, sodium, glycogen), the weekly average is signal.
 */

export function rollingAverage(weighIns: WeighIn[], endDate: string, days = 7): number | null {
  const end = new Date(endDate + 'T00:00:00Z').getTime()
  const start = end - (days - 1) * 86400000
  const window = weighIns.filter((w) => {
    const t = new Date(w.date + 'T00:00:00Z').getTime()
    return t >= start && t <= end
  })
  if (window.length < 3) return null // too few points to call it an average
  const sum = window.reduce((acc, w) => acc + w.weightKg, 0)
  return Math.round((sum / window.length) * 100) / 100
}

export function analyzeProgress(weighIns: WeighIn[], todayIso: string, startWeightKg: number, weeksDieting: number): ProgressAnalysis {
  const targetWeekly = -targetWeeklyLossKg(startWeightKg)
  const currentAvg = rollingAverage(weighIns, todayIso)
  const weekAgo = shiftDate(todayIso, -7)
  const previousAvg = rollingAverage(weighIns, weekAgo)

  if (currentAvg === null || previousAvg === null) {
    return {
      status: 'insufficient_data',
      currentAvgKg: currentAvg,
      previousAvgKg: previousAvg,
      weeklyChangeKg: null,
      targetWeeklyChangeKg: targetWeekly,
      recommendation: [
        tr(
          'Keep weighing in daily — the engine needs at least 3 weigh-ins in each of two consecutive weeks to read your trend.',
          'Fortsätt väga dig dagligen — motorn behöver minst 3 invägningar i var och en av två veckor i rad för att läsa din trend.',
        ),
        tr(
          'Until then: hit your calorie and protein targets and complete your sessions. That is the whole job right now.',
          'Tills dess: nå dina kalori- och proteinmål och genomför dina pass. Det är hela jobbet just nu.',
        ),
      ],
      dietBreakSuggested: false,
    }
  }

  const change = Math.round((currentAvg - previousAvg) * 100) / 100
  let status: ProgressStatus
  if (change <= targetWeekly * 1.5) status = 'too_fast'
  else if (change <= targetWeekly * 0.5) status = 'on_track'
  else if (change < 0) status = 'slow'
  else status = 'stalled'

  const dietBreakSuggested = weeksDieting >= 10 && status !== 'too_fast'

  const recommendation: string[] = []
  switch (status) {
    case 'too_fast':
      recommendation.push(
        tr(
          `You lost ${fmt(-change)} kg this week — above the muscle-safe rate. Add ~150–200 kcal/day (carbs around training) and re-check next week.`,
          `Du gick ner ${fmt(-change)} kg den här veckan — över den muskelsäkra takten. Lägg till ~150–200 kcal/dag (kolhydrater runt träningen) och kolla igen nästa vecka.`,
        ),
        tr(
          'Losing faster than ~1% of bodyweight per week costs muscle and rebounds. Slower here is genuinely faster overall.',
          'Att gå ner snabbare än ~1 % av kroppsvikten per vecka kostar muskler och slår tillbaka. Långsammare här är på riktigt snabbare totalt.',
        ),
      )
      break
    case 'on_track':
      recommendation.push(
        tr(
          `Trend: ${fmt(-change)} kg/week — right in the muscle-sparing zone. Change nothing.`,
          `Trend: ${fmt(-change)} kg/vecka — mitt i den muskelsparande zonen. Ändra ingenting.`,
        ),
        tr(
          'Boring consistency is what a successful cut looks like. Keep logging.',
          'Tråkig konsekvens är så en lyckad deff ser ut. Fortsätt logga.',
        ),
      )
      break
    case 'slow':
      recommendation.push(
        tr(
          `Trend: ${fmt(-change)} kg/week — moving, but under 50% of target. Watch one more week before changing anything.`,
          `Trend: ${fmt(-change)} kg/vecka — det rör sig, men under 50 % av målet. Vänta en vecka till innan du ändrar något.`,
        ),
        tr(
          'If it is still slow next week: first tighten tracking accuracy (oils, bites, weekend drift), then add 1,000–2,000 daily steps.',
          'Om det fortfarande går långsamt nästa vecka: skärp först noggrannheten i loggningen (oljor, småbitar, helgglidning), lägg sedan till 1 000–2 000 steg per dag.',
        ),
      )
      break
    case 'stalled':
      recommendation.push(
        tr(
          'Two weekly averages with no drop = a real stall, not noise. Apply one lever, in this order:',
          'Två veckosnitt utan nedgång = en riktig platå, inte brus. Använd en spak i taget, i den här ordningen:',
        ),
        tr(
          '1) Audit intake honestly for 3 days — untracked calories cause most "stalls".',
          '1) Granska intaget ärligt i 3 dagar — ospårade kalorier orsakar de flesta "platåer".',
        ),
        tr(
          '2) Add 1,500–2,000 daily steps (NEAT quietly drops as you diet; this restores it).',
          '2) Lägg till 1 500–2 000 steg per dag (vardagsrörelsen sjunker i tysthet när du dietar; det här återställer den).',
        ),
        tr(
          '3) If still flat after that: reduce calories by 5–10% (~100–200 kcal), protein stays where it is.',
          '3) Om det fortfarande står still efter det: sänk kalorierna med 5–10 % (~100–200 kcal), proteinet ligger kvar.',
        ),
      )
      break
    default:
      break
  }
  if (dietBreakSuggested) {
    recommendation.push(
      tr(
        `You have been dieting ${weeksDieting} weeks — take a 1-week diet break at maintenance calories. It restores leptin, training quality and sanity, and improves long-term adherence.`,
        `Du har dietat i ${weeksDieting} veckor — ta en dietpaus på 1 vecka på underhållskalorier. Den återställer leptin, träningskvalitet och förstånd, och förbättrar följsamheten på sikt.`,
      ),
    )
  }

  return {
    status,
    currentAvgKg: currentAvg,
    previousAvgKg: previousAvg,
    weeklyChangeKg: change,
    targetWeeklyChangeKg: targetWeekly,
    recommendation,
    dietBreakSuggested,
  }
}

export interface FatLossPillar {
  title: string
  detail: string
}

export function fatLossPillars(): FatLossPillar[] {
  return [
    {
      title: tr('Lift to keep what you have', 'Lyft för att behålla det du har'),
      detail: tr(
        'Resistance training 2–4×/week is the single strongest muscle-retention signal in a deficit. Keep weights heavy; volume can drop slightly, intensity should not.',
        'Styrketräning 2–4×/vecka är den enskilt starkaste signalen för att behålla muskler i ett kaloriunderskott. Håll vikterna tunga; volymen kan sjunka något, intensiteten ska inte göra det.',
      ),
    },
    {
      title: tr('Protein does the guarding', 'Proteinet står vakt'),
      detail: tr(
        '2.2+ g/kg/day while cutting. Protein preserves lean mass, blunts hunger and has the highest thermic effect of any macro.',
        '2,2+ g per kg kroppsvikt och dag under deffen. Protein bevarar muskelmassa, dämpar hungern och har den högsta termiska effekten av alla makronutrienter.',
      ),
    },
    {
      title: tr('Moderate deficit, weekly verdict', 'Måttligt underskott, veckovis dom'),
      detail: tr(
        '300–600 kcal/day below maintenance, aiming at ~0.5–1% of bodyweight per week — judged only on the 7-day average.',
        '300–600 kcal/dag under underhållskalorierna, med sikte på ~0,5–1 % av kroppsvikten per vecka — bedömt enbart på 7-dagars snittet.',
      ),
    },
    {
      title: tr('Move outside the gym', 'Rör dig utanför gymmet'),
      detail: tr(
        'Daily steps are the biggest controllable calorie burner you have, and the first thing your body silently cuts when dieting. Set a step floor and hold it.',
        'Steg per dag är den största påverkbara kaloriförbrukaren du har, och det första kroppen i tysthet drar ner på när du dietar. Sätt ett steggolv och håll det.',
      ),
    },
    {
      title: tr('Sleep is part of the diet', 'Sömn är en del av dieten'),
      detail: tr(
        'Under ~6 h of sleep, significantly more of the weight you lose comes from muscle instead of fat, and hunger hormones turn against you. 7–9 h is the target.',
        'Under ~6 h sömn kommer betydligt mer av vikten du tappar från muskler i stället för fett, och hungerhormonerna vänder sig emot dig. 7–9 h är målet.',
      ),
    },
    {
      title: tr('Adjust on evidence, not mood', 'Justera på evidens, inte humör'),
      detail: tr(
        'Plateaus are normal metabolic adaptation, not failure. The adjustment engine reacts to two flat weeks with the smallest change that restarts progress.',
        'Platåer är normal metabol anpassning, inte misslyckande. Justeringsmotorn reagerar på två platta veckor med den minsta förändring som får framstegen att starta igen.',
      ),
    },
  ]
}

function shiftDate(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function fmt(n: number): string {
  return (Math.round(n * 100) / 100).toString()
}
