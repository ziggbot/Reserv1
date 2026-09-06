import type { CoachProvider } from './provider'
import type { ChatMessage, CoachContext, CoachReply, PlanChange } from './types'
import { tr } from '../../i18n'

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
      summary = tr(`Set training to ${n} day${n > 1 ? 's' : ''}/week`, `Träna ${n} ${n > 1 ? 'dagar' : 'dag'}/vecka`)
    }
  }

  // Session length — "20 minuter", "only have 30 min"
  if (/(minut|minuter|min|minutes)/.test(t)) {
    const n = parseNumber(t, /\d+\s*(minut|minuter|min|minutes)/)
    if (n && n >= 15 && n <= 120 && n !== context.profile.minutesPerSession) {
      changes.push({ type: 'minutesPerSession', value: n })
      summary = summary ? `${summary}, ${n} min/session` : tr(`Set sessions to ${n} min`, `Pass på ${n} min`)
    }
  }

  // Goal switch
  if (/(bygga muskler|muscle|muskelmassa|gå upp|ga upp|bulk)/.test(t) && context.profile.goal !== 'muscle_gain') {
    changes.push({ type: 'goal', value: 'muscle_gain' })
    summary = tr('Switch goal to building muscle', 'Byt mål till att bygga muskler')
  } else if (/(gå ner|ga ner|fett|fat loss|lose fat|deff|cut|banta)/.test(t) && context.profile.goal !== 'fat_loss') {
    changes.push({ type: 'goal', value: 'fat_loss' })
    summary = tr('Switch goal to fat loss', 'Byt mål till fettförlust')
  }

  // Pain / injury → advice, no automatic change (safety)
  if (/(ont|smärt|smart|hurts?|pain|skada|injur|värk|vark)/.test(t)) {
    const area =
      /(knä|kna|knee)/.test(t) ? tr('knee', 'knät')
      : /(rygg|back|ländrygg|landrygg)/.test(t) ? tr('lower back', 'ländryggen')
      : /(axel|axlar|shoulder)/.test(t) ? tr('shoulder', 'axeln')
      : /(höft|hoft|hip)/.test(t) ? tr('hip', 'höften')
      : tr('that area', 'det området')
    notes.push(
      tr(
        `Sorry to hear about your ${area}. Work strictly in a pain-free range, swap any movement that provokes it for a comfortable variation, and if pain is above ~3/10 or lingers to the next day, rest it and see a physio. I can help you pick substitute exercises.`,
        `Tråkigt att höra om ${area}. Jobba strikt i ett smärtfritt rörelseomfång, byt varje rörelse som provocerar det mot en bekväm variant, och om smärtan är över ~3/10 eller sitter i till nästa dag: vila och uppsök en fysioterapeut. Jag kan hjälpa dig välja ersättningsövningar.`,
      ),
    )
  }

  let reply: string
  if (changes.length > 0) {
    reply = tr(
      `Got it. Based on that, I suggest updating your plan — review the change below and apply it if it looks right. ` +
        `Nothing changes until you tap Apply, and you can always undo it from the plan history.`,
      `Uppfattat. Utifrån det föreslår jag en uppdatering av din plan — granska ändringen nedan och aktivera den om den ser rätt ut. ` +
        `Inget ändras förrän du trycker på Aktivera, och du kan alltid ångra det från planhistoriken.`,
    )
  } else if (notes.length > 0) {
    reply = notes.join(' ')
  } else {
    reply = tr(
      `Thanks — I’ve noted that. (I’m the built-in coach; a full AI dialogue is coming soon.) ` +
        `I can already adjust concrete things — try e.g. “I can only train 2 days a week”, “only 30 minutes per session”, ` +
        `“switch my goal to building muscle”, or tell me if something hurts.`,
      `Tack — jag har noterat det. (Jag är den inbyggda coachen; en fullständig AI-dialog kommer snart.) ` +
        `Jag kan redan justera konkreta saker — prova t.ex. ”Jag kan bara träna 2 dagar i veckan”, ”bara 30 minuter per pass”, ` +
        `”byt mitt mål till att bygga muskler”, eller berätta om något gör ont.`,
    )
  }
  if (notes.length > 0 && changes.length > 0) reply = `${notes.join(' ')} ${reply}`

  return { text: reply, changes, summary }
}

export const localCoach: CoachProvider = {
  id: 'local',
  // Getter so the label follows the active language instead of freezing at load.
  get label() {
    return tr('Built-in coach (offline)', 'Inbyggd coach (offline)')
  },
  async reply(history: ChatMessage[], context: CoachContext): Promise<CoachReply> {
    const last = [...history].reverse().find((m) => m.role === 'user')
    if (!last) {
      return {
        text: tr(
          'Hi! Tell me about your training and I’ll help you adjust the plan.',
          'Hej! Berätta om din träning så hjälper jag dig justera planen.',
        ),
      }
    }
    const { text, changes, summary } = detect(last.text, context)
    if (changes.length > 0) {
      return { text, proposal: { summary: summary ?? tr('Update plan', 'Uppdatera planen'), changes } }
    }
    return { text }
  },
}
