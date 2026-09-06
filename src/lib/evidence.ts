import { tr } from '../i18n'

export interface Citation {
  claim: string
  source: string
}

/** Built at call time so the explanatory text follows the active language; citations stay as published. */
export function evidence(): Citation[] {
  return [
    {
      claim: tr(
        'Resting energy is estimated with the Mifflin–St Jeor equation',
        'Viloenergin uppskattas med Mifflin–St Jeor-ekvationen',
      ),
      source: tr(
        'Mifflin MD et al., Am J Clin Nutr 1990; validated as most accurate for healthy adults (ADA evidence analysis, Frankenfield 2005).',
        'Mifflin MD et al., Am J Clin Nutr 1990; validerad som mest träffsäker för friska vuxna (ADA evidence analysis, Frankenfield 2005).',
      ),
    },
    {
      claim: tr(
        'Protein 1.6–2.2 g/kg/day maximizes muscle gain from training',
        'Protein 1,6–2,2 g per kg kroppsvikt och dag maximerar muskeltillväxten från träning',
      ),
      source: tr(
        'Morton RW et al., Br J Sports Med 2018 — meta-analysis of 49 RCTs; benefits plateau around ~1.6 g/kg with upper CI ~2.2.',
        'Morton RW et al., Br J Sports Med 2018 — metaanalys av 49 RCT:er; nyttan planar ut runt ~1,6 g/kg med övre konfidensgräns ~2,2.',
      ),
    },
    {
      claim: tr(
        'Higher protein (≈2.3–3.1 g/kg fat-free mass) preserves muscle when dieting',
        'Högre protein (≈2,3–3,1 g/kg fettfri massa) bevarar muskler under diet',
      ),
      source: 'Helms ER et al., Int J Sport Nutr Exerc Metab 2014.',
    },
    {
      claim: tr(
        'Fat loss of ~0.5–1% bodyweight/week spares lean mass vs. faster loss',
        'Fettförlust på ~0,5–1 % av kroppsvikten/vecka sparar muskelmassa jämfört med snabbare nedgång',
      ),
      source: tr(
        'Garthe I et al., Int J Sport Nutr Exerc Metab 2011 (slower rate retained more lean mass and performance in athletes).',
        'Garthe I et al., Int J Sport Nutr Exerc Metab 2011 (långsammare takt behöll mer muskelmassa och prestation hos idrottare).',
      ),
    },
    {
      claim: tr(
        '150–300 min/week moderate aerobic activity + ≥2 resistance days',
        '150–300 min/vecka måttlig konditionsaktivitet + ≥2 styrkedagar',
      ),
      source: 'WHO Physical Activity Guidelines 2020; ACSM position stand.',
    },
    {
      claim: tr(
        '~10–20 hard sets per muscle per week is an effective hypertrophy dose',
        '~10–20 hårda set per muskel och vecka är en effektiv dos för muskeltillväxt',
      ),
      source: tr(
        'Schoenfeld BJ et al., J Sports Sci 2017 dose–response meta-analysis (and 2019 update).',
        'Schoenfeld BJ et al., J Sports Sci 2017 dos–respons-metaanalys (och uppdatering 2019).',
      ),
    },
    {
      claim: tr(
        'Higher daily step counts strongly associate with lower all-cause mortality (benefits accrue up to ~8–10k+)',
        'Fler steg per dag hänger starkt ihop med lägre dödlighet oavsett orsak (nyttan ökar upp till ~8–10k+)',
      ),
      source: tr(
        'Paluch AE et al., Lancet Public Health 2022 — meta-analysis of 15 cohorts.',
        'Paluch AE et al., Lancet Public Health 2022 — metaanalys av 15 kohorter.',
      ),
    },
    {
      claim: tr(
        'Sleeping ~5.5 h vs 8.5 h in a deficit shifts weight loss from fat to lean mass',
        'Att sova ~5,5 h mot 8,5 h i ett kaloriunderskott flyttar viktnedgången från fett till muskelmassa',
      ),
      source: tr(
        'Nedeltcheva AV et al., Ann Intern Med 2010; AASM recommends 7–9 h for adults.',
        'Nedeltcheva AV et al., Ann Intern Med 2010; AASM rekommenderar 7–9 h för vuxna.',
      ),
    },
    {
      claim: tr(
        'Habits take ~66 days on average to become automatic (range 18–254)',
        'Vanor tar i snitt ~66 dagar att bli automatiska (spann 18–254)',
      ),
      source: 'Lally P et al., Eur J Soc Psychol 2010.',
    },
    {
      claim: tr(
        'Implementation intentions ("when X, I do Y") substantially increase goal attainment',
        'Om–då-planer ("om X, då gör jag Y") ökar måluppfyllelsen avsevärt',
      ),
      source: tr(
        'Gollwitzer PM & Sheeran P, Adv Exp Soc Psychol 2006 — meta-analysis, d ≈ 0.65.',
        'Gollwitzer PM & Sheeran P, Adv Exp Soc Psychol 2006 — metaanalys, d ≈ 0,65.',
      ),
    },
    {
      claim: tr(
        'Regular self-weighing is associated with better long-term weight outcomes',
        'Regelbunden invägning hänger ihop med bättre viktresultat på sikt',
      ),
      source: tr('Zheng Y et al., Obesity 2015 systematic review.', 'Zheng Y et al., Obesity 2015 systematisk översikt.'),
    },
    {
      claim: tr(
        'Diet breaks / intermittent deficits can improve fat-loss efficiency and adherence',
        'Dietpauser / intermittenta underskott kan förbättra fettförlustens effektivitet och följsamheten',
      ),
      source: tr('Byrne NM et al. (MATADOR study), Int J Obes 2018.', 'Byrne NM et al. (MATADOR-studien), Int J Obes 2018.'),
    },
    {
      claim: tr(
        'Interval training (HIIT) is a time-efficient route to VO₂max and cardiometabolic health',
        'Intervallträning (HIIT) är en tidseffektiv väg till VO₂max och kardiometabol hälsa',
      ),
      source: tr(
        'Batacan RB et al., Br J Sports Med 2017 meta-analysis; Weston KS et al. 2014.',
        'Batacan RB et al., Br J Sports Med 2017 metaanalys; Weston KS et al. 2014.',
      ),
    },
    {
      claim: tr(
        'Creatine monohydrate 3–5 g/day safely improves strength and lean mass with resistance training',
        'Kreatinmonohydrat 3–5 g/dag förbättrar säkert styrka och muskelmassa tillsammans med styrketräning',
      ),
      source: tr(
        'Kreider RB et al., ISSN Position Stand on creatine, J Int Soc Sports Nutr 2017; Antonio J et al. 2021 safety review.',
        'Kreider RB et al., ISSN Position Stand on creatine, J Int Soc Sports Nutr 2017; Antonio J et al. 2021 säkerhetsöversikt.',
      ),
    },
    {
      claim: tr(
        'Vitamin D supplementation is warranted when sun exposure is limited; deficiency impairs muscle function',
        'D-vitamintillskott är motiverat när solexponeringen är begränsad; brist försämrar muskelfunktionen',
      ),
      source: 'Holick MF, Endocrine Society guideline 2011; Chiang CM et al., J Strength Cond Res 2017.',
    },
    {
      claim: tr(
        'Omega-3 (EPA/DHA) supports cardiovascular health and may enhance muscle anabolism',
        'Omega-3 (EPA/DHA) stödjer hjärt-kärlhälsan och kan förstärka muskeluppbyggnaden',
      ),
      source: tr('ISSFAL recommendations; Smith GI et al., Am J Clin Nutr 2011.', 'ISSFAL-rekommendationer; Smith GI et al., Am J Clin Nutr 2011.'),
    },
    {
      claim: tr(
        'Caffeine 2–6 mg/kg acutely improves strength and endurance performance',
        'Koffein 2–6 mg/kg förbättrar akut styrke- och uthållighetsprestation',
      ),
      source: 'Guest NS et al., ISSN Position Stand on caffeine, J Int Soc Sports Nutr 2021.',
    },
    {
      claim: tr(
        'Magnesium supplementation can modestly improve sleep quality in short sleepers',
        'Magnesiumtillskott kan måttligt förbättra sömnkvaliteten hos den som sover kort',
      ),
      source: tr(
        'Abbasi B et al., J Res Med Sci 2012; Mah J & Pitre T, BMC Complement Med 2021 systematic review.',
        'Abbasi B et al., J Res Med Sci 2012; Mah J & Pitre T, BMC Complement Med 2021 systematisk översikt.',
      ),
    },
    {
      claim: tr(
        'Probiotics/fermented foods: emerging evidence for immune and gut-health benefits in athletes',
        'Probiotika/fermenterad mat: växande evidens för immun- och tarmhälsa hos idrottare',
      ),
      source: 'Jäger R et al., ISSN Position Stand on probiotics, J Int Soc Sports Nutr 2019.',
    },
  ]
}
