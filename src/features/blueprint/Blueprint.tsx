import { useAppStore, todayIso, weeksSince } from '../../state/store'
import { defaultProgram } from '../../lib/threeDayFullBody'
import { recommendProgram } from '../../lib/programMatrix'
import { buildCautions } from '../../lib/programs'
import { buildNutritionPlan } from '../../lib/calculations'
import { buildHabitPlan } from '../../lib/habits'
import { buildOverview } from '../../lib/overview'
import { buildRoadmap } from '../../lib/roadmap'
import { buildWeeklySchedule } from '../../lib/weeklySchedule'
import EvidencePanel from '../shared/EvidencePanel'
import { tr, L, dateLocale, useLocale } from '../../i18n'
import type { Tab } from '../../App'
import type { FitnessLevel, Goal } from '../../lib/types'

function goalLabel(goal: Goal): string {
  switch (goal) {
    case 'fat_loss':
      return tr('lose fat while keeping muscle', 'gå ner i fett och behålla muskler')
    case 'muscle_gain':
      return tr('build muscle', 'bygga muskler')
    case 'recomp':
      return tr(
        'recomposition — trade fat for muscle at the same weight',
        'recomposition — byt fett mot muskler vid samma vikt',
      )
    case 'general_fitness':
      return tr('all-round fitness and health', 'allmän fitness och hälsa')
    default:
      return goal
  }
}

function levelLabel(level: FitnessLevel): string {
  switch (level) {
    case 'beginner':
      return tr('beginner', 'nybörjare')
    case 'intermediate':
      return tr('intermediate', 'medel')
    case 'advanced':
      return tr('advanced', 'avancerad')
    default:
      return level
  }
}

export default function Blueprint({ onNavigate }: { onNavigate: (t: Tab) => void }) {
  useLocale()
  const profile = useAppStore((s) => s.profile)
  const planStartDate = useAppStore((s) => s.planStartDate)
  const customProgram = useAppStore((s) => s.customProgram)
  if (!profile) return null

  const program = defaultProgram(profile, customProgram)
  const rec = recommendProgram(profile)
  const nutrition = buildNutritionPlan(profile)
  const habits = buildHabitPlan(profile)
  const overview = buildOverview(profile, program)
  const schedule = buildWeeklySchedule(profile, program)
  const roadmap = buildRoadmap(profile)
  const currentWeek = weeksSince(planStartDate, todayIso()) + 1
  const cautions = buildCautions(profile)
  const restMin = Math.max(1, 7 - profile.daysPerWeek - 1)
  const restMax = 7 - profile.daysPerWeek

  return (
    <main>
      <div className="card">
        <h1>{tr('Blueprint & Roadmap', 'Plan & färdplan')}</h1>
        <p className="muted">
          {profile.age} {tr('y', 'år')} · {profile.heightCm} cm · {profile.weightKg} kg ·{' '}
          {levelLabel(profile.fitnessLevel)} · {tr('goal:', 'mål:')} <strong>{goalLabel(profile.goal)}</strong>
        </p>
        {cautions.map((c) => (
          <div className="banner warn" key={c}>
            {c}
          </div>
        ))}
      </div>

      <div className="card">
        <h2>{tr('⭐ What matters — your marching orders', '⭐ Det viktigaste — dina marschorder')}</h2>
        <p className="muted small">
          {tr(
            `Do these ${overview.length} things consistently and everything else is optimization detail.`,
            `Gör de här ${overview.length} sakerna konsekvent — allt annat är optimeringsdetaljer.`,
          )}
        </p>
        {overview.map((d) => (
          <div className="directive" key={d.headline}>
            <span className="directive-icon" aria-hidden>
              {d.icon}
            </span>
            <div>
              <strong>{d.headline}</strong>
              <p className="muted small">{d.detail}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2>{tr('🗺️ Roadmap — the realistic path', '🗺️ Färdplan — den realistiska vägen')}</h2>
        <p>{roadmap.summary}</p>
        <div className="stat-row">
          <div className="stat">
            <div className="value">{currentWeek}</div>
            <div className="label">{tr('current week', 'aktuell vecka')}</div>
          </div>
          <div className="stat">
            <div className="value">{roadmap.etaWeeks ?? '—'}</div>
            <div className="label">{tr('weeks to goal', 'veckor till mål')}</div>
          </div>
          <div className="stat">
            <div className="value">
              {roadmap.weeklyRateKg > 0 ? '+' : ''}
              {roadmap.weeklyRateKg}
            </div>
            <div className="label">{tr('kg / week pace', 'kg / vecka i takt')}</div>
          </div>
        </div>
        {roadmap.phases.map((p) => (
          <div className="phase" key={p.name}>
            <div className="weeks">{p.weeks}</div>
            <h3>{p.name}</h3>
            <p>{p.focus}</p>
            <ul>
              <li>
                <strong>{tr('Training:', 'Träning:')}</strong> {p.trainingEmphasis}
              </li>
              <li>
                <strong>{tr('Nutrition:', 'Kost:')}</strong> {p.nutritionEmphasis}
              </li>
              <li>
                <strong>{tr('Checkpoints:', 'Kontrollpunkter:')}</strong> {p.checkpoints.join(' · ')}
              </li>
            </ul>
          </div>
        ))}
        <div className="banner info">
          {tr('This is the ', 'Det här är den ')}
          <strong>{tr('fastest realistic path', 'snabbaste realistiska vägen')}</strong>
          {tr(
            ' — the rates come from studies on preserving muscle, not marketing. Faster trades muscle, adherence and rebound risk for a calendar date.',
            ' — takten kommer från studier om att bevara muskler, inte från marknadsföring. Snabbare byter muskler, följsamhet och risk för rekyl mot ett datum i kalendern.',
          )}
        </div>
        <details className="evidence">
          <summary>{tr('📋 Weekly tracking protocol', '📋 Veckans uppföljningsprotokoll')}</summary>
          <ul>
            {roadmap.trackingProtocol.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <p className="muted small">
            {tr(
              'Log weigh-ins and sessions in the Progress and Action tabs — the engine turns them into adjustment calls automatically.',
              'Logga invägningar och pass under flikarna Framsteg och Träna — motorn gör om dem till justeringar automatiskt.',
            )}
          </p>
        </details>
      </div>

      <div className="card">
        <h2>{tr('📅 Your training week', '📅 Din träningsvecka')}</h2>
        <p className="muted small">
          {L(program.splitName)} · {schedule.summaryLine}.{' '}
          {tr(
            `This is exactly what fits your ${profile.daysPerWeek} training day${profile.daysPerWeek > 1 ? 's' : ''} — no more, no less.`,
            profile.daysPerWeek > 1
              ? `Det här är exakt vad som ryms på dina ${profile.daysPerWeek} träningsdagar — varken mer eller mindre.`
              : 'Det här är exakt vad som ryms på din enda träningsdag — varken mer eller mindre.',
          )}
        </p>
        <p className="muted small why-schema">
          <strong>{tr('Why this schema:', 'Varför det här upplägget:')}</strong> {rec.rationale}{' '}
          <a href={rec.sourceUrl} target="_blank" rel="noopener noreferrer">
            {rec.sourceName} ↗
          </a>
        </p>
        <ol className="week-list">
          {schedule.days.map((day) => (
            <li className="week-day" key={day.label}>
              <span className="week-icon" aria-hidden>
                {day.icon}
              </span>
              <div>
                <strong>
                  {day.label}: {L(day.title)}
                </strong>
                <div className="muted small">{day.detail}</div>
              </div>
            </li>
          ))}
        </ol>
        <div className="banner info small">
          <strong>{tr('Conditioning:', 'Kondition:')}</strong> {schedule.conditioning.note}
        </div>
        <p className="muted small">
          {tr(
            `👟 ${schedule.dailySteps.toLocaleString(dateLocale())} steps every day (all days, not counted as a session).`,
            `👟 ${schedule.dailySteps.toLocaleString(dateLocale())} steg varje dag (alla dagar, räknas inte som ett pass).`,
          )}
        </p>
        {schedule.rotationNote && <p className="muted small">🔁 {schedule.rotationNote}</p>}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
          <button className="primary" onClick={() => onNavigate('program')}>
            {tr('✏️ Adjust my plan', '✏️ Justera min plan')}
          </button>
          <button className="ghost" onClick={() => onNavigate('train')}>
            {tr('Let’s train →', 'Nu kör vi →')}
          </button>
        </div>
      </div>

      <div className="card">
        <h2>{tr('🍽️ Nutrition targets', '🍽️ Kostmål')}</h2>
        <div className="stat-row">
          <div className="stat">
            <div className="value">{nutrition.targets.calories}</div>
            <div className="label">{tr('kcal / day', 'kcal / dag')}</div>
          </div>
          <div className="stat">
            <div className="value">{nutrition.targets.proteinG} g</div>
            <div className="label">{tr('protein', 'protein')}</div>
          </div>
          <div className="stat">
            <div className="value">{nutrition.targets.fatG} g</div>
            <div className="label">{tr('fat', 'fett')}</div>
          </div>
          <div className="stat">
            <div className="value">{nutrition.targets.carbsG} g</div>
            <div className="label">{tr('carbs', 'kolhydrater')}</div>
          </div>
        </div>
        <p className="muted small">
          {tr(
            `Maintenance ≈ ${nutrition.maintenanceCalories} kcal (Mifflin–St Jeor × activity). Meal ideas and supplement guidance live in the Nutrition tab.`,
            `Underhållskalorier ≈ ${nutrition.maintenanceCalories} kcal (Mifflin–St Jeor × aktivitet). Måltidsidéer och tillskott hittar du under fliken Kost.`,
          )}
        </p>
      </div>

      <div className="card">
        <h2>{tr('😴 Recovery', '😴 Återhämtning')}</h2>
        <ul>
          <li>
            <strong>{tr('Sleep:', 'Sömn:')}</strong> {tr('7–9 h target.', 'mål 7–9 h.')}{' '}
            {profile.sleepHours < 7
              ? tr(
                  `You reported ${profile.sleepHours} h — this is the single highest-leverage fix in your entire plan.`,
                  `Du angav ${profile.sleepHours} h — det här är den enskilt viktigaste förbättringen i hela din plan.`,
                )
              : tr(
                  `You reported ${profile.sleepHours} h — keep protecting it.`,
                  `Du angav ${profile.sleepHours} h — fortsätt skydda den.`,
                )}
          </li>
          <li>
            <strong>{tr('Stress:', 'Stress:')}</strong>{' '}
            {profile.stressLevel === 'high'
              ? tr(
                  'High — your cardio doubles as stress treatment. On brutal days, do the 10-minute minimum instead of skipping.',
                  'Hög — din kondition fungerar också som stressbehandling. På riktigt tuffa dagar: gör 10-minutersminimum i stället för att hoppa över.',
                )
              : tr(
                  'Manageable — watch it during hard training blocks.',
                  'Hanterbar — håll koll på den under hårda träningsblock.',
                )}
          </li>
          <li>
            <strong>{tr('Rest days:', 'Vilodagar:')}</strong>{' '}
            {tr(`at least ${restMin}–${restMax} full days/week.`, `minst ${restMin}–${restMax} hela dagar/vecka.`)}
          </li>
          <li>
            <strong>{tr('Mobility:', 'Rörlighet:')}</strong>{' '}
            {tr(
              '5 minutes after every session (built into your programs), targeting hips, ankles and thoracic spine.',
              '5 minuter efter varje pass (inbyggt i dina program), med fokus på höfter, fotleder och bröstrygg.',
            )}
          </li>
        </ul>
      </div>

      <div className="card">
        <h2>{tr('✅ Habit system (summary)', '✅ Vanesystem (sammanfattning)')}</h2>
        <ul>
          {habits.habits.map((h) => (
            <li key={h.id}>{h.title}</li>
          ))}
        </ul>
        <p className="muted small">
          {tr('Full behavioral plan in the Habits tab.', 'Hela beteendeplanen finns under fliken Vanor.')}
        </p>
      </div>

      <EvidencePanel />
    </main>
  )
}
