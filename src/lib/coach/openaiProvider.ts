import type { CoachProvider } from './provider'
import type { ChatMessage, CoachContext, CoachReply } from './types'
import { buildSystemPrompt, parseCoachJson, toCoachReply } from './prompt'

/**
 * OpenAI Chat Completions client (direct browser fetch — no SDK). Enabled when
 * the user has entered an OpenAI API key in Settings. Uses JSON response format
 * so the strict-JSON reply contract is honored. Sandbox CSP blocks the call in
 * the hosted preview; the resolver then falls back to the built-in coach.
 */

export const OPENAI_MODELS = ['gpt-4o', 'gpt-4o-mini'] as const
export type OpenAIModel = (typeof OPENAI_MODELS)[number]

export function makeOpenAIProvider(apiKey: string, model: OpenAIModel): CoachProvider {
  return {
    id: 'openai',
    label: `OpenAI (${model})`,
    async reply(history: ChatMessage[], context: CoachContext): Promise<CoachReply> {
      const messages = [
        { role: 'system', content: buildSystemPrompt(context) },
        ...history
          .filter((m) => m.text.trim())
          .map((m) => ({ role: m.role === 'coach' ? 'assistant' : 'user', content: m.text })),
      ]
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          max_tokens: 1024,
          response_format: { type: 'json_object' },
          messages,
        }),
      })
      if (!res.ok) {
        const detail = await res.text().catch(() => '')
        throw new Error(`OpenAI API ${res.status}: ${detail.slice(0, 200)}`)
      }
      const data = await res.json()
      const text: string = data.choices?.[0]?.message?.content ?? ''
      return toCoachReply(parseCoachJson(text)) as CoachReply
    },
  }
}
