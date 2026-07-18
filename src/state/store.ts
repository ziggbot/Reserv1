import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type {
  ActiveWorkout,
  CompletedWorkout,
  Profile,
  WeighIn,
  WorkoutProgram,
  WorkoutSession,
} from '../lib/types'

/** localStorage when available; in-memory fallback for sandboxed embeds (e.g. hosted preview). */
function safeStorage(): Storage {
  try {
    const probe = '__fitblueprint_probe__'
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    return window.localStorage
  } catch {
    const mem = new Map<string, string>()
    return {
      get length() {
        return mem.size
      },
      clear: () => mem.clear(),
      getItem: (k: string) => mem.get(k) ?? null,
      key: (i: number) => [...mem.keys()][i] ?? null,
      removeItem: (k: string) => void mem.delete(k),
      setItem: (k: string, v: string) => void mem.set(k, v),
    }
  }
}

export interface WorkoutLogEntry {
  date: string
  sessionName: string
}

interface AppState {
  profile: Profile | null
  planStartDate: string | null
  weighIns: WeighIn[]
  workoutLog: WorkoutLogEntry[]
  habitChecks: Record<string, string[]> // habitId -> ISO dates
  customProgram: WorkoutProgram | null // null = follow the profile-generated program
  activeWorkout: ActiveWorkout | null
  completedWorkouts: CompletedWorkout[]

  setProfile: (p: Profile) => void
  resetAll: () => void
  addWeighIn: (w: WeighIn) => void
  toggleWorkout: (date: string, sessionName: string) => void
  toggleHabit: (habitId: string, date: string) => void
  setCustomProgram: (p: WorkoutProgram | null) => void
  startWorkout: (session: WorkoutSession, lastTime?: CompletedWorkout) => void
  updateActiveSet: (exIdx: number, setIdx: number, patch: Partial<ActiveWorkout['exercises'][number]['sets'][number]>) => void
  addActiveSet: (exIdx: number) => void
  cancelWorkout: () => void
  finishWorkout: (nowIso: string) => CompletedWorkout | null
}

export function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      profile: null,
      planStartDate: null,
      weighIns: [],
      workoutLog: [],
      habitChecks: {},
      customProgram: null,
      activeWorkout: null,
      completedWorkouts: [],

      setProfile: (p) =>
        set((s) => ({ profile: p, planStartDate: s.planStartDate ?? todayIso() })),

      resetAll: () =>
        set({
          profile: null,
          planStartDate: null,
          weighIns: [],
          workoutLog: [],
          habitChecks: {},
          customProgram: null,
          activeWorkout: null,
          completedWorkouts: [],
        }),

      addWeighIn: (w) =>
        set((s) => ({
          weighIns: [...s.weighIns.filter((x) => x.date !== w.date), w].sort((a, b) =>
            a.date.localeCompare(b.date),
          ),
        })),

      toggleWorkout: (date, sessionName) =>
        set((s) => {
          const exists = s.workoutLog.some((e) => e.date === date && e.sessionName === sessionName)
          return {
            workoutLog: exists
              ? s.workoutLog.filter((e) => !(e.date === date && e.sessionName === sessionName))
              : [...s.workoutLog, { date, sessionName }],
          }
        }),

      toggleHabit: (habitId, date) =>
        set((s) => {
          const dates = s.habitChecks[habitId] ?? []
          const next = dates.includes(date) ? dates.filter((d) => d !== date) : [...dates, date]
          return { habitChecks: { ...s.habitChecks, [habitId]: next } }
        }),

      setCustomProgram: (p) => set({ customProgram: p }),

      startWorkout: (session, lastTime) =>
        set({
          activeWorkout: {
            sessionName: session.name,
            startedAt: new Date().toISOString(),
            exercises: session.exercises.map((ex) => {
              const prev = lastTime?.exercises.find((e) => e.name === ex.name)
              const setCount = Math.max(ex.sets, prev?.sets.length ?? 0)
              return {
                name: ex.name,
                targetReps: ex.reps,
                sets: Array.from({ length: setCount }, (_, i) => ({
                  weightKg: prev?.sets[i]?.weightKg ?? null,
                  reps: prev?.sets[i]?.reps ?? null,
                  done: false,
                })),
              }
            }),
          },
        }),

      updateActiveSet: (exIdx, setIdx, patch) =>
        set((s) => {
          if (!s.activeWorkout) return s
          const exercises = s.activeWorkout.exercises.map((ex, i) =>
            i !== exIdx
              ? ex
              : { ...ex, sets: ex.sets.map((st, j) => (j !== setIdx ? st : { ...st, ...patch })) },
          )
          return { activeWorkout: { ...s.activeWorkout, exercises } }
        }),

      addActiveSet: (exIdx) =>
        set((s) => {
          if (!s.activeWorkout) return s
          const exercises = s.activeWorkout.exercises.map((ex, i) => {
            if (i !== exIdx) return ex
            const last = ex.sets[ex.sets.length - 1]
            return { ...ex, sets: [...ex.sets, { weightKg: last?.weightKg ?? null, reps: last?.reps ?? null, done: false }] }
          })
          return { activeWorkout: { ...s.activeWorkout, exercises } }
        }),

      cancelWorkout: () => set({ activeWorkout: null }),

      finishWorkout: (nowIso) => {
        const s = get()
        if (!s.activeWorkout) return null
        const done = s.activeWorkout.exercises
          .map((ex) => ({ ...ex, sets: ex.sets.filter((st) => st.done) }))
          .filter((ex) => ex.sets.length > 0)
        const totalVolumeKg = Math.round(
          done.reduce(
            (acc, ex) => acc + ex.sets.reduce((a, st) => a + (st.weightKg ?? 0) * (st.reps ?? 0), 0),
            0,
          ),
        )
        const durationMin = Math.max(
          1,
          Math.round((Date.now() - new Date(s.activeWorkout.startedAt).getTime()) / 60000),
        )
        const completed: CompletedWorkout = {
          date: nowIso,
          sessionName: s.activeWorkout.sessionName,
          durationMin,
          exercises: done,
          totalVolumeKg,
          totalSets: done.reduce((a, ex) => a + ex.sets.length, 0),
        }
        set({
          activeWorkout: null,
          completedWorkouts: [...s.completedWorkouts, completed],
          workoutLog: s.workoutLog.some((e) => e.date === nowIso && e.sessionName === completed.sessionName)
            ? s.workoutLog
            : [...s.workoutLog, { date: nowIso, sessionName: completed.sessionName }],
        })
        return completed
      },
    }),
    { name: 'fitblueprint-v1', storage: createJSONStorage(safeStorage) },
  ),
)

export function weeksSince(startIso: string | null, todayIsoStr: string): number {
  if (!startIso) return 0
  const ms = new Date(todayIsoStr + 'T00:00:00Z').getTime() - new Date(startIso + 'T00:00:00Z').getTime()
  return Math.max(0, Math.floor(ms / (7 * 86400000)))
}
