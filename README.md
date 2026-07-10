# FitBlueprint — Evidence-Based Personal Trainer

A personal-trainer web app that covers five coaching use cases, powered by a deterministic,
research-grounded engine — no accounts, no server, no API keys. All data stays in your browser.

## The five use cases

| # | Use case | Where in the app |
|---|----------|------------------|
| 1 | **Complete Fitness Blueprint** — coach-style interview (age, height, weight, body fat, fitness level, medical conditions, injuries, equipment, schedule, sleep, stress, diet, lifestyle) → a personalized system covering workouts, nutrition, recovery, mobility and habits | Intake wizard → **Blueprint** tab |
| 2 | **Body Transformation Roadmap** — the fastest *realistic* path to your goal, in phases with weekly tracking, optimized for long-term results | **Roadmap** tab |
| 3 | **Nutrition Coach** — calorie & protein targets, meal ideas for your diet preference, hydration, and sustainable habits instead of restriction | **Nutrition** tab |
| 4 | **Fat Loss Expert** — muscle-preserving fat-loss strategy plus an adjustment engine that reads your weigh-in trend and tells you exactly what to change when loss stalls | **Fat Loss** tab |
| 5 | **Habit Builder** — behavioral diagnosis of what breaks your consistency, and an anchored-habit system with streaks, built on habits rather than willpower | **Habits** tab |

The **Today** tab ties it together: morning weigh-in, session check-off and habit streaks feed the
adjustment engine.

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

- Vite + React 18 + TypeScript, zustand (persisted to localStorage)
- Installable PWA with an offline service worker
- Vitest unit tests on the whole calculation/adjustment engine

## Run it

```bash
npm install
npm run dev       # local dev server
npm run test      # 33 engine tests
npm run build     # production build in dist/ (static, host anywhere)
```

## Disclaimer

FitBlueprint provides general fitness and nutrition education based on published research. It is not
medical advice and does not replace a physician, registered dietitian or physiotherapist — especially
if you have a medical condition, an injury, or are pregnant.
