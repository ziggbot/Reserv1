import type { EvidenceGrade, Profile } from './types'
import { tr } from '../i18n'

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

/** Built at call time so statements and details follow the active language; sources and URLs stay as published. */
export function longevitySections(): LongevitySection[] {
  return [
    {
      id: 'big-rocks',
      icon: '🪨',
      title: tr('The big rocks', 'De stora stenarna'),
      intro: tr(
        'A handful of levers explain most of the modifiable difference in healthy lifespan. Get these right before optimizing anything smaller.',
        'En handfull spakar förklarar det mesta av den påverkbara skillnaden i friska år. Få dem rätt innan du optimerar något mindre.',
      ),
      claims: [
        {
          statement: tr(
            'Cardiorespiratory fitness is one of the strongest predictors of living longer',
            'Kondition är en av de starkaste förutsägarna för ett längre liv',
          ),
          detail: tr(
            'In 122,007 people, higher fitness on a treadmill test tracked with lower all-cause mortality — with no observed upper limit and the biggest gap between "low" and "below average". Being unfit carried risk comparable to smoking or diabetes.',
            'Bland 122 007 personer hängde högre kondition på ett löpbandstest ihop med lägre dödlighet oavsett orsak — utan någon observerad övre gräns och med det största gapet mellan "låg" och "under medel". Att vara otränad innebar en risk jämförbar med rökning eller diabetes.',
          ),
          grade: 'strong',
          sourceName: 'Mandsager et al., JAMA Network Open 2018',
          url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6324439/',
        },
        {
          statement: tr(
            'Strength training 2–4×/week independently lowers mortality',
            'Styrketräning 2–4×/vecka sänker dödligheten oberoende av annat',
          ),
          detail: tr(
            'A meta-analysis of cohort studies found 30–60 min/week of muscle-strengthening activity associated with a 10–20% lower risk of all-cause mortality, cardiovascular disease and cancer — on top of any cardio.',
            'En metaanalys av kohortstudier fann att 30–60 min/vecka muskelstärkande aktivitet hängde ihop med 10–20 % lägre risk för död oavsett orsak, hjärt-kärlsjukdom och cancer — utöver all kondition.',
          ),
          grade: 'strong',
          sourceName: 'Momma et al., Br J Sports Med 2022',
          url: 'https://pubmed.ncbi.nlm.nih.gov/35228201/',
        },
        {
          statement: tr(
            'More daily steps → lower mortality, with benefit up to ~7,000–10,000',
            'Fler steg per dag → lägre dödlighet, med nytta upp till ~7 000–10 000',
          ),
          detail: tr(
            'Across 15 cohorts, risk fell steadily with more steps; ~7,000/day captures most of the benefit for many adults, and the classic "10,000" is a fine target but not a magic threshold.',
            'Över 15 kohorter sjönk risken stadigt med fler steg; ~7 000/dag fångar det mesta av nyttan för många vuxna, och de klassiska "10 000" är ett bra mål men ingen magisk gräns.',
          ),
          grade: 'strong',
          sourceName: 'Paluch et al., Lancet Public Health 2022',
          url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9289978/',
        },
        {
          statement: tr(
            'Meet the activity guideline: 150–300 min/week moderate + 2 strength days',
            'Nå aktivitetsrekommendationen: 150–300 min/vecka måttlig + 2 styrkedagar',
          ),
          detail: tr(
            'The WHO 2020 guideline: 150–300 min moderate (or 75–150 vigorous) aerobic activity weekly plus muscle-strengthening on 2+ days, and replace sitting with movement of any intensity. "Some is better than none; more is better."',
            'WHO 2020-riktlinjen: 150–300 min måttlig (eller 75–150 intensiv) konditionsaktivitet i veckan plus muskelstärkande träning 2+ dagar, och byt ut sittande mot rörelse av vilken intensitet som helst. "Lite är bättre än inget; mer är bättre."',
          ),
          grade: 'strong',
          sourceName: 'WHO 2020 Guidelines (Bull et al.)',
          url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7719906/',
        },
        {
          statement: tr(
            'Strong social connection rivals classic risk factors for survival',
            'Starka sociala band mäter sig med klassiska riskfaktorer för överlevnad',
          ),
          detail: tr(
            'A meta-analysis of 148 studies (308,849 people) found a 50% greater likelihood of survival for those with stronger social relationships — an effect size comparable to quitting smoking.',
            'En metaanalys av 148 studier (308 849 personer) fann 50 % högre sannolikhet att överleva för dem med starkare sociala relationer — en effektstorlek jämförbar med att sluta röka.',
          ),
          grade: 'strong',
          sourceName: 'Holt-Lunstad et al., PLoS Medicine 2010',
          url: 'https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.1000316',
        },
        {
          statement: tr('Control your blood pressure — target matters', 'Håll koll på blodtrycket — målet spelar roll'),
          detail: tr(
            'In SPRINT, aiming for systolic <120 mmHg (vs <140) cut major cardiovascular events by ~25% and death by ~27% in high-risk adults. Know your numbers; treat high blood pressure.',
            'I SPRINT minskade ett mål på systoliskt <120 mmHg (mot <140) allvarliga hjärt-kärlhändelser med ~25 % och dödsfall med ~27 % hos högriskvuxna. Känn dina värden; behandla högt blodtryck.',
          ),
          grade: 'strong',
          sourceName: 'SPRINT Research Group, NEJM 2015',
          url: 'https://www.nejm.org/doi/full/10.1056/NEJMoa1511939',
        },
      ],
    },
    {
      id: 'food',
      icon: '🥗',
      title: tr('Food & nutrition', 'Mat & näring'),
      intro: tr(
        'No single "longevity food" — dietary patterns drive outcomes. Plant-forward, high-fibre, minimally processed, with enough protein as you age.',
        'Det finns ingen enskild "livslängdsmat" — kostmönster styr utfallen. Växtbaserat i grunden, fiberrikt, minimalt processat, med tillräckligt protein när du blir äldre.',
      ),
      claims: [
        {
          statement: tr('A Mediterranean pattern lowers cardiovascular events', 'Ett medelhavsmönster minskar hjärt-kärlhändelser'),
          detail: tr(
            'In the PREDIMED randomized trial, a Mediterranean diet with extra-virgin olive oil or nuts cut major cardiovascular events by ~30% vs a low-fat control in high-risk adults. Olive oil, nuts, legumes, fish, vegetables, whole grains.',
            'I den randomiserade PREDIMED-studien minskade medelhavskost med extra jungfruolivolja eller nötter allvarliga hjärt-kärlhändelser med ~30 % jämfört med en fettsnål kontroll hos högriskvuxna. Olivolja, nötter, baljväxter, fisk, grönsaker, fullkorn.',
          ),
          grade: 'strong',
          sourceName: 'Estruch et al., NEJM 2018 (PREDIMED)',
          url: 'https://www.nejm.org/doi/full/10.1056/NEJMoa1800389',
        },
        {
          statement: tr('Eat 25–30 g+ of fibre a day', 'Ät 25–30 g+ fibrer om dagen'),
          detail: tr(
            'A Lancet series found the highest fibre consumers had 15–30% lower all-cause and cardiovascular mortality, with benefit greatest at 25–29 g/day and rising beyond. Whole grains, legumes, vegetables, fruit.',
            'En Lancet-serie fann att de som åt mest fibrer hade 15–30 % lägre dödlighet oavsett orsak och i hjärt-kärlsjukdom, med störst nytta vid 25–29 g/dag och stigande därutöver. Fullkorn, baljväxter, grönsaker, frukt.',
          ),
          grade: 'strong',
          sourceName: 'Reynolds et al., The Lancet 2019',
          url: 'https://pubmed.ncbi.nlm.nih.gov/30638909/',
        },
        {
          statement: tr(
            'Protein needs rise with age (~1.0–1.2 g/kg, more if active)',
            'Proteinbehovet ökar med åldern (~1,0–1,2 g/kg, mer om du är aktiv)',
          ),
          detail: tr(
            'The PROT-AGE expert group recommends 1.0–1.2 g/kg/day for adults over 65 (≥1.2 if exercising) to defend against sarcopenia — higher than the standard RDA and easy to miss on a plant-light plate.',
            'Expertgruppen PROT-AGE rekommenderar 1,0–1,2 g per kg kroppsvikt och dag för vuxna över 65 (≥1,2 om du tränar) för att skydda mot sarkopeni — högre än det vanliga rekommenderade intaget och lätt att missa om tallriken är proteinfattig.',
          ),
          grade: 'moderate',
          sourceName: 'Bauer et al., JAMDA 2013 (PROT-AGE)',
          url: 'https://www.jamda.com/article/S1525-8610(13)00326-5/fulltext',
        },
        {
          statement: tr('Limit processed meat; go easy on red meat', 'Begränsa charkuterier; ta det lugnt med rött kött'),
          detail: tr(
            'The IARC classifies processed meat as a Group 1 carcinogen and red meat as "probably carcinogenic"; each 50 g/day of processed meat is linked to ~18% higher colorectal-cancer risk. Treat bacon/deli meat as an occasional food.',
            'IARC klassar processat kött som cancerframkallande (grupp 1) och rött kött som "troligen cancerframkallande"; varje 50 g/dag processat kött kopplas till ~18 % högre risk för tjocktarmscancer. Se bacon och charkpålägg som något du äter då och då.',
          ),
          grade: 'strong',
          sourceName: 'IARC/WHO Q&A on red & processed meat',
          url: 'https://www.who.int/news-room/questions-and-answers/item/cancer-carcinogenicity-of-the-consumption-of-red-meat-and-processed-meat',
        },
        {
          statement: tr(
            'There is no "heart-healthy" amount of alcohol',
            'Det finns ingen "hjärtvänlig" mängd alkohol',
          ),
          detail: tr(
            'The Global Burden of Disease analysis concluded the consumption level that minimizes health loss is zero — the old "J-curve" largely reflected study artefacts. Less is better; none is safest.',
            'Global Burden of Disease-analysen slog fast att den konsumtionsnivå som minimerar hälsoförlusten är noll — den gamla "J-kurvan" berodde till stor del på studieartefakter. Mindre är bättre; inget är säkrast.',
          ),
          grade: 'strong',
          sourceName: 'GBD Alcohol Collaborators, The Lancet 2018',
          url: 'https://www.thelancet.com/article/S0140-6736(18)31571-X/fulltext',
        },
        {
          statement: tr(
            'Time-restricted eating: promising, not proven for longevity',
            'Tidsbegränsat ätande: lovande, inte bevisat för livslängd',
          ),
          detail: tr(
            'Eating within a consistent daily window may help some people control calories and metabolic markers, but human evidence for lifespan extension is preliminary. Useful as an adherence tool, not a magic switch.',
            'Att äta inom ett fast dagligt fönster kan hjälpa vissa att kontrollera kalorier och metabola markörer, men evidensen för längre liv hos människor är preliminär. Användbart som följsamhetsverktyg, inte en magisk knapp.',
          ),
          grade: 'emerging',
          sourceName: 'de Cabo & Mattson, NEJM 2019 (review)',
          url: 'https://www.nejm.org/doi/full/10.1056/NEJMra1905136',
        },
      ],
    },
    {
      id: 'supplements',
      icon: '💊',
      title: tr('Supplements', 'Kosttillskott'),
      intro: tr(
        'Most supplements do little for a well-fed person. A short list has real evidence for specific gaps; a longer list is marketing. Food and training first.',
        'De flesta kosttillskott gör lite för en välnärd person. En kort lista har riktig evidens för specifika luckor; en längre lista är marknadsföring. Mat och träning först.',
      ),
      claims: [
        {
          statement: tr('Vitamin D — correct a deficiency, don’t megadose', 'D-vitamin — korrigera en brist, megadosera inte'),
          detail: tr(
            'Worth supplementing (1,000–2,000 IU/day) if you’re low or get little sun, especially at northern latitudes in winter; a blood test beats guessing. Benefits are about correcting deficiency, not loading up.',
            'Värt att ta (1 000–2 000 IE/dag) om du ligger lågt eller får lite sol, särskilt på nordliga breddgrader på vintern; ett blodprov slår gissningar. Nyttan handlar om att korrigera brist, inte att ladda upp.',
          ),
          grade: 'moderate',
          sourceName: 'NIH Office of Dietary Supplements',
          url: 'https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/',
        },
        {
          statement: tr('Creatine — muscle now, maybe brain later', 'Kreatin — muskler nu, kanske hjärna sen'),
          detail: tr(
            '3–5 g/day is strongly proven for strength and lean mass (which protect against age-related frailty), with emerging evidence for cognition in older adults. One of the few supplements worth most people’s money.',
            '3–5 g/dag har starkt stöd för styrka och muskelmassa (som skyddar mot åldersrelaterad skörhet), med växande evidens för kognition hos äldre. Ett av få kosttillskott som är värt de flestas pengar.',
          ),
          grade: 'moderate',
          sourceName: 'Kreider et al., ISSN Position Stand 2017',
          url: 'https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0173-z',
        },
        {
          statement: tr(
            'Omega-3 (EPA/DHA) for heart and, if intake is low, general health',
            'Omega-3 (EPA/DHA) för hjärtat och, vid lågt intag, allmän hälsa',
          ),
          detail: tr(
            'If you rarely eat oily fish, 1–2 g/day of combined EPA/DHA (algae oil if vegan) supports cardiovascular and metabolic health. Whole fish 2–3×/week is an equally good route.',
            'Om du sällan äter fet fisk stödjer 1–2 g/dag EPA/DHA sammanlagt (algolja om du är vegan) hjärt-kärl- och metabol hälsa. Fisk 2–3×/vecka är en lika bra väg.',
          ),
          grade: 'moderate',
          sourceName: 'NIH Office of Dietary Supplements',
          url: 'https://ods.od.nih.gov/factsheets/Omega3FattyAcids-HealthProfessional/',
        },
        {
          statement: tr(
            'NMN / NR (NAD+ boosters): impressive in mice, unproven in humans',
            'NMN / NR (NAD+-höjare): imponerande i möss, obevisat hos människor',
          ),
          detail: tr(
            'Human trials so far show these are safe and raise NAD+ blood levels, but there is no evidence yet that they extend healthy lifespan in people. Promising research, not a proven longevity buy.',
            'Studier på människor visar hittills att de är säkra och höjer NAD+ i blodet, men det finns ännu inga belägg för att de ger fler friska år. Lovande forskning, inte ett bevisat livslängdsköp.',
          ),
          grade: 'emerging',
          sourceName: 'Human trials review, GeroScience/PMC 2023',
          url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10721522/',
        },
        {
          statement: tr(
            'Overhyped, skip for longevity: resveratrol & "anti-aging" blends',
            'Överhajpat, hoppa över för livslängd: resveratrol & "anti-aging"-blandningar',
          ),
          detail: tr(
            'Resveratrol’s mouse results never replicated in humans; multivitamins don’t reduce mortality in well-nourished people; "greens powders" are expensive urine. Spend the money on vegetables and a coach.',
            'Resveratrols musresultat har aldrig upprepats hos människor; multivitaminer minskar inte dödligheten hos välnärda; "greens-pulver" är dyr urin. Lägg pengarna på grönsaker och en coach.',
          ),
          grade: 'emerging',
          sourceName: 'NIH ODS — Dietary Supplements overview',
          url: 'https://ods.od.nih.gov/factsheets/MVMS-HealthProfessional/',
        },
      ],
    },
    {
      id: 'routines',
      icon: '🌙',
      title: tr('Routines & recovery', 'Rutiner & återhämtning'),
      intro: tr(
        'The daily and weekly rhythms that compound quietly over decades.',
        'De dagliga och veckovisa rytmerna som tyst ger ränta på ränta under årtionden.',
      ),
      claims: [
        {
          statement: tr(
            'Sleep regularity may matter even more than sleep duration',
            'Regelbunden sömn kan betyda ännu mer än sömnlängd',
          ),
          detail: tr(
            'In 60,000+ UK Biobank participants, consistent sleep/wake timing predicted 20–48% lower all-cause mortality and beat duration as a predictor. Same bedtime and wake time — even weekends — is a free longevity habit.',
            'Bland 60 000+ deltagare i UK Biobank förutsade jämna sov- och vakentider 20–48 % lägre dödlighet oavsett orsak och slog sömnlängd som förutsägare. Samma läggtid och uppstigning — även på helger — är en gratis vana för fler friska år.',
          ),
          grade: 'moderate',
          sourceName: 'Windred et al., Sleep 2024',
          url: 'https://academic.oup.com/sleep/article/47/1/zsad253/7280269',
        },
        {
          statement: tr('Aim for 7–9 h of sleep — the base of recovery', 'Sikta på 7–9 h sömn — grunden för återhämtning'),
          detail: tr(
            'Adults consistently do best on 7–9 h. Chronic short sleep worsens metabolic health, appetite hormones and cardiovascular risk, and (in a deficit) shifts weight loss toward muscle.',
            'Vuxna mår genomgående bäst på 7–9 h. Kronisk sömnbrist försämrar metabol hälsa, aptithormoner och hjärt-kärlrisk, och (i ett kaloriunderskott) flyttar viktnedgången mot muskler.',
          ),
          grade: 'strong',
          sourceName: 'AASM/SRS Consensus (Watson et al. 2015)',
          url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4434546/',
        },
        {
          statement: tr(
            'Regular sauna use is associated with lower cardiovascular and all-cause mortality',
            'Regelbunden bastu hänger ihop med lägre hjärt-kärl- och total dödlighet',
          ),
          detail: tr(
            'In a 20-year Finnish cohort, 4–7 sauna sessions/week tracked with markedly lower cardiac and all-cause mortality vs once weekly. Observational, but plausible and pleasant heat-stress conditioning.',
            'I en 20-årig finsk kohort hängde 4–7 bastubad/vecka ihop med markant lägre hjärt- och total dödlighet jämfört med en gång i veckan. Observationellt, men rimligt och behagligt som värmestressträning.',
          ),
          grade: 'moderate',
          sourceName: 'Laukkanen et al., JAMA Intern Med 2015',
          url: 'https://pubmed.ncbi.nlm.nih.gov/25705824/',
        },
        {
          statement: tr(
            'Manage stress — mindfulness/meditation has modest, real benefits',
            'Hantera stress — mindfulness/meditation har måttliga, verkliga effekter',
          ),
          detail: tr(
            'Meditation programs produce small-to-moderate reductions in anxiety, depression and pain in randomized trials. Any consistent down-regulation practice (breathwork, nature, prayer, walking) counts.',
            'Meditationsprogram ger små till måttliga minskningar av ångest, depression och smärta i randomiserade studier. Vilken regelbunden nedvarvningspraktik som helst (andningsövningar, natur, bön, promenader) räknas.',
          ),
          grade: 'moderate',
          sourceName: 'Goyal et al., JAMA Intern Med 2014 (meta-analysis)',
          url: 'https://pubmed.ncbi.nlm.nih.gov/24395196/',
        },
        {
          statement: tr(
            'Cold exposure: popular, but longevity evidence is thin',
            'Kyla: populärt, men evidensen för livslängd är tunn',
          ),
          detail: tr(
            'Cold plunges may briefly lift mood and alertness, but robust evidence for long-term health or lifespan benefit is limited. Enjoy it if you like it; don’t expect it to move your healthspan much.',
            'Kallbad kan kortvarigt lyfta humör och vakenhet, men robust evidens för långsiktig hälsa eller längre liv är begränsad. Njut av det om du gillar det; förvänta dig inte att det ger många fler friska år.',
          ),
          grade: 'emerging',
          sourceName: 'Systematic review, PLOS ONE 2022',
          url: 'https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0275427',
        },
      ],
    },
    {
      id: 'medical',
      icon: '🩺',
      title: tr('Treatments & medical', 'Behandlingar & medicin'),
      intro: tr(
        'The highest-return "treatments" for a healthy person are boring: know your numbers, get age-appropriate screening, stay vaccinated. Exotic longevity drugs are experiments.',
        'De "behandlingar" med högst avkastning för en frisk person är tråkiga: känn dina värden, gå på åldersanpassad screening, håll vaccinationerna uppdaterade. Exotiska livslängdsläkemedel är experiment.',
      ),
      claims: [
        {
          statement: tr('Get age-appropriate cancer screening', 'Gå på åldersanpassad cancerscreening'),
          detail: tr(
            'Colorectal screening from age 45, plus cervical, breast and (discussed) prostate and lung screening per age and risk. Screening catches disease when it is still curable — the ultimate "longevity treatment".',
            'Screening för tjocktarmscancer från 45 års ålder, plus livmoderhals-, bröst- och (efter diskussion) prostata- och lungscreening efter ålder och risk. Screening hittar sjukdom medan den fortfarande är botbar — den ultimata "livslängdsbehandlingen".',
          ),
          grade: 'strong',
          sourceName: 'U.S. Preventive Services Task Force',
          url: 'https://www.uspreventiveservicestaskforce.org/uspstf/topic_search_results?topic_status=P',
        },
        {
          statement: tr('Know and manage your ApoB / LDL cholesterol', 'Känn till och hantera ditt ApoB / LDL-kolesterol'),
          detail: tr(
            'Lifetime exposure to LDL/ApoB-containing particles drives atherosclerosis. Lower is better over a lifetime; diet, exercise and, where indicated, medication reduce cardiovascular risk.',
            'Livstidsexponering för LDL/ApoB-partiklar driver åderförkalkning. Lägre är bättre över ett helt liv; kost, träning och, där det är motiverat, läkemedel minskar hjärt-kärlrisken.',
          ),
          grade: 'strong',
          sourceName: 'Ference et al., Eur Heart J 2017 (consensus)',
          url: 'https://academic.oup.com/eurheartj/article/38/32/2459/3745109',
        },
        {
          statement: tr('Stay current on vaccinations as you age', 'Håll vaccinationerna uppdaterade när du blir äldre'),
          detail: tr(
            'Influenza, COVID-19, pneumococcal, shingles and others prevent infections that are far deadlier in older adults. One of the best-evidenced ways to avoid a preventable late-life death.',
            'Influensa, covid-19, pneumokocker, bältros med flera förebygger infektioner som är betydligt dödligare för äldre. Ett av de bäst belagda sätten att undvika en död sent i livet som gick att förebygga.',
          ),
          grade: 'strong',
          sourceName: 'CDC Adult Immunization Schedule',
          url: 'https://www.cdc.gov/vaccines/hcp/imz-schedules/adult-age.html',
        },
        {
          statement: tr(
            'Rapamycin, metformin & similar: experimental for healthy people',
            'Rapamycin, metformin & liknande: experimentellt för friska',
          ),
          detail: tr(
            'These show anti-aging effects in animals and are being studied in humans (e.g. the TAME trial), but are not proven or approved to extend lifespan in healthy people. Strictly physician territory, not a self-experiment.',
            'De visar anti-aging-effekter hos djur och studeras på människor (t.ex. TAME-studien), men är inte bevisade eller godkända för att förlänga livet hos friska. Strikt läkarens bord, inte ett självexperiment.',
          ),
          grade: 'emerging',
          sourceName: 'Barzilai et al., Cell Metab 2016 (TAME rationale)',
          url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5943638/',
        },
      ],
    },
  ]
}

/**
 * Snapshot for tests only (they import it by name and run with the language
 * forced to English). UI must call `longevitySections()` so text follows the
 * active language.
 */
export const LONGEVITY_SECTIONS: LongevitySection[] = longevitySections()

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
      text: tr(
        `You average ${profile.sleepHours} h of sleep — the single biggest longevity lever on your list. Anchor a fixed wake time and protect a 7–9 h window.`,
        `Du sover i snitt ${profile.sleepHours} h — den enskilt största spaken för fler friska år på din lista. Förankra en fast uppstigningstid och skydda ett fönster på 7–9 h.`,
      ),
    })
  }
  if (profile.stressLevel === 'high') {
    out.push({
      icon: '🧘',
      text: tr(
        'Your stress is high — build in a daily down-regulation habit (a walk, breathwork, 10 min of meditation). It compounds like training does.',
        'Din stress är hög — bygg in en daglig nedvarvningsvana (en promenad, andningsövningar, 10 min meditation). Den ger ränta på ränta precis som träning.',
      ),
    })
  }
  if (profile.lifestyle.deskJob || profile.activityLevel === 'sedentary') {
    out.push({
      icon: '👟',
      text: tr(
        'Sitting most of the day quietly raises risk independent of your workouts. Break up sitting hourly and hold a daily step floor.',
        'Att sitta större delen av dagen höjer risken i tysthet oberoende av dina pass. Bryt sittandet varje timme och håll ett dagligt steggolv.',
      ),
    })
  }
  if (profile.age >= 45) {
    out.push({
      icon: '🩺',
      text: tr(
        `At ${profile.age}, colorectal screening is now recommended — and it’s a good moment to check blood pressure, ApoB/LDL and HbA1c with your doctor.`,
        `Vid ${profile.age} rekommenderas nu screening för tjocktarmscancer — och det är ett bra tillfälle att kolla blodtryck, ApoB/LDL och HbA1c hos din läkare.`,
      ),
    })
  } else if (profile.age >= 40) {
    out.push({
      icon: '🩺',
      text: tr(
        `You’re over 40 — a good time to establish your baseline numbers (blood pressure, ApoB/LDL, HbA1c) and discuss a screening schedule with your doctor.`,
        `Du är över 40 — ett bra tillfälle att fastställa dina utgångsvärden (blodtryck, ApoB/LDL, HbA1c) och diskutera ett screeningschema med din läkare.`,
      ),
    })
  }
  out.push({
    icon: '🏋️',
    text: tr(
      'Your training already covers the two biggest rocks — cardiorespiratory fitness and strength. Keep that streak; it is the highest-ROI longevity work you can do.',
      'Din träning täcker redan de två största stenarna — kondition och styrka. Håll sviten; det är livslängdsarbetet med högst avkastning du kan göra.',
    ),
  })
  return out
}
