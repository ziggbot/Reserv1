import type { DietPref } from './types'
import { tr } from '../i18n'

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface MealIdea {
  name: string
  proteinG: number
  approxKcal: number
  slot: MealSlot
}

export const SLOT_ORDER: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack']

/** Display label for a meal slot in the active language. */
export function slotLabel(slot: MealSlot): string {
  switch (slot) {
    case 'breakfast':
      return tr('Breakfast', 'Frukost')
    case 'lunch':
      return tr('Lunch', 'Lunch')
    case 'dinner':
      return tr('Dinner', 'Middag')
    case 'snack':
      return tr('Snacks', 'Mellanmål')
  }
}

/** Small constructor so the table below stays readable: m(en, sv, protein, kcal, slot). */
function m(en: string, sv: string, proteinG: number, approxKcal: number, slot: MealSlot): MealIdea {
  return { name: tr(en, sv), proteinG, approxKcal, slot }
}

/** Built at call time so names follow the active language. */
function meals(): Record<DietPref, MealIdea[]> {
  return {
    omnivore: [
      // Breakfast
      m('Greek yogurt (300 g) + berries + oats + honey', 'Grekisk yoghurt (300 g) + bär + havregryn + honung', 30, 420, 'breakfast'),
      m('3-egg omelette + wholegrain toast + fruit', 'Omelett på 3 ägg + rostat fullkornsbröd + frukt', 26, 450, 'breakfast'),
      m('Skyr (250 g) + granola + banana', 'Skyr (250 g) + granola + banan', 28, 400, 'breakfast'),
      m('Protein oatmeal: oats cooked with milk + scoop of whey + berries', 'Proteingröt: havregryn kokta på mjölk + en skopa vassle + bär', 35, 430, 'breakfast'),
      m('Scrambled eggs (2) + smoked salmon on rye bread', 'Äggröra (2 ägg) + rökt lax på rågbröd', 30, 420, 'breakfast'),
      // Lunch
      m('Chicken burrito bowl: rice, beans, salsa, cheese', 'Burritobowl med kyckling: ris, bönor, salsa, ost', 42, 620, 'lunch'),
      m('Tuna + white bean salad, olive oil, bread', 'Sallad med tonfisk och vita bönor, olivolja, bröd', 38, 520, 'lunch'),
      m('Chicken wrap with hummus + vegetables', 'Kycklingwrap med hummus + grönsaker', 35, 550, 'lunch'),
      m('Meal-prep box: ground turkey, rice, roasted veg', 'Matlåda: kalkonfärs, ris, ugnsrostade grönsaker', 40, 580, 'lunch'),
      m('Shrimp + noodle stir-fry with vegetables', 'Wok med räkor, nudlar och grönsaker', 32, 520, 'lunch'),
      // Dinner
      m('Salmon, potatoes, roasted vegetables', 'Lax, potatis, ugnsrostade grönsaker', 38, 600, 'dinner'),
      m('Lean beef / turkey pasta bolognese + side salad', 'Pasta bolognese på mager nötfärs / kalkonfärs + sallad', 40, 650, 'dinner'),
      m('Chicken fajitas with peppers + tortillas', 'Kycklingfajitas med paprika + tortillas', 42, 620, 'dinner'),
      m('Cod / white fish with rice + broccoli in butter', 'Torsk / vit fisk med ris + smörslungad broccoli', 36, 520, 'dinner'),
      m('Lean steak, sweet potato, green beans', 'Mager biff, sötpotatis, haricots verts', 45, 640, 'dinner'),
      // Snacks
      m('Cottage cheese + pineapple', 'Keso + ananas', 22, 220, 'snack'),
      m('Protein shake + banana', 'Proteinshake + banan', 27, 260, 'snack'),
      m('Beef jerky + apple', 'Beef jerky + äpple', 18, 200, 'snack'),
      m('2 boiled eggs + handful of nuts', '2 kokta ägg + en näve nötter', 16, 280, 'snack'),
      m('Skyr drink / kvarg (250 ml)', 'Drickskyr / kvarg (250 ml)', 25, 180, 'snack'),
    ],
    vegetarian: [
      // Breakfast
      m('Greek yogurt (300 g) + berries + oats + nuts', 'Grekisk yoghurt (300 g) + bär + havregryn + nötter', 30, 450, 'breakfast'),
      m('Cottage-cheese pancakes + fruit', 'Kesopannkakor + frukt', 28, 430, 'breakfast'),
      m('3-egg omelette with cheese + wholegrain toast', 'Omelett på 3 ägg med ost + rostat fullkornsbröd', 28, 460, 'breakfast'),
      m('Protein oatmeal with whey + peanut butter', 'Proteingröt med vassle + jordnötssmör', 34, 470, 'breakfast'),
      m('Skyr bowl with granola + honey', 'Skyrbowl med granola + honung', 26, 400, 'breakfast'),
      // Lunch
      m('Halloumi + lentil salad with olive oil', 'Sallad med halloumi och linser, olivolja', 30, 560, 'lunch'),
      m('Egg fried rice with edamame + vegetables', 'Stekt ris med ägg, edamame + grönsaker', 30, 580, 'lunch'),
      m('Falafel bowl with quinoa, feta + tzatziki', 'Falafelbowl med quinoa, fetaost + tzatziki', 26, 590, 'lunch'),
      m('Caprese sandwich + cottage cheese side', 'Capresemacka + keso vid sidan', 28, 520, 'lunch'),
      m('Greek salad with extra feta + chickpeas + bread', 'Grekisk sallad med extra fetaost + kikärtor + bröd', 24, 540, 'lunch'),
      // Dinner
      m('Paneer / bean curry with rice', 'Paneer- / böncurry med ris', 32, 620, 'dinner'),
      m('Bean & cheese chili with quinoa', 'Chili med bönor och ost, serverad med quinoa', 30, 580, 'dinner'),
      m('Vegetarian lasagna with lentil ragu + side salad', 'Vegetarisk lasagne med linsragu + sallad', 30, 620, 'dinner'),
      m('Halloumi burger + oven fries', 'Halloumiburgare + ugnspommes', 28, 650, 'dinner'),
      m('Egg + potato hash with baked beans', 'Pyttipanna på ägg och potatis med vita bönor i tomatsås', 27, 540, 'dinner'),
      // Snacks
      m('Skyr / kvarg (250 g) + honey', 'Skyr / kvarg (250 g) + honung', 25, 200, 'snack'),
      m('Protein shake + handful of almonds', 'Proteinshake + en näve mandlar', 28, 290, 'snack'),
      m('Cottage cheese on rice cakes', 'Keso på riskakor', 18, 190, 'snack'),
      m('2 boiled eggs + fruit', '2 kokta ägg + frukt', 13, 220, 'snack'),
      m('Cheese + wholegrain crackers', 'Ost + fullkornskex', 14, 260, 'snack'),
    ],
    vegan: [
      // Breakfast
      m('Tofu scramble + wholegrain toast + avocado', 'Tofuröra + rostat fullkornsbröd + avokado', 26, 470, 'breakfast'),
      m('Overnight oats with soy milk + pea protein + berries', 'Overnight oats med sojamjölk + ärtprotein + bär', 30, 450, 'breakfast'),
      m('Soy yogurt bowl + granola + hemp seeds', 'Sojayoghurtbowl + granola + hampafrön', 22, 420, 'breakfast'),
      m('Protein smoothie: soy milk, banana, oats, vegan protein', 'Proteinsmoothie: sojamjölk, banan, havregryn, veganskt proteinpulver', 32, 440, 'breakfast'),
      m('Peanut butter + banana on wholegrain toast + soy latte', 'Jordnötssmör + banan på rostat fullkornsbröd + sojalatte', 20, 480, 'breakfast'),
      // Lunch
      m('Lentil + quinoa bowl with tahini dressing', 'Bowl med linser och quinoa, tahinidressing', 26, 560, 'lunch'),
      m('Chickpea wrap with hummus + vegetables', 'Kikärtswrap med hummus + grönsaker', 24, 540, 'lunch'),
      m('Tofu poke bowl with edamame + rice', 'Pokebowl med tofu, edamame + ris', 30, 580, 'lunch'),
      m('Lentil soup + wholegrain bread + peanut butter', 'Linssoppa + fullkornsbröd + jordnötssmör', 25, 520, 'lunch'),
      m('Black-bean burrito with guacamole', 'Burrito med svarta bönor och guacamole', 24, 590, 'lunch'),
      // Dinner
      m('Tempeh stir-fry with rice + edamame', 'Tempehwok med ris + edamame', 34, 600, 'dinner'),
      m('Seitan / soy-mince pasta with lentil ragu', 'Pasta med seitan / sojafärs och linsragu', 36, 620, 'dinner'),
      m('Chana masala (chickpea curry) with rice', 'Chana masala (kikärtscurry) med ris', 26, 580, 'dinner'),
      m('Tofu + peanut satay with noodles', 'Tofu i jordnötssatay med nudlar', 32, 640, 'dinner'),
      m('Vegan chili sin carne with quinoa', 'Vegansk chili sin carne med quinoa', 28, 560, 'dinner'),
      // Snacks
      m('Soy yogurt + granola', 'Sojayoghurt + granola', 15, 230, 'snack'),
      m('Vegan protein shake + banana', 'Vegansk proteinshake + banan', 27, 260, 'snack'),
      m('Edamame (200 g, salted)', 'Edamame (200 g, saltade)', 22, 240, 'snack'),
      m('Roasted chickpeas + dried fruit', 'Rostade kikärtor + torkad frukt', 12, 250, 'snack'),
      m('Hummus + vegetable sticks + crackers', 'Hummus + grönsaksstavar + kex', 10, 240, 'snack'),
    ],
  }
}

export function mealIdeasFor(pref: DietPref): MealIdea[] {
  return meals()[pref]
}

export function mealsBySlot(pref: DietPref): Record<MealSlot, MealIdea[]> {
  const grouped: Record<MealSlot, MealIdea[]> = { breakfast: [], lunch: [], dinner: [], snack: [] }
  for (const meal of meals()[pref]) grouped[meal.slot].push(meal)
  return grouped
}

export function sustainableEatingHabits(): string[] {
  return [
    tr(
      'No forbidden foods — foods you love fit inside the calorie budget. Restriction is what triggers binges.',
      'Inga förbjudna livsmedel — maten du älskar får plats i kaloribudgeten. Det är förbud som utlöser hetsätning.',
    ),
    tr(
      'Protein + produce first on every plate; whatever you enjoy fills the rest.',
      'Protein + grönsaker först på varje tallrik; det du tycker om fyller resten.',
    ),
    tr(
      'Plan tomorrow’s meals in 2 minutes tonight — decisions made in advance beat decisions made hungry.',
      'Planera morgondagens måltider på 2 minuter i kväll — beslut fattade i förväg slår beslut fattade hungrig.',
    ),
    tr(
      'Eat slowly for the first plate, then wait 10 minutes before deciding on seconds — satiety lags intake.',
      'Ät första tallriken långsamt och vänta 10 minuter innan du bestämmer dig för en andra — mättnaden släpar efter intaget.',
    ),
    tr(
      'Keep 2–3 "default meals" you can make on autopilot for low-energy days.',
      'Ha 2–3 "standardmåltider" du kan laga på autopilot när energin är låg.',
    ),
    tr(
      'Weekends count: 5 perfect days can be undone by 2 untracked ones. Aim for consistent, not perfect.',
      'Helger räknas: 5 perfekta dagar kan raderas av 2 ospårade. Sikta på konsekvent, inte perfekt.',
    ),
  ]
}
