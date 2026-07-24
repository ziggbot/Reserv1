import type { ChatMessage, CoachContext, CoachReply } from './types'

/**
 * Seam for the training-partner coach. The app talks only to this interface, so
 * a real LLM (e.g. an Anthropic Messages API client) can be dropped in later
 * with zero UI changes — implement `reply()` and register it.
 *
 * Current implementation: `localCoach` (offline placeholder, no key, no network).
 * A future `claudeProvider` would build a system prompt from `CoachContext`, ask
 * the model to return prose + a JSON `PlanProposal`, and parse that into CoachReply.
 */
export interface CoachProvider {
  id: string
  label: string
  /** Given the conversation so far and the plan context, produce the coach's reply. */
  reply(history: ChatMessage[], context: CoachContext): Promise<CoachReply>
}
