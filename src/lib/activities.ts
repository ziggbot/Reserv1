import { hiitSafe } from './programs'
import type { ActivityProposal, Profile } from './types'
import { tr } from '../i18n'

/**
 * Basic workout proposals for the non-strength categories, adapted to the
 * user's goal, fitness level and health screen. Strength lives in programs.ts.
 *
 * Proposal `name`s are canonical English keys (they are logged as sessionName)
 * and are translated at display time via `L()`; descriptions and steps are
 * display text and go through `tr()` here.
 */

export function cardioProposals(profile: Profile): ActivityProposal[] {
  const out: ActivityProposal[] = [
    {
      name: 'Zone-2 walk / cycle / row',
      category: 'cardio',
      durationMin: 30,
      description: tr(
        'The bread-and-butter session: steady effort where you can still hold a conversation. Builds your aerobic base, burns calories, and doubles as stress treatment.',
        'Basen i all konditionsträning: jämn ansträngning där du fortfarande kan hålla en konversation. Bygger din aeroba bas, förbränner kalorier och fungerar samtidigt som stressbehandling.',
      ),
      steps: [
        tr('5 min easy warm-up', '5 min lugn uppvärmning'),
        tr(
          '20–25 min steady zone 2 (talking pace, nose-breathing possible)',
          '20–25 min jämn zon 2 (samtalstempo, näsandning möjlig)',
        ),
        tr('3 min easy cool-down', '3 min lugn nedvarvning'),
      ],
    },
    {
      name: 'Incline treadmill walk',
      category: 'cardio',
      durationMin: 30,
      description: tr(
        'Joint-friendly and surprisingly hard. Great on strength rest days — no impact, big calorie burn.',
        'Skonsamt för lederna och förvånansvärt tufft. Perfekt på vilodagar från styrkan — ingen stötbelastning, stor kaloriförbränning.',
      ),
      steps: [
        tr('Set 8–12% incline, 4.5–5.5 km/h', 'Ställ in 8–12 % lutning, 4,5–5,5 km/h'),
        tr('Hold a pace you could talk through', 'Håll ett tempo du kan prata i'),
        tr('No holding the rails — that erases half the work', 'Håll inte i räckena — det raderar halva jobbet'),
      ],
    },
    {
      name: 'Step booster',
      category: 'cardio',
      durationMin: 20,
      description: tr(
        `A brisk outdoor walk sized to rescue your ${profile.goal === 'fat_loss' ? '9,000' : '7,500'}-step floor on a desk-heavy day.`,
        `En rask promenad utomhus dimensionerad för att rädda ditt golv på ${profile.goal === 'fat_loss' ? '9 000' : '7 500'} steg en dag med mycket stillasittande.`,
      ),
      steps: [
        tr('Brisk pace (you notice your breathing)', 'Raskt tempo (du märker att du andas)'),
        tr('Ideally right after a meal — improves glucose response', 'Helst direkt efter en måltid — förbättrar blodsockersvaret'),
        tr('Podcast/audiobook recommended', 'Podd/ljudbok rekommenderas'),
      ],
    },
  ]
  if (hiitSafe(profile)) {
    out.splice(1, 0, {
      name: 'HIIT intervals (bike or rower)',
      category: 'cardio',
      durationMin: 20,
      description: tr(
        'Time-efficient VO₂max work — the strongest cardio stimulus per minute. Hard by design; once a week is plenty, and never the day before heavy legs.',
        'Tidseffektiv VO₂max-träning — det starkaste konditionsstimulit per minut. Tufft med avsikt; en gång i veckan räcker gott, och aldrig dagen före tunga ben.',
      ),
      steps: [
        tr('5 min easy warm-up', '5 min lugn uppvärmning'),
        tr('6–8 × (30 s hard / 90 s easy spin)', '6–8 × (30 s hårt / 90 s lugn tramp)'),
        tr('“Hard” = 8/10 effort, not all-out sprint', '”Hårt” = 8/10 i ansträngning, inte maxsprint'),
        tr('3 min easy cool-down', '3 min lugn nedvarvning'),
      ],
    })
  }
  return out
}

export function enduranceProposals(profile: Profile): ActivityProposal[] {
  const beginner = profile.fitnessLevel === 'beginner'
  return [
    {
      name: 'Long zone-2 (hike / long ride)',
      category: 'endurance',
      durationMin: beginner ? 60 : 90,
      description: tr(
        'The weekly “long slow distance” session: builds mitochondria, fat metabolism and the engine that makes everything else easier. Keep it genuinely easy.',
        'Veckans ”long slow distance”-pass: bygger mitokondrier, fettförbränning och motorn som gör allt annat lättare. Håll det genuint lugnt.',
      ),
      steps: [
        tr(
          `${beginner ? '60' : '75–90'} min continuous at conversational pace`,
          `${beginner ? '60' : '75–90'} min sammanhängande i konversationstempo`,
        ),
        tr(
          'Flat-ish terrain or steady gearing; fuel with water (+ a snack past 75 min)',
          'Någorlunda platt terräng eller jämn växling; fyll på med vatten (+ ett mellanmål efter 75 min)',
        ),
        tr(
          'Effort check: you should finish feeling like you could do 20 more minutes',
          'Ansträngningskoll: du ska avsluta med känslan att du kunde ha kört 20 minuter till',
        ),
      ],
    },
    {
      name: beginner ? 'Run/walk 5K builder' : 'Steady 5–8K run',
      category: 'endurance',
      durationMin: 30,
      description: beginner
        ? tr(
            'The proven route from zero to running 5K without wrecking your shins: alternate running and walking, extend the running a little each week.',
            'Den beprövade vägen från noll till att springa 5 km utan att slita sönder smalbenen: växla mellan löpning och gång, förläng löpningen lite varje vecka.',
          )
        : tr(
            'A steady continuous run at conversational pace — the backbone of running fitness.',
            'En jämn sammanhängande löpning i konversationstempo — ryggraden i löpkonditionen.',
          ),
      steps: beginner
        ? [
            tr('5 min brisk walk warm-up', '5 min rask promenad som uppvärmning'),
            tr('8 × (1 min easy run / 2 min walk)', '8 × (1 min lugn löpning / 2 min gång)'),
            tr('Next weeks: 2/2 → 3/2 → 5/1 → continuous', 'Kommande veckor: 2/2 → 3/2 → 5/1 → sammanhängande'),
            tr('Never add more than ~10% per week', 'Öka aldrig mer än ~10 % per vecka'),
          ]
        : [
            tr('10 min easy warm-up', '10 min lugn uppvärmning'),
            tr('20–35 min steady (could speak in sentences)', '20–35 min jämnt (du ska kunna prata i hela meningar)'),
            tr('Finish with 4 × 20 s relaxed strides', 'Avsluta med 4 × 20 s avslappnade stegringslopp'),
          ],
    },
    {
      name: 'Swim (steady laps)',
      category: 'endurance',
      durationMin: 40,
      description: tr(
        'Zero-impact full-body endurance — ideal with cranky joints or as active recovery that still trains the engine.',
        'Helkroppsuthållighet helt utan stötbelastning — perfekt med krångliga leder eller som aktiv återhämtning som ändå tränar motorn.',
      ),
      steps: [
        tr('Warm up 4 × 50 m easy', 'Värm upp 4 × 50 m lugnt'),
        tr('Main: 10–20 × 50 m with 15–20 s rest', 'Huvuddel: 10–20 × 50 m med 15–20 s vila'),
        tr('Mix strokes if technique fades', 'Blanda simsätt om tekniken sviktar'),
      ],
    },
    {
      name: 'Tempo ladder',
      category: 'endurance',
      durationMin: 35,
      description: tr(
        'Comfortably-hard intervals that raise your sustainable pace — the bridge between easy volume and race fitness.',
        'Behagligt hårda intervaller som höjer ditt hållbara tempo — bryggan mellan lugn volym och tävlingsform.',
      ),
      steps: [
        tr('10 min easy warm-up', '10 min lugn uppvärmning'),
        tr(
          '4 / 6 / 8 / 6 / 4 min at “comfortably hard” (7/10), 2 min easy between',
          '4 / 6 / 8 / 6 / 4 min i ”behagligt hårt” (7/10), 2 min lugnt emellan',
        ),
        tr('5 min cool-down', '5 min nedvarvning'),
      ],
    },
  ]
}

export function stretchProposals(profile: Profile): ActivityProposal[] {
  return [
    {
      name: '10-min full-body mobility',
      category: 'stretch',
      durationMin: 10,
      description: tr(
        'The daily minimum: hits every major area in ten minutes. Perfect as a morning starter or training warm-down.',
        'Dagens minimum: träffar varje större område på tio minuter. Perfekt som morgonstart eller nedvarvning efter träning.',
      ),
      steps: [
        tr('World’s greatest stretch × 5/side', 'World’s greatest stretch × 5/sida'),
        tr('Cat–camel × 10', 'Katt–kamel × 10'),
        tr('Deep squat hold 1 min (hold support if needed)', 'Djup knäböjshållning 1 min (håll i ett stöd vid behov)'),
        tr('Couch stretch 1 min/side', 'Couch stretch 1 min/sida'),
        tr('Thoracic rotations × 8/side', 'Bröstryggsrotationer × 8/sida'),
      ],
    },
    {
      name: profile.lifestyle.deskJob ? 'Desk-body rescue (hips & thoracic)' : 'Hip opener routine',
      category: 'stretch',
      durationMin: 12,
      description: profile.lifestyle.deskJob
        ? tr(
            'Targets exactly what sitting shortens: hip flexors, chest and mid-back. Do it after work to un-desk your body.',
            'Riktar in sig på exakt det som sittandet förkortar: höftböjare, bröst och mellanrygg. Gör den efter jobbet för att skaka av dig kontorskroppen.',
          )
        : tr(
            'Deep hip work for squat depth and lower-back relief.',
            'Djupt höftarbete för knäböjsdjup och lindring för ländryggen.',
          ),
      steps: [
        tr('90/90 hip switches × 10', '90/90 höftväxlingar × 10'),
        tr('Couch stretch 90 s/side', 'Couch stretch 90 s/sida'),
        tr('Pigeon stretch 90 s/side', 'Pigeon stretch 90 s/sida'),
        tr('Doorway pec stretch 45 s/side', 'Bröststretch i dörröppning 45 s/sida'),
        tr(
          'Thoracic extension over a foam roller / chair edge 1 min',
          'Bröstryggsextension över foamroller / stolskant 1 min',
        ),
      ],
    },
    {
      name: 'Shoulder & upper-back routine',
      category: 'stretch',
      durationMin: 10,
      description: tr(
        'Keeps pressing overhead safe and posture tall. Great on pull-day evenings.',
        'Håller pressar över huvudet säkra och hållningen rak. Perfekt på kvällen efter pull-pass.',
      ),
      steps: [
        tr('Wall slides × 10', 'Wall slides × 10'),
        tr('Band / towel pull-aparts × 15', 'Pull-aparts med gummiband / handduk × 15'),
        tr('Doorway pec stretch 45 s/side', 'Bröststretch i dörröppning 45 s/sida'),
        tr('Child’s pose with side reach 45 s/side', 'Child’s pose med sidosträckning 45 s/sida'),
        tr('Neck half-circles × 5 each way', 'Halva nackcirklar × 5 åt varje håll'),
      ],
    },
    {
      name: 'Evening wind-down flow',
      category: 'stretch',
      durationMin: 15,
      description: tr(
        'Slow floor-based stretching with long exhales — doubles as a sleep-onset ritual, which your recovery loves.',
        'Långsam stretching på golvet med långa utandningar — fungerar samtidigt som insomningsritual, vilket din återhämtning älskar.',
      ),
      steps: [
        tr('Child’s pose 1 min', 'Child’s pose 1 min'),
        tr('Cat–camel × 10 slow', 'Katt–kamel × 10 långsamma'),
        tr('Supine twist 1 min/side', 'Ryggliggande vridning 1 min/sida'),
        tr('Legs up the wall 3 min', 'Benen upp mot väggen 3 min'),
        tr('Breathing: 4 s in / 6 s out throughout', 'Andning: 4 s in / 6 s ut hela tiden'),
      ],
    },
  ]
}

export function proposalsFor(profile: Profile, category: 'cardio' | 'endurance' | 'stretch'): ActivityProposal[] {
  switch (category) {
    case 'cardio':
      return cardioProposals(profile)
    case 'endurance':
      return enduranceProposals(profile)
    case 'stretch':
      return stretchProposals(profile)
  }
}
