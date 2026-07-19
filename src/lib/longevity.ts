import type { EvidenceGrade, Profile } from './types'

/**
 * Longevity content library. Every claim carries an evidence grade and a real,
 * canonical source URL (PubMed/PMC, journal publisher, NIH, WHO, IARC) surfaced
 * and cross-checked via search during authoring. Honesty is the expertise:
 * hyped-but-unproven interventions are labelled as such.
 */

export interface LongevityClaim {
  statement: string
  detail: string
  grade: EvidenceGrade
  sourceName: string
  url: string
}

export interface LongevitySection {
  id: string
  icon: string
  title: string
  intro: string
  claims: LongevityClaim[]
}

export const LONGEVITY_SECTIONS: LongevitySection[] = [
  {
    id: 'big-rocks',
    icon: '🪨',
    title: 'The big rocks',
    intro:
      'A handful of levers explain most of the modifiable difference in healthy lifespan. Get these right before optimizing anything smaller.',
    claims: [
      {
        statement: 'Cardiorespiratory fitness is one of the strongest predictors of living longer',
        detail:
          'In 122,007 people, higher fitness on a treadmill test tracked with lower all-cause mortality — with no observed upper limit and the biggest gap between "low" and "below average". Being unfit carried risk comparable to smoking or diabetes.',
        grade: 'strong',
        sourceName: 'Mandsager et al., JAMA Network Open 2018',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6324439/',
      },
      {
        statement: 'Strength training 2–4×/week independently lowers mortality',
        detail:
          'A meta-analysis of cohort studies found 30–60 min/week of muscle-strengthening activity associated with a 10–20% lower risk of all-cause mortality, cardiovascular disease and cancer — on top of any cardio.',
        grade: 'strong',
        sourceName: 'Momma et al., Br J Sports Med 2022',
        url: 'https://pubmed.ncbi.nlm.nih.gov/35228201/',
      },
      {
        statement: 'More daily steps → lower mortality, with benefit up to ~7,000–10,000',
        detail:
          'Across 15 cohorts, risk fell steadily with more steps; ~7,000/day captures most of the benefit for many adults, and the classic "10,000" is a fine target but not a magic threshold.',
        grade: 'strong',
        sourceName: 'Paluch et al., Lancet Public Health 2022',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9289978/',
      },
      {
        statement: 'Meet the activity guideline: 150–300 min/week moderate + 2 strength days',
        detail:
          'The WHO 2020 guideline: 150–300 min moderate (or 75–150 vigorous) aerobic activity weekly plus muscle-strengthening on 2+ days, and replace sitting with movement of any intensity. "Some is better than none; more is better."',
        grade: 'strong',
        sourceName: 'WHO 2020 Guidelines (Bull et al.)',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7719906/',
      },
      {
        statement: 'Strong social connection rivals classic risk factors for survival',
        detail:
          'A meta-analysis of 148 studies (308,849 people) found a 50% greater likelihood of survival for those with stronger social relationships — an effect size comparable to quitting smoking.',
        grade: 'strong',
        sourceName: 'Holt-Lunstad et al., PLoS Medicine 2010',
        url: 'https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.1000316',
      },
      {
        statement: 'Control your blood pressure — target matters',
        detail:
          'In SPRINT, aiming for systolic <120 mmHg (vs <140) cut major cardiovascular events by ~25% and death by ~27% in high-risk adults. Know your numbers; treat high blood pressure.',
        grade: 'strong',
        sourceName: 'SPRINT Research Group, NEJM 2015',
        url: 'https://www.nejm.org/doi/full/10.1056/NEJMoa1511939',
      },
    ],
  },
  {
    id: 'food',
    icon: '🥗',
    title: 'Food & nutrition',
    intro:
      'No single "longevity food" — dietary patterns drive outcomes. Plant-forward, high-fibre, minimally processed, with enough protein as you age.',
    claims: [
      {
        statement: 'A Mediterranean pattern lowers cardiovascular events',
        detail:
          'In the PREDIMED randomized trial, a Mediterranean diet with extra-virgin olive oil or nuts cut major cardiovascular events by ~30% vs a low-fat control in high-risk adults. Olive oil, nuts, legumes, fish, vegetables, whole grains.',
        grade: 'strong',
        sourceName: 'Estruch et al., NEJM 2018 (PREDIMED)',
        url: 'https://www.nejm.org/doi/full/10.1056/NEJMoa1800389',
      },
      {
        statement: 'Eat 25–30 g+ of fibre a day',
        detail:
          'A Lancet series found the highest fibre consumers had 15–30% lower all-cause and cardiovascular mortality, with benefit greatest at 25–29 g/day and rising beyond. Whole grains, legumes, vegetables, fruit.',
        grade: 'strong',
        sourceName: 'Reynolds et al., The Lancet 2019',
        url: 'https://pubmed.ncbi.nlm.nih.gov/30638909/',
      },
      {
        statement: 'Protein needs rise with age (~1.0–1.2 g/kg, more if active)',
        detail:
          'The PROT-AGE expert group recommends 1.0–1.2 g/kg/day for adults over 65 (≥1.2 if exercising) to defend against sarcopenia — higher than the standard RDA and easy to miss on a plant-light plate.',
        grade: 'moderate',
        sourceName: 'Bauer et al., JAMDA 2013 (PROT-AGE)',
        url: 'https://www.jamda.com/article/S1525-8610(13)00326-5/fulltext',
      },
      {
        statement: 'Limit processed meat; go easy on red meat',
        detail:
          'The IARC classifies processed meat as a Group 1 carcinogen and red meat as "probably carcinogenic"; each 50 g/day of processed meat is linked to ~18% higher colorectal-cancer risk. Treat bacon/deli meat as an occasional food.',
        grade: 'strong',
        sourceName: 'IARC/WHO Q&A on red & processed meat',
        url: 'https://www.who.int/news-room/questions-and-answers/item/cancer-carcinogenicity-of-the-consumption-of-red-meat-and-processed-meat',
      },
      {
        statement: 'There is no "heart-healthy" amount of alcohol',
        detail:
          'The Global Burden of Disease analysis concluded the consumption level that minimizes health loss is zero — the old "J-curve" largely reflected study artefacts. Less is better; none is safest.',
        grade: 'strong',
        sourceName: 'GBD Alcohol Collaborators, The Lancet 2018',
        url: 'https://www.thelancet.com/article/S0140-6736(18)31571-X/fulltext',
      },
      {
        statement: 'Time-restricted eating: promising, not proven for longevity',
        detail:
          'Eating within a consistent daily window may help some people control calories and metabolic markers, but human evidence for lifespan extension is preliminary. Useful as an adherence tool, not a magic switch.',
        grade: 'emerging',
        sourceName: 'de Cabo & Mattson, NEJM 2019 (review)',
        url: 'https://www.nejm.org/doi/full/10.1056/NEJMra1905136',
      },
    ],
  },
  {
    id: 'supplements',
    icon: '💊',
    title: 'Supplements',
    intro:
      'Most supplements do little for a well-fed person. A short list has real evidence for specific gaps; a longer list is marketing. Food and training first.',
    claims: [
      {
        statement: 'Vitamin D — correct a deficiency, don’t megadose',
        detail:
          'Worth supplementing (1,000–2,000 IU/day) if you’re low or get little sun, especially at northern latitudes in winter; a blood test beats guessing. Benefits are about correcting deficiency, not loading up.',
        grade: 'moderate',
        sourceName: 'NIH Office of Dietary Supplements',
        url: 'https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/',
      },
      {
        statement: 'Creatine — muscle now, maybe brain later',
        detail:
          '3–5 g/day is strongly proven for strength and lean mass (which protect against age-related frailty), with emerging evidence for cognition in older adults. One of the few supplements worth most people’s money.',
        grade: 'moderate',
        sourceName: 'Kreider et al., ISSN Position Stand 2017',
        url: 'https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0173-z',
      },
      {
        statement: 'Omega-3 (EPA/DHA) for heart and, if intake is low, general health',
        detail:
          'If you rarely eat oily fish, 1–2 g/day of combined EPA/DHA (algae oil if vegan) supports cardiovascular and metabolic health. Whole fish 2–3×/week is an equally good route.',
        grade: 'moderate',
        sourceName: 'NIH Office of Dietary Supplements',
        url: 'https://ods.od.nih.gov/factsheets/Omega3FattyAcids-HealthProfessional/',
      },
      {
        statement: 'NMN / NR (NAD+ boosters): impressive in mice, unproven in humans',
        detail:
          'Human trials so far show these are safe and raise NAD+ blood levels, but there is no evidence yet that they extend healthy lifespan in people. Promising research, not a proven longevity buy.',
        grade: 'emerging',
        sourceName: 'Human trials review, GeroScience/PMC 2023',
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10721522/',
      },
      {
        statement: 'Overhyped, skip for longevity: resveratrol & "anti-aging" blends',
        detail:
          'Resveratrol’s mouse results never replicated in humans; multivitamins don’t reduce mortality in well-nourished people; "greens powders" are expensive urine. Spend the money on vegetables and a coach.',
        grade: 'emerging',
        sourceName: 'NIH ODS — Dietary Supplements overview',
        url: 'https://ods.od.nih.gov/factsheets/MVMS-HealthProfessional/',
      },
    ],
  },
  {
    id: 'routines',
    icon: '🌙',
    title: 'Routines & recovery',
    intro: 'The daily and weekly rhythms that compound quietly over decades.',
    claims: [
      {
        statement: 'Sleep regularity may matter even more than sleep duration',
        detail:
          'In 60,000+ UK Biobank participants, consistent sleep/wake timing predicted 20–48% lower all-cause mortality and beat duration as a predictor. Same bedtime and wake time — even weekends — is a free longevity habit.',
        grade: 'moderate',
        sourceName: 'Windred et al., Sleep 2024',
        url: 'https://academic.oup.com/sleep/article/47/1/zsad253/7280269',
      },
      {
        statement: 'Aim for 7–9 h of sleep — the base of recovery',
        detail:
          'Adults consistently do best on 7–9 h. Chronic short sleep worsens metabolic health, appetite hormones and cardiovascular risk, and (in a deficit) shifts weight loss toward muscle.',
        grade: 'strong',
        sourceName: 'AASM/SRS Consensus (Watson et al. 2015)',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4434546/',
      },
      {
        statement: 'Regular sauna use is associated with lower cardiovascular and all-cause mortality',
        detail:
          'In a 20-year Finnish cohort, 4–7 sauna sessions/week tracked with markedly lower cardiac and all-cause mortality vs once weekly. Observational, but plausible and pleasant heat-stress conditioning.',
        grade: 'moderate',
        sourceName: 'Laukkanen et al., JAMA Intern Med 2015',
        url: 'https://pubmed.ncbi.nlm.nih.gov/25705824/',
      },
      {
        statement: 'Manage stress — mindfulness/meditation has modest, real benefits',
        detail:
          'Meditation programs produce small-to-moderate reductions in anxiety, depression and pain in randomized trials. Any consistent down-regulation practice (breathwork, nature, prayer, walking) counts.',
        grade: 'moderate',
        sourceName: 'Goyal et al., JAMA Intern Med 2014 (meta-analysis)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/24395196/',
      },
      {
        statement: 'Cold exposure: popular, but longevity evidence is thin',
        detail:
          'Cold plunges may briefly lift mood and alertness, but robust evidence for long-term health or lifespan benefit is limited. Enjoy it if you like it; don’t expect it to move your healthspan much.',
        grade: 'emerging',
        sourceName: 'Systematic review, PLOS ONE 2022',
        url: 'https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0275427',
      },
    ],
  },
  {
    id: 'medical',
    icon: '🩺',
    title: 'Treatments & medical',
    intro:
      'The highest-return "treatments" for a healthy person are boring: know your numbers, get age-appropriate screening, stay vaccinated. Exotic longevity drugs are experiments.',
    claims: [
      {
        statement: 'Get age-appropriate cancer screening',
        detail:
          'Colorectal screening from age 45, plus cervical, breast and (discussed) prostate and lung screening per age and risk. Screening catches disease when it is still curable — the ultimate "longevity treatment".',
        grade: 'strong',
        sourceName: 'U.S. Preventive Services Task Force',
        url: 'https://www.uspreventiveservicestaskforce.org/uspstf/topic_search_results?topic_status=P',
      },
      {
        statement: 'Know and manage your ApoB / LDL cholesterol',
        detail:
          'Lifetime exposure to LDL/ApoB-containing particles drives atherosclerosis. Lower is better over a lifetime; diet, exercise and, where indicated, medication reduce cardiovascular risk.',
        grade: 'strong',
        sourceName: 'Ference et al., Eur Heart J 2017 (consensus)',
        url: 'https://academic.oup.com/eurheartj/article/38/32/2459/3745109',
      },
      {
        statement: 'Stay current on vaccinations as you age',
        detail:
          'Influenza, COVID-19, pneumococcal, shingles and others prevent infections that are far deadlier in older adults. One of the best-evidenced ways to avoid a preventable late-life death.',
        grade: 'strong',
        sourceName: 'CDC Adult Immunization Schedule',
        url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-age.html',
      },
      {
        statement: 'Rapamycin, metformin & similar: experimental for healthy people',
        detail:
          'These show anti-aging effects in animals and are being studied in humans (e.g. the TAME trial), but are not proven or approved to extend lifespan in healthy people. Strictly physician territory, not a self-experiment.',
        grade: 'emerging',
        sourceName: 'Barzilai et al., Cell Metab 2016 (TAME rationale)',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5943638/',
      },
    ],
  },
]

export interface LongevityNudge {
  icon: string
  text: string
}

/** Turn the user's own profile into a few concrete longevity nudges. */
export function longevityNudges(profile: Profile): LongevityNudge[] {
  const out: LongevityNudge[] = []
  if (profile.sleepHours < 7) {
    out.push({
      icon: '🌙',
      text: `You average ${profile.sleepHours} h of sleep — the single biggest longevity lever on your list. Anchor a fixed wake time and protect a 7–9 h window.`,
    })
  }
  if (profile.stressLevel === 'high') {
    out.push({
      icon: '🧘',
      text: 'Your stress is high — build in a daily down-regulation habit (a walk, breathwork, 10 min of meditation). It compounds like training does.',
    })
  }
  if (profile.lifestyle.deskJob || profile.activityLevel === 'sedentary') {
    out.push({
      icon: '👟',
      text: 'Sitting most of the day quietly raises risk independent of your workouts. Break up sitting hourly and hold a daily step floor.',
    })
  }
  if (profile.age >= 45) {
    out.push({
      icon: '🩺',
      text: `At ${profile.age}, colorectal screening is now recommended — and it’s a good moment to check blood pressure, ApoB/LDL and HbA1c with your doctor.`,
    })
  } else if (profile.age >= 40) {
    out.push({
      icon: '🩺',
      text: `You’re over 40 — a good time to establish your baseline numbers (blood pressure, ApoB/LDL, HbA1c) and discuss a screening schedule with your doctor.`,
    })
  }
  out.push({
    icon: '🏋️',
    text: 'Your training already covers the two biggest rocks — cardiorespiratory fitness and strength. Keep that streak; it is the highest-ROI longevity work you can do.',
  })
  return out
}
