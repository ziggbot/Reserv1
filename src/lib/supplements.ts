import type { Profile, SupplementRec } from './types'
import { tr } from '../i18n'

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
      name: tr('Vitamin D3', 'D-vitamin (D3)'),
      grade: 'strong',
      dose: tr('1,000–2,000 IU (25–50 µg) daily', '1 000–2 000 IE (25–50 µg) dagligen'),
      timing: tr('With a meal containing fat', 'Till en måltid som innehåller fett'),
      why: tr(
        'Supports bone health and immune function; deficiency is common at northern latitudes, especially October–April.',
        'Stödjer skelett och immunförsvar; brist är vanlig på nordliga breddgrader, särskilt oktober–april.',
      ),
      caution: tr(
        'Discuss all supplementation with your prenatal care provider — including this one.',
        'Diskutera alla kosttillskott med din mödravård — även det här.',
      ),
    })
    return recs
  }

  recs.push({
    name: tr('Creatine monohydrate', 'Kreatinmonohydrat'),
    grade: 'strong',
    dose: tr('3–5 g daily (no loading needed)', '3–5 g dagligen (ingen laddningsfas behövs)'),
    timing: tr('Any time — consistency matters, timing doesn’t', 'När som helst — regelbundenheten spelar roll, tidpunkten gör det inte'),
    why: tr(
      'The most-studied sports supplement: +5–15% strength and lean-mass gains alongside resistance training, with emerging cognitive and healthy-aging benefits. Works for every goal in this app.',
      'Det mest studerade sporttillskottet: +5–15 % i styrka och muskelmassa tillsammans med styrketräning, med växande stöd för kognition och friskt åldrande. Fungerar för alla mål i den här appen.',
    ),
    caution: tr(
      'Safe for healthy kidneys (the "kidney damage" myth is debunked in long-term studies). Expect ~1 kg water-weight uptick in week one — it is not fat.',
      'Säkert för friska njurar (myten om "njurskador" är avfärdad i långtidsstudier). Räkna med ~1 kg extra vätska första veckan — det är inte fett.',
    ),
  })

  recs.push({
    name: tr('Vitamin D3', 'D-vitamin (D3)'),
    grade: 'strong',
    dose: tr('1,000–2,000 IU (25–50 µg) daily', '1 000–2 000 IE (25–50 µg) dagligen'),
    timing: tr('With a meal containing fat', 'Till en måltid som innehåller fett'),
    why: tr(
      'Muscle function, bone health and immunity; deficiency is widespread with indoor lifestyles and dark winters, and blunts training adaptations.',
      'Muskelfunktion, skelett och immunförsvar; brist är utbredd med inomhusliv och mörka vintrar, och dämpar träningsanpassningen.',
    ),
    caution: tr(
      'A blood test (25-OH-D) beats guessing; higher doses only under medical guidance.',
      'Ett blodprov (25-OH-D) slår gissningar; högre doser bara under medicinsk vägledning.',
    ),
  })

  recs.push(
    profile.dietPref === 'vegan'
      ? {
          name: tr('Omega-3 (algae oil EPA/DHA)', 'Omega-3 (algolja EPA/DHA)'),
          grade: 'moderate',
          dose: tr('1–2 g combined EPA+DHA daily', '1–2 g EPA+DHA sammanlagt dagligen'),
          timing: tr('With food', 'Till mat'),
          why: tr(
            'Vegans get almost no preformed EPA/DHA. Supports cardiovascular health, recovery from training and long-term brain health — a core longevity play.',
            'Veganer får nästan inget färdigbildat EPA/DHA. Stödjer hjärta och kärl, återhämtning efter träning och hjärnhälsa på sikt — en grundpelare för fler friska år.',
          ),
        }
      : {
          name: tr('Omega-3 (fish oil EPA/DHA)', 'Omega-3 (fiskolja EPA/DHA)'),
          grade: 'moderate',
          dose: tr(
            '1–2 g combined EPA+DHA daily — or 2–3 servings of fatty fish per week instead',
            '1–2 g EPA+DHA sammanlagt dagligen — eller 2–3 portioner fet fisk i veckan i stället',
          ),
          timing: tr('With food', 'Till mat'),
          why: tr(
            'Cardiovascular and joint health, may aid muscle protein synthesis in older adults. Skip the capsules on weeks you actually eat salmon, mackerel or herring.',
            'Hjärta, kärl och leder; kan stödja muskelproteinsyntesen hos äldre. Hoppa över kapslarna de veckor du faktiskt äter lax, makrill eller sill.',
          ),
        },
  )

  const proteinTargetHigh = profile.goal === 'fat_loss' || profile.goal === 'recomp'
  recs.push({
    name:
      profile.dietPref === 'vegan'
        ? tr('Plant protein powder (pea/soy blend)', 'Växtbaserat proteinpulver (ärt/soja-blandning)')
        : tr('Whey or casein protein powder', 'Vassle- eller kaseinproteinpulver'),
    grade: 'strong',
    dose: tr('20–40 g per serving as needed', '20–40 g per portion vid behov'),
    timing: tr('Wherever a meal falls short of its protein target', 'När en måltid inte når sitt proteinmål'),
    why: proteinTargetHigh
      ? tr(
          `Your cut demands a high protein target — a shake is the cheapest, easiest way to close the gap on busy days without extra calories.`,
          `Din deff kräver ett högt proteinmål — en shake är det billigaste och enklaste sättet att täcka gapet på stressiga dagar utan extra kalorier.`,
        )
      : tr(
          'Convenience, not magic: it counts toward your daily protein exactly like food does.',
          'Bekvämlighet, inte magi: det räknas mot ditt dagliga protein precis som mat gör.',
        ),
  })

  if (!cardiovascularFlag) {
    recs.push({
      name: tr('Caffeine (pre-workout)', 'Koffein (före träning)'),
      grade: 'strong',
      dose: tr('2–3 mg/kg (~200 mg) 30–45 min before training', '2–3 mg/kg (~200 mg) 30–45 min före passet'),
      timing: tr('Morning/early-afternoon sessions only', 'Bara vid pass på morgonen/tidig eftermiddag'),
      why: tr(
        'Reliable 2–4% performance boost in strength and endurance work.',
        'Pålitlig prestationshöjning på 2–4 % i styrke- och konditionsarbete.',
      ),
      caution: tr(
        `None after ~14:00 — it has a 5–6 h half-life and your ${profile.sleepHours} h of sleep is worth more than any pre-workout.`,
        `Inget efter ~14:00 — halveringstiden är 5–6 h och dina ${profile.sleepHours} h sömn är värda mer än något pre-workout.`,
      ),
    })
  }

  if (profile.sleepHours < 7 || profile.stressLevel === 'high') {
    recs.push({
      name: tr('Magnesium (glycinate/citrate)', 'Magnesium (glycinat/citrat)'),
      grade: 'moderate',
      dose: tr('200–400 mg elemental', '200–400 mg elementärt'),
      timing: tr('1–2 h before bed', '1–2 h före läggdags'),
      why: tr(
        'Common shortfall in training adults; supplementation modestly improves sleep quality and muscle relaxation — relevant given your sleep/stress profile.',
        'Vanlig brist hos tränande vuxna; tillskott förbättrar sömnkvalitet och muskelavslappning måttligt — relevant med tanke på din sömn/stress.',
      ),
    })
  }

  recs.push({
    name: tr('Probiotics / fermented foods', 'Probiotika / fermenterad mat'),
    grade: 'emerging',
    dose: tr(
      'Daily fermented foods (yogurt, kefir, kimchi, sauerkraut) or a multi-strain capsule',
      'Fermenterad mat dagligen (yoghurt, kefir, kimchi, surkål) eller en kapsel med flera stammar',
    ),
    timing: tr('With meals', 'Till måltider'),
    why: tr(
      'Gut-microbiome diversity associates with better immunity, body composition and healthy aging. Food sources beat capsules on current evidence — capsules are the travel backup.',
      'Mångfald i tarmfloran hänger ihop med bättre immunförsvar, kroppssammansättning och friskt åldrande. Mat slår kapslar enligt nuvarande evidens — kapslar är reservlösningen på resa.',
    ),
  })

  return recs
}

export function supplementPrinciples(): string[] {
  return [
    tr(
      'Food first: supplements close specific gaps; they cannot compensate for a poor base diet.',
      'Mat först: kosttillskott täcker specifika luckor; de kan inte kompensera för en dålig grundkost.',
    ),
    tr(
      'Buy third-party tested products (Informed Sport / NSF) — the supplement market is poorly regulated.',
      'Köp tredjepartstestade produkter (Informed Sport / NSF) — tillskottsmarknaden är dåligt reglerad.',
    ),
    tr(
      'Add one at a time so you can tell what actually does something.',
      'Lägg till ett i taget så att du märker vad som faktiskt gör något.',
    ),
    tr(
      'Anything marketed as a "fat burner" is marketing. The deficit does the burning.',
      'Allt som marknadsförs som "fettförbrännare" är marknadsföring. Det är underskottet som förbränner.',
    ),
  ]
}
