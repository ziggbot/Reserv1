import type { DietPref } from './types'

export interface MealIdea {
  name: string
  proteinG: number
  approxKcal: number
  slot: 'breakfast' | 'lunch' | 'dinner' | 'snack'
}

const MEALS: Record<DietPref, MealIdea[]> = {
  omnivore: [
    { name: 'Greek yogurt (300 g) + berries + oats + honey', proteinG: 30, approxKcal: 420, slot: 'breakfast' },
    { name: '3-egg omelette + wholegrain toast + fruit', proteinG: 26, approxKcal: 450, slot: 'breakfast' },
    { name: 'Chicken burrito bowl: rice, beans, salsa, cheese', proteinG: 42, approxKcal: 620, slot: 'lunch' },
    { name: 'Tuna + white bean salad, olive oil, bread', proteinG: 38, approxKcal: 520, slot: 'lunch' },
    { name: 'Salmon, potatoes, roasted vegetables', proteinG: 38, approxKcal: 600, slot: 'dinner' },
    { name: 'Lean beef / turkey pasta bolognese + side salad', proteinG: 40, approxKcal: 650, slot: 'dinner' },
    { name: 'Cottage cheese + pineapple, or protein shake + banana', proteinG: 25, approxKcal: 250, slot: 'snack' },
  ],
  vegetarian: [
    { name: 'Greek yogurt (300 g) + berries + oats + nuts', proteinG: 30, approxKcal: 450, slot: 'breakfast' },
    { name: 'Cottage-cheese pancakes + fruit', proteinG: 28, approxKcal: 430, slot: 'breakfast' },
    { name: 'Halloumi + lentil salad with olive oil', proteinG: 30, approxKcal: 560, slot: 'lunch' },
    { name: 'Egg fried rice with edamame + vegetables', proteinG: 30, approxKcal: 580, slot: 'lunch' },
    { name: 'Paneer / bean curry with rice', proteinG: 32, approxKcal: 620, slot: 'dinner' },
    { name: 'Bean & cheese chili with quinoa', proteinG: 30, approxKcal: 580, slot: 'dinner' },
    { name: 'Skyr / protein shake + handful of almonds', proteinG: 25, approxKcal: 260, slot: 'snack' },
  ],
  vegan: [
    { name: 'Tofu scramble + wholegrain toast + avocado', proteinG: 26, approxKcal: 470, slot: 'breakfast' },
    { name: 'Overnight oats with soy milk + pea protein + berries', proteinG: 30, approxKcal: 450, slot: 'breakfast' },
    { name: 'Lentil + quinoa bowl with tahini dressing', proteinG: 26, approxKcal: 560, slot: 'lunch' },
    { name: 'Chickpea wrap with hummus + vegetables', proteinG: 24, approxKcal: 540, slot: 'lunch' },
    { name: 'Tempeh stir-fry with rice + edamame', proteinG: 34, approxKcal: 600, slot: 'dinner' },
    { name: 'Seitan / soy-mince pasta with lentil ragu', proteinG: 36, approxKcal: 620, slot: 'dinner' },
    { name: 'Soy yogurt + granola, or vegan protein shake', proteinG: 22, approxKcal: 260, slot: 'snack' },
  ],
}

export function mealIdeasFor(pref: DietPref): MealIdea[] {
  return MEALS[pref]
}

export const SUSTAINABLE_EATING_HABITS = [
  'No forbidden foods — foods you love fit inside the calorie budget. Restriction is what triggers binges.',
  'Protein + produce first on every plate; whatever you enjoy fills the rest.',
  'Plan tomorrow’s meals in 2 minutes tonight — decisions made in advance beat decisions made hungry.',
  'Eat slowly for the first plate, then wait 10 minutes before deciding on seconds — satiety lags intake.',
  'Keep 2–3 "default meals" you can make on autopilot for low-energy days.',
  'Weekends count: 5 perfect days can be undone by 2 untracked ones. Aim for consistent, not perfect.',
]
