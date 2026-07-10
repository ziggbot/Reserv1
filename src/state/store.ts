import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Profile, WeighIn } from '../lib/types'

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

  setProfile: (p: Profile) => void
  resetAll: () => void
  addWeighIn: (w: WeighIn) => void
  toggleWorkout: (date: string, sessionName: string) => void
  toggleHabit: (habitId: string, date: string) => void
}

export function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      profile: null,
      planStartDate: null,
      weighIns: [],
      workoutLog: [],
      habitChecks: {},

      setProfile: (p) =>
        set((s) => ({ profile: p, planStartDate: s.planStartDate ?? todayIso() })),

      resetAll: () =>
        set({ profile: null, planStartDate: null, weighIns: [], workoutLog: [], habitChecks: {} }),

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
    }),
    { name: 'fitblueprint-v1' },
  ),
)

export function weeksSince(startIso: string | null, todayIsoStr: string): number {
  if (!startIso) return 0
  const ms = new Date(todayIsoStr + 'T00:00:00Z').getTime() - new Date(startIso + 'T00:00:00Z').getTime()
  return Math.max(0, Math.floor(ms / (7 * 86400000)))
}
