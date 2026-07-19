import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import { SEED_MEMORY } from '../lib/threeDayFullBody'
import { rawStorage } from './storage'
import { getSession, sessionDecrypt, sessionEncrypt } from './session'
import type {
  ActiveWorkout,
  ActivityCategory,
  CompletedWorkout,
  Profile,
  WeighIn,
  WorkoutProgram,
  WorkoutSession,
} from '../lib/types'

/**
 * Per-user encrypted storage adapter. Values are encrypted with the unlocked
 * account's key before being written; reads decrypt with the same key. Before
 * an account is unlocked there is no session, so reads return null and writes
 * are dropped — the store simply holds defaults.
 */
const encryptedStorage: StateStorage = {
  getItem: async (name) => {
    if (!getSession()) return null
    const stored = rawStorage.getItem(name)
    if (stored === null) return null
    return sessionDecrypt(stored)
  },
  setItem: async (name, value) => {
    if (!getSession()) return
    rawStorage.setItem(name, await sessionEncrypt(value))
  },
  removeItem: async (name) => {
    rawStorage.removeItem(name)
  },
}

type AppData = Pick<
  AppState,
  | 'profile'
  | 'planStartDate'
  | 'weighIns'
  | 'workoutLog'
  | 'habitChecks'
  | 'customProgram'
  | 'activeWorkout'
  | 'completedWorkouts'
  | 'exerciseMemory'
>

const INITIAL_DATA: AppData = {
  profile: null,
  planStartDate: null,
  weighIns: [],
  workoutLog: [],
  habitChecks: {},
  customProgram: null,
  activeWorkout: null,
  completedWorkouts: [],
  exerciseMemory: {},
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
  /** Last logged sets per exercise name — the prefill source for every future workout. */
  exerciseMemory: Record<string, { weightKg: number | null; reps: number | null }[]>

  setProfile: (p: Profile) => void
  resetAll: () => void
  addWeighIn: (w: WeighIn) => void
  toggleWorkout: (date: string, sessionName: string) => void
  toggleHabit: (habitId: string, date: string) => void
  setCustomProgram: (p: WorkoutProgram | null) => void
  startWorkout: (session: WorkoutSession) => void
  updateActiveSet: (exIdx: number, setIdx: number, patch: Partial<ActiveWorkout['exercises'][number]['sets'][number]>) => void
  addActiveSet: (exIdx: number) => void
  cancelWorkout: () => void
  finishWorkout: (nowIso: string) => CompletedWorkout | null
  logActivity: (category: ActivityCategory, name: string, durationMin: number, date: string) => void
}

export function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...INITIAL_DATA,

      setProfile: (p) =>
        set((s) => ({ profile: p, planStartDate: s.planStartDate ?? todayIso() })),

      resetAll: () => set({ ...INITIAL_DATA }),

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

      startWorkout: (session) => {
        const memory = get().exerciseMemory
        set({
          activeWorkout: {
            sessionName: session.name,
            startedAt: new Date().toISOString(),
            exercises: session.exercises.map((ex) => {
              // Prefill priority: logged history → seeded defaults from the user's
              // imported program → rep target. Same set index first, then last set.
              const prev = memory[ex.name] ?? SEED_MEMORY[ex.name]
              const lastSet = prev?.[prev.length - 1]
              const targetReps = firstNumber(ex.reps)
              const setCount = Math.max(ex.sets, prev?.length ?? 0)
              return {
                name: ex.name,
                targetReps: ex.reps,
                linkUrl: ex.linkUrl,
                sets: Array.from({ length: setCount }, (_, i) => ({
                  weightKg: prev?.[i]?.weightKg ?? lastSet?.weightKg ?? null,
                  reps: prev?.[i]?.reps ?? lastSet?.reps ?? targetReps,
                  done: false,
                })),
              }
            }),
          },
        })
      },

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
          category: 'strength',
          durationMin,
          exercises: done,
          totalVolumeKg,
          totalSets: done.reduce((a, ex) => a + ex.sets.length, 0),
        }
        const exerciseMemory = { ...s.exerciseMemory }
        for (const ex of done) {
          exerciseMemory[ex.name] = ex.sets.map((st) => ({ weightKg: st.weightKg, reps: st.reps }))
        }
        set({
          activeWorkout: null,
          exerciseMemory,
          completedWorkouts: [...s.completedWorkouts, completed],
          workoutLog: s.workoutLog.some((e) => e.date === nowIso && e.sessionName === completed.sessionName)
            ? s.workoutLog
            : [...s.workoutLog, { date: nowIso, sessionName: completed.sessionName }],
        })
        return completed
      },

      logActivity: (category, name, durationMin, date) =>
        set((s) => ({
          completedWorkouts: [
            ...s.completedWorkouts,
            {
              date,
              sessionName: name,
              category,
              durationMin,
              exercises: [],
              totalVolumeKg: 0,
              totalSets: 0,
            },
          ],
          workoutLog: s.workoutLog.some((e) => e.date === date && e.sessionName === name)
            ? s.workoutLog
            : [...s.workoutLog, { date, sessionName: name }],
        })),
    }),
    {
      name: 'fitblueprint-unbound', // real per-user name is set on unlock
      storage: createJSONStorage(() => encryptedStorage),
      skipHydration: true, // nothing to hydrate until an account is unlocked
    },
  ),
)

/** Point the store at an unlocked account and load its (decrypted) data. */
export async function bindAccountStorage(storageName: string): Promise<void> {
  useAppStore.setState({ ...INITIAL_DATA }) // clear any previous account's state
  useAppStore.persist.setOptions({ name: storageName })
  await useAppStore.persist.rehydrate()
}

/** Import plaintext state from the pre-accounts version into the current account. */
export function importLegacyState(state: Partial<Record<keyof AppData, unknown>>): void {
  const clean: Record<string, unknown> = {}
  for (const k of Object.keys(INITIAL_DATA) as (keyof AppData)[]) {
    if (state[k] !== undefined) clean[k] = state[k]
  }
  useAppStore.setState(clean as Partial<AppState>)
}

/** Everything worth exporting for GDPR data portability (no functions). */
export function exportableState(): Record<string, unknown> {
  const s = useAppStore.getState()
  const out: Record<string, unknown> = {}
  for (const k of Object.keys(INITIAL_DATA) as (keyof AppData)[]) {
    out[k] = s[k]
  }
  return out
}

/** First integer in a rep-target string, e.g. "8–12" → 8. Used as the reps prefill before any history exists. */
function firstNumber(s: string): number | null {
  const m = s.match(/\d+/)
  return m ? Number(m[0]) : null
}

export function weeksSince(startIso: string | null, todayIsoStr: string): number {
  if (!startIso) return 0
  const ms = new Date(todayIsoStr + 'T00:00:00Z').getTime() - new Date(startIso + 'T00:00:00Z').getTime()
  return Math.max(0, Math.floor(ms / (7 * 86400000)))
}
