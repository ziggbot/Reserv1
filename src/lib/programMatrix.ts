import { buildProgram } from './programs'
import type { Profile, WorkoutProgram } from './types'
import { trainingDays } from './trainingDays'
import { tr } from '../i18n'

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
  const days = trainingDays(profile).strength

  // Beginners always do full-body regardless of goal — frequency + skill acquisition beats a split.
  if (profile.fitnessLevel === 'beginner') {
    return {
      split: `Full body ×${Math.min(3, Math.max(2, days))}`,
      source: FREQ_SOURCE,
      why: tr(
        'As a beginner, training each muscle 2–3× per week (full-body) builds skill and strength faster than a body-part split — total weekly frequency, not session count, drives early progress.',
        'Som nybörjare bygger du teknik och styrka snabbare genom att träna varje muskel 2–3× per vecka (helkropp) än med en uppdelad rutin — det är den totala veckofrekvensen, inte antalet pass, som driver de tidiga framstegen.',
      ),
    }
  }

  if (profile.goal === 'muscle_gain') {
    if (days <= 3)
      return {
        split: 'Full body ×3',
        source: FREQ_SOURCE,
        why: tr(
          'On 3 days, full-body hits each muscle 3× a week — higher frequency means more weekly growth stimulus than a 3-way split at this volume.',
          'På 3 dagar tränar helkropp varje muskel 3× i veckan — högre frekvens ger mer tillväxtstimulus per vecka än en tredelad rutin vid den här volymen.',
        ),
      }
    if (days === 4)
      return {
        split: 'Upper / Lower ×2',
        source: VOLUME_SOURCE,
        why: tr(
          'Four days as upper/lower trains each region twice weekly and lets you place 10–20 hard sets per muscle across the week — the effective hypertrophy dose.',
          'Fyra dagar som över/underkropp tränar varje region två gånger i veckan och låter dig lägga 10–20 hårda set per muskel över veckan — den effektiva dosen för hypertrofi.',
        ),
      }
    return {
      split: 'Push / Pull / Legs ×2',
      source: VOLUME_SOURCE,
      why: tr(
        'On 5–6 days, PPL twice through the week gives each muscle two sessions and room for higher weekly volume, which drives more growth in trained lifters.',
        'På 5–6 dagar ger PPL två gånger per vecka varje muskel två pass och utrymme för högre veckovolym, vilket driver mer tillväxt hos tränade lyftare.',
      ),
    }
  }

  if (profile.goal === 'fat_loss' || profile.goal === 'recomp') {
    if (days <= 3)
      return {
        split: 'Full body ×3',
        source: FREQ_SOURCE,
        why: tr(
          'While cutting, full-body ×3 keeps every muscle stimulated on limited days — the strongest signal to retain muscle in a deficit, with time left for steps and conditioning.',
          'Under en deff håller helkropp ×3 varje muskel stimulerad på begränsade dagar — den starkaste signalen för att behålla muskler i ett kaloriunderskott, med tid över för steg och kondition.',
        ),
      }
    if (days === 4)
      return {
        split: 'Upper / Lower ×2',
        source: VOLUME_SOURCE,
        why: tr(
          'Upper/lower twice a week preserves muscle with enough weekly hard sets, while leaving two days for conditioning and daily-step targets that do the fat-burning.',
          'Över/underkropp två gånger i veckan bevarar musklerna med tillräckligt många hårda set per vecka, samtidigt som två dagar blir över för kondition och de dagliga stegmålen som sköter fettförbränningen.',
        ),
      }
    return {
      split: 'Upper / Lower + Push / Pull / Legs',
      source: VOLUME_SOURCE,
      why: tr(
        'Five days lets you hit each muscle twice and add conditioning without sacrificing the resistance training that protects muscle in a deficit.',
        'Fem dagar låter dig träna varje muskel två gånger och lägga till kondition utan att offra styrketräningen som skyddar musklerna i ett kaloriunderskott.',
      ),
    }
  }

  // general_fitness
  return {
    split: `Full body ×${Math.min(3, Math.max(2, days))} + conditioning`,
    source: WHO_SOURCE,
    why: tr(
      'For all-round health, full-body strength on your available days plus 150+ min of weekly cardio matches the WHO guideline — strength and aerobic fitness are the two biggest levers.',
      'För allsidig hälsa matchar helkroppsstyrka på dina tillgängliga dagar plus 150+ min kondition per vecka WHO:s riktlinje — styrka och aerob kondition är de två största spakarna.',
    ),
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
