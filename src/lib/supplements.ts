import type { Profile, SupplementRec } from './types'

/**
 * Evidence-graded supplement recommendations, conditional on the user's goal,
 * diet and health screen. Grades: strong = consistent meta-analytic support,
 * moderate = good evidence in specific contexts, emerging = promising but thin.
 * Food first — supplements close specific gaps, they don't build the base.
 */
export function recommendSupplements(profile: Profile): SupplementRec[] {
  const recs: SupplementRec[] = []
  const pregnant = profile.medicalConditions.includes('pregnancy')
  const cardiovascularFlag =
    profile.medicalConditions.includes('hypertension') || profile.medicalConditions.includes('heart_condition')

  if (pregnant) {
    // Conservative: only the universally safe basics, everything via physician.
    recs.push({
      name: 'Vitamin D3',
      grade: 'strong',
      dose: '1,000–2,000 IU (25–50 µg) daily',
      timing: 'With a meal containing fat',
      why: 'Supports bone health and immune function; deficiency is common at northern latitudes, especially October–April.',
      caution: 'Discuss all supplementation with your prenatal care provider — including this one.',
    })
    return recs
  }

  recs.push({
    name: 'Creatine monohydrate',
    grade: 'strong',
    dose: '3–5 g daily (no loading needed)',
    timing: 'Any time — consistency matters, timing doesn’t',
    why: 'The most-studied sports supplement: +5–15% strength and lean-mass gains alongside resistance training, with emerging cognitive and healthy-aging benefits. Works for every goal in this app.',
    caution: 'Safe for healthy kidneys (the "kidney damage" myth is debunked in long-term studies). Expect ~1 kg water-weight uptick in week one — it is not fat.',
  })

  recs.push({
    name: 'Vitamin D3',
    grade: 'strong',
    dose: '1,000–2,000 IU (25–50 µg) daily',
    timing: 'With a meal containing fat',
    why: 'Muscle function, bone health and immunity; deficiency is widespread with indoor lifestyles and dark winters, and blunts training adaptations.',
    caution: 'A blood test (25-OH-D) beats guessing; higher doses only under medical guidance.',
  })

  recs.push(
    profile.dietPref === 'vegan'
      ? {
          name: 'Omega-3 (algae oil EPA/DHA)',
          grade: 'moderate',
          dose: '1–2 g combined EPA+DHA daily',
          timing: 'With food',
          why: 'Vegans get almost no preformed EPA/DHA. Supports cardiovascular health, recovery from training and long-term brain health — a core longevity play.',
        }
      : {
          name: 'Omega-3 (fish oil EPA/DHA)',
          grade: 'moderate',
          dose: '1–2 g combined EPA+DHA daily — or 2–3 servings of fatty fish per week instead',
          timing: 'With food',
          why: 'Cardiovascular and joint health, may aid muscle protein synthesis in older adults. Skip the capsules on weeks you actually eat salmon, mackerel or herring.',
        },
  )

  const proteinTargetHigh = profile.goal === 'fat_loss' || profile.goal === 'recomp'
  recs.push({
    name: profile.dietPref === 'vegan' ? 'Plant protein powder (pea/soy blend)' : 'Whey or casein protein powder',
    grade: 'strong',
    dose: '20–40 g per serving as needed',
    timing: 'Wherever a meal falls short of its protein target',
    why: proteinTargetHigh
      ? `Your cut demands a high protein target — a shake is the cheapest, easiest way to close the gap on busy days without extra calories.`
      : 'Convenience, not magic: it counts toward your daily protein exactly like food does.',
  })

  if (!cardiovascularFlag) {
    recs.push({
      name: 'Caffeine (pre-workout)',
      grade: 'strong',
      dose: '2–3 mg/kg (~200 mg) 30–45 min before training',
      timing: 'Morning/early-afternoon sessions only',
      why: 'Reliable 2–4% performance boost in strength and endurance work.',
      caution: `None after ~14:00 — it has a 5–6 h half-life and your ${profile.sleepHours} h of sleep is worth more than any pre-workout.`,
    })
  }

  if (profile.sleepHours < 7 || profile.stressLevel === 'high') {
    recs.push({
      name: 'Magnesium (glycinate/citrate)',
      grade: 'moderate',
      dose: '200–400 mg elemental',
      timing: '1–2 h before bed',
      why: 'Common shortfall in training adults; supplementation modestly improves sleep quality and muscle relaxation — relevant given your sleep/stress profile.',
    })
  }

  recs.push({
    name: 'Probiotics / fermented foods',
    grade: 'emerging',
    dose: 'Daily fermented foods (yogurt, kefir, kimchi, sauerkraut) or a multi-strain capsule',
    timing: 'With meals',
    why: 'Gut-microbiome diversity associates with better immunity, body composition and healthy aging. Food sources beat capsules on current evidence — capsules are the travel backup.',
  })

  return recs
}

export const SUPPLEMENT_PRINCIPLES = [
  'Food first: supplements close specific gaps; they cannot compensate for a poor base diet.',
  'Buy third-party tested products (Informed Sport / NSF) — the supplement market is poorly regulated.',
  'Add one at a time so you can tell what actually does something.',
  'Anything marketed as a "fat burner" is marketing. The deficit does the burning.',
]
