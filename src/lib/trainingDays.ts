import type { FitnessLevel, Goal, Profile } from './types'
import { tr } from '../i18n'

/**
 * How the week is budgeted. New profiles say how many STRENGTH and how many
 * CARDIO sessions they can do; older profiles only have a total (`daysPerWeek`),
 * which the schedule treats the old way (strength first, cardio in what is left).
 */
export interface TrainingDays {
  strength: number
  cardio: number
  total: number
  /** true when the profile carries the separate strength/cardio numbers */
  split: boolean
}

export function trainingDays(p: Pick<Profile, 'daysPerWeek' | 'strengthDaysPerWeek' | 'cardioDaysPerWeek'>): TrainingDays {
  if (typeof p.strengthDaysPerWeek === 'number') {
    const strength = clamp(p.strengthDaysPerWeek, 1, 6)
    const cardio = clamp(p.cardioDaysPerWeek ?? 0, 0, 6)
    return { strength, cardio, total: Math.min(7, strength + cardio), split: true }
  }
  return { strength: p.daysPerWeek, cardio: 0, total: p.daysPerWeek, split: false }
}

/** Profile with the week budget set; keeps `daysPerWeek` as the total for older code paths. */
export function withTrainingDays(p: Profile, strength: number, cardio: number): Profile {
  const s = clamp(strength, 1, 6)
  const c = clamp(cardio, 0, 6)
  return { ...p, strengthDaysPerWeek: s, cardioDaysPerWeek: c, daysPerWeek: Math.min(7, s + c) }
}

/** Sensible ranges shown as guidance in the intake and the program page. */
export function recommendedDays(level: FitnessLevel, goal: Goal): { strength: [number, number]; cardio: [number, number] } {
  const strength: [number, number] = level === 'beginner' ? [2, 3] : level === 'intermediate' ? [3, 4] : [4, 5]
  const cardio: [number, number] =
    goal === 'fat_loss' ? [2, 3] : goal === 'general_fitness' ? [2, 3] : goal === 'recomp' ? [1, 2] : [1, 2]
  return { strength, cardio }
}

/** "3× strength + 2× cardio" / "3× styrka + 2× kondition"; a plain "N days" for older profiles. */
export function describeWeek(p: Profile): string {
  const d = trainingDays(p)
  if (!d.split) return tr(`${d.total}×/week`, `${d.total}×/vecka`)
  const s = tr(`${d.strength}× strength`, `${d.strength}× styrka`)
  const c = d.cardio > 0 ? tr(` + ${d.cardio}× cardio`, ` + ${d.cardio}× kondition`) : ''
  return s + c
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(n)))
}
