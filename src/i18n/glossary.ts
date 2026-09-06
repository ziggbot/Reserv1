import { GLOSSARY_PROGRAMS } from './glossary.programs'
import { GLOSSARY_CONTENT } from './glossary.content'

/**
 * Canonical English name → Swedish display label. Exercise names use the
 * terms Swedish gyms actually use (chins, latsdrag, skivstångsrodd…), not
 * literal translations. Keys must match the English strings byte for byte.
 */
const CORE: Record<string, string> = {
  // --- Squat pattern
  'Barbell back squat': 'Knäböj med skivstång',
  'Goblet squat': 'Goblet squat',
  'Leg press': 'Benpress',
  'Box squat to bench': 'Boxknäböj mot bänk',
  'Bodyweight squat (tempo)': 'Knäböj med kroppsvikt (tempo)',
  // --- Hinge
  'Romanian deadlift (barbell)': 'Rumänska marklyft (skivstång)',
  'Romanian deadlift (dumbbell)': 'Rumänska marklyft (hantlar)',
  'Hip thrust / glute bridge': 'Hip thrust / höftlyft',
  'Back extension (45°)': 'Ryggresning (45°)',
  // --- Lunge
  'Walking lunge': 'Gående utfall',
  'Bulgarian split squat': 'Bulgariska utfall',
  'Step-up (low box)': 'Step-ups (låg låda)',
  'Glute bridge march': 'Höftlyft med marsch',
  // --- Horizontal push
  'Barbell bench press': 'Bänkpress med skivstång',
  'Dumbbell bench press': 'Hantelpress på bänk',
  'Push-up': 'Armhävningar',
  'Machine chest press': 'Bröstpress i maskin',
  'Incline push-up (hands elevated)': 'Armhävningar med händerna upphöjda',
  // --- Vertical push
  'Overhead press (barbell)': 'Militärpress (skivstång)',
  'Seated dumbbell shoulder press': 'Sittande axelpress med hantlar',
  'Pike push-up': 'Pike-armhävningar',
  'Landmine press': 'Landmine press',
  'Lateral raise (light)': 'Sidolyft (lätt)',
  'Wall slide + band raise': 'Wall slides + lyft med gummiband',
  // --- Horizontal pull
  'Barbell row': 'Skivstångsrodd',
  'One-arm dumbbell row': 'Enarmsrodd med hantel',
  'Seated cable row': 'Sittande kabelrodd',
  'Inverted row (table/rings)': 'Omvänd rodd (bord/ringar)',
  // --- Vertical pull
  'Pull-up / assisted pull-up': 'Chins / assisterade chins',
  'Lat pulldown': 'Latsdrag',
  'Dumbbell pullover': 'Pullover med hantel',
  'Doorframe row / towel row': 'Rodd i dörrkarm / handduksrodd',
  // --- Core
  Plank: 'Plankan',
  'Dead bug': 'Dead bug',
  'Pallof press (cable/band)': 'Pallof press (kabel/gummiband)',
  'Side plank': 'Sidoplanka',
  // --- Carry / calf
  "Farmer's carry": 'Farmers walk',
  'Standing calf raise': 'Stående tåhävningar',
  'Coach-selected alternative': 'Alternativ valt av coachen',
  Exercise: 'Övning',

  // --- Session names (rotation keys — stay English in storage)
  'Full Body A': 'Helkropp A',
  'Full Body B': 'Helkropp B',
  'Full Body C': 'Helkropp C',
  'Full Body D': 'Helkropp D',
  'Full Body E': 'Helkropp E',
  'Full Body F': 'Helkropp F',
  'Upper Body': 'Överkropp',
  'Lower Body': 'Underkropp',
  'Upper Body 2': 'Överkropp 2',
  'Lower Body 2': 'Underkropp 2',
  Push: 'Push',
  Pull: 'Pull',
  Legs: 'Ben',
  'Push 2': 'Push 2',
  'Pull 2': 'Pull 2',
  'Legs 2': 'Ben 2',
  'Bonus full body': 'Bonus helkropp',

  // --- Session focus
  'Whole-body strength': 'Helkroppsstyrka',
  'Chest, back, shoulders, arms': 'Bröst, rygg, axlar, armar',
  'Legs, glutes, core': 'Ben, säte, bål',
  'Chest, shoulders, triceps': 'Bröst, axlar, triceps',
  'Back, biceps, rear delts': 'Rygg, biceps, bakre axlar',
  'Quads, hamstrings, glutes, calves': 'Framsida lår, baksida lår, säte, vader',
  'Legs & core': 'Ben & bål',
  'Back, rear delts, biceps': 'Rygg, bakre axlar, biceps',
  'Whole-body strength · extra, outside your rotation': 'Helkroppsstyrka · extra, utanför din rotation',

  // --- Split names
  'Full body ×2': 'Helkropp ×2',
  'Full body ×3': 'Helkropp ×3',
  'Full body ×4': 'Helkropp ×4',
  'Full body ×5': 'Helkropp ×5',
  'Full body ×6': 'Helkropp ×6',
  'Full body ×2 + conditioning': 'Helkropp ×2 + kondition',
  'Full body ×3 + conditioning': 'Helkropp ×3 + kondition',
  'Upper / Lower ×2': 'Över / Under ×2',
  'Upper / Lower + Push / Pull / Legs': 'Över / Under + Push / Pull / Ben',
  'Push / Pull / Legs ×2': 'Push / Pull / Ben ×2',
  '3 Day Full Body': '3-dagars helkropp',

  // --- Effort and rep targets
  'RPE 6–7 (2–4 reps left in the tank)': 'RPE 6–7 (2–4 reps kvar i tanken)',
  'RPE 7–8 (1–3 reps in reserve)': 'RPE 7–8 (1–3 reps i reserv)',
  '1–2 reps in reserve': '1–2 reps i reserv',
  '30–45 s or 8–12 slow reps': '30–45 s eller 8–12 långsamma reps',

  // --- Warm-up
  '3–5 min easy cardio to raise body temperature': '3–5 min lugn kondition för att höja kroppstemperaturen',
  'Dynamic drills: leg swings, arm circles, hip openers (5 min)': 'Dynamisk uppvärmning: benpendlingar, armcirklar, höftöppnare (5 min)',
  'First exercise: 2 light ramp-up sets before working sets': 'Första övningen: 2 lätta uppvärmningsset före arbetsseten',

  // --- Mobility finishers
  'Couch stretch 1 min/side': 'Couch stretch 1 min/sida',
  '90/90 hip switch ×10': '90/90 höftväxlingar ×10',
  'Ankle rocks ×10/side': 'Fotledsgungningar ×10/sida',
  'Thoracic extension on foam roller 1 min': 'Bröstryggsextension på foamroller 1 min',
  'Doorway pec stretch 45 s/side': 'Bröststretch i dörröppning 45 s/sida',
  'Band pull-aparts ×15': 'Band pull-aparts ×15',
  'World’s greatest stretch ×5/side': 'World’s greatest stretch ×5/sida',
  'Cat–camel ×10': 'Katt–kamel ×10',
  'Deep squat hold 1 min': 'Djup knäböjshållning 1 min',
}

export const GLOSSARY: Record<string, string> = { ...CORE, ...GLOSSARY_PROGRAMS, ...GLOSSARY_CONTENT }
