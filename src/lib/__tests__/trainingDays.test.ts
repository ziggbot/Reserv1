import { describe, expect, it } from 'vitest'
import { describeWeek, recommendedDays, trainingDays, withTrainingDays } from '../trainingDays'
import { buildWeeklySchedule } from '../weeklySchedule'
import { buildProgram } from '../programs'
import { recommendProgram } from '../programMatrix'
import { threeDayFullBody } from '../threeDayFullBody'
import type { Profile } from '../types'

const legacy: Profile = {
  name: 'Peter', age: 45, sex: 'male', heightCm: 182, weightKg: 92, goal: 'fat_loss', goalWeightKg: 82,
  fitnessLevel: 'intermediate', medicalConditions: [], injuries: [], equipment: 'full_gym', daysPerWeek: 4,
  minutesPerSession: 60, sleepHours: 7, stressLevel: 'moderate', activityLevel: 'light', dietPref: 'omnivore', mealsPerDay: 3,
  lifestyle: { allOrNothing: false, timeCrunched: false, travelsOften: false, eveningSnacker: false, deskJob: true, trainsAlone: false },
}
const split = withTrainingDays(legacy, 3, 2)

describe('trainingDays', () => {
  it('treats an older profile as a total-only budget', () => {
    expect(trainingDays(legacy)).toEqual({ strength: 4, cardio: 0, total: 4, split: false })
    expect(describeWeek(legacy)).toBe('4×/week')
  })
  it('keeps daysPerWeek as the total when strength and cardio are set', () => {
    expect(split.daysPerWeek).toBe(5)
    expect(trainingDays(split)).toEqual({ strength: 3, cardio: 2, total: 5, split: true })
    expect(describeWeek(split)).toBe('3× strength + 2× cardio')
    expect(withTrainingDays(legacy, 6, 4).daysPerWeek).toBe(7)
  })
  it('recommends by level and goal', () => {
    expect(recommendedDays('beginner', 'fat_loss')).toEqual({ strength: [2, 3], cardio: [2, 3] })
    expect(recommendedDays('advanced', 'muscle_gain').strength).toEqual([4, 5])
  })
})

describe('split budget drives the program and the week', () => {
  it('the strength split follows strength days, not the total', () => {
    expect(buildProgram(split).sessions).toHaveLength(3)
    expect(recommendProgram(split).splitName).toBe('Full body ×3')
    expect(buildProgram(withTrainingDays(legacy, 4, 1)).sessions).toHaveLength(4)
  })
  it('every chosen cardio day becomes a scheduled session', () => {
    const s = buildWeeklySchedule(split, threeDayFullBody(split))
    expect(s.days.filter((d) => d.kind === 'strength')).toHaveLength(3)
    expect(s.days.filter((d) => d.kind !== 'strength')).toHaveLength(2)
    expect(s.conditioning.placement).toBe('separate')
    expect(s.days).toHaveLength(5)
  })
  it('zero cardio days folds conditioning into finishers even with a big strength budget', () => {
    const s = buildWeeklySchedule(withTrainingDays(legacy, 4, 0), threeDayFullBody(legacy))
    expect(s.days.every((d) => d.kind === 'strength')).toBe(true)
    expect(s.conditioning.placement).toBe('finisher')
  })
  it('three cardio days are all filled even when the ideal dose is lower', () => {
    const s = buildWeeklySchedule(withTrainingDays({ ...legacy, goal: 'muscle_gain' }, 3, 3), threeDayFullBody(legacy))
    expect(s.days.filter((d) => d.kind !== 'strength')).toHaveLength(3)
  })
})
