import type { DietPref } from './types'

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface MealIdea {
  name: string
  proteinG: number
  approxKcal: number
  slot: MealSlot
}

export const SLOT_ORDER: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack']

export const SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
}

const MEALS: Record<DietPref, MealIdea[]> = {
  omnivore: [
    // Breakfast
    { name: 'Greek yogurt (300 g) + berries + oats + honey', proteinG: 30, approxKcal: 420, slot: 'breakfast' },
    { name: '3-egg omelette + wholegrain toast + fruit', proteinG: 26, approxKcal: 450, slot: 'breakfast' },
    { name: 'Skyr (250 g) + granola + banana', proteinG: 28, approxKcal: 400, slot: 'breakfast' },
    { name: 'Protein oatmeal: oats cooked with milk + scoop of whey + berries', proteinG: 35, approxKcal: 430, slot: 'breakfast' },
    { name: 'Scrambled eggs (2) + smoked salmon on rye bread', proteinG: 30, approxKcal: 420, slot: 'breakfast' },
    // Lunch
    { name: 'Chicken burrito bowl: rice, beans, salsa, cheese', proteinG: 42, approxKcal: 620, slot: 'lunch' },
    { name: 'Tuna + white bean salad, olive oil, bread', proteinG: 38, approxKcal: 520, slot: 'lunch' },
    { name: 'Chicken wrap with hummus + vegetables', proteinG: 35, approxKcal: 550, slot: 'lunch' },
    { name: 'Meal-prep box: ground turkey, rice, roasted veg', proteinG: 40, approxKcal: 580, slot: 'lunch' },
    { name: 'Shrimp + noodle stir-fry with vegetables', proteinG: 32, approxKcal: 520, slot: 'lunch' },
    // Dinner
    { name: 'Salmon, potatoes, roasted vegetables', proteinG: 38, approxKcal: 600, slot: 'dinner' },
    { name: 'Lean beef / turkey pasta bolognese + side salad', proteinG: 40, approxKcal: 650, slot: 'dinner' },
    { name: 'Chicken fajitas with peppers + tortillas', proteinG: 42, approxKcal: 620, slot: 'dinner' },
    { name: 'Cod / white fish with rice + broccoli in butter', proteinG: 36, approxKcal: 520, slot: 'dinner' },
    { name: 'Lean steak, sweet potato, green beans', proteinG: 45, approxKcal: 640, slot: 'dinner' },
    // Snacks
    { name: 'Cottage cheese + pineapple', proteinG: 22, approxKcal: 220, slot: 'snack' },
    { name: 'Protein shake + banana', proteinG: 27, approxKcal: 260, slot: 'snack' },
    { name: 'Beef jerky + apple', proteinG: 18, approxKcal: 200, slot: 'snack' },
    { name: '2 boiled eggs + handful of nuts', proteinG: 16, approxKcal: 280, slot: 'snack' },
    { name: 'Skyr drink / kvarg (250 ml)', proteinG: 25, approxKcal: 180, slot: 'snack' },
  ],
  vegetarian: [
    // Breakfast
    { name: 'Greek yogurt (300 g) + berries + oats + nuts', proteinG: 30, approxKcal: 450, slot: 'breakfast' },
    { name: 'Cottage-cheese pancakes + fruit', proteinG: 28, approxKcal: 430, slot: 'breakfast' },
    { name: '3-egg omelette with cheese + wholegrain toast', proteinG: 28, approxKcal: 460, slot: 'breakfast' },
    { name: 'Protein oatmeal with whey + peanut butter', proteinG: 34, approxKcal: 470, slot: 'breakfast' },
    { name: 'Skyr bowl with granola + honey', proteinG: 26, approxKcal: 400, slot: 'breakfast' },
    // Lunch
    { name: 'Halloumi + lentil salad with olive oil', proteinG: 30, approxKcal: 560, slot: 'lunch' },
    { name: 'Egg fried rice with edamame + vegetables', proteinG: 30, approxKcal: 580, slot: 'lunch' },
    { name: 'Falafel bowl with quinoa, feta + tzatziki', proteinG: 26, approxKcal: 590, slot: 'lunch' },
    { name: 'Caprese sandwich + cottage cheese side', proteinG: 28, approxKcal: 520, slot: 'lunch' },
    { name: 'Greek salad with extra feta + chickpeas + bread', proteinG: 24, approxKcal: 540, slot: 'lunch' },
    // Dinner
    { name: 'Paneer / bean curry with rice', proteinG: 32, approxKcal: 620, slot: 'dinner' },
    { name: 'Bean & cheese chili with quinoa', proteinG: 30, approxKcal: 580, slot: 'dinner' },
    { name: 'Vegetarian lasagna with lentil ragu + side salad', proteinG: 30, approxKcal: 620, slot: 'dinner' },
    { name: 'Halloumi burger + oven fries', proteinG: 28, approxKcal: 650, slot: 'dinner' },
    { name: 'Egg + potato hash with baked beans', proteinG: 27, approxKcal: 540, slot: 'dinner' },
    // Snacks
    { name: 'Skyr / kvarg (250 g) + honey', proteinG: 25, approxKcal: 200, slot: 'snack' },
    { name: 'Protein shake + handful of almonds', proteinG: 28, approxKcal: 290, slot: 'snack' },
    { name: 'Cottage cheese on rice cakes', proteinG: 18, approxKcal: 190, slot: 'snack' },
    { name: '2 boiled eggs + fruit', proteinG: 13, approxKcal: 220, slot: 'snack' },
    { name: 'Cheese + wholegrain crackers', proteinG: 14, approxKcal: 260, slot: 'snack' },
  ],
  vegan: [
    // Breakfast
    { name: 'Tofu scramble + wholegrain toast + avocado', proteinG: 26, approxKcal: 470, slot: 'breakfast' },
    { name: 'Overnight oats with soy milk + pea protein + berries', proteinG: 30, approxKcal: 450, slot: 'breakfast' },
    { name: 'Soy yogurt bowl + granola + hemp seeds', proteinG: 22, approxKcal: 420, slot: 'breakfast' },
    { name: 'Protein smoothie: soy milk, banana, oats, vegan protein', proteinG: 32, approxKcal: 440, slot: 'breakfast' },
    { name: 'Peanut butter + banana on wholegrain toast + soy latte', proteinG: 20, approxKcal: 480, slot: 'breakfast' },
    // Lunch
    { name: 'Lentil + quinoa bowl with tahini dressing', proteinG: 26, approxKcal: 560, slot: 'lunch' },
    { name: 'Chickpea wrap with hummus + vegetables', proteinG: 24, approxKcal: 540, slot: 'lunch' },
    { name: 'Tofu poke bowl with edamame + rice', proteinG: 30, approxKcal: 580, slot: 'lunch' },
    { name: 'Lentil soup + wholegrain bread + peanut butter', proteinG: 25, approxKcal: 520, slot: 'lunch' },
    { name: 'Black-bean burrito with guacamole', proteinG: 24, approxKcal: 590, slot: 'lunch' },
    // Dinner
    { name: 'Tempeh stir-fry with rice + edamame', proteinG: 34, approxKcal: 600, slot: 'dinner' },
    { name: 'Seitan / soy-mince pasta with lentil ragu', proteinG: 36, approxKcal: 620, slot: 'dinner' },
    { name: 'Chana masala (chickpea curry) with rice', proteinG: 26, approxKcal: 580, slot: 'dinner' },
    { name: 'Tofu + peanut satay with noodles', proteinG: 32, approxKcal: 640, slot: 'dinner' },
    { name: 'Vegan chili sin carne with quinoa', proteinG: 28, approxKcal: 560, slot: 'dinner' },
    // Snacks
    { name: 'Soy yogurt + granola', proteinG: 15, approxKcal: 230, slot: 'snack' },
    { name: 'Vegan protein shake + banana', proteinG: 27, approxKcal: 260, slot: 'snack' },
    { name: 'Edamame (200 g, salted)', proteinG: 22, approxKcal: 240, slot: 'snack' },
    { name: 'Roasted chickpeas + dried fruit', proteinG: 12, approxKcal: 250, slot: 'snack' },
    { name: 'Hummus + vegetable sticks + crackers', proteinG: 10, approxKcal: 240, slot: 'snack' },
  ],
}

export function mealIdeasFor(pref: DietPref): MealIdea[] {
  return MEALS[pref]
}

export function mealsBySlot(pref: DietPref): Record<MealSlot, MealIdea[]> {
  const grouped: Record<MealSlot, MealIdea[]> = { breakfast: [], lunch: [], dinner: [], snack: [] }
  for (const m of MEALS[pref]) grouped[m.slot].push(m)
  return grouped
}

export const SUSTAINABLE_EATING_HABITS = [
  'No forbidden foods — foods you love fit inside the calorie budget. Restriction is what triggers binges.',
  'Protein + produce first on every plate; whatever you enjoy fills the rest.',
  'Plan tomorrow’s meals in 2 minutes tonight — decisions made in advance beat decisions made hungry.',
  'Eat slowly for the first plate, then wait 10 minutes before deciding on seconds — satiety lags intake.',
  'Keep 2–3 "default meals" you can make on autopilot for low-energy days.',
  'Weekends count: 5 perfect days can be undone by 2 untracked ones. Aim for consistent, not perfect.',
]
