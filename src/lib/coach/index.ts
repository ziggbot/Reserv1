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

/**
 * Pick the active provider from settings + keys, wrapped so that any network
 * failure (offline, sandbox CSP, HTTP error) transparently falls back to the
 * built-in coach and surfaces a one-line notice.
 */
export function resolveCoach(settings: CoachSettings, keys: CoachApiKeys): CoachProvider {
  let primary: CoachProvider | null = null
  if (settings.provider === 'claude' && keys.claude) primary = makeClaudeProvider(keys.claude, settings.claudeModel)
  else if (settings.provider === 'openai' && keys.openai) primary = makeOpenAIProvider(keys.openai, settings.openaiModel)

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
