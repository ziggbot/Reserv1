export interface Citation {
  claim: string
  source: string
}

export const EVIDENCE: Citation[] = [
  {
    claim: 'Resting energy is estimated with the Mifflin–St Jeor equation',
    source: 'Mifflin MD et al., Am J Clin Nutr 1990; validated as most accurate for healthy adults (ADA evidence analysis, Frankenfield 2005).',
  },
  {
    claim: 'Protein 1.6–2.2 g/kg/day maximizes muscle gain from training',
    source: 'Morton RW et al., Br J Sports Med 2018 — meta-analysis of 49 RCTs; benefits plateau around ~1.6 g/kg with upper CI ~2.2.',
  },
  {
    claim: 'Higher protein (≈2.3–3.1 g/kg fat-free mass) preserves muscle when dieting',
    source: 'Helms ER et al., Int J Sport Nutr Exerc Metab 2014.',
  },
  {
    claim: 'Fat loss of ~0.5–1% bodyweight/week spares lean mass vs. faster loss',
    source: 'Garthe I et al., Int J Sport Nutr Exerc Metab 2011 (slower rate retained more lean mass and performance in athletes).',
  },
  {
    claim: '150–300 min/week moderate aerobic activity + ≥2 resistance days',
    source: 'WHO Physical Activity Guidelines 2020; ACSM position stand.',
  },
  {
    claim: '~10–20 hard sets per muscle per week is an effective hypertrophy dose',
    source: 'Schoenfeld BJ et al., J Sports Sci 2017 dose–response meta-analysis (and 2019 update).',
  },
  {
    claim: 'Higher daily step counts strongly associate with lower all-cause mortality (benefits accrue up to ~8–10k+)',
    source: 'Paluch AE et al., Lancet Public Health 2022 — meta-analysis of 15 cohorts.',
  },
  {
    claim: 'Sleeping ~5.5 h vs 8.5 h in a deficit shifts weight loss from fat to lean mass',
    source: 'Nedeltcheva AV et al., Ann Intern Med 2010; AASM recommends 7–9 h for adults.',
  },
  {
    claim: 'Habits take ~66 days on average to become automatic (range 18–254)',
    source: 'Lally P et al., Eur J Soc Psychol 2010.',
  },
  {
    claim: 'Implementation intentions ("when X, I do Y") substantially increase goal attainment',
    source: 'Gollwitzer PM & Sheeran P, Adv Exp Soc Psychol 2006 — meta-analysis, d ≈ 0.65.',
  },
  {
    claim: 'Regular self-weighing is associated with better long-term weight outcomes',
    source: 'Zheng Y et al., Obesity 2015 systematic review.',
  },
  {
    claim: 'Diet breaks / intermittent deficits can improve fat-loss efficiency and adherence',
    source: 'Byrne NM et al. (MATADOR study), Int J Obes 2018.',
  },
  {
    claim: 'Interval training (HIIT) is a time-efficient route to VO₂max and cardiometabolic health',
    source: 'Batacan RB et al., Br J Sports Med 2017 meta-analysis; Weston KS et al. 2014.',
  },
  {
    claim: 'Creatine monohydrate 3–5 g/day safely improves strength and lean mass with resistance training',
    source: 'Kreider RB et al., ISSN Position Stand on creatine, J Int Soc Sports Nutr 2017; Antonio J et al. 2021 safety review.',
  },
  {
    claim: 'Vitamin D supplementation is warranted when sun exposure is limited; deficiency impairs muscle function',
    source: 'Holick MF, Endocrine Society guideline 2011; Chiang CM et al., J Strength Cond Res 2017.',
  },
  {
    claim: 'Omega-3 (EPA/DHA) supports cardiovascular health and may enhance muscle anabolism',
    source: 'ISSFAL recommendations; Smith GI et al., Am J Clin Nutr 2011.',
  },
  {
    claim: 'Caffeine 2–6 mg/kg acutely improves strength and endurance performance',
    source: 'Guest NS et al., ISSN Position Stand on caffeine, J Int Soc Sports Nutr 2021.',
  },
  {
    claim: 'Magnesium supplementation can modestly improve sleep quality in short sleepers',
    source: 'Abbasi B et al., J Res Med Sci 2012; Mah J & Pitre T, BMC Complement Med 2021 systematic review.',
  },
  {
    claim: 'Probiotics/fermented foods: emerging evidence for immune and gut-health benefits in athletes',
    source: 'Jäger R et al., ISSN Position Stand on probiotics, J Int Soc Sports Nutr 2019.',
  },
]
