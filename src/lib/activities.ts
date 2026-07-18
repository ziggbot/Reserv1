import { hiitSafe } from './programs'
import type { ActivityProposal, Profile } from './types'

/**
 * Basic workout proposals for the non-strength categories, adapted to the
 * user's goal, fitness level and health screen. Strength lives in programs.ts.
 */

export function cardioProposals(profile: Profile): ActivityProposal[] {
  const out: ActivityProposal[] = [
    {
      name: 'Zone-2 walk / cycle / row',
      category: 'cardio',
      durationMin: 30,
      description:
        'The bread-and-butter session: steady effort where you can still hold a conversation. Builds your aerobic base, burns calories, and doubles as stress treatment.',
      steps: [
        '5 min easy warm-up',
        '20–25 min steady zone 2 (talking pace, nose-breathing possible)',
        '3 min easy cool-down',
      ],
    },
    {
      name: 'Incline treadmill walk',
      category: 'cardio',
      durationMin: 30,
      description: 'Joint-friendly and surprisingly hard. Great on strength rest days — no impact, big calorie burn.',
      steps: ['Set 8–12% incline, 4.5–5.5 km/h', 'Hold a pace you could talk through', 'No holding the rails — that erases half the work'],
    },
    {
      name: 'Step booster',
      category: 'cardio',
      durationMin: 20,
      description:
        `A brisk outdoor walk sized to rescue your ${profile.goal === 'fat_loss' ? '9,000' : '7,500'}-step floor on a desk-heavy day.`,
      steps: ['Brisk pace (you notice your breathing)', 'Ideally right after a meal — improves glucose response', 'Podcast/audiobook recommended'],
    },
  ]
  if (hiitSafe(profile)) {
    out.splice(1, 0, {
      name: 'HIIT intervals (bike or rower)',
      category: 'cardio',
      durationMin: 20,
      description:
        'Time-efficient VO₂max work — the strongest cardio stimulus per minute. Hard by design; once a week is plenty, and never the day before heavy legs.',
      steps: [
        '5 min easy warm-up',
        '6–8 × (30 s hard / 90 s easy spin)',
        '“Hard” = 8/10 effort, not all-out sprint',
        '3 min easy cool-down',
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
      description:
        'The weekly “long slow distance” session: builds mitochondria, fat metabolism and the engine that makes everything else easier. Keep it genuinely easy.',
      steps: [
        `${beginner ? '60' : '75–90'} min continuous at conversational pace`,
        'Flat-ish terrain or steady gearing; fuel with water (+ a snack past 75 min)',
        'Effort check: you should finish feeling like you could do 20 more minutes',
      ],
    },
    {
      name: beginner ? 'Run/walk 5K builder' : 'Steady 5–8K run',
      category: 'endurance',
      durationMin: 30,
      description: beginner
        ? 'The proven route from zero to running 5K without wrecking your shins: alternate running and walking, extend the running a little each week.'
        : 'A steady continuous run at conversational pace — the backbone of running fitness.',
      steps: beginner
        ? ['5 min brisk walk warm-up', '8 × (1 min easy run / 2 min walk)', 'Next weeks: 2/2 → 3/2 → 5/1 → continuous', 'Never add more than ~10% per week']
        : ['10 min easy warm-up', '20–35 min steady (could speak in sentences)', 'Finish with 4 × 20 s relaxed strides'],
    },
    {
      name: 'Swim (steady laps)',
      category: 'endurance',
      durationMin: 40,
      description: 'Zero-impact full-body endurance — ideal with cranky joints or as active recovery that still trains the engine.',
      steps: ['Warm up 4 × 50 m easy', 'Main: 10–20 × 50 m with 15–20 s rest', 'Mix strokes if technique fades'],
    },
    {
      name: 'Tempo ladder',
      category: 'endurance',
      durationMin: 35,
      description:
        'Comfortably-hard intervals that raise your sustainable pace — the bridge between easy volume and race fitness.',
      steps: ['10 min easy warm-up', '4 / 6 / 8 / 6 / 4 min at “comfortably hard” (7/10), 2 min easy between', '5 min cool-down'],
    },
  ]
}

export function stretchProposals(profile: Profile): ActivityProposal[] {
  return [
    {
      name: '10-min full-body mobility',
      category: 'stretch',
      durationMin: 10,
      description: 'The daily minimum: hits every major area in ten minutes. Perfect as a morning starter or training warm-down.',
      steps: [
        'World’s greatest stretch × 5/side',
        'Cat–camel × 10',
        'Deep squat hold 1 min (hold support if needed)',
        'Couch stretch 1 min/side',
        'Thoracic rotations × 8/side',
      ],
    },
    {
      name: profile.lifestyle.deskJob ? 'Desk-body rescue (hips & thoracic)' : 'Hip opener routine',
      category: 'stretch',
      durationMin: 12,
      description: profile.lifestyle.deskJob
        ? 'Targets exactly what sitting shortens: hip flexors, chest and mid-back. Do it after work to un-desk your body.'
        : 'Deep hip work for squat depth and lower-back relief.',
      steps: [
        '90/90 hip switches × 10',
        'Couch stretch 90 s/side',
        'Pigeon stretch 90 s/side',
        'Doorway pec stretch 45 s/side',
        'Thoracic extension over a foam roller / chair edge 1 min',
      ],
    },
    {
      name: 'Shoulder & upper-back routine',
      category: 'stretch',
      durationMin: 10,
      description: 'Keeps pressing overhead safe and posture tall. Great on pull-day evenings.',
      steps: [
        'Wall slides × 10',
        'Band / towel pull-aparts × 15',
        'Doorway pec stretch 45 s/side',
        'Child’s pose with side reach 45 s/side',
        'Neck half-circles × 5 each way',
      ],
    },
    {
      name: 'Evening wind-down flow',
      category: 'stretch',
      durationMin: 15,
      description:
        'Slow floor-based stretching with long exhales — doubles as a sleep-onset ritual, which your recovery loves.',
      steps: [
        'Child’s pose 1 min',
        'Cat–camel × 10 slow',
        'Supine twist 1 min/side',
        'Legs up the wall 3 min',
        'Breathing: 4 s in / 6 s out throughout',
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
