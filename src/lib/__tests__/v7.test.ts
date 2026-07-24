import { describe, expect, it } from 'vitest'
import { buildWeeklySchedule } from '../weeklySchedule'
import { buildOverview } from '../overview'
import { threeDayFullBody } from '../threeDayFullBody'
import { localCoach } from '../coach/localCoach'
import { useAppStore } from '../../state/store'
import type { Profile } from '../types'

const base: Profile = {
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

const scheduleFor = (p: Profile) => buildWeeklySchedule(p, threeDayFullBody(p))

describe('weeklySchedule respects the day budget', () => {
  it('2-day budget → exactly 2 strength days, no separate conditioning day', () => {
    const s = scheduleFor({ ...base, daysPerWeek: 2 })
    expect(s.days).toHaveLength(2)
    expect(s.days.every((d) => d.kind === 'strength')).toBe(true)
    expect(s.conditioning.placement).toBe('finisher')
    expect(s.conditioning.hiitPerWeek).toBe(0)
    expect(s.conditioning.zone2PerWeek).toBe(0)
    // total prescribed sessions never exceed the budget
    expect(s.days.length).toBeLessThanOrEqual(2)
  })

  it('2-day budget with a 3-session program adds a rotation note', () => {
    const s = scheduleFor({ ...base, daysPerWeek: 2 })
    expect(s.rotationNote).toMatch(/rotate/i)
  })

  it('4-day budget fits strength + conditioning within 4 days', () => {
    const s = scheduleFor({ ...base, daysPerWeek: 4 })
    expect(s.days.length).toBeLessThanOrEqual(4)
    const strength = s.days.filter((d) => d.kind === 'strength').length
    const cond = s.days.filter((d) => d.kind !== 'strength').length
    expect(strength).toBe(3)
    expect(strength + cond).toBeLessThanOrEqual(4)
    expect(s.conditioning.placement).toBe('separate')
  })

  it('hypertension → no HIIT day even when there is room', () => {
    const s = scheduleFor({ ...base, daysPerWeek: 5, medicalConditions: ['hypertension'] })
    expect(s.days.some((d) => d.kind === 'hiit')).toBe(false)
  })
})

describe('overview never over-prescribes vs. the budget', () => {
  it('2-day fat-loss user is not told to do 2 lifts + separate cardio + HIIT', () => {
    const p = { ...base, daysPerWeek: 2 }
    const text = buildOverview(p, threeDayFullBody(p))
      .map((d) => `${d.headline} ${d.detail}`)
      .join(' ')
    expect(text).not.toMatch(/2× zone 2 \+ 1× HIIT/)
    expect(text).toMatch(/finisher/i) // conditioning folded, not a phantom session
  })
})

describe('localCoach intents', () => {
  const ctx = { profile: base, program: threeDayFullBody(base), scheduleSummary: '' }
  const ask = async (text: string, profile = base) =>
    localCoach.reply([{ id: '1', role: 'user', text, ts: '' }], { ...ctx, profile })

  it('"jag kan bara träna 2 dagar" → daysPerWeek proposal of 2', async () => {
    const r = await ask('Jag kan bara träna 2 dagar per vecka')
    expect(r.proposal?.changes).toContainEqual({ type: 'daysPerWeek', value: 2 })
  })

  it('"only 30 minutes" → minutes proposal', async () => {
    const r = await ask('I only have 30 minutes per session')
    expect(r.proposal?.changes).toContainEqual({ type: 'minutesPerSession', value: 30 })
  })

  it('"byt mål till bygga muskler" → goal proposal', async () => {
    const r = await ask('Jag vill byta mål till att bygga muskler')
    expect(r.proposal?.changes).toContainEqual({ type: 'goal', value: 'muscle_gain' })
  })

  it('"knät gör ont" → safety advice, no automatic change', async () => {
    const r = await ask('Mitt knä gör ont')
    expect(r.proposal).toBeUndefined()
    expect(r.text.toLowerCase()).toMatch(/knee|pain-free|physio/)
  })
})

describe('plan journaling & undo', () => {
  it('applyPlanChanges snapshots the prior plan then mutates', () => {
    const st = useAppStore.getState()
    st.setProfile({ ...base, daysPerWeek: 4 })
    const before = useAppStore.getState().planHistory.length
    st.applyPlanChanges([{ type: 'daysPerWeek', value: 2 }], 'coach', 'Training days → 2/week')
    const after = useAppStore.getState()
    expect(after.profile!.daysPerWeek).toBe(2)
    expect(after.planHistory.length).toBe(before + 1)
    expect(after.planHistory[0].snapshot.profile!.daysPerWeek).toBe(4) // pre-change snapshot
  })

  it('restoreRevision returns the plan to the snapshot', () => {
    const st = useAppStore.getState()
    st.setProfile({ ...base, daysPerWeek: 5 })
    st.applyPlanChanges([{ type: 'daysPerWeek', value: 3 }], 'user', 'to 3')
    const revId = useAppStore.getState().planHistory[0].id
    st.restoreRevision(revId)
    expect(useAppStore.getState().profile!.daysPerWeek).toBe(5)
  })

  it('coach messages persist in the store', () => {
    const st = useAppStore.getState()
    const n = useAppStore.getState().coachMessages.length
    st.addCoachMessage({ id: 'm1', role: 'user', text: 'hej', ts: '2026-07-19T00:00:00Z' })
    expect(useAppStore.getState().coachMessages.length).toBe(n + 1)
  })
})
