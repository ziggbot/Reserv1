import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { AppData } from './data.js'
import { readData, updateData } from './data.js'
import { setLocale } from '../../src/i18n'
import { todayIso } from '../../src/lib/dates'
import { defaultProgram } from '../../src/lib/threeDayFullBody'
import { buildWeeklySchedule } from '../../src/lib/weeklySchedule'
import { buildGrounding } from '../../src/lib/coach/grounding'
import { coachContextFrom } from '../../src/lib/coach/context'
import { nextSession, rollingCycle } from '../../src/lib/trainWeek'
import { programDiff, toWorkoutProgram } from '../../src/lib/coach/programGen'
import { buildNutritionPlan } from '../../src/lib/calculations'
import { analyzeProgress } from '../../src/lib/fatloss'
import { weeksSince } from '../../src/lib/dates'
import { estimateMinutes } from '../../src/lib/trainWeek'
import type { CompletedWorkout, Profile, WorkoutProgram } from '../../src/lib/types'

/**
 * The tools ChatGPT / Claude get. Read tools return a compact text digest the
 * model can reason over; write tools mutate the shared row. Names and
 * descriptions carry the programming rules the in-app coach used to get from
 * its system prompt, since here we do not own the prompt.
 */

const APP_URL = process.env.APP_URL ?? 'https://ziggbot.github.io/Reserv1/'

interface Ctx {
  token: string
  userId: string
}

function snapshot(d: AppData) {
  return {
    profile: (d.profile as Profile) ?? null,
    customProgram: (d.customProgram as WorkoutProgram) ?? null,
    programChoice: (d.programChoice as string) ?? null,
    customExercises: (d.customExercises as string[]) ?? [],
    aiProgramLog: (d.aiProgramLog as { ts: string; summary: string }[]) ?? [],
    completedWorkouts: (d.completedWorkouts as CompletedWorkout[]) ?? [],
    weighIns: (d.weighIns as { date: string; weightKg: number }[]) ?? [],
    habitChecks: (d.habitChecks as Record<string, string[]>) ?? {},
    planStartDate: (d.planStartDate as string) ?? null,
    planHistory: (d.planHistory as { ts: string; source: string; description: string }[]) ?? [],
  }
}

const text = (s: string) => ({ content: [{ type: 'text' as const, text: s }] })
const NO_PROFILE = `No profile yet. Ask the user to complete the 6-step interview in the web app first: ${APP_URL}`

export function registerTools(server: McpServer, getCtx: () => Ctx) {
  setLocale('en') // digests are English; the model answers in the user's language

  server.registerTool(
    'get_profile',
    {
      title: 'Get profile and weekly setup',
      description:
        'The user’s training profile: goal, level, equipment, injuries, strength and cardio sessions per week, minutes per session, current and goal weight, and which program is active.',
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async () => {
      const ctx = getCtx()
      const d = await readData(ctx.token, ctx.userId)
      const s = d ? snapshot(d) : null
      if (!s?.profile) return text(NO_PROFILE)
      const p = s.profile
      const program = defaultProgram(p, s.customProgram)
      const nutrition = buildNutritionPlan(p)
      return text(
        [
          `Name ${p.name}, age ${p.age}, ${p.sex}, ${p.heightCm} cm, ${p.weightKg} kg${p.goalWeightKg ? `, goal ${p.goalWeightKg} kg` : ''}.`,
          `Goal ${p.goal}, level ${p.fitnessLevel}, equipment ${p.equipment}, injuries ${p.injuries.join(', ') || 'none'}, medical ${p.medicalConditions.join(', ') || 'none'}.`,
          `Week: ${p.strengthDaysPerWeek ?? p.daysPerWeek}× strength + ${p.cardioDaysPerWeek ?? 0}× cardio, ${p.minutesPerSession} min/session. Sleep ${p.sleepHours} h, stress ${p.stressLevel}, diet ${p.dietPref}.`,
          `Active program: ${program.splitName} (choice: ${s.programChoice ?? 'recommended'}). Schedule: ${buildWeeklySchedule(p, program).summaryLine}.`,
          `Nutrition targets: ${nutrition.targets.calories} kcal, ${nutrition.targets.proteinG} g protein, ${nutrition.targets.fatG} g fat, ${nutrition.targets.carbsG} g carbs (maintenance ≈ ${nutrition.maintenanceCalories}).`,
        ].join('\n'),
      )
    },
  )

  server.registerTool(
    'get_training_summary',
    {
      title: 'Get recent training data',
      description:
        'Ground truth from the user’s log, newest first: plan week, rolling cycle, sessions per week for 4 weeks, last 6 sessions with best sets and PRs, post-session feedback (too easy/right/too hard, flagged exercises), strength trends, body-weight trend and status, habit streaks, recent plan changes. Call this before assessing progress or changing the program; never claim progress the log does not show.',
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async () => {
      const ctx = getCtx()
      const d = await readData(ctx.token, ctx.userId)
      const s = d ? snapshot(d) : null
      if (!s?.profile) return text(NO_PROFILE)
      const program = defaultProgram(s.profile, s.customProgram)
      return text(buildGrounding({ ...s, profile: s.profile, program, today: todayIso() }))
    },
  )

  server.registerTool(
    'get_next_session',
    {
      title: 'Get the next session',
      description:
        'The next session in the user’s rotation with its exercises, sets, reps, effort target, warm-up and estimated time, plus the rolling-week checklist. Includes a link to open the session in the FitBlueprint logger, which is the best place to log sets during training.',
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async () => {
      const ctx = getCtx()
      const d = await readData(ctx.token, ctx.userId)
      const s = d ? snapshot(d) : null
      if (!s?.profile) return text(NO_PROFILE)
      const program = defaultProgram(s.profile, s.customProgram)
      const next = nextSession(program, s.completedWorkouts)
      const cycle = rollingCycle(program, buildWeeklySchedule(s.profile, program), s.completedWorkouts)
      const lines = [
        `Next: ${next.session.name} [${next.session.focus}], ~${estimateMinutes(next.session, s.profile.minutesPerSession)} min.`,
        `Warm-up 10 min: ${next.session.warmup.join('; ')}`,
        ...next.session.exercises.map((e) => `- ${e.name}: ${e.sets}×${e.reps}, ${e.rpe}${e.notes ? ` (${e.notes})` : ''}`),
        `Finisher: ${next.session.mobilityFinisher.join('; ')}`,
        `This rolling week: ${cycle.doneCount}/${cycle.days.length} done — ${cycle.days.map((x) => `${x.title}${x.done ? ' ✓' : ''}`).join(', ')}.`,
        `Open in the logger: ${APP_URL}`,
      ]
      return text(lines.join('\n'))
    },
  )

  server.registerTool(
    'get_program',
    {
      title: 'Get the full program',
      description: 'Every session of the active strength program with exercises, sets, reps and effort, plus progression and deload rules and the AI change log.',
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async () => {
      const ctx = getCtx()
      const d = await readData(ctx.token, ctx.userId)
      const s = d ? snapshot(d) : null
      if (!s?.profile) return text(NO_PROFILE)
      const program = defaultProgram(s.profile, s.customProgram)
      return text(
        [
          `${program.splitName} (choice: ${s.programChoice ?? 'recommended'})`,
          ...program.sessions.map((sess) => `${sess.name} [${sess.focus}]: ${sess.exercises.map((e) => `${e.name} ${e.sets}×${e.reps}`).join(', ')}`),
          `Progression: ${program.progressionRules.join(' | ')}`,
          `Deload: ${program.deloadRule}`,
          s.aiProgramLog.length ? `Change log: ${s.aiProgramLog.slice(0, 5).map((e) => `${e.ts.slice(0, 10)} ${e.summary}`).join(' | ')}` : '',
          `Custom exercises: ${s.customExercises.join(', ') || 'none'}`,
        ]
          .filter(Boolean)
          .join('\n'),
      )
    },
  )

  const setSchema = z.object({ weightKg: z.number().min(0).nullable(), reps: z.number().int().min(0).nullable() })
  server.registerTool(
    'log_workout',
    {
      title: 'Log a strength workout',
      description:
        'Save a completed strength session: session name (use the program’s session name so the rotation advances), per-exercise sets with weight in kg and reps, duration, and optional feedback (effort too_easy/right/too_hard, exercises that hurt, a note). Date defaults to today. Confirm the numbers with the user before calling.',
      inputSchema: {
        sessionName: z.string().min(1),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        durationMin: z.number().int().min(1).max(300).optional(),
        exercises: z.array(z.object({ name: z.string().min(1), sets: z.array(setSchema).min(1) })).min(1),
        feedback: z
          .object({ effort: z.enum(['too_easy', 'right', 'too_hard']), flagged: z.array(z.string()).optional(), note: z.string().optional() })
          .optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async (args) => {
      const ctx = getCtx()
      const date = args.date ?? todayIso()
      const exercises = args.exercises.map((e) => ({ name: e.name, targetReps: '', sets: e.sets.map((st) => ({ ...st, done: true })) }))
      const totalVolumeKg = Math.round(exercises.reduce((a, e) => a + e.sets.reduce((b, st) => b + (st.weightKg ?? 0) * (st.reps ?? 0), 0), 0))
      const totalSets = exercises.reduce((a, e) => a + e.sets.length, 0)
      const workout: CompletedWorkout = {
        date,
        sessionName: args.sessionName,
        category: 'strength',
        durationMin: args.durationMin ?? Math.max(20, totalSets * 3 + 10),
        exercises,
        totalVolumeKg,
        totalSets,
        feedback: args.feedback ? { effort: args.feedback.effort, flagged: args.feedback.flagged ?? [], note: args.feedback.note } : undefined,
      }
      await updateData(ctx.token, ctx.userId, (d) => {
        const list = ((d.completedWorkouts as CompletedWorkout[]) ?? []).concat(workout).sort((a, b) => a.date.localeCompare(b.date))
        const memory = { ...((d.exerciseMemory as Record<string, unknown>) ?? {}) }
        for (const e of exercises) memory[e.name] = e.sets.map((st) => ({ weightKg: st.weightKg, reps: st.reps }))
        const log = ((d.workoutLog as { date: string; sessionName: string }[]) ?? []).concat({ date, sessionName: args.sessionName })
        return { ...d, completedWorkouts: list, exerciseMemory: memory, workoutLog: log }
      })
      return text(`Logged ${args.sessionName} on ${date}: ${totalSets} sets, ${totalVolumeKg} kg volume.`)
    },
  )

  server.registerTool(
    'log_activity',
    {
      title: 'Log cardio, endurance or stretching',
      description: 'Save a non-strength session by name, category (cardio, endurance, stretch) and minutes. Date defaults to today.',
      inputSchema: {
        name: z.string().min(1),
        category: z.enum(['cardio', 'endurance', 'stretch']),
        durationMin: z.number().int().min(1).max(600),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    },
    async (args) => {
      const ctx = getCtx()
      const date = args.date ?? todayIso()
      await updateData(ctx.token, ctx.userId, (d) => ({
        ...d,
        completedWorkouts: ((d.completedWorkouts as CompletedWorkout[]) ?? [])
          .concat({ date, sessionName: args.name, category: args.category, durationMin: args.durationMin, exercises: [], totalVolumeKg: 0, totalSets: 0 })
          .sort((a, b) => a.date.localeCompare(b.date)),
      }))
      return text(`Logged ${args.category}: ${args.name}, ${args.durationMin} min on ${date}.`)
    },
  )

  server.registerTool(
    'log_weigh_in',
    {
      title: 'Log a morning weigh-in',
      description: 'Save body weight in kg for a date (defaults to today). One entry per day; a later call for the same day replaces it.',
      inputSchema: { weightKg: z.number().min(35).max(300), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async (args) => {
      const ctx = getCtx()
      const date = args.date ?? todayIso()
      const d = await updateData(ctx.token, ctx.userId, (d) => ({
        ...d,
        weighIns: ((d.weighIns as { date: string; weightKg: number }[]) ?? [])
          .filter((w) => w.date !== date)
          .concat({ date, weightKg: args.weightKg })
          .sort((a, b) => a.date.localeCompare(b.date)),
      }))
      const s = snapshot(d)
      const a = s.profile ? analyzeProgress(s.weighIns, todayIso(), s.profile.weightKg, weeksSince(s.planStartDate, todayIso())) : null
      return text(`Logged ${args.weightKg} kg on ${date}.${a ? ` 7-day average ${a.currentAvgKg ?? 'n/a'} kg, status ${a.status}.` : ''}`)
    },
  )

  const exerciseSchema = z.object({ name: z.string().min(1), sets: z.number().int().min(1).max(8), reps: z.string().min(1), rpe: z.string().optional(), notes: z.string().optional() })
  const programSchema = {
    splitName: z.string().min(1),
    sessions: z.array(z.object({ name: z.string().min(1), focus: z.string().min(1), exercises: z.array(exerciseSchema).min(1).max(12) })).min(1).max(6),
    progressionRules: z.array(z.string()).optional(),
    deloadRule: z.string().optional(),
    rationale: z.string().min(1),
  }
  const PROGRAM_RULES =
    'Send the COMPLETE program (every session, every exercise). One session per strength day in the user’s week, never more. Respect equipment, injuries (do not load a flagged area), session length (≈3 min per working set + 10 min) and goal. Prefer exact exercise names from get_program / the user’s custom exercises; invent a name only when nothing fits. Change one variable at a time (selection OR volume OR intensity) unless the user asks for a rebuild; add volume before intensity. Cover squat, hinge, push, pull and core across the week. Plan 4–5-week blocks with a deload rule. Explain the change in rationale.'

  server.registerTool(
    'preview_program_update',
    {
      title: 'Preview a program change',
      description: `Validate a proposed program and return the diff against the current one WITHOUT saving. Use this first, show the diff to the user, then call apply_program_update after they approve. ${PROGRAM_RULES}`,
      inputSchema: programSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async (args) => {
      const ctx = getCtx()
      const d = await readData(ctx.token, ctx.userId)
      const s = d ? snapshot(d) : null
      if (!s?.profile) return text(NO_PROFILE)
      const built = toWorkoutProgram(args, s.profile, s.customExercises)
      if (!built) return text('Invalid program: each session needs 1–12 exercises and there must be 1–6 sessions.')
      const current = defaultProgram(s.profile, s.customProgram)
      const diff = programDiff(current, built.program)
      return text(
        [
          `Diff vs current (${current.splitName}):`,
          ...diff.map((l) => `- ${l}`),
          built.unknownExercises.length ? `Exercises not in the library (kept as written): ${built.unknownExercises.join(', ')}` : '',
          'If the user approves, call apply_program_update with the same payload.',
        ]
          .filter(Boolean)
          .join('\n'),
      )
    },
  )

  server.registerTool(
    'apply_program_update',
    {
      title: 'Apply a program change',
      description: `Save the proposed program as the user’s AI-coach program and make it active. Only call after the user has approved the preview. ${PROGRAM_RULES}`,
      inputSchema: programSchema,
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    },
    async (args) => {
      const ctx = getCtx()
      let summary = ''
      await updateData(ctx.token, ctx.userId, (d) => {
        const s = snapshot(d)
        if (!s.profile) throw new Error('No profile')
        const built = toWorkoutProgram(args, s.profile, s.customExercises)
        if (!built) throw new Error('Invalid program')
        const current = defaultProgram(s.profile, s.customProgram)
        summary = programDiff(current, built.program).join('; ')
        const entry = { ts: new Date().toISOString(), summary: `Coach update: ${built.program.splitName}`, rationale: args.rationale, unknownExercises: built.unknownExercises }
        const revision = {
          id: Math.random().toString(16).slice(2, 14),
          ts: entry.ts,
          source: 'coach',
          description: `Program update (${built.program.splitName})`,
          snapshot: { profile: s.profile, customProgram: s.customProgram },
        }
        return {
          ...d,
          aiProgram: built.program,
          customProgram: built.program,
          programChoice: 'ai',
          aiProgramLog: [entry, ...s.aiProgramLog].slice(0, 30),
          planHistory: [revision, ...s.planHistory].slice(0, 50),
        }
      })
      return text(`Applied. ${summary}. The web app shows the new program on its next sync (within a minute when open).`)
    },
  )

  server.registerTool(
    'get_coach_context',
    {
      title: 'Get the full coaching briefing',
      description:
        'Everything in one call for a coaching conversation: profile, active program, exercise library names, custom exercises, AI change log and the recent-training digest. Prefer the smaller tools when you only need one part.',
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async () => {
      const ctx = getCtx()
      const d = await readData(ctx.token, ctx.userId)
      const c = d ? coachContextFrom(snapshot(d)) : null
      if (!c) return text(NO_PROFILE)
      return text(
        [
          `Schedule: ${c.scheduleSummary}. Program choice: ${c.programChoice}.`,
          `Program: ${c.program.sessions.map((s) => `${s.name} [${s.focus}]: ${s.exercises.map((e) => `${e.name} ${e.sets}×${e.reps}`).join(', ')}`).join('\n')}`,
          `Library: ${(c.libraryNames ?? []).join('; ')}`,
          `Custom exercises: ${(c.customExercises ?? []).join('; ') || 'none'}`,
          `AI change log: ${(c.aiProgramLog ?? []).join(' | ') || 'none'}`,
          '',
          'RECENT TRAINING DATA:',
          c.grounding ?? '',
        ].join('\n'),
      )
    },
  )
}
