import { describe, expect, it } from 'vitest'
import { addDaysIso, estimateMinutes, inWeek, nextSession, startOfWeekIso, weekStatus } from '../trainWeek'
import { threeDayFullBody } from '../threeDayFullBody'
import { buildWeeklySchedule } from '../weeklySchedule'
import type { CompletedWorkout, Profile } from '../types'

const profile: Profile = {
  name: 'Peter',
  age: 38,
  sex: 'male',
  heightCm: 182,
  weightKg: 92,
  goal: 'fat_loss',
  goalWeightKg: 82,
  fitnessLevel: 'intermediate',
  medicalConditions: [],
  injuries: [],
  equipment: 'full_gym',
  daysPerWeek: 4,
  minutesPerSession: 60,
  sleepHours: 7,
  stressLevel: 'moderate',
  activityLevel: 'light',
  dietPref: 'omnivore',
  mealsPerDay: 3,
  lifestyle: {
    allOrNothing: false,
    timeCrunched: false,
    travelsOften: false,
    eveningSnacker: false,
    deskJob: true,
    trainsAlone: false,
  },
}

function done(date: string, sessionName: string, category: CompletedWorkout['category'] = 'strength'): CompletedWorkout {
  return { date, sessionName, category, durationMin: 50, exercises: [], totalVolumeKg: 0, totalSets: 0 }
}

describe('week boundaries', () => {
  it('starts the week on Monday', () => {
    expect(startOfWeekIso('2026-09-04')).toBe('2026-08-31') // Friday → Monday
    expect(startOfWeekIso('2026-08-31')).toBe('2026-08-31') // Monday stays
    expect(startOfWeekIso('2026-09-06')).toBe('2026-08-31') // Sunday belongs to the same week
  })
  it('adds days across month ends', () => {
    expect(addDaysIso('2026-08-31', 7)).toBe('2026-09-07')
  })
  it('inWeek is a half-open 7-day range', () => {
    expect(inWeek('2026-08-31', '2026-08-31')).toBe(true)
    expect(inWeek('2026-09-06', '2026-08-31')).toBe(true)
    expect(inWeek('2026-09-07', '2026-08-31')).toBe(false)
    expect(inWeek('2026-08-30', '2026-08-31')).toBe(false)
  })
})

describe('nextSession rotation', () => {
  const program = threeDayFullBody(profile)
  const [p1, p2, p3] = program.sessions.map((s) => s.name)

  it('starts at session 1 with no history', () => {
    const n = nextSession(program, [])
    expect(n.index).toBe(0)
    expect(n.previousName).toBeNull()
  })
  it('advances after the last completed program session and wraps', () => {
    expect(nextSession(program, [done('2026-09-01', p1)]).session.name).toBe(p2)
    expect(nextSession(program, [done('2026-09-01', p1), done('2026-09-03', p3)]).session.name).toBe(p1)
  })
  it('ignores cardio and sessions from an older program', () => {
    const history = [done('2026-09-01', p2), done('2026-09-02', 'Zone-2 cardio', 'cardio'), done('2026-09-03', 'Old upper day')]
    expect(nextSession(program, history).session.name).toBe(p3)
  })
})

describe('weekStatus', () => {
  const program = threeDayFullBody(profile)
  const schedule = buildWeeklySchedule(profile, program)

  it('ticks strength days by name and conditioning days in order, only for this week', () => {
    const history = [
      done('2026-08-28', program.sessions[0].name), // last week — ignored
      done('2026-09-01', program.sessions[1].name),
      done('2026-09-02', 'Zone-2 cardio', 'cardio'),
    ]
    const status = weekStatus(schedule, history, '2026-08-31')
    const strength = status.filter((d) => d.kind === 'strength')
    expect(strength.find((d) => d.title === program.sessions[0].name)?.done).toBe(false)
    expect(strength.find((d) => d.title === program.sessions[1].name)?.done).toBe(true)
    const conditioning = status.filter((d) => d.kind !== 'strength')
    expect(conditioning.length).toBeGreaterThan(0)
    expect(conditioning[0].done).toBe(true)
    expect(conditioning.slice(1).every((d) => !d.done)).toBe(true)
  })
})

describe('estimateMinutes', () => {
  it('scales with set count and respects the session cap', () => {
    const program = threeDayFullBody(profile)
    expect(estimateMinutes(program.sessions[0], 60)).toBe(60) // 27 sets → capped
    expect(estimateMinutes(program.sessions[2], 90)).toBe(65) // 18 sets → 64 → 65
  })
})
