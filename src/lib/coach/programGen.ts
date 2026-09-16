import type { Profile, WorkoutProgram, WorkoutSession } from '../types'
import { buildProgram, defaultWarmup, exerciseLibrary, mobilityFor } from '../programs'
import { tr } from '../../i18n'

/**
 * The AI coach's own program: the model returns a compact JSON payload (below),
 * which is validated and turned into a full WorkoutProgram here. Exercise names
 * are snapped to the built-in library or the user's own exercises when they
 * match case-insensitively; anything else is kept as written and reported so
 * the user can see what the coach invented.
 */

export interface AiExercise {
  name: string
  sets: number
  reps: string
  rpe?: string
  notes?: string
}
export interface AiSession {
  name: string
  focus: string
  exercises: AiExercise[]
}
export interface AiProgramPayload {
  splitName: string
  sessions: AiSession[]
  progressionRules?: string[]
  deloadRule?: string
}

const DEFAULT_RPE = 'RPE 7–8 (1–3 reps in reserve)'

export function toWorkoutProgram(
  raw: unknown,
  profile: Profile,
  customExercises: string[] = [],
): { program: WorkoutProgram; unknownExercises: string[] } | null {
  if (!raw || typeof raw !== 'object') return null
  const p = raw as Partial<AiProgramPayload>
  if (!Array.isArray(p.sessions) || p.sessions.length < 1 || p.sessions.length > 6) return null

  const known = new Map<string, string>()
  for (const l of exerciseLibrary(profile.equipment, profile.injuries)) known.set(l.name.toLowerCase(), l.name)
  for (const c of customExercises) known.set(c.toLowerCase(), c)
  const unknown = new Set<string>()

  const sessions: WorkoutSession[] = []
  const seen = new Set<string>()
  for (const [i, s] of p.sessions.entries()) {
    if (!s || typeof s !== 'object' || !Array.isArray(s.exercises)) return null
    let name = clean(s.name) || `Session ${i + 1}`
    while (seen.has(name)) name = `${name} ·`
    seen.add(name)
    const exercises = s.exercises
      .filter((e) => e && typeof e === 'object' && clean(e.name))
      .slice(0, 12)
      .map((e) => {
        const typed = clean(e.name)
        const canonical = known.get(typed.toLowerCase())
        if (!canonical) unknown.add(typed)
        const sets = Number.isFinite(e.sets) ? Math.min(8, Math.max(1, Math.round(e.sets))) : 3
        return {
          name: canonical ?? typed,
          sets,
          reps: clean(e.reps) || '8–12',
          rpe: clean(e.rpe) || DEFAULT_RPE,
          notes: clean(e.notes) || undefined,
        }
      })
    if (exercises.length === 0) return null
    sessions.push({
      name,
      focus: clean(s.focus) || 'Whole-body strength',
      warmup: defaultWarmup(),
      exercises,
      mobilityFinisher: mobilityFor(name),
    })
  }

  const base = buildProgram(profile)
  const rules = Array.isArray(p.progressionRules) ? p.progressionRules.map(clean).filter(Boolean) : []
  return {
    program: {
      splitName: clean(p.splitName) || `AI program ×${sessions.length}`,
      sessions,
      cardio: base.cardio,
      progressionRules: rules.length ? rules : base.progressionRules,
      deloadRule: clean(p.deloadRule) || base.deloadRule,
      cautions: base.cautions,
    },
    unknownExercises: [...unknown],
  }
}

function clean(v: unknown): string {
  return typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : ''
}

/** Human-readable lines describing what changes between two programs. */
export function programDiff(before: WorkoutProgram | null, after: WorkoutProgram): string[] {
  const lines: string[] = []
  if (!before) {
    lines.push(tr(`New program: ${after.splitName}, ${after.sessions.length} sessions`, `Nytt program: ${after.splitName}, ${after.sessions.length} pass`))
    for (const s of after.sessions) lines.push(`+ ${s.name} (${s.exercises.length} ${tr('exercises', 'övningar')})`)
    return lines
  }
  if (before.splitName !== after.splitName) lines.push(tr(`Split: ${before.splitName} → ${after.splitName}`, `Upplägg: ${before.splitName} → ${after.splitName}`))
  const byName = (list: WorkoutSession[]) => new Map(list.map((s) => [s.name, s]))
  const b = byName(before.sessions)
  const a = byName(after.sessions)
  for (const s of after.sessions) if (!b.has(s.name)) lines.push(`+ ${tr('session', 'pass')} ${s.name} (${s.exercises.length} ${tr('exercises', 'övningar')})`)
  for (const s of before.sessions) if (!a.has(s.name)) lines.push(`− ${tr('session', 'pass')} ${s.name}`)
  for (const s of after.sessions) {
    const prev = b.get(s.name)
    if (!prev) continue
    const pe = new Map(prev.exercises.map((e) => [e.name, e]))
    const ae = new Map(s.exercises.map((e) => [e.name, e]))
    const parts: string[] = []
    for (const e of s.exercises) if (!pe.has(e.name)) parts.push(`+ ${e.name} ${e.sets}×${e.reps}`)
    for (const e of prev.exercises) if (!ae.has(e.name)) parts.push(`− ${e.name}`)
    for (const e of s.exercises) {
      const old = pe.get(e.name)
      if (old && (old.sets !== e.sets || old.reps !== e.reps)) parts.push(`${e.name} ${old.sets}×${old.reps} → ${e.sets}×${e.reps}`)
    }
    if (parts.length) lines.push(`${s.name}: ${parts.join(', ')}`)
  }
  if (lines.length === 0) lines.push(tr('No structural change (notes or rules only)', 'Ingen strukturell ändring (bara noteringar eller regler)'))
  return lines
}

/** The user-side messages the program page sends into the chat. */
export function generateRequest(): string {
  return tr(
    'Build my personal strength program: one session per strength day in my week, using my equipment, injuries and goal. Return it as a programUpdate.',
    'Bygg mitt personliga styrkeprogram: ett pass per styrkedag i min vecka, utifrån min utrustning, mina skador och mitt mål. Skicka det som en programUpdate.',
  )
}
export function reviewRequest(): string {
  return tr(
    'Review my program against my recent training data and feedback. If something should change, send an updated program as a programUpdate and explain why; otherwise tell me it holds.',
    'Gå igenom mitt program mot min senaste träningsdata och feedback. Om något bör ändras, skicka ett uppdaterat program som programUpdate och förklara varför; annars säg att det håller.',
  )
}
