import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import { SEED_MEMORY } from '../lib/threeDayFullBody'
import { trainingDays, withTrainingDays } from '../lib/trainingDays'
import { rawStorage } from './storage'
import { getSession, sessionDecrypt, sessionEncrypt } from './session'
import type { ChatMessage, PlanChange } from '../lib/coach/types'
import { DEFAULT_COACH_SETTINGS, type CoachApiKeys, type CoachSettings } from '../lib/coach'
import type {
  ActiveWorkout,
  ActivityCategory,
  CompletedWorkout,
  Profile,
  WeighIn,
  WorkoutProgram,
  WorkoutSession,
} from '../lib/types'

export interface PlanRevision {
  id: string
  ts: string
  source: 'user' | 'coach' | 'intake'
  description: string
  snapshot: { profile: Profile | null; customProgram: WorkoutProgram | null }
}

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
  | 'programChoice'
  | 'activeWorkout'
  | 'completedWorkouts'
  | 'exerciseMemory'
  | 'coachMessages'
  | 'planHistory'
  | 'coachSettings'
  | 'coachApiKeys'
  | 'coachAssessment'
  | 'customExercises'
>

const INITIAL_DATA: AppData = {
  profile: null,
  planStartDate: null,
  weighIns: [],
  workoutLog: [],
  habitChecks: {},
  customProgram: null,
  programChoice: null,
  activeWorkout: null,
  completedWorkouts: [],
  exerciseMemory: {},
  coachMessages: [],
  planHistory: [],
  coachSettings: DEFAULT_COACH_SETTINGS,
  coachApiKeys: {},
  coachAssessment: null,
  customExercises: [],
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
  /** Which option in Settings → Choose a program is active ('recommended', a preset id, 'imported', 'generated', 'custom'). null = not chosen yet. */
  programChoice: string | null
  activeWorkout: ActiveWorkout | null
  completedWorkouts: CompletedWorkout[]
  /** Last logged sets per exercise name — the prefill source for every future workout. */
  exerciseMemory: Record<string, { weightKg: number | null; reps: number | null }[]>
  coachMessages: ChatMessage[]
  planHistory: PlanRevision[]
  coachSettings: CoachSettings
  coachApiKeys: CoachApiKeys
  /** Latest LLM assessment shown under Progress, keyed to the data it was built from. */
  coachAssessment: CoachAssessment | null
  /** Exercises the user added themselves; offered in the program editor next to the built-in library. */
  customExercises: string[]

  setProfile: (p: Profile) => void
  resetAll: () => void
  addWeighIn: (w: WeighIn) => void
  toggleWorkout: (date: string, sessionName: string) => void
  toggleHabit: (habitId: string, date: string) => void
  setCustomProgram: (p: WorkoutProgram | null, choice: string) => void
  startWorkout: (session: WorkoutSession) => void
  updateActiveSet: (exIdx: number, setIdx: number, patch: Partial<ActiveWorkout['exercises'][number]['sets'][number]>) => void
  addActiveSet: (exIdx: number) => void
  /** Skip (or un-skip) an exercise in the running workout. Skipping clears its done marks. */
  skipActiveExercise: (exIdx: number, skipped: boolean) => void
  cancelWorkout: () => void
  finishWorkout: (nowIso: string) => CompletedWorkout | null
  logActivity: (category: ActivityCategory, name: string, durationMin: number, date: string) => void
  addCoachMessage: (m: ChatMessage) => void
  markProposal: (messageId: string, outcome: 'applied' | 'dismissed') => void
  commitPlanRevision: (source: PlanRevision['source'], description: string) => void
  applyPlanChanges: (changes: PlanChange[], source: PlanRevision['source'], description: string) => void
  restoreRevision: (id: string) => void
  setCoachSettings: (patch: Partial<CoachSettings>) => void
  setCoachApiKey: (provider: 'claude' | 'openai', key: string | undefined) => void
  setCoachAssessment: (a: CoachAssessment | null) => void
  addCustomExercise: (name: string) => string | null
  removeCustomExercise: (name: string) => void
}

export interface CoachAssessment {
  text: string
  at: string // ISO datetime
  key: string // groundingKey() at the time
  provider: string
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

      setCustomProgram: (p, choice) => set({ customProgram: p, programChoice: choice }),

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

      skipActiveExercise: (exIdx, skipped) =>
        set((s) => {
          if (!s.activeWorkout) return s
          const exercises = s.activeWorkout.exercises.map((ex, i) =>
            i !== exIdx
              ? ex
              : { ...ex, skipped, sets: skipped ? ex.sets.map((st) => ({ ...st, done: false })) : ex.sets },
          )
          return { activeWorkout: { ...s.activeWorkout, exercises } }
        }),

      cancelWorkout: () => set({ activeWorkout: null }),

      finishWorkout: (nowIso) => {
        const s = get()
        if (!s.activeWorkout) return null
        const done = s.activeWorkout.exercises
          .filter((ex) => !ex.skipped)
          .map(({ skipped: _skipped, ...ex }) => ({ ...ex, sets: ex.sets.filter((st) => st.done) }))
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

      addCoachMessage: (m) => set((s) => ({ coachMessages: [...s.coachMessages, m] })),

      markProposal: (messageId, outcome) =>
        set((s) => ({
          coachMessages: s.coachMessages.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  proposalApplied: outcome === 'applied' ? true : m.proposalApplied,
                  proposalDismissed: outcome === 'dismissed' ? true : m.proposalDismissed,
                }
              : m,
          ),
        })),

      commitPlanRevision: (source, description) =>
        set((s) => ({
          planHistory: [
            {
              id: revisionId(),
              ts: new Date().toISOString(),
              source,
              description,
              snapshot: { profile: s.profile, customProgram: s.customProgram },
            },
            ...s.planHistory,
          ].slice(0, 50),
        })),

      applyPlanChanges: (changes, source, description) =>
        set((s) => {
          // Snapshot BEFORE applying, so restoring returns to the pre-change plan.
          const revision: PlanRevision = {
            id: revisionId(),
            ts: new Date().toISOString(),
            source,
            description,
            snapshot: { profile: s.profile, customProgram: s.customProgram },
          }
          let profile = s.profile
          let customProgram = s.customProgram
          for (const c of changes) {
            if (!profile && c.type !== 'note') continue
            switch (c.type) {
              case 'daysPerWeek': {
                // Legacy change: the number of lifting days; cardio days are kept.
                const td = trainingDays(profile!)
                profile = withTrainingDays(profile!, c.value, td.split ? td.cardio : 0)
                break
              }
              case 'strengthDaysPerWeek':
                profile = withTrainingDays(profile!, c.value, trainingDays(profile!).cardio)
                break
              case 'cardioDaysPerWeek':
                profile = withTrainingDays(profile!, trainingDays(profile!).strength, c.value)
                break
              case 'minutesPerSession':
                profile = { ...profile!, minutesPerSession: c.value }
                break
              case 'goal':
                profile = { ...profile!, goal: c.value }
                break
              case 'goalWeightKg':
                profile = { ...profile!, goalWeightKg: c.value }
                break
              case 'addExercise': {
                if (!customProgram) break
                customProgram = {
                  ...customProgram,
                  sessions: customProgram.sessions.map((sess, i) =>
                    i === c.sessionIndex
                      ? {
                          ...sess,
                          exercises: [
                            ...sess.exercises,
                            { name: c.name, sets: 3, reps: '8–12', rpe: 'RPE 7–8 (1–3 reps in reserve)' },
                          ],
                        }
                      : sess,
                  ),
                }
                break
              }
              case 'note':
                break // notes are journal-only
            }
          }
          const programChoice = customProgram !== s.customProgram ? 'custom' : s.programChoice
          return { profile, customProgram, programChoice, planHistory: [revision, ...s.planHistory].slice(0, 50) }
        }),

      setCoachSettings: (patch) => set((s) => ({ coachSettings: { ...s.coachSettings, ...patch } })),

      setCoachAssessment: (a) => set({ coachAssessment: a }),

      addCustomExercise: (name) => {
        const clean = name.trim().replace(/\s+/g, ' ')
        if (!clean) return null
        const exists = get().customExercises.find((n) => n.toLowerCase() === clean.toLowerCase())
        if (exists) return exists
        set((s) => ({ customExercises: [...s.customExercises, clean].sort((a, b) => a.localeCompare(b)) }))
        return clean
      },

      removeCustomExercise: (name) =>
        set((s) => ({ customExercises: s.customExercises.filter((n) => n !== name) })),

      setCoachApiKey: (provider, key) =>
        set((s) => {
          const next = { ...s.coachApiKeys }
          if (key && key.trim()) next[provider] = key.trim()
          else delete next[provider]
          return { coachApiKeys: next }
        }),

      restoreRevision: (id) =>
        set((s) => {
          const rev = s.planHistory.find((r) => r.id === id)
          if (!rev) return s
          const current: PlanRevision = {
            id: revisionId(),
            ts: new Date().toISOString(),
            source: 'user',
            description: 'Before restore',
            snapshot: { profile: s.profile, customProgram: s.customProgram },
          }
          return {
            profile: rev.snapshot.profile,
            customProgram: rev.snapshot.customProgram,
            planHistory: [current, ...s.planHistory].slice(0, 50),
          }
        }),
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

/** Apply a cloud row to the current account (device-only secrets are kept). */
export function importCloudState(state: Record<string, unknown>): void {
  const clean: Record<string, unknown> = {}
  for (const k of Object.keys(INITIAL_DATA) as (keyof AppData)[]) {
    if (k === 'coachApiKeys') continue
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

function revisionId(): string {
  const b = new Uint8Array(6)
  crypto.getRandomValues(b)
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
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
