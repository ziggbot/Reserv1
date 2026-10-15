import type { CoachContext } from './types'
import type { CompletedWorkout, Profile, WeighIn, WorkoutProgram } from '../types'
import { useAppStore } from '../../state/store'
import { todayIso } from '../dates'
import { defaultProgram } from '../threeDayFullBody'
import { buildWeeklySchedule } from '../weeklySchedule'
import { exerciseLibrary } from '../programs'
import { buildGrounding } from './grounding'

/** The slice of app data the coach context is built from (same shape on the server). */
export interface CoachSnapshot {
  profile: Profile | null
  customProgram: WorkoutProgram | null
  programChoice: string | null
  customExercises: string[]
  aiProgramLog: { ts: string; summary: string }[]
  completedWorkouts: CompletedWorkout[]
  weighIns: WeighIn[]
  habitChecks: Record<string, string[]>
  planStartDate: string | null
  planHistory: { ts: string; source: string; description: string }[]
}

/** Pure: everything the coach knows from a data snapshot. */
export function coachContextFrom(s: CoachSnapshot, today = todayIso()): CoachContext | null {
  if (!s.profile) return null
  const program = defaultProgram(s.profile, s.customProgram)
  return {
    profile: s.profile,
    program,
    programChoice: s.programChoice ?? (s.customProgram ? 'custom' : 'recommended'),
    scheduleSummary: buildWeeklySchedule(s.profile, program).summaryLine,
    libraryNames: exerciseLibrary(s.profile.equipment, s.profile.injuries).map((l) => l.name),
    customExercises: s.customExercises,
    aiProgramLog: s.aiProgramLog.slice(0, 5).map((e) => `${e.ts.slice(0, 10)}: ${e.summary}`),
    grounding: buildGrounding({
      profile: s.profile,
      program,
      completedWorkouts: s.completedWorkouts,
      weighIns: s.weighIns,
      habitChecks: s.habitChecks,
      planStartDate: s.planStartDate,
      planHistory: s.planHistory,
      today,
    }),
  }
}

/** App wrapper over the live store. */
export function buildCoachContext(): CoachContext | null {
  return coachContextFrom(useAppStore.getState())
}
