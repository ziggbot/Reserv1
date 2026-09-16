import type { CoachContext } from './types'
import { useAppStore, todayIso } from '../../state/store'
import { defaultProgram } from '../threeDayFullBody'
import { buildWeeklySchedule } from '../weeklySchedule'
import { exerciseLibrary } from '../programs'
import { buildGrounding } from './grounding'

/** One place that assembles what the coach knows: profile, program, library, log digest. */
export function buildCoachContext(): CoachContext | null {
  const s = useAppStore.getState()
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
      today: todayIso(),
    }),
  }
}
