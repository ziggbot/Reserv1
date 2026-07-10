import type { FrictionFinding, Habit, HabitPlan, Profile } from './types'

/**
 * Behavioral engine: diagnoses why consistency breaks from lifestyle answers,
 * then prescribes a small set of anchored habits (implementation intentions)
 * instead of willpower-based rules.
 */

export function diagnoseFriction(profile: Profile): FrictionFinding[] {
  const findings: FrictionFinding[] = []
  const { lifestyle } = profile

  if (lifestyle.allOrNothing) {
    findings.push({
      title: 'All-or-nothing cycling',
      detail:
        'You go all-in, miss one day, and the whole plan collapses. The fix is lowering the bar, not raising motivation: a 10-minute session counts as a win, and the only hard rule is "never miss twice".',
    })
  }
  if (profile.sleepHours < 7) {
    findings.push({
      title: `Short sleep (${profile.sleepHours} h)`,
      detail:
        'Sleep deprivation measurably lowers self-control, raises hunger hormones and makes every habit harder. Sleep is upstream of everything else in this plan — it gets its own habit.',
    })
  }
  if (profile.stressLevel === 'high') {
    findings.push({
      title: 'High stress',
      detail:
        'Stress depletes the same self-regulation you use to train and eat well. Zone 2 cardio and walks are prescribed here partly as stress treatment — they pay you back twice.',
    })
  }
  if (lifestyle.timeCrunched) {
    findings.push({
      title: 'Time scarcity',
      detail:
        'Plans fail when they need "finding time". Your sessions are scheduled like meetings — fixed days, fixed slot, and a 15-minute fallback version for chaotic days.',
    })
  }
  if (lifestyle.eveningSnacker) {
    findings.push({
      title: 'Evening snacking',
      detail:
        'Usually a signal of under-eating protein earlier plus habit-loop cueing (couch → screen → snack). We front-load protein and change the cue, rather than relying on resisting it.',
    })
  }
  if (lifestyle.deskJob) {
    findings.push({
      title: 'Desk-bound days',
      detail:
        'Sitting all day silently erases 300–500 kcal of daily movement vs. an active job. A step floor with movement snacks rebuilds it without extra gym time.',
    })
  }
  if (lifestyle.travelsOften) {
    findings.push({
      title: 'Frequent travel',
      detail:
        'Travel breaks environment-dependent routines. You get a location-independent minimum: a 20-minute bodyweight session and a protein-first rule that work in any hotel.',
    })
  }
  if (lifestyle.trainsAlone) {
    findings.push({
      title: 'No accountability structure',
      detail:
        'Training alone with no one noticing makes skipping free. The streak tracker in this app is your accountability — checking the box daily is itself the keystone habit.',
    })
  }
  if (findings.length === 0) {
    findings.push({
      title: 'No major friction flags',
      detail: 'Your lifestyle answers show no obvious consistency killers — your system focuses on making progress automatic and visible.',
    })
  }
  return findings
}

export function buildHabitPlan(profile: Profile): HabitPlan {
  const habits: Habit[] = []
  const { lifestyle } = profile

  habits.push({
    id: 'train_scheduled',
    title: `Train on your ${profile.daysPerWeek} fixed days (10-min minimum counts)`,
    anchor: 'When my training-day alarm goes off, I put on my workout clothes immediately.',
    why: 'Implementation intentions ("when X, I do Y") roughly double follow-through vs. vague plans. The 10-minute minimum keeps the streak alive on bad days — showing up is the habit, volume is a bonus.',
  })
  habits.push({
    id: 'protein_first',
    title: 'Protein anchor at breakfast and lunch',
    anchor: 'When I plan or plate a meal, I place the protein source first.',
    why: 'One decision that quietly hits your protein target, raises satiety and crowds out the foods that cause overshooting.',
  })
  habits.push({
    id: 'daily_weighin',
    title: 'Morning weigh-in',
    anchor: 'After I use the bathroom in the morning, I step on the scale.',
    why: 'Ten seconds. Regular self-weighing is one of the most consistent predictors of long-term weight-management success — and it feeds your adjustment engine.',
  })
  if (lifestyle.deskJob || profile.activityLevel === 'sedentary') {
    habits.push({
      id: 'movement_snack',
      title: 'Movement snack every work block',
      anchor: 'When I finish a meeting or a work block, I stand up and take a 3-minute walk.',
      why: 'Movement snacks restore the NEAT a desk job deletes, improve glucose control after meals, and break the sitting streak that no gym hour can offset.',
    })
  } else {
    habits.push({
      id: 'step_floor',
      title: 'Hit your daily step floor',
      anchor: 'After lunch, I take a 10–15 minute walk before sitting back down.',
      why: 'A post-meal walk is the easiest place to bank steps, and daily movement is the biggest controllable side of energy balance.',
    })
  }
  if (profile.sleepHours < 7) {
    habits.push({
      id: 'sleep_alarm',
      title: 'Wind-down alarm',
      anchor: 'When my 22:00 wind-down alarm rings, I put my phone on the charger outside arm’s reach.',
      why: 'You can’t decide to sleep more at midnight — the decision happens an hour earlier. This single cue is the highest-leverage recovery habit for a short sleeper.',
    })
  }
  if (lifestyle.eveningSnacker) {
    habits.push({
      id: 'evening_swap',
      title: 'Evening cue swap',
      anchor: 'When I sit down for evening TV, I first make tea / grab a high-protein snack I planned.',
      why: 'Habits are cue-driven loops. Replacing the automatic snack with a planned one keeps the ritual and deletes the damage — no willpower required.',
    })
  }

  const principles = [
    'Never miss twice. Missing once is life; missing twice is the start of a new (bad) habit.',
    'Make it smaller before you make it harder — a habit must survive your worst week, not your best.',
    'Expect ~2 months before a habit feels automatic (research average is 66 days). The streaks page is your progress bar.',
    'Design the environment, not the willpower: clothes laid out, protein in the fridge, phone out of the bedroom.',
    'Identity over outcomes: every checked box is a vote for "I am someone who trains".',
  ]

  return { findings: diagnoseFriction(profile), habits: habits.slice(0, 6), principles }
}

/** Current streak (consecutive days up to today) for a habit's checked dates. */
export function currentStreak(checkedDates: string[], todayIso: string): number {
  const set = new Set(checkedDates)
  let streak = 0
  const d = new Date(todayIso + 'T00:00:00Z')
  // Today not checked yet doesn't break the streak — start from yesterday in that case.
  if (!set.has(todayIso)) d.setUTCDate(d.getUTCDate() - 1)
  while (set.has(d.toISOString().slice(0, 10))) {
    streak++
    d.setUTCDate(d.getUTCDate() - 1)
  }
  return streak
}
