# FitBlueprint — Evidence-Based Personal Trainer

A personal-trainer web app that covers five coaching use cases, powered by a deterministic,
research-grounded engine — no accounts, no server, no API keys. All data stays in your browser.

## The five use cases

| # | Use case | Where in the app |
|---|----------|------------------|
| 1 | **Complete Fitness Blueprint** — coach-style interview (age, height, weight, body fat, fitness level, medical conditions, injuries, equipment, schedule, sleep, stress, diet, lifestyle) → goal-based "marching orders" overview (lose X kg, train N×/week, steps, protein range, HIIT, sleep, hydration) plus the full system | Intake wizard → More → **Plan & roadmap** |
| 2 | **Body Transformation Roadmap** — the fastest *realistic* path to your goal, in phases with weekly tracking, optimized for long-term results | More → **Plan & roadmap** |
| 3 | **Nutrition Coach** — calorie & protein targets, meal ideas per slot (breakfast/lunch/dinner/snacks) for your diet preference, hydration, evidence-graded supplement guidance (creatine, vitamin D, omega-3, magnesium, probiotics…) and sustainable habits instead of restriction | More → **Nutrition** |
| 4 | **Fat Loss Expert** — all statistics in one place: weight-trend chart (daily + 7-day average + goal line), the adjustment engine that reads your weigh-in trend and tells you exactly what to change when loss stalls, training volume and strength trends | **Progress** tab |
| 5 | **Habit Builder** — behavioral diagnosis of what breaks your consistency, and an anchored-habit system with streaks, built on habits rather than willpower | More → **Habits** |

## The home screen: "Let's train"

The app opens on one big button. It starts the next session in your program rotation (the one
after the last session you logged), shows what it is and roughly how long it takes, and lets you
pick a different session if today calls for it. Under the button: your week as a checklist
(strength days tick off by session name, conditioning days by count), cardio/endurance/stretch
proposals one tap away, and your last few workouts.

The workout logger is in the style of the best trackers (Hevy/Strong): each set prefills last
session's weight × reps, one tap marks it done and starts a 90 s rest timer, and finishing stores
volume, duration and PR flags. Programs — presets (full-body ×3, upper/lower ×4, PPL ×6, 30-min
express, bodyweight travel), the research-matrix recommendation, and a full editor — live under
More → Settings.

The bottom bar has three items: **Progress**, **Train** (centre) and **More**. Everything that is
not training sits behind More.

## Languages

Swedish is the default; English is one tap away (SV / EN in the header, before or after unlock).
UI strings use `tr(en, sv)` at the point of use; names that are stored or used as keys (exercise
and session names, split names) stay English in data and are translated for display through the
glossary in `src/i18n/glossary*.ts`, so histories and prefills keep matching when you switch. The
user's own imported Swedish program passes through untouched.

## Cloud sync (Supabase)

Optional. Everything works offline on one device; sign in under More → Settings → Cloud sync and
the profile's data (workouts, weigh-ins, program, plan history) is mirrored to your own Supabase
project so a phone and a laptop show the same thing. Coach API keys never leave the device.

1. Create a free project at supabase.com and run `supabase/schema.sql` once in the SQL editor
   (one `app_state` table, row-level security so each user only sees their own row).
2. Either paste the Project URL and anon key under Settings → Cloud sync → Project settings, or
   bake them into the build with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (the Pages
   workflow reads them from repository secrets of the same names).
3. Create an account with email + password, sign in on each device.

Sync is last-write-wins on the whole profile, debounced 1.5 s after each change.

## Look

White paper, dark ink, handwritten type: [Caveat](https://fonts.google.com/specimen/Caveat) for
headings and the call-to-action, [Patrick Hand](https://fonts.google.com/specimen/Patrick+Hand)
for body copy. Both are SIL Open Font License and self-hosted in `public/fonts/` so the installed
PWA works offline.

## Research the engine encodes

- **Mifflin–St Jeor** resting metabolic rate (Mifflin et al. 1990; most accurate validated equation — Frankenfield 2005)
- **Protein 1.6–2.2 g/kg/day** for muscle gain (Morton et al. 2018, BJSM meta-analysis); **higher while cutting** (Helms et al. 2014)
- **Fat loss at 0.5–1% bodyweight/week** spares lean mass (Garthe et al. 2011)
- **WHO 2020 / ACSM**: 150–300 min/week moderate cardio + ≥2 resistance days; ~10–20 hard sets/muscle/week (Schoenfeld et al. 2017)
- **Steps & mortality** (Paluch et al. 2022, Lancet Public Health); NEAT restoration as the first stall lever
- **Sleep 7–9 h**; short sleep shifts weight loss from fat to lean mass (Nedeltcheva et al. 2010)
- **Diet breaks** improve fat-loss efficiency and adherence (MATADOR, Byrne et al. 2018)
- **Habits**: ~66 days to automaticity (Lally et al. 2010); implementation intentions ≈ d 0.65 (Gollwitzer & Sheeran 2006); self-weighing predicts long-term success (Zheng et al. 2015)

Every plan screen has a "research behind these numbers" panel with the citations.

## Tech

- Vite + React 18 + TypeScript, zustand (persisted to localStorage, optionally mirrored to Supabase)
- Installable PWA with an offline service worker
- Vitest unit tests on the whole calculation/adjustment engine

## Run it

```bash
npm install
npm run dev       # local dev server
npm run test      # engine tests (vitest)
npm run build     # production build in dist/ (static, host anywhere)
```

## Disclaimer

FitBlueprint provides general fitness and nutrition education based on published research. It is not
medical advice and does not replace a physician, registered dietitian or physiotherapist — especially
if you have a medical condition, an injury, or are pregnant.
