import type { CoachProvider } from './provider'
import type { CoachContext } from './types'

/**
 * Ask the LLM coach for its read on recent training. Uses the ordinary reply
 * contract (the grounding is already in the system prompt) with a fixed
 * request, and returns the prose. Throws on network/API failure so the UI can
 * fall back to the deterministic engine.
 */
export const ASSESSMENT_REQUEST =
  'Give me your coach’s assessment of my recent training and progress, based on the RECENT TRAINING DATA. ' +
  '3–5 short lines: what is going well (cite specific lifts/numbers), what to watch, and the single most important adjustment for next week. ' +
  'If data is thin, say what to log first. Plain text with line breaks, no headings, no proposal.'

export async function requestAssessment(coach: CoachProvider, context: CoachContext): Promise<string> {
  const reply = await coach.reply(
    [{ id: 'assessment', role: 'user', text: ASSESSMENT_REQUEST, ts: new Date().toISOString() }],
    context,
  )
  return reply.text.trim()
}
