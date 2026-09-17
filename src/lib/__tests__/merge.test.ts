import { describe, expect, it } from 'vitest'
import { mergeAppData, stableJson } from '../cloud/merge'

const w = (date: string, sessionName: string, vol = 100) => ({ date, sessionName, category: 'strength', durationMin: 50, totalVolumeKg: vol, totalSets: 6, exercises: [] })

describe('mergeAppData', () => {
  const local = {
    profile: { name: 'Local', weightKg: 90 },
    weighIns: [{ date: '2026-09-10', weightKg: 91 }, { date: '2026-09-12', weightKg: 90.5 }],
    completedWorkouts: [w('2026-09-10', 'A'), w('2026-09-12', 'B')],
    workoutLog: [{ date: '2026-09-10', sessionName: 'A' }],
    habitChecks: { h1: ['2026-09-10'] },
    coachMessages: [{ id: 'm1', ts: '2026-09-10T10:00:00Z', text: 'hi' }],
    planHistory: [{ id: 'r1', ts: '2026-09-10T10:00:00Z' }],
    customExercises: ['Hacklift'],
    exerciseMemory: { Bench: [{ weightKg: 40, reps: 10 }] },
    programChoice: 'ai',
    activeWorkout: null,
  }
  const remote = {
    profile: { name: 'Remote', weightKg: 89 },
    weighIns: [{ date: '2026-09-11', weightKg: 90.8 }, { date: '2026-09-12', weightKg: 90.2 }],
    completedWorkouts: [w('2026-09-10', 'A'), w('2026-09-11', 'C')],
    workoutLog: [{ date: '2026-09-11', sessionName: 'C' }],
    habitChecks: { h1: ['2026-09-11'], h2: ['2026-09-11'] },
    coachMessages: [{ id: 'm2', ts: '2026-09-11T10:00:00Z', text: 'yo' }],
    planHistory: [{ id: 'r2', ts: '2026-09-11T10:00:00Z' }],
    customExercises: ['Cable crunch'],
    exerciseMemory: { Bench: [{ weightKg: 42.5, reps: 10 }], Squat: [{ weightKg: 60, reps: 8 }] },
    programChoice: 'recommended',
    activeWorkout: { sessionName: 'C' },
  }

  it('unions collections and takes single values from the newer side', () => {
    const m = mergeAppData(local, remote, true)
    expect((m.profile as { name: string }).name).toBe('Remote')
    expect((m.weighIns as { date: string; weightKg: number }[]).map((x) => `${x.date}:${x.weightKg}`)).toEqual([
      '2026-09-10:91', '2026-09-11:90.8', '2026-09-12:90.2',
    ])
    expect((m.completedWorkouts as { sessionName: string }[]).map((x) => x.sessionName)).toEqual(['A', 'C', 'B'])
    expect(m.workoutLog).toHaveLength(2)
    expect(m.habitChecks).toEqual({ h1: ['2026-09-10', '2026-09-11'], h2: ['2026-09-11'] })
    expect((m.coachMessages as { id: string }[]).map((x) => x.id)).toEqual(['m1', 'm2'])
    expect((m.planHistory as { id: string }[]).map((x) => x.id)).toEqual(['r2', 'r1'])
    expect(m.customExercises).toEqual(['Cable crunch', 'Hacklift'])
    expect((m.exerciseMemory as Record<string, unknown[]>).Bench).toEqual([{ weightKg: 42.5, reps: 10 }])
    expect((m.exerciseMemory as Record<string, unknown[]>).Squat).toBeDefined()
    expect(m.programChoice).toBe('recommended')
    expect(m.activeWorkout).toEqual({ sessionName: 'C' })
  })
  it('flips the tie-break when local is newer', () => {
    const m = mergeAppData(local, remote, false)
    expect((m.profile as { name: string }).name).toBe('Local')
    expect((m.weighIns as { date: string; weightKg: number }[]).find((x) => x.date === '2026-09-12')?.weightKg).toBe(90.5)
    expect(m.programChoice).toBe('ai')
    expect(m.activeWorkout).toEqual({ sessionName: 'C' }) // the only device with one in progress
  })
  it('is idempotent and stableJson ignores key order', () => {
    const once = mergeAppData(local, remote, true)
    const twice = mergeAppData(once, remote, true)
    expect(stableJson(once)).toBe(stableJson(twice))
    expect(stableJson({ b: 1, a: [{ y: 2, x: 1 }] })).toBe(stableJson({ a: [{ x: 1, y: 2 }], b: 1 }))
  })
})
