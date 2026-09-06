import { describe, expect, it } from 'vitest'
import { buildGrounding, groundingKey } from '../coach/grounding'
import { buildSystemPrompt } from '../coach/prompt'
import { threeDayFullBody } from '../threeDayFullBody'
import type { CompletedWorkout, Profile } from '../types'

const profile: Profile = {
  name: 'Peter', age: 45, sex: 'male', heightCm: 182, weightKg: 92, goal: 'fat_loss', goalWeightKg: 82,
  fitnessLevel: 'intermediate', medicalConditions: [], injuries: [], equipment: 'full_gym', daysPerWeek: 3,
  minutesPerSession: 60, sleepHours: 7, stressLevel: 'moderate', activityLevel: 'light', dietPref: 'omnivore',
  mealsPerDay: 3,
  lifestyle: { allOrNothing: false, timeCrunched: false, travelsOften: false, eveningSnacker: false, deskJob: true, trainsAlone: false },
}

function strength(date: string, sessionName: string, benchKg: number): CompletedWorkout {
  return {
    date, sessionName, category: 'strength', durationMin: 55, totalSets: 6, totalVolumeKg: benchKg * 12 * 3 + 45 * 15 * 3,
    exercises: [
      { name: 'Bänkpress', targetReps: '12', sets: [{ weightKg: benchKg, reps: 12, done: true }, { weightKg: benchKg, reps: 11, done: true }, { weightKg: benchKg, reps: 10, done: true }] },
      { name: 'Knäböj', targetReps: '15', sets: [{ weightKg: 45, reps: 15, done: true }, { weightKg: 45, reps: 15, done: true }, { weightKg: 45, reps: 15, done: true }] },
    ],
  }
}

describe('coach grounding', () => {
  const program = threeDayFullBody(profile)
  const [p1, p2] = program.sessions.map((s) => s.name)
  const input = {
    profile,
    program,
    completedWorkouts: [strength('2026-08-25', p2, 40), strength('2026-09-01', p2, 42.5), { ...strength('2026-09-03', p1, 0), exercises: [] }],
    weighIns: [
      { date: '2026-08-25', weightKg: 92.4 }, { date: '2026-08-27', weightKg: 92.1 }, { date: '2026-08-29', weightKg: 91.9 },
      { date: '2026-09-01', weightKg: 91.6 }, { date: '2026-09-03', weightKg: 91.4 }, { date: '2026-09-05', weightKg: 91.2 },
    ],
    habitChecks: {},
    planStartDate: '2026-08-24',
    planHistory: [{ ts: '2026-09-02T10:00:00Z', source: 'user', description: 'Training days → 3/week' }],
    today: '2026-09-06',
  }

  it('describes rotation, recent sessions with PRs, strength trend and body weight', () => {
    const g = buildGrounding(input)
    expect(g).toContain('Plan week 2')
    expect(g).toContain(`Next session in rotation: ${program.sessions[1].name}`)
    expect(g).toContain('Bänkpress 42.5kg×12 PR')
    expect(g).toContain('Bänkpress 40→42.5 kg (+6%, 2 sessions)')
    expect(g).toContain('latest 91.2 kg (2026-09-05)')
    expect(g).toContain('Recent plan changes: 2026-09-02 Training days → 3/week (user)')
    expect(g).toMatch(/W36: 2 strength/)
  })

  it('lands in the system prompt with a grounding instruction', () => {
    const prompt = buildSystemPrompt({ profile, program, scheduleSummary: 'x', grounding: buildGrounding(input) })
    expect(prompt).toContain('RECENT TRAINING DATA')
    expect(prompt).toContain('Bänkpress 42.5kg×12 PR')
    expect(prompt).toContain('never claim progress the log does not show')
  })

  it('key changes when a workout or weigh-in is added', () => {
    const k1 = groundingKey(input)
    const k2 = groundingKey({ ...input, completedWorkouts: [...input.completedWorkouts, strength('2026-09-06', p1, 42.5)] })
    const k3 = groundingKey({ ...input, weighIns: [...input.weighIns, { date: '2026-09-06', weightKg: 91 }] })
    expect(k1).not.toBe(k2)
    expect(k1).not.toBe(k3)
  })

  it('copes with an empty log', () => {
    const g = buildGrounding({ ...input, completedWorkouts: [], weighIns: [], planHistory: [] })
    expect(g).toContain('No workouts logged yet.')
    expect(g).toContain('no weigh-ins logged yet')
  })
})
