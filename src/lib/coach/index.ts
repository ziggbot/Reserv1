import type { CoachProvider } from './provider'
import type { ChatMessage, CoachContext, CoachReply } from './types'
import { localCoach } from './localCoach'
import { makeClaudeProvider, type ClaudeModel } from './claudeProvider'
import { makeOpenAIProvider, type OpenAIModel } from './openaiProvider'

export type CoachProviderId = 'local' | 'claude' | 'openai'

export interface CoachSettings {
  provider: CoachProviderId
  claudeModel: ClaudeModel
  openaiModel: OpenAIModel
}

export interface CoachApiKeys {
  claude?: string
  openai?: string
}

export const DEFAULT_COACH_SETTINGS: CoachSettings = {
  provider: 'local',
  claudeModel: 'claude-opus-5',
  openaiModel: 'gpt-4o',
}

/** The configured LLM provider without fallback wrapping, or null when the built-in coach is in use. */
export function resolvePrimaryCoach(settings: CoachSettings, keys: CoachApiKeys): CoachProvider | null {
  if (settings.provider === 'claude' && keys.claude) return makeClaudeProvider(keys.claude, settings.claudeModel)
  if (settings.provider === 'openai' && keys.openai) return makeOpenAIProvider(keys.openai, settings.openaiModel)
  return null
}

/**
 * Pick the active provider from settings + keys, wrapped so that any network
 * failure (offline, sandbox CSP, HTTP error) transparently falls back to the
 * built-in coach and surfaces a one-line notice.
 */
export function resolveCoach(settings: CoachSettings, keys: CoachApiKeys): CoachProvider {
  const primary = resolvePrimaryCoach(settings, keys)
  if (!primary) return localCoach

  return {
    id: primary.id,
    label: primary.label,
    async reply(history: ChatMessage[], context: CoachContext): Promise<CoachReply> {
      try {
        return await primary!.reply(history, context)
      } catch (e) {
        const fallback = await localCoach.reply(history, context)
        const why = e instanceof Error ? e.message : 'connection failed'
        return {
          ...fallback,
          text: `⚠️ Couldn’t reach ${primary!.label} (${why}). Using the built-in coach instead.\n\n${fallback.text}`,
        }
      }
    },
  }
}
