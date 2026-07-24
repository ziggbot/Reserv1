import { buildProgram } from './programs'
import type { Profile, WorkoutProgram } from './types'

/**
 * Research-based program matrix. Maps (goal × training-day budget × experience)
 * to ONE recommended split, so the app gives a clear "do this" schema rather than
 * a wall of options. The actual sessions come from the injury/equipment-aware
 * builder in programs.ts; this layer only decides the split and explains why.
 */

export interface Recommendation {
  program: WorkoutProgram
  splitName: string
  rationale: string
  sourceName: string
  sourceUrl: string
}

const FREQ_SOURCE = {
  name: 'Schoenfeld et al., Sports Med 2016 (training-frequency meta-analysis)',
  url: 'https://pubmed.ncbi.nlm.nih.gov/27102172/',
}
const VOLUME_SOURCE = {
  name: 'Schoenfeld et al., J Sports Sci 2017 (volume dose–response)',
  url: 'https://pubmed.ncbi.nlm.nih.gov/27433992/',
}
const WHO_SOURCE = {
  name: 'WHO 2020 Physical Activity Guidelines',
  url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7719906/',
}

/** Decide the split name from goal, day-budget and experience. */
function pickSplit(profile: Profile): { split: string; source: { name: string; url: string }; why: string } {
  const days = profile.daysPerWeek

  // Beginners always do full-body regardless of goal — frequency + skill acquisition beats a split.
  if (profile.fitnessLevel === 'beginner') {
    return {
      split: `Full body ×${Math.min(3, Math.max(2, days))}`,
      source: FREQ_SOURCE,
      why: 'As a beginner, training each muscle 2–3× per week (full-body) builds skill and strength faster than a body-part split — total weekly frequency, not session count, drives early progress.',
    }
  }

  if (profile.goal === 'muscle_gain') {
    if (days <= 3) return { split: 'Full body ×3', source: FREQ_SOURCE, why: 'On 3 days, full-body hits each muscle 3× a week — higher frequency means more weekly growth stimulus than a 3-way split at this volume.' }
    if (days === 4) return { split: 'Upper / Lower ×2', source: VOLUME_SOURCE, why: 'Four days as upper/lower trains each region twice weekly and lets you place 10–20 hard sets per muscle across the week — the effective hypertrophy dose.' }
    return { split: 'Push / Pull / Legs ×2', source: VOLUME_SOURCE, why: 'On 5–6 days, PPL twice through the week gives each muscle two sessions and room for higher weekly volume, which drives more growth in trained lifters.' }
  }

  if (profile.goal === 'fat_loss' || profile.goal === 'recomp') {
    if (days <= 3) return { split: 'Full body ×3', source: FREQ_SOURCE, why: 'While cutting, full-body ×3 keeps every muscle stimulated on limited days — the strongest signal to retain muscle in a deficit, with time left for steps and conditioning.' }
    if (days === 4) return { split: 'Upper / Lower ×2', source: VOLUME_SOURCE, why: 'Upper/lower twice a week preserves muscle with enough weekly hard sets, while leaving two days for conditioning and daily-step targets that do the fat-burning.' }
    return { split: 'Upper / Lower + Push / Pull / Legs', source: VOLUME_SOURCE, why: 'Five days lets you hit each muscle twice and add conditioning without sacrificing the resistance training that protects muscle in a deficit.' }
  }

  // general_fitness
  return {
    split: `Full body ×${Math.min(3, Math.max(2, days))} + conditioning`,
    source: WHO_SOURCE,
    why: 'For all-round health, full-body strength on your available days plus 150+ min of weekly cardio matches the WHO guideline — strength and aerobic fitness are the two biggest levers.',
  }
}

export function recommendProgram(profile: Profile): Recommendation {
  const { split, source, why } = pickSplit(profile)
  // The builder picks sessions from the day-budget; splitName is overridden for clarity.
  const program = { ...buildProgram(profile), splitName: split }
  return {
    program,
    splitName: split,
    rationale: why,
    sourceName: source.name,
    sourceUrl: source.url,
  }
}
