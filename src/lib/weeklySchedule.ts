import { buildCardio } from './programs'
import type { Profile, WorkoutProgram } from './types'
import { L, tr } from '../i18n'

/**
 * Reconciles strength + conditioning against the user's weekly training-day
 * BUDGET so the plan never prescribes more sessions than they committed to.
 * This is the single source of truth for "what does my week look like".
 */

export type DayKind = 'strength' | 'cardio' | 'hiit'

export interface ScheduledDay {
  label: string // "Day 1"
  kind: DayKind
  icon: string
  title: string
  detail: string
}

export type ConditioningPlacement = 'separate' | 'finisher'

export interface WeeklySchedule {
  days: ScheduledDay[]
  conditioning: {
    hiitPerWeek: number
    zone2PerWeek: number
    placement: ConditioningPlacement
    note: string
  }
  dailySteps: number
  rotationNote?: string
  summaryLine: string
}

const KIND_ICON: Record<DayKind, string> = { strength: '🏋️', cardio: '🫀', hiit: '🔥' }

function dayLabel(n: number): string {
  return tr(`Day ${n}`, `Dag ${n}`)
}

export function buildWeeklySchedule(profile: Profile, program: WorkoutProgram): WeeklySchedule {
  const budget = profile.daysPerWeek
  const cardio = buildCardio(profile)

  // Strength gets first claim on the day budget. Titles are session names (keys,
  // stay English); the focus is display text and goes through the glossary.
  const strengthCount = Math.min(program.sessions.length, budget)
  const strengthDays: ScheduledDay[] = program.sessions.slice(0, strengthCount).map((s, i) => ({
    label: dayLabel(i + 1),
    kind: 'strength',
    icon: KIND_ICON.strength,
    title: s.name,
    detail: `${L(s.focus)} · ${profile.minutesPerSession} min`,
  }))

  const remaining = program.sessions.length - strengthCount
  const rotationNote =
    remaining > 0
      ? tr(
          `Your program has ${program.sessions.length} sessions but you train ${budget}×/week — the remaining session${
            remaining > 1 ? 's' : ''
          } (${program.sessions
            .slice(strengthCount)
            .map((s) => s.name)
            .join(', ')}) rotate in on following weeks so everything gets trained.`,
          `Ditt program har ${program.sessions.length} pass men du tränar ${budget}×/vecka — ${
            remaining > 1 ? 'de återstående passen' : 'det återstående passet'
          } (${program.sessions
            .slice(strengthCount)
            .map((s) => L(s.name))
            .join(', ')}) roterar in de följande veckorna så att allt blir tränat.`,
        )
      : undefined

  const freeDays = budget - strengthCount

  // Ideal conditioning from the goal, then fit it into whatever days are left.
  let hiitPerWeek = cardio.hiitSessionsPerWeek
  let zone2PerWeek = cardio.sessionsPerWeek
  const days = [...strengthDays]
  let placement: ConditioningPlacement

  if (freeDays > 0) {
    placement = 'separate'
    let slots = freeDays
    const scheduled: ScheduledDay[] = []
    if (hiitPerWeek > 0 && slots > 0) {
      scheduled.push({
        label: '',
        kind: 'hiit',
        icon: KIND_ICON.hiit,
        title: tr('HIIT conditioning', 'HIIT-kondition'),
        detail: tr(
          '15–20 min: 6–8 × 30 s hard / 90 s easy (bike, rower, hill walks).',
          '15–20 min: 6–8 × 30 s hårt / 90 s lugnt (cykel, roddmaskin, backpromenader).',
        ),
      })
      slots--
    }
    let z2 = 0
    while (slots > 0 && z2 < zone2PerWeek) {
      scheduled.push({
        label: '',
        kind: 'cardio',
        icon: KIND_ICON.cardio,
        title: tr('Zone-2 cardio', 'Zon 2-kondition'),
        detail: tr(
          '25–35 min easy — walk, cycle, row or swim (conversational pace).',
          '25–35 min lugnt — promenad, cykel, rodd eller simning (konversationstempo).',
        ),
      })
      slots--
      z2++
    }
    // Conditioning we couldn't fit as its own day becomes a finisher instead.
    hiitPerWeek = scheduled.filter((s) => s.kind === 'hiit').length
    zone2PerWeek = scheduled.filter((s) => s.kind === 'cardio').length
    days.push(...scheduled)
    days.forEach((d, i) => (d.label = dayLabel(i + 1)))
  } else {
    // No room for separate conditioning — fold it into strength days + steps.
    placement = 'finisher'
    hiitPerWeek = 0
    zone2PerWeek = 0
  }

  const steps = cardio.stepsTarget.toLocaleString()
  const hiitPrefix = hiitPerWeek > 0 ? `${hiitPerWeek}× HIIT + ` : ''
  const note =
    placement === 'separate'
      ? tr(
          `${hiitPrefix}${zone2PerWeek}× zone-2 fit into your ${budget}-day week. Never put HIIT the day before heavy legs.`,
          `${hiitPrefix}${zone2PerWeek}× zon 2 ryms i din ${budget}-dagarsvecka. Lägg aldrig HIIT dagen före tunga ben.`,
        )
      : tr(
          `With ${budget} training day${budget > 1 ? 's' : ''} there’s no room for a separate cardio day — that’s fine. Add an optional 8–10 min conditioning finisher after a lift when you have energy, and let your ${steps} daily steps be your main conditioning.`,
          `Med ${budget} träningsdag${budget > 1 ? 'ar' : ''} finns inget utrymme för en separat konditionsdag — det är helt okej. Lägg till ett valfritt 8–10 min konditionsavslut efter ett styrkepass när du har energi, och låt dina ${steps} steg per dag vara din huvudsakliga kondition.`,
        )

  const strengthLabel = tr(`${strengthCount}× strength`, `${strengthCount}× styrka`)
  const condLabel =
    placement === 'separate'
      ? tr(
          ` · ${hiitPerWeek > 0 ? `${hiitPerWeek}× HIIT · ` : ''}${zone2PerWeek}× zone-2`,
          ` · ${hiitPerWeek > 0 ? `${hiitPerWeek}× HIIT · ` : ''}${zone2PerWeek}× zon 2`,
        )
      : tr(' · conditioning as finisher', ' · kondition som avslut')
  const summaryLine = `${strengthLabel}${condLabel} · ${steps} ${tr('steps/day', 'steg/dag')}`

  return {
    days,
    conditioning: { hiitPerWeek, zone2PerWeek, placement, note },
    dailySteps: cardio.stepsTarget,
    rotationNote,
    summaryLine,
  }
}
