import type { CoachProvider } from './provider'
import type { ChatMessage, CoachContext, CoachReply, PlanChange } from './types'

/**
 * Placeholder coach — works offline with no API key. It acknowledges the message
 * and, for a handful of common, unambiguous intents (Swedish + English), returns
 * a structured plan proposal so the propose → apply → journal → undo flow is real
 * and testable today. A real LLM replaces this behind the same CoachProvider seam.
 */

const NUM_WORDS: Record<string, number> = {
  en: 1, ett: 1, one: 1,
  två: 2, tva: 2, two: 2,
  tre: 3, three: 3,
  fyra: 4, four: 4,
  fem: 5, five: 5,
  sex: 6, six: 6,
}

function parseNumber(text: string, near: RegExp): number | null {
  const m = text.match(near)
  if (!m) return null
  const digit = m[0].match(/\d+/)
  if (digit) return Number(digit[0])
  for (const [w, n] of Object.entries(NUM_WORDS)) {
    if (m[0].toLowerCase().includes(w)) return n
  }
  return null
}

function detect(text: string, context: CoachContext): { text: string; changes: PlanChange[]; summary?: string } {
  const t = text.toLowerCase()
  const changes: PlanChange[] = []
  const notes: string[] = []
  let summary: string | undefined

  // Training days per week — "jag kan bara träna 2 dagar", "only 3 days a week"
  if (/(dag|dagar|day|days|gånger|ganger|times|pass)/.test(t) && /(bara|max|only|klarar|kan|per vecka|a week|i veckan)/.test(t)) {
    const n =
      parseNumber(t, /\d+\s*(dag|dagar|day|days|gånger|ganger|times|pass)/) ??
      parseNumber(t, /(en|ett|one|två|tva|two|tre|three|fyra|four|fem|five|sex|six)\s*(dag|dagar|day|days)/)
    if (n && n >= 1 && n <= 7 && n !== context.profile.daysPerWeek) {
      changes.push({ type: 'daysPerWeek', value: n })
      summary = `Set training to ${n} day${n > 1 ? 's' : ''}/week`
    }
  }

  // Session length — "20 minuter", "only have 30 min"
  if (/(minut|minuter|min|minutes)/.test(t)) {
    const n = parseNumber(t, /\d+\s*(minut|minuter|min|minutes)/)
    if (n && n >= 15 && n <= 120 && n !== context.profile.minutesPerSession) {
      changes.push({ type: 'minutesPerSession', value: n })
      summary = summary ? `${summary}, ${n} min/session` : `Set sessions to ${n} min`
    }
  }

  // Goal switch
  if (/(bygga muskler|muscle|muskelmassa|gå upp|ga upp|bulk)/.test(t) && context.profile.goal !== 'muscle_gain') {
    changes.push({ type: 'goal', value: 'muscle_gain' })
    summary = 'Switch goal to building muscle'
  } else if (/(gå ner|ga ner|fett|fat loss|lose fat|deff|cut|banta)/.test(t) && context.profile.goal !== 'fat_loss') {
    changes.push({ type: 'goal', value: 'fat_loss' })
    summary = 'Switch goal to fat loss'
  }

  // Pain / injury → advice, no automatic change (safety)
  if (/(ont|smärt|smart|hurts?|pain|skada|injur|värk|vark)/.test(t)) {
    const area =
      /(knä|kna|knee)/.test(t) ? 'knee'
      : /(rygg|back|ländrygg|landrygg)/.test(t) ? 'lower back'
      : /(axel|axlar|shoulder)/.test(t) ? 'shoulder'
      : /(höft|hoft|hip)/.test(t) ? 'hip'
      : 'that area'
    notes.push(
      `Sorry to hear about your ${area}. Work strictly in a pain-free range, swap any movement that provokes it for a comfortable variation, and if pain is above ~3/10 or lingers to the next day, rest it and see a physio. I can help you pick substitute exercises.`,
    )
  }

  let reply: string
  if (changes.length > 0) {
    reply =
      `Got it. Based on that, I suggest updating your plan — review the change below and apply it if it looks right. ` +
      `Nothing changes until you tap Apply, and you can always undo it from the plan history.`
  } else if (notes.length > 0) {
    reply = notes.join(' ')
  } else {
    reply =
      `Thanks — I’ve noted that. (I’m the built-in coach; a full AI dialogue is coming soon.) ` +
      `I can already adjust concrete things — try e.g. “I can only train 2 days a week”, “only 30 minutes per session”, ` +
      `“switch my goal to building muscle”, or tell me if something hurts.`
  }
  if (notes.length > 0 && changes.length > 0) reply = `${notes.join(' ')} ${reply}`

  return { text: reply, changes, summary }
}

export const localCoach: CoachProvider = {
  id: 'local',
  label: 'Built-in coach (offline)',
  async reply(history: ChatMessage[], context: CoachContext): Promise<CoachReply> {
    const last = [...history].reverse().find((m) => m.role === 'user')
    if (!last) return { text: 'Hi! Tell me about your training and I’ll help you adjust the plan.' }
    const { text, changes, summary } = detect(last.text, context)
    if (changes.length > 0) {
      return { text, proposal: { summary: summary ?? 'Update plan', changes } }
    }
    return { text }
  },
}
