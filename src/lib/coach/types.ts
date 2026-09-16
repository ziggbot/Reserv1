import type { Goal, Profile, WorkoutProgram } from '../types'
import type { AiProgramPayload } from './programGen'

/** A single, reversible change the coach proposes to the user's plan. */
export type PlanChange =
  | { type: 'daysPerWeek'; value: number } // legacy: sets the strength days
  | { type: 'strengthDaysPerWeek'; value: number }
  | { type: 'cardioDaysPerWeek'; value: number }
  | { type: 'minutesPerSession'; value: number }
  | { type: 'goal'; value: Goal }
  | { type: 'goalWeightKg'; value: number }
  | { type: 'addExercise'; sessionIndex: number; name: string }
  | { type: 'programUpdate'; program: AiProgramPayload; rationale?: string }
  | { type: 'note'; text: string }

export interface PlanProposal {
  summary: string
  changes: PlanChange[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'coach'
  text: string
  ts: string // ISO datetime
  proposal?: PlanProposal
  proposalApplied?: boolean
  proposalDismissed?: boolean
}

/** Compact snapshot of the user's plan handed to the coach as context. */
export interface CoachContext {
  profile: Profile
  program: WorkoutProgram
  scheduleSummary: string
  /** Which option under Choose a program is active ('ai' = the coach's own program). */
  programChoice?: string
  /** Built-in exercises usable with the user's equipment, canonical names. */
  libraryNames?: string[]
  /** Exercises the user added themselves. */
  customExercises?: string[]
  /** Recent AI-program change log lines, newest first. */
  aiProgramLog?: string[]
  /** Digest of the training log (see grounding.ts); omitted only for connection tests. */
  grounding?: string
}

export interface CoachReply {
  text: string
  proposal?: PlanProposal
}

/** Human-readable one-liner for a change, used in chat + the plan journal. */
export function describeChange(c: PlanChange): string {
  switch (c.type) {
    case 'daysPerWeek':
      return `Training days → ${c.value}/week`
    case 'strengthDaysPerWeek':
      return `Strength sessions → ${c.value}/week`
    case 'cardioDaysPerWeek':
      return `Cardio sessions → ${c.value}/week`
    case 'minutesPerSession':
      return `Session length → ${c.value} min`
    case 'goal':
      return `Goal → ${c.value.replace('_', ' ')}`
    case 'goalWeightKg':
      return `Goal weight → ${c.value} kg`
    case 'addExercise':
      return `Add “${c.name}” to session ${c.sessionIndex + 1}`
    case 'programUpdate':
      return `Program: ${c.program.splitName} (${c.program.sessions.length} sessions)`
    case 'note':
      return `Note: ${c.text}`
  }
}
