import type { CompletedWorkout, Profile, WeighIn, WorkoutProgram } from '../types'
import { analyzeProgress, rollingAverage } from '../fatloss'
import { buildHabitPlan, currentStreak } from '../habits'
import { buildWeeklySchedule } from '../weeklySchedule'
import { addDaysIso, inWeek, isoWeek, nextSession, rollingCycle, startOfWeekIso } from '../trainWeek'
import { bestSets, previousBests, topExerciseTrends } from '../trends'
import { weeksSince } from '../../state/store'

/**
 * Everything the coach needs to know about how training has actually gone:
 * a compact, plain-English digest of the log that is placed in the LLM's
 * system prompt so its answers and its assessment are grounded in real
 * numbers rather than the plan alone. Always English (the model answers in
 * the interface language regardless); names are the stored canonical ones.
 */

export interface GroundingInput {
  profile: Profile
  program: WorkoutProgram
  completedWorkouts: CompletedWorkout[]
  weighIns: WeighIn[]
  habitChecks: Record<string, string[]>
  planStartDate: string | null
  planHistory: { ts: string; source: string; description: string }[]
  today: string
}

/** Changes whenever the data the assessment depends on changes. */
export function groundingKey(input: Pick<GroundingInput, 'completedWorkouts' | 'weighIns' | 'planHistory' | 'today'>): string {
  const lastW = input.completedWorkouts[input.completedWorkouts.length - 1]
  const lastKg = input.weighIns[input.weighIns.length - 1]
  return [
    input.completedWorkouts.length,
    lastW ? `${lastW.date}:${lastW.sessionName}:${lastW.totalVolumeKg}` : '-',
    input.weighIns.length,
    lastKg ? `${lastKg.date}:${lastKg.weightKg}` : '-',
    input.planHistory.length,
    startOfWeekIso(input.today),
  ].join('|')
}

export function buildGrounding(input: GroundingInput): string {
  const { profile, program, completedWorkouts, weighIns, habitChecks, planStartDate, planHistory, today } = input
  const lines: string[] = []

  // --- Plan position and rotation
  const schedule = buildWeeklySchedule(profile, program)
  const cycle = rollingCycle(program, schedule, completedWorkouts)
  const next = nextSession(program, completedWorkouts)
  const planWeek = weeksSince(planStartDate, today) + 1
  lines.push(`Today: ${today}. Plan week ${planWeek}. Program: ${program.splitName} (${program.sessions.map((s) => s.name).join(', ')}).`)
  lines.push(
    `Current rolling training week: ${cycle.doneCount}/${cycle.days.length} sessions done` +
      (cycle.startedOn ? ` (started ${cycle.startedOn})` : '') +
      `. Next session in rotation: ${next.session.name}.`,
  )

  // --- Consistency, last 4 ISO weeks
  const weekStart = startOfWeekIso(today)
  const weekRows: string[] = []
  for (let k = 0; k < 4; k++) {
    const ws = addDaysIso(weekStart, -7 * k)
    const inWk = completedWorkouts.filter((w) => inWeek(w.date, ws))
    const strength = inWk.filter((w) => w.category === 'strength')
    const other = inWk.length - strength.length
    const vol = strength.reduce((a, w) => a + w.totalVolumeKg, 0)
    weekRows.push(`W${isoWeek(ws)}: ${strength.length} strength (${vol.toLocaleString('en-US')} kg volume)${other ? `, ${other} cardio/other` : ''}`)
  }
  lines.push(`Sessions per week, newest first (planned ${profile.daysPerWeek}/week): ${weekRows.join(' · ')}.`)

  // --- Last sessions in detail
  const recent = completedWorkouts.slice(-6).reverse()
  if (recent.length === 0) {
    lines.push('No workouts logged yet.')
  } else {
    lines.push('Most recent sessions (newest first):')
    for (const w of recent) {
      const idx = completedWorkouts.lastIndexOf(w)
      if (w.category !== 'strength' || w.exercises.length === 0) {
        lines.push(`- ${w.date} ${w.sessionName} [${w.category}] ${w.durationMin} min`)
        continue
      }
      const prev = previousBests(completedWorkouts, idx)
      const sets = bestSets(w).map((b) => {
        const pr = b.weightKg > 0 && b.weightKg > (prev.get(b.name) ?? 0) ? ' PR' : ''
        return `${b.name} ${b.weightKg}kg×${b.reps}${pr}`
      })
      lines.push(`- ${w.date} ${w.sessionName}: ${w.durationMin} min, ${w.totalSets} sets, ${w.totalVolumeKg.toLocaleString('en-US')} kg. Best sets: ${sets.join('; ')}`)
    }
  }

  // --- Strength trends
  const trends = topExerciseTrends(completedWorkouts, 8)
  if (trends.length > 0) {
    lines.push(
      'Strength trend (best set first → latest): ' +
        trends
          .map((t) => {
            const pct = t.first > 0 ? Math.round(((t.last - t.first) / t.first) * 100) : 0
            return `${t.name} ${t.first}→${t.last} kg (${pct >= 0 ? '+' : ''}${pct}%, ${t.sessions} sessions)`
          })
          .join('; '),
    )
  }

  // --- Body weight
  if (weighIns.length > 0) {
    const last = weighIns[weighIns.length - 1]
    const avg = rollingAverage(weighIns, today)
    const analysis = analyzeProgress(weighIns, today, profile.weightKg, weeksSince(planStartDate, today))
    const goal = profile.goalWeightKg ? `, goal ${profile.goalWeightKg} kg` : ''
    lines.push(
      `Body weight: latest ${last.weightKg} kg (${last.date}), 7-day average ${avg ?? 'n/a'} kg, change vs previous week ${analysis.weeklyChangeKg ?? 'n/a'} kg, target ${analysis.targetWeeklyChangeKg} kg/week, status ${analysis.status}, ${weighIns.length} weigh-ins, plan start weight ${profile.weightKg} kg${goal}.`,
    )
  } else {
    lines.push('Body weight: no weigh-ins logged yet.')
  }

  // --- Habits
  const streaks = buildHabitPlan(profile)
    .habits.map((h) => ({ title: h.title, streak: currentStreak(habitChecks[h.id] ?? [], today) }))
    .filter((s) => s.streak > 0)
  if (streaks.length > 0) lines.push(`Habit streaks: ${streaks.map((s) => `${s.title} ${s.streak}d`).join('; ')}.`)

  // --- Recent plan changes
  const changes = planHistory.slice(0, 3)
  if (changes.length > 0) {
    lines.push(`Recent plan changes: ${changes.map((c) => `${c.ts.slice(0, 10)} ${c.description} (${c.source})`).join('; ')}.`)
  }

  return lines.join('\n')
}
