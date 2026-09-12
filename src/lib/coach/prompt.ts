import type { CoachContext } from './types'
import { getLocale, tr } from '../../i18n'
import { describeWeek } from '../trainingDays'

/**
 * Shared system prompt + parsing for the LLM coach providers. Both the Claude
 * and OpenAI clients send this system prompt and parse the same strict-JSON
 * reply contract, so a single prompt drives both.
 */

export function buildSystemPrompt(ctx: CoachContext): string {
  const p = ctx.profile
  const conds = p.medicalConditions.length ? p.medicalConditions.join(', ') : 'none'
  const injuries = p.injuries.length ? p.injuries.join(', ') : 'none'
  const language = getLocale() === 'sv' ? 'Swedish' : 'English'
  return [
    'You are FitBlueprint, a friendly, evidence-based personal trainer and nutrition coach.',
    `Answer in ${language} — the same language as the user's interface (the "reply" and "summary" strings below must be in ${language}).`,
    'Keep replies short, concrete and encouraging. Base advice on mainstream exercise-science consensus (progressive overload, 1.6–2.2 g/kg protein, muscle-sparing fat loss, WHO activity guidelines). Never give medical advice; for red-flag symptoms tell the user to see a doctor.',
    '',
    "USER PROFILE:",
    `- Name: ${p.name}, age ${p.age}, ${p.sex}, ${p.heightCm} cm, ${p.weightKg} kg`,
    `- Goal: ${p.goal}${p.goalWeightKg ? ` (target ${p.goalWeightKg} kg)` : ''}`,
    `- Experience: ${p.fitnessLevel}; trains ${describeWeek(p)} per week, ${p.minutesPerSession} min per session; equipment: ${p.equipment}`,
    `- Sleep ${p.sleepHours} h, stress ${p.stressLevel}, diet ${p.dietPref}`,
    `- Medical conditions: ${conds}; injuries: ${injuries}`,
    `- Current weekly plan: ${ctx.scheduleSummary}`,
    '',
    ...(ctx.grounding
      ? [
          'RECENT TRAINING DATA (from the user’s log — treat as ground truth, newest first):',
          ctx.grounding,
          '',
          'Ground every answer in this data: refer to actual sessions, lifts, weights and trends by name and number when relevant, notice missed sessions or stalls, and never claim progress the log does not show.',
          '',
        ]
      : []),
    'When the user asks for a concrete change to their plan (strength or cardio sessions per week, session length, goal, goal weight, or adding an exercise), propose it as a structured change they can review.',
    'ALWAYS respond with a single JSON object and nothing else, in this exact shape:',
    '{"reply": string, "proposal": null | {"summary": string, "changes": Change[]}}',
    'Change is one of:',
    '  {"type":"strengthDaysPerWeek","value": number 1-6}',
    '  {"type":"cardioDaysPerWeek","value": number 0-6}',
    '  {"type":"minutesPerSession","value": number 15-120}',
    '  {"type":"goal","value":"fat_loss"|"muscle_gain"|"recomp"|"general_fitness"}',
    '  {"type":"goalWeightKg","value": number}',
    '  {"type":"addExercise","sessionIndex": number,"name": string}',
    '  {"type":"note","text": string}',
    'Use "proposal": null for pure conversation, advice, or questions. Never invent medical claims. Output ONLY the JSON object.',
  ].join('\n')
}

/** Extract the first balanced {...} object from model text, tolerating prose/markdown fences. */
export function parseCoachJson(text: string): { reply: string; proposal?: unknown } {
  const start = text.indexOf('{')
  if (start === -1) return { reply: text.trim() }
  let depth = 0
  let inStr = false
  let esc = false
  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (inStr) {
      if (esc) esc = false
      else if (ch === '\\') esc = true
      else if (ch === '"') inStr = false
      continue
    }
    if (ch === '"') inStr = true
    else if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) {
        try {
          const obj = JSON.parse(text.slice(start, i + 1))
          if (obj && typeof obj.reply === 'string') return obj
        } catch {
          /* fall through */
        }
        break
      }
    }
  }
  return { reply: text.trim() }
}

/** Turn parsed JSON into a CoachReply, validating the proposal changes defensively. */
export function toCoachReply(parsed: { reply: string; proposal?: unknown }) {
  const reply = parsed.reply || tr('Okay!', 'Okej!')
  const prop = parsed.proposal as { summary?: string; changes?: unknown } | null | undefined
  if (!prop || !Array.isArray(prop.changes) || prop.changes.length === 0) return { text: reply }
  const valid = ['daysPerWeek', 'strengthDaysPerWeek', 'cardioDaysPerWeek', 'minutesPerSession', 'goal', 'goalWeightKg', 'addExercise', 'note']
  const changes = (prop.changes as { type?: string }[]).filter((c) => c && valid.includes(c.type ?? ''))
  if (changes.length === 0) return { text: reply }
  return { text: reply, proposal: { summary: prop.summary || tr('Update plan', 'Uppdatera planen'), changes: changes as never } }
}
