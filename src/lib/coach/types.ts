import type { Goal, Profile, WorkoutProgram } from '../types'

/** A single, reversible change the coach proposes to the user's plan. */
export type PlanChange =
  | { type: 'daysPerWeek'; value: number }
  | { type: 'minutesPerSession'; value: number }
  | { type: 'goal'; value: Goal }
  | { type: 'goalWeightKg'; value: number }
  | { type: 'addExercise'; sessionIndex: number; name: string }
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
    case 'minutesPerSession':
      return `Session length → ${c.value} min`
    case 'goal':
      return `Goal → ${c.value.replace('_', ' ')}`
    case 'goalWeightKg':
      return `Goal weight → ${c.value} kg`
    case 'addExercise':
      return `Add “${c.name}” to session ${c.sessionIndex + 1}`
    case 'note':
      return `Note: ${c.text}`
  }
}
