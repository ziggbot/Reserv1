import { buildCardio } from './programs'
import type { Profile, WorkoutProgram } from './types'

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

export function buildWeeklySchedule(profile: Profile, program: WorkoutProgram): WeeklySchedule {
  const budget = profile.daysPerWeek
  const cardio = buildCardio(profile)

  // Strength gets first claim on the day budget.
  const strengthCount = Math.min(program.sessions.length, budget)
  const strengthDays: ScheduledDay[] = program.sessions.slice(0, strengthCount).map((s, i) => ({
    label: `Day ${i + 1}`,
    kind: 'strength',
    icon: KIND_ICON.strength,
    title: s.name,
    detail: `${s.focus} · ${profile.minutesPerSession} min`,
  }))

  const rotationNote =
    program.sessions.length > strengthCount
      ? `Your program has ${program.sessions.length} sessions but you train ${budget}×/week — the remaining session${
          program.sessions.length - strengthCount > 1 ? 's' : ''
        } (${program.sessions
          .slice(strengthCount)
          .map((s) => s.name)
          .join(', ')}) rotate in on following weeks so everything gets trained.`
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
        title: 'HIIT conditioning',
        detail: '15–20 min: 6–8 × 30 s hard / 90 s easy (bike, rower, hill walks).',
      })
      slots--
    }
    let z2 = 0
    while (slots > 0 && z2 < zone2PerWeek) {
      scheduled.push({
        label: '',
        kind: 'cardio',
        icon: KIND_ICON.cardio,
        title: 'Zone-2 cardio',
        detail: '25–35 min easy — walk, cycle, row or swim (conversational pace).',
      })
      slots--
      z2++
    }
    // Conditioning we couldn't fit as its own day becomes a finisher instead.
    hiitPerWeek = scheduled.filter((s) => s.kind === 'hiit').length
    zone2PerWeek = scheduled.filter((s) => s.kind === 'cardio').length
    days.push(...scheduled)
    days.forEach((d, i) => (d.label = `Day ${i + 1}`))
  } else {
    // No room for separate conditioning — fold it into strength days + steps.
    placement = 'finisher'
    hiitPerWeek = 0
    zone2PerWeek = 0
  }

  const note =
    placement === 'separate'
      ? `${hiitPerWeek > 0 ? `${hiitPerWeek}× HIIT + ` : ''}${zone2PerWeek}× zone-2 fit into your ${budget}-day week. Never put HIIT the day before heavy legs.`
      : `With ${budget} training day${budget > 1 ? 's' : ''} there’s no room for a separate cardio day — that’s fine. Add an optional 8–10 min conditioning finisher after a lift when you have energy, and let your ${cardio.stepsTarget.toLocaleString()} daily steps be your main conditioning.`

  const strengthLabel = `${strengthCount}× strength`
  const condLabel =
    placement === 'separate'
      ? ` · ${hiitPerWeek > 0 ? `${hiitPerWeek}× HIIT · ` : ''}${zone2PerWeek}× zone-2`
      : ' · conditioning as finisher'
  const summaryLine = `${strengthLabel}${condLabel} · ${cardio.stepsTarget.toLocaleString()} steps/day`

  return {
    days,
    conditioning: { hiitPerWeek, zone2PerWeek, placement, note },
    dailySteps: cardio.stepsTarget,
    rotationNote,
    summaryLine,
  }
}
