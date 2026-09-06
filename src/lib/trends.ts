import type { CompletedWorkout } from './types'

export interface ExerciseTrend {
  name: string
  first: number
  last: number
  sessions: number
}

/** Best-set weight trend for the most-logged exercises (first vs latest best set). */
export function topExerciseTrends(workouts: Pick<CompletedWorkout, 'exercises'>[], limit = 6): ExerciseTrend[] {
  const byExercise = new Map<string, number[]>()
  for (const w of workouts) {
    for (const ex of w.exercises) {
      const best = ex.sets.reduce((b, s) => Math.max(b, s.weightKg ?? 0), 0)
      if (best <= 0) continue
      byExercise.set(ex.name, [...(byExercise.get(ex.name) ?? []), best])
    }
  }
  return [...byExercise.entries()]
    .filter(([, arr]) => arr.length >= 2)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, limit)
    .map(([name, arr]) => ({ name, first: arr[0], last: arr[arr.length - 1], sessions: arr.length }))
}

/** Heaviest set (kg × reps) per exercise in one workout. */
export function bestSets(workout: CompletedWorkout): { name: string; weightKg: number; reps: number }[] {
  return workout.exercises.map((ex) => {
    const best = ex.sets.reduce(
      (b, s) => ((s.weightKg ?? 0) > (b.weightKg ?? 0) ? s : b),
      ex.sets[0] ?? { weightKg: null, reps: null, done: true },
    )
    return { name: ex.name, weightKg: best.weightKg ?? 0, reps: best.reps ?? 0 }
  })
}

/** Best weight ever lifted per exercise before (not including) the given workout index. */
export function previousBests(workouts: CompletedWorkout[], beforeIndex: number): Map<string, number> {
  const best = new Map<string, number>()
  for (let i = 0; i < beforeIndex; i++) {
    for (const ex of workouts[i].exercises) {
      const w = ex.sets.reduce((b, s) => Math.max(b, s.weightKg ?? 0), 0)
      if (w > (best.get(ex.name) ?? 0)) best.set(ex.name, w)
    }
  }
  return best
}
