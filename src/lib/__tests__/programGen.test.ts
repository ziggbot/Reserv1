import { describe, expect, it } from 'vitest'
import { programDiff, toWorkoutProgram } from '../coach/programGen'
import { buildSystemPrompt } from '../coach/prompt'
import { useAppStore } from '../../state/store'
import type { Profile } from '../types'

const profile: Profile = {
  name: 'Peter', age: 45, sex: 'male', heightCm: 182, weightKg: 92, goal: 'muscle_gain',
  fitnessLevel: 'intermediate', medicalConditions: [], injuries: ['shoulder'], equipment: 'full_gym', daysPerWeek: 3,
  strengthDaysPerWeek: 3, cardioDaysPerWeek: 0,
  minutesPerSession: 60, sleepHours: 7, stressLevel: 'moderate', activityLevel: 'light', dietPref: 'omnivore', mealsPerDay: 3,
  lifestyle: { allOrNothing: false, timeCrunched: false, travelsOften: false, eveningSnacker: false, deskJob: true, trainsAlone: false },
}

const payload = {
  splitName: 'Upper / Lower ×3',
  sessions: [
    { name: 'Upper A', focus: 'Chest, back, shoulders', exercises: [
      { name: 'barbell bench press', sets: 4, reps: '6–8' },
      { name: 'Seated Cable Row', sets: 3, reps: '8–12', notes: 'pause at chest' },
      { name: 'Hacklift', sets: 10, reps: '10' },
      { name: 'Zercher carry', sets: 2, reps: '40 m' },
    ] },
    { name: 'Lower A', focus: 'Legs', exercises: [{ name: 'Leg press', sets: 3, reps: '10–12' }] },
  ],
  progressionRules: ['Add 2.5 kg when all sets hit the top of the range'],
  deloadRule: 'Every 5th week halve the sets',
}

describe('toWorkoutProgram', () => {
  it('snaps names to the library and the user’s own exercises, clamps sets, reports unknowns', () => {
    const built = toWorkoutProgram(payload, profile, ['Hacklift'])!
    expect(built).not.toBeNull()
    const [upper, lower] = built.program.sessions
    expect(upper.exercises.map((e) => e.name)).toEqual(['Barbell bench press', 'Seated cable row', 'Hacklift', 'Zercher carry'])
    expect(upper.exercises[2].sets).toBe(8) // clamped from 10
    expect(upper.exercises[1].notes).toBe('pause at chest')
    expect(upper.exercises[0].rpe).toMatch(/RPE/)
    expect(upper.warmup.length).toBeGreaterThan(0)
    expect(lower.mobilityFinisher.length).toBeGreaterThan(0)
    expect(built.unknownExercises).toEqual(['Zercher carry'])
    expect(built.program.splitName).toBe('Upper / Lower ×3')
    expect(built.program.progressionRules).toEqual(['Add 2.5 kg when all sets hit the top of the range'])
    expect(built.program.deloadRule).toBe('Every 5th week halve the sets')
    expect(built.program.cardio.stepsTarget).toBeGreaterThan(0)
  })
  it('rejects garbage', () => {
    expect(toWorkoutProgram(null, profile)).toBeNull()
    expect(toWorkoutProgram({ sessions: [] }, profile)).toBeNull()
    expect(toWorkoutProgram({ sessions: [{ name: 'X', exercises: [] }] }, profile)).toBeNull()
    expect(toWorkoutProgram({ sessions: Array(7).fill({ name: 'X', exercises: [{ name: 'Plank', sets: 2, reps: '30 s' }] }) }, profile)).toBeNull()
  })
  it('de-duplicates session names and fills defaults', () => {
    const built = toWorkoutProgram({ sessions: [
      { name: 'Day', exercises: [{ name: 'Plank', sets: 2, reps: '30 s' }] },
      { name: 'Day', exercises: [{ name: 'Plank', sets: 2, reps: '30 s' }] },
    ] }, profile)!
    expect(built.program.sessions.map((s) => s.name)).toEqual(['Day', 'Day ·'])
    expect(built.program.splitName).toBe('AI program ×2')
  })
})

describe('programDiff', () => {
  const before = toWorkoutProgram(payload, profile, ['Hacklift'])!.program
  it('describes added/removed sessions and exercise changes', () => {
    const after = toWorkoutProgram({
      ...payload,
      sessions: [
        { ...payload.sessions[0], exercises: [
          { name: 'Barbell bench press', sets: 4, reps: '6–8' },
          { name: 'Seated cable row', sets: 4, reps: '8–12' },
          { name: 'Lat pulldown', sets: 3, reps: '10' },
        ] },
        { name: 'Legs B', focus: 'Legs', exercises: [{ name: 'Leg press', sets: 3, reps: '10–12' }] },
      ],
    }, profile, ['Hacklift'])!.program
    const lines = programDiff(before, after)
    expect(lines.some((l) => l.startsWith('+ session Legs B'))).toBe(true)
    expect(lines.some((l) => l.startsWith('− session Lower A'))).toBe(true)
    expect(lines.find((l) => l.startsWith('Upper A:'))).toContain('+ Lat pulldown 3×10')
    expect(lines.find((l) => l.startsWith('Upper A:'))).toContain('− Hacklift')
    expect(lines.find((l) => l.startsWith('Upper A:'))).toContain('Seated cable row 3×8–12 → 4×8–12')
  })
  it('describes a first program', () => {
    expect(programDiff(null, before)[0]).toMatch(/New program: Upper \/ Lower ×3, 2 sessions/)
  })
})

describe('programUpdate through the store', () => {
  it('sets the AI program, selects it, logs the change, and survives switching programs', () => {
    const st = useAppStore.getState()
    st.setProfile(profile)
    st.applyPlanChanges([{ type: 'programUpdate', program: payload, rationale: 'Shoulder-friendly pressing' }], 'coach', 'Built program')
    let s = useAppStore.getState()
    expect(s.programChoice).toBe('ai')
    expect(s.aiProgram?.splitName).toBe('Upper / Lower ×3')
    expect(s.customProgram?.splitName).toBe('Upper / Lower ×3')
    expect(s.aiProgramLog[0].summary).toBe('Built program')
    expect(s.aiProgramLog[0].rationale).toBe('Shoulder-friendly pressing')
    st.setCustomProgram(null, 'recommended')
    s = useAppStore.getState()
    expect(s.programChoice).toBe('recommended')
    expect(s.aiProgram?.splitName).toBe('Upper / Lower ×3') // still there
  })
  it('workout feedback attaches to the latest matching workout and reaches the prompt', () => {
    const st = useAppStore.getState()
    st.logActivity('strength', 'Upper A', 50, '2026-09-15')
    st.setWorkoutFeedback('2026-09-15', 'Upper A', { effort: 'too_hard', flagged: ['Barbell bench press'], note: 'shoulder pinch' })
    const w = useAppStore.getState().completedWorkouts.find((x) => x.sessionName === 'Upper A')!
    expect(w.feedback?.effort).toBe('too_hard')
    const prompt = buildSystemPrompt({
      profile,
      program: useAppStore.getState().aiProgram!,
      programChoice: 'ai',
      scheduleSummary: 'x',
      libraryNames: ['Plank'],
      grounding: 'Felt: too hard; pain/issue on Barbell bench press',
    })
    expect(prompt).toContain('CURRENT STRENGTH PROGRAM (choice: ai')
    expect(prompt).toContain('Upper A [Chest, back, shoulders]: Barbell bench press 4×6–8')
    expect(prompt).toContain('programUpdate')
    expect(prompt).toContain('EXERCISE LIBRARY')
  })
})
