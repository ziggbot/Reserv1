import type { CompletedWorkout, WorkoutProgram, WorkoutSession } from './types'
import type { ScheduledDay, WeeklySchedule } from './weeklySchedule'

/**
 * Pure helpers behind the "Let's train" home screen: which session is next in
 * the rotation, and how far through the current (Monday-based) week you are.
 */

/** ISO date (yyyy-mm-dd) of the Monday that starts the week containing `iso`. */
export function startOfWeekIso(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z')
  const dow = (d.getUTCDay() + 6) % 7 // Monday = 0 … Sunday = 6
  d.setUTCDate(d.getUTCDate() - dow)
  return d.toISOString().slice(0, 10)
}

export function addDaysIso(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function inWeek(dateIso: string, weekStartIso: string): boolean {
  return dateIso >= weekStartIso && dateIso < addDaysIso(weekStartIso, 7)
}

export interface NextSession {
  session: WorkoutSession
  index: number
  /** Name of the last program session you completed, if any. */
  previousName: string | null
}

/**
 * Next session in the program rotation: the one after the most recently
 * completed program session. Sessions completed on an older program (names
 * that no longer exist) are ignored, so a program swap restarts at session 1.
 */
export function nextSession(program: WorkoutProgram, completed: CompletedWorkout[]): NextSession {
  const names = program.sessions.map((s) => s.name)
  for (let i = completed.length - 1; i >= 0; i--) {
    const w = completed[i]
    if (w.category !== 'strength') continue
    const idx = names.indexOf(w.sessionName)
    if (idx === -1) continue
    const next = (idx + 1) % program.sessions.length
    return { session: program.sessions[next], index: next, previousName: w.sessionName }
  }
  return { session: program.sessions[0], index: 0, previousName: null }
}

export interface WeekDayStatus extends ScheduledDay {
  done: boolean
}

/**
 * Marks each scheduled day as done for the current week. Strength days match
 * by session name; conditioning days are ticked off in order by the number of
 * cardio/endurance sessions logged this week.
 */
export function weekStatus(
  schedule: WeeklySchedule,
  completed: CompletedWorkout[],
  weekStartIso: string,
): WeekDayStatus[] {
  const thisWeek = completed.filter((w) => inWeek(w.date, weekStartIso))
  const strengthDone = new Set(thisWeek.filter((w) => w.category === 'strength').map((w) => w.sessionName))
  let conditioningLeft = thisWeek.filter((w) => w.category === 'cardio' || w.category === 'endurance').length

  return schedule.days.map((day) => {
    if (day.kind === 'strength') return { ...day, done: strengthDone.has(day.title) }
    if (conditioningLeft > 0) {
      conditioningLeft--
      return { ...day, done: true }
    }
    return { ...day, done: false }
  })
}

/** Rough session length from the prescription: ~3 min per working set + 10 min warm-up/finisher. */
export function estimateMinutes(session: WorkoutSession, cap: number): number {
  const sets = session.exercises.reduce((a, e) => a + e.sets, 0)
  return Math.min(cap, Math.max(20, Math.round((sets * 3 + 10) / 5) * 5))
}
