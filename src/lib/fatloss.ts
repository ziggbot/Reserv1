import { targetWeeklyLossKg } from './calculations'
import type { ProgressAnalysis, ProgressStatus, WeighIn } from './types'

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
        'Keep weighing in daily — the engine needs at least 3 weigh-ins in each of two consecutive weeks to read your trend.',
        'Until then: hit your calorie and protein targets and complete your sessions. That is the whole job right now.',
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
        `You lost ${fmt(-change)} kg this week — above the muscle-safe rate. Add ~150–200 kcal/day (carbs around training) and re-check next week.`,
        'Losing faster than ~1% of bodyweight per week costs muscle and rebounds. Slower here is genuinely faster overall.',
      )
      break
    case 'on_track':
      recommendation.push(
        `Trend: ${fmt(-change)} kg/week — right in the muscle-sparing zone. Change nothing.`,
        'Boring consistency is what a successful cut looks like. Keep logging.',
      )
      break
    case 'slow':
      recommendation.push(
        `Trend: ${fmt(-change)} kg/week — moving, but under 50% of target. Watch one more week before changing anything.`,
        'If it is still slow next week: first tighten tracking accuracy (oils, bites, weekend drift), then add 1,000–2,000 daily steps.',
      )
      break
    case 'stalled':
      recommendation.push(
        'Two weekly averages with no drop = a real stall, not noise. Apply one lever, in this order:',
        '1) Audit intake honestly for 3 days — untracked calories cause most "stalls".',
        '2) Add 1,500–2,000 daily steps (NEAT quietly drops as you diet; this restores it).',
        '3) If still flat after that: reduce calories by 5–10% (~100–200 kcal), protein stays where it is.',
      )
      break
    default:
      break
  }
  if (dietBreakSuggested) {
    recommendation.push(
      `You have been dieting ${weeksDieting} weeks — take a 1-week diet break at maintenance calories. It restores leptin, training quality and sanity, and improves long-term adherence.`,
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

export const FAT_LOSS_PILLARS = [
  {
    title: 'Lift to keep what you have',
    detail:
      'Resistance training 2–4×/week is the single strongest muscle-retention signal in a deficit. Keep weights heavy; volume can drop slightly, intensity should not.',
  },
  {
    title: 'Protein does the guarding',
    detail:
      '2.2+ g/kg/day while cutting. Protein preserves lean mass, blunts hunger and has the highest thermic effect of any macro.',
  },
  {
    title: 'Moderate deficit, weekly verdict',
    detail:
      '300–600 kcal/day below maintenance, aiming at ~0.5–1% of bodyweight per week — judged only on the 7-day average.',
  },
  {
    title: 'Move outside the gym',
    detail:
      'Daily steps are the biggest controllable calorie burner you have, and the first thing your body silently cuts when dieting. Set a step floor and hold it.',
  },
  {
    title: 'Sleep is part of the diet',
    detail:
      'Under ~6 h of sleep, significantly more of the weight you lose comes from muscle instead of fat, and hunger hormones turn against you. 7–9 h is the target.',
  },
  {
    title: 'Adjust on evidence, not mood',
    detail:
      'Plateaus are normal metabolic adaptation, not failure. The adjustment engine reacts to two flat weeks with the smallest change that restarts progress.',
  },
]

function shiftDate(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function fmt(n: number): string {
  return (Math.round(n * 100) / 100).toString()
}
