import type { FrictionFinding, Habit, HabitPlan, Profile } from './types'
import { tr } from '../i18n'

/**
 * Behavioral engine: diagnoses why consistency breaks from lifestyle answers,
 * then prescribes a small set of anchored habits (implementation intentions)
 * instead of willpower-based rules.
 */

export function diagnoseFriction(profile: Profile): FrictionFinding[] {
  const findings: FrictionFinding[] = []
  const { lifestyle } = profile

  if (lifestyle.allOrNothing) {
    findings.push({
      title: tr('All-or-nothing cycling', 'Allt-eller-inget-mönster'),
      detail: tr(
        'You go all-in, miss one day, and the whole plan collapses. The fix is lowering the bar, not raising motivation: a 10-minute session counts as a win, and the only hard rule is "never miss twice".',
        'Du kör allt-eller-inget, missar en dag och hela planen rasar. Lösningen är att sänka ribban, inte höja motivationen: ett 10-minuterspass räknas som en vinst, och den enda hårda regeln är "missa aldrig två gånger".',
      ),
    })
  }
  if (profile.sleepHours < 7) {
    findings.push({
      title: tr(`Short sleep (${profile.sleepHours} h)`, `Kort sömn (${profile.sleepHours} h)`),
      detail: tr(
        'Sleep deprivation measurably lowers self-control, raises hunger hormones and makes every habit harder. Sleep is upstream of everything else in this plan — it gets its own habit.',
        'Sömnbrist sänker mätbart självkontrollen, höjer hungerhormonerna och gör varje vana svårare. Sömn ligger uppströms allt annat i den här planen — den får en egen vana.',
      ),
    })
  }
  if (profile.stressLevel === 'high') {
    findings.push({
      title: tr('High stress', 'Hög stress'),
      detail: tr(
        'Stress depletes the same self-regulation you use to train and eat well. Zone 2 cardio and walks are prescribed here partly as stress treatment — they pay you back twice.',
        'Stress tömmer samma självreglering som du använder för att träna och äta bra. Zon 2-kondition och promenader ordineras här delvis som stressbehandling — de betalar tillbaka dubbelt.',
      ),
    })
  }
  if (lifestyle.timeCrunched) {
    findings.push({
      title: tr('Time scarcity', 'Tidsbrist'),
      detail: tr(
        'Plans fail when they need "finding time". Your sessions are scheduled like meetings — fixed days, fixed slot, and a 15-minute fallback version for chaotic days.',
        'Planer faller när de kräver att man "hittar tid". Dina pass schemaläggs som möten — fasta dagar, fast tid och en 15-minutersversion i reserv för kaotiska dagar.',
      ),
    })
  }
  if (lifestyle.eveningSnacker) {
    findings.push({
      title: tr('Evening snacking', 'Kvällssnacks'),
      detail: tr(
        'Usually a signal of under-eating protein earlier plus habit-loop cueing (couch → screen → snack). We front-load protein and change the cue, rather than relying on resisting it.',
        'Oftast ett tecken på för lite protein tidigare på dagen plus en vaneloop (soffa → skärm → snacks). Vi lägger proteinet tidigt och byter signalen, i stället för att förlita oss på att stå emot.',
      ),
    })
  }
  if (lifestyle.deskJob) {
    findings.push({
      title: tr('Desk-bound days', 'Stillasittande dagar'),
      detail: tr(
        'Sitting all day silently erases 300–500 kcal of daily movement vs. an active job. A step floor with movement snacks rebuilds it without extra gym time.',
        'Att sitta hela dagen raderar i tysthet 300–500 kcal daglig rörelse jämfört med ett aktivt jobb. Ett golv för steg per dag med rörelsepauser bygger upp det igen utan extra gymtid.',
      ),
    })
  }
  if (lifestyle.travelsOften) {
    findings.push({
      title: tr('Frequent travel', 'Reser ofta'),
      detail: tr(
        'Travel breaks environment-dependent routines. You get a location-independent minimum: a 20-minute bodyweight session and a protein-first rule that work in any hotel.',
        'Resor bryter rutiner som hänger på miljön. Du får ett platsoberoende minimum: ett 20-minuters kroppsviktspass och en protein först-regel som fungerar på vilket hotell som helst.',
      ),
    })
  }
  if (lifestyle.trainsAlone) {
    findings.push({
      title: tr('No accountability structure', 'Ingen som håller dig ansvarig'),
      detail: tr(
        'Training alone with no one noticing makes skipping free. The streak tracker in this app is your accountability — checking the box daily is itself the keystone habit.',
        'När du tränar ensam och ingen märker något är det gratis att skippa. Streak-räknaren i appen är din ansvarsstruktur — att bocka av rutan varje dag är i sig nyckelvanan.',
      ),
    })
  }
  if (findings.length === 0) {
    findings.push({
      title: tr('No major friction flags', 'Inga stora friktionsflaggor'),
      detail: tr(
        'Your lifestyle answers show no obvious consistency killers — your system focuses on making progress automatic and visible.',
        'Dina livsstilssvar visar inga uppenbara konsekvensdödare — ditt system fokuserar på att göra framstegen automatiska och synliga.',
      ),
    })
  }
  return findings
}

export function buildHabitPlan(profile: Profile): HabitPlan {
  const habits: Habit[] = []
  const { lifestyle } = profile

  habits.push({
    id: 'train_scheduled',
    title: tr(
      `Train on your ${profile.daysPerWeek} fixed days (10-min minimum counts)`,
      `Träna på dina ${profile.daysPerWeek} fasta dagar (10 min räcker för att räknas)`,
    ),
    anchor: tr(
      'When my training-day alarm goes off, I put on my workout clothes immediately.',
      'När mitt träningsdagslarm ringer tar jag på mig träningskläderna direkt.',
    ),
    why: tr(
      'Implementation intentions ("when X, I do Y") roughly double follow-through vs. vague plans. The 10-minute minimum keeps the streak alive on bad days — showing up is the habit, volume is a bonus.',
      'Om–då-planer ("om X, då gör jag Y") ungefär fördubblar genomförandet jämfört med vaga planer. 10-minutersminimumet håller sviten vid liv på dåliga dagar — att dyka upp är vanan, volymen är bonus.',
    ),
  })
  habits.push({
    id: 'protein_first',
    title: tr('Protein anchor at breakfast and lunch', 'Proteinankare till frukost och lunch'),
    anchor: tr(
      'When I plan or plate a meal, I place the protein source first.',
      'När jag planerar eller lägger upp en måltid lägger jag proteinkällan först.',
    ),
    why: tr(
      'One decision that quietly hits your protein target, raises satiety and crowds out the foods that cause overshooting.',
      'Ett enda beslut som tyst når ditt proteinmål, ökar mättnaden och tränger undan maten som får dig att äta för mycket.',
    ),
  })
  habits.push({
    id: 'daily_weighin',
    title: tr('Morning weigh-in', 'Invägning på morgonen'),
    anchor: tr(
      'After I use the bathroom in the morning, I step on the scale.',
      'När jag har varit på toaletten på morgonen ställer jag mig på vågen.',
    ),
    why: tr(
      'Ten seconds. Regular self-weighing is one of the most consistent predictors of long-term weight-management success — and it feeds your adjustment engine.',
      'Tio sekunder. Regelbunden invägning är en av de mest konsekventa förutsägarna av långsiktig viktkontroll — och den matar din justeringsmotor.',
    ),
  })
  if (lifestyle.deskJob || profile.activityLevel === 'sedentary') {
    habits.push({
      id: 'movement_snack',
      title: tr('Movement snack every work block', 'Rörelsepaus efter varje arbetsblock'),
      anchor: tr(
        'When I finish a meeting or a work block, I stand up and take a 3-minute walk.',
        'När jag avslutar ett möte eller ett arbetsblock ställer jag mig upp och tar en 3-minuters promenad.',
      ),
      why: tr(
        'Movement snacks restore the NEAT a desk job deletes, improve glucose control after meals, and break the sitting streak that no gym hour can offset.',
        'Rörelsepauser återställer vardagsrörelsen (NEAT) som ett kontorsjobb raderar, förbättrar blodsockret efter måltider och bryter sittandet som ingen gymtimme kan kompensera.',
      ),
    })
  } else {
    habits.push({
      id: 'step_floor',
      title: tr('Hit your daily step floor', 'Nå ditt dagliga steggolv'),
      anchor: tr(
        'After lunch, I take a 10–15 minute walk before sitting back down.',
        'Efter lunch tar jag en 10–15 minuters promenad innan jag sätter mig igen.',
      ),
      why: tr(
        'A post-meal walk is the easiest place to bank steps, and daily movement is the biggest controllable side of energy balance.',
        'En promenad efter maten är det enklaste sättet att samla steg, och daglig rörelse är den största påverkbara sidan av energibalansen.',
      ),
    })
  }
  if (profile.sleepHours < 7) {
    habits.push({
      id: 'sleep_alarm',
      title: tr('Wind-down alarm', 'Nedvarvningslarm'),
      anchor: tr(
        'When my 22:00 wind-down alarm rings, I put my phone on the charger outside arm’s reach.',
        'När mitt nedvarvningslarm ringer kl. 22:00 lägger jag telefonen på laddning utom räckhåll.',
      ),
      why: tr(
        'You can’t decide to sleep more at midnight — the decision happens an hour earlier. This single cue is the highest-leverage recovery habit for a short sleeper.',
        'Du kan inte bestämma dig för att sova mer vid midnatt — beslutet fattas en timme tidigare. Den här enda signalen är återhämtningsvanan med störst hävstång för dig som sover kort.',
      ),
    })
  }
  if (lifestyle.eveningSnacker) {
    habits.push({
      id: 'evening_swap',
      title: tr('Evening cue swap', 'Byt kvällssignalen'),
      anchor: tr(
        'When I sit down for evening TV, I first make tea / grab a high-protein snack I planned.',
        'När jag sätter mig framför tv:n på kvällen gör jag först te / tar ett proteinrikt mellanmål jag planerat.',
      ),
      why: tr(
        'Habits are cue-driven loops. Replacing the automatic snack with a planned one keeps the ritual and deletes the damage — no willpower required.',
        'Vanor är signalstyrda loopar. Att ersätta det automatiska snackset med ett planerat behåller ritualen och tar bort skadan — ingen viljestyrka krävs.',
      ),
    })
  }

  const principles = [
    tr(
      'Never miss twice. Missing once is life; missing twice is the start of a new (bad) habit.',
      'Missa aldrig två gånger. Att missa en gång är livet; att missa två gånger är starten på en ny (dålig) vana.',
    ),
    tr(
      'Make it smaller before you make it harder — a habit must survive your worst week, not your best.',
      'Gör den mindre innan du gör den svårare — en vana måste överleva din sämsta vecka, inte din bästa.',
    ),
    tr(
      'Expect ~2 months before a habit feels automatic (research average is 66 days). The streaks page is your progress bar.',
      'Räkna med ~2 månader innan en vana känns automatisk (forskningens snitt är 66 dagar). Vanesidan är din framstegsmätare.',
    ),
    tr(
      'Design the environment, not the willpower: clothes laid out, protein in the fridge, phone out of the bedroom.',
      'Designa miljön, inte viljestyrkan: kläderna framlagda, protein i kylen, telefonen utanför sovrummet.',
    ),
    tr(
      'Identity over outcomes: every checked box is a vote for "I am someone who trains".',
      'Identitet före resultat: varje avbockad ruta är en röst för "jag är någon som tränar".',
    ),
  ]

  return { findings: diagnoseFriction(profile), habits: habits.slice(0, 6), principles }
}

/** Current streak (consecutive days up to today) for a habit's checked dates. */
export function currentStreak(checkedDates: string[], todayIso: string): number {
  const set = new Set(checkedDates)
  let streak = 0
  const d = new Date(todayIso + 'T00:00:00Z')
  // Today not checked yet doesn't break the streak — start from yesterday in that case.
  if (!set.has(todayIso)) d.setUTCDate(d.getUTCDate() - 1)
  while (set.has(d.toISOString().slice(0, 10))) {
    streak++
    d.setUTCDate(d.getUTCDate() - 1)
  }
  return streak
}
