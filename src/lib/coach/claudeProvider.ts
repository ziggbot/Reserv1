import type { CoachProvider } from './provider'
import type { ChatMessage, CoachContext, CoachReply } from './types'
import { buildSystemPrompt, parseCoachJson, toCoachReply } from './prompt'

/**
 * Anthropic Messages API client (direct browser fetch — no SDK). Enabled when
 * the user has entered a Claude API key in Settings. The artifact sandbox CSP
 * blocks api.anthropic.com; in that case the call rejects and the resolver
 * falls back to the built-in coach.
 */

export const CLAUDE_MODELS = ['claude-opus-5', 'claude-sonnet-5', 'claude-haiku-4-5'] as const
export type ClaudeModel = (typeof CLAUDE_MODELS)[number]

export function makeClaudeProvider(apiKey: string, model: ClaudeModel): CoachProvider {
  return {
    id: 'claude',
    label: `Claude (${model})`,
    async reply(history: ChatMessage[], context: CoachContext): Promise<CoachReply> {
      const messages = history
        .filter((m) => m.text.trim())
        .map((m) => ({ role: m.role === 'coach' ? 'assistant' : 'user', content: m.text }))
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model,
          max_tokens: 1024,
          output_config: { effort: 'low' },
          system: buildSystemPrompt(context),
          messages,
        }),
      })
      if (!res.ok) {
        const detail = await res.text().catch(() => '')
        throw new Error(`Claude API ${res.status}: ${detail.slice(0, 200)}`)
      }
      const data = await res.json()
      const text: string = (data.content ?? [])
        .filter((b: { type: string }) => b.type === 'text')
        .map((b: { text: string }) => b.text)
        .join('')
      return toCoachReply(parseCoachJson(text)) as CoachReply
    },
  }
}
