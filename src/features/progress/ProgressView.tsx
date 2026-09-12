import { useEffect, useState } from 'react'
import { useAppStore, todayIso, weeksSince } from '../../state/store'
import { analyzeProgress, fatLossPillars, rollingAverage } from '../../lib/fatloss'
import { macroTargets, targetWeeklyLossKg, tdee } from '../../lib/calculations'
import { buildHabitPlan, currentStreak } from '../../lib/habits'
import { topExerciseTrends } from '../../lib/trends'
import { trainingDays } from '../../lib/trainingDays'
import { resolvePrimaryCoach } from '../../lib/coach'
import { buildGrounding, groundingKey } from '../../lib/coach/grounding'
import { requestAssessment } from '../../lib/coach/assessment'
import { defaultProgram } from '../../lib/threeDayFullBody'
import { buildWeeklySchedule } from '../../lib/weeklySchedule'
import { isoWeek, startOfWeekIso, addDaysIso } from '../../lib/trainWeek'
import EvidencePanel from '../shared/EvidencePanel'
import { tr, L, fmtDate, dateLocale, useLocale } from '../../i18n'
import type { ActivityCategory, CompletedWorkout, WeighIn } from '../../lib/types'

function categoryMeta(category: ActivityCategory): { icon: string; label: string } {
  switch (category) {
    case 'cardio':
      return { icon: '🫀', label: tr('Cardio', 'Kondition') }
    case 'endurance':
      return { icon: '🏃', label: tr('Endurance', 'Uthållighet') }
    case 'stretch':
      return { icon: '🧘', label: tr('Stretch', 'Stretch') }
    case 'strength':
    default:
      return { icon: '🏋️', label: tr('Strength', 'Styrka') }
  }
}

function statusLabel(status: string): { label: string; cls: string } {
  switch (status) {
    case 'on_track':
      return { label: tr('On track', 'På rätt spår'), cls: 'ok' }
    case 'slow':
      return { label: tr('Slower than target', 'Långsammare än målet'), cls: 'warn' }
    case 'stalled':
      return { label: tr('Stalled', 'Står still'), cls: 'danger' }
    case 'too_fast':
      return { label: tr('Too fast', 'För snabbt'), cls: 'warn' }
    case 'insufficient_data':
    default:
      return { label: tr('Collecting data', 'Samlar data'), cls: 'info' }
  }
}

export default function ProgressView() {
  useLocale()
  const {
    profile,
    weighIns,
    planStartDate,
    completedWorkouts,
    workoutLog,
    habitChecks,
    planHistory,
    customProgram,
    coachSettings,
    coachApiKeys,
    coachAssessment,
    addWeighIn,
    setProfile,
    setCoachAssessment,
  } = useAppStore()
  const [weight, setWeight] = useState('')
  const [assessing, setAssessing] = useState(false)
  const [assessError, setAssessError] = useState<string | null>(null)

  // LLM coach's read on the log, refreshed whenever the underlying data changes.
  const llm = resolvePrimaryCoach(coachSettings, coachApiKeys)
  const today0 = todayIso()
  const dataKey = groundingKey({ completedWorkouts, weighIns, planHistory, today: today0 })
  const stale = coachAssessment === null || coachAssessment.key !== dataKey || coachAssessment.provider !== llm?.id
  async function refreshAssessment() {
    if (!llm || !profile || assessing) return
    setAssessing(true)
    setAssessError(null)
    try {
      const program = defaultProgram(profile, customProgram)
      const text = await requestAssessment(llm, {
        profile,
        program,
        scheduleSummary: buildWeeklySchedule(profile, program).summaryLine,
        grounding: buildGrounding({ profile, program, completedWorkouts, weighIns, habitChecks, planStartDate, planHistory, today: today0 }),
      })
      setCoachAssessment({ text, at: new Date().toISOString(), key: dataKey, provider: llm.id })
    } catch (e) {
      setAssessError(e instanceof Error ? e.message : 'failed')
    } finally {
      setAssessing(false)
    }
  }
  useEffect(() => {
    if (llm && stale && !assessing && !assessError) void refreshAssessment()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [llm?.id, dataKey])
  const [statWeight, setStatWeight] = useState(profile ? String(profile.weightKg) : '')
  const [goalWeight, setGoalWeight] = useState(profile?.goalWeightKg ? String(profile.goalWeightKg) : '')
  const [statsSaved, setStatsSaved] = useState(false)
  if (!profile) return null

  const today = todayIso()
  const todayWeighIn = weighIns.find((w) => w.date === today)
  const weeks = weeksSince(planStartDate, today)
  const analysis = analyzeProgress(weighIns, today, profile.weightKg, weeks)
  const status = statusLabel(analysis.status)
  const isCutting = profile.goal === 'fat_loss'

  const thisWeek = completedWorkouts.filter((w) => weeksSince(w.date, today) === 0)
  const days = trainingDays(profile)
  const weekVolume = thisWeek.reduce((a, w) => a + w.totalVolumeKg, 0)
  const habitPlan = buildHabitPlan(profile)
  const streaks = habitPlan.habits
    .map((h) => ({ title: h.title, streak: currentStreak(habitChecks[h.id] ?? [], today) }))
    .filter((s) => s.streak > 0)
    .sort((a, b) => b.streak - a.streak)

  const strengthTrends = topExerciseTrends(completedWorkouts)

  return (
    <main>
      <div className="card">
        <h1>{tr('Progress', 'Framsteg')}</h1>
        <p className="muted small">
          {tr(
            `Week ${weeks + 1} of your plan · every number below updates from your weigh-ins, workouts and habit checks.`,
            `Vecka ${weeks + 1} av din plan · varje siffra nedan uppdateras från dina invägningar, pass och avbockade vanor.`,
          )}
        </p>
        <div className="stat-row">
          <div className="stat">
            <div className="value">{analysis.currentAvgKg ?? '—'}</div>
            <div className="label">{tr('7-day avg kg', '7-dagars snitt kg')}</div>
          </div>
          <div className="stat">
            <div className="value">{analysis.weeklyChangeKg ?? '—'}</div>
            <div className="label">{tr('kg this week', 'kg denna vecka')}</div>
          </div>
          <div className="stat">
            <div className="value">
              {thisWeek.filter((w) => w.category === 'strength').length}/{days.strength}
            </div>
            <div className="label">{tr('strength this wk', 'styrka denna vecka')}</div>
          </div>
          {(days.cardio > 0 || thisWeek.some((w) => w.category !== 'strength')) && (
            <div className="stat">
              <div className="value">
                {thisWeek.filter((w) => w.category !== 'strength').length}/{days.cardio}
              </div>
              <div className="label">{tr('cardio this wk', 'kondition denna vecka')}</div>
            </div>
          )}
          <div className="stat">
            <div className="value">{weekVolume.toLocaleString(dateLocale())}</div>
            <div className="label">{tr('kg volume this wk', 'kg volym denna vecka')}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>{tr('⚖️ Morning weigh-in', '⚖️ Morgoninvägning')}</h2>
        {todayWeighIn ? (
          <p>
            {tr('Logged ', 'Du loggade ')}
            <strong>{todayWeighIn.weightKg} kg</strong>
            {tr(
              ' today. Only the weekly average matters — single days are water, not fat.',
              ' i dag. Bara veckosnittet räknas — enskilda dagar är vatten, inte fett.',
            )}
          </p>
        ) : (
          <div className="weigh-form">
            <input
              type="number"
              step="0.1"
              placeholder={tr('Weight (kg)', 'Vikt (kg)')}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              aria-label={tr("Today's weight in kg", 'Dagens vikt i kg')}
            />
            <button
              className="primary"
              disabled={!weight || Number(weight) < 35 || Number(weight) > 300}
              onClick={() => {
                addWeighIn({ date: today, weightKg: Number(weight) })
                setWeight('')
              }}
            >
              {tr('Log', 'Logga')}
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <h2>{tr('🎯 Your numbers', '🎯 Dina siffror')}</h2>
        <p className="muted small">
          {tr(
            'Plan weight and goal. Update as you go and every target (calories, protein, pace) recalculates.',
            'Planvikt och målvikt. Uppdatera löpande så räknas alla mål (kalorier, protein, takt) om.',
          )}
        </p>
        <div className="field">
          <label>{tr('Current weight (kg)', 'Nuvarande vikt (kg)')}</label>
          <input type="number" step="0.1" value={statWeight} onChange={(e) => setStatWeight(e.target.value)} />
        </div>
        <div className="field">
          <label>{tr('Goal weight (kg)', 'Målvikt (kg)')}</label>
          <input type="number" step="0.1" value={goalWeight} onChange={(e) => setGoalWeight(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className="primary"
            disabled={!statWeight || Number(statWeight) < 35 || Number(statWeight) > 300}
            onClick={() => {
              useAppStore.getState().commitPlanRevision('user', 'Updated stats')
              setProfile({
                ...profile,
                weightKg: Number(statWeight),
                goalWeightKg: goalWeight === '' ? undefined : Number(goalWeight),
              })
              setStatsSaved(true)
            }}
          >
            {tr('Save & recalculate', 'Spara & räkna om')}
          </button>
          {statsSaved && <span className="muted small">{tr('Saved.', 'Sparat.')}</span>}
        </div>
      </div>

      <TrainingTimeline completedWorkouts={completedWorkouts} workoutLog={workoutLog} />

      <div className="card">
        <h2>{tr('⚖️ Weight trend', '⚖️ Vikttrend')}</h2>
        {weighIns.length >= 2 ? (
          <WeightChart weighIns={weighIns} goalWeightKg={profile.goalWeightKg} today={today} />
        ) : (
          <p className="muted">
            {tr(
              'Log at least two weigh-ins above and your trend chart appears here.',
              'Logga minst två invägningar ovan så visas din trendkurva här.',
            )}
          </p>
        )}
      </div>

      {llm && (
        <div className="card">
          <h2>
            {tr('🧭 Coach’s call', '🧭 Coachens bedömning')}{' '}
            {isCutting && <span className={`pill ${status.cls}`}>{status.label}</span>}
          </h2>
          {coachAssessment && coachAssessment.provider === llm.id ? (
            <div className="assessment">
              {coachAssessment.text.split(/\n+/).map((line, i) => (
                <p key={i}>{line}</p>
              ))}
              <p className="muted small">
                {tr('From', 'Från')} {llm.label} ·{' '}
                {new Date(coachAssessment.at).toLocaleString(dateLocale(), { dateStyle: 'short', timeStyle: 'short' })}
                {stale && !assessing && ` · ${tr('new data since', 'ny data sedan dess')}`}
              </p>
            </div>
          ) : (
            !assessing && !assessError && <p className="muted small">{tr('Asking your coach…', 'Frågar din coach…')}</p>
          )}
          {assessing && <p className="muted small">{tr('Reading your log…', 'Läser din logg…')}</p>}
          {assessError && (
            <div className="banner warn small">
              {tr('Couldn’t reach', 'Kunde inte nå')} {llm.label} ({assessError}). {tr('Showing the built-in analysis below.', 'Visar den inbyggda analysen nedan.')}
            </div>
          )}
          <button className="ghost small-btn" disabled={assessing} onClick={() => void refreshAssessment()}>
            {tr('↻ Ask again', '↻ Fråga igen')}
          </button>
          {assessError && isCutting && (
            <ul>
              {analysis.recommendation.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!llm && isCutting && (
        <div className="card">
          <h2>
            {tr('🧭 Coach’s call', '🧭 Coachens bedömning')} <span className={`pill ${status.cls}`}>{status.label}</span>
          </h2>
          <p className="muted small">
            {tr(
              `Target: ${analysis.targetWeeklyChangeKg} kg/week (~${targetWeeklyLossKg(profile.weightKg)} kg — the muscle-sparing zone). Cut calories ${macroTargets(profile).calories} · maintenance ≈ ${tdee(profile)}.`,
              `Mål: ${analysis.targetWeeklyChangeKg} kg/vecka (~${targetWeeklyLossKg(profile.weightKg)} kg — zonen som skonar musklerna). Kaloriunderskott ${macroTargets(profile).calories} · underhållskalorier ≈ ${tdee(profile)}.`,
            )}
          </p>
          <ul>
            {analysis.recommendation.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      {strengthTrends.length > 0 && (
        <div className="card">
          <h2>{tr('🏋️ Strength trend', '🏋️ Styrketrend')}</h2>
          <div className="table-scroll">
            <table className="exercise-table">
              <thead>
                <tr>
                  <th>{tr('Exercise', 'Övning')}</th>
                  <th>{tr('First best set', 'Första bästa set')}</th>
                  <th>{tr('Latest best set', 'Senaste bästa set')}</th>
                  <th>{tr('Change', 'Förändring')}</th>
                </tr>
              </thead>
              <tbody>
                {strengthTrends.map((t) => (
                  <tr key={t.name}>
                    <td>{L(t.name)}</td>
                    <td>{t.first} kg</td>
                    <td>{t.last} kg</td>
                    <td>
                      {t.last > t.first ? (
                        <span className="pill ok">+{Math.round(((t.last - t.first) / Math.max(1, t.first)) * 100)}%</span>
                      ) : t.last === t.first ? (
                        <span className="pill info">{tr('flat', 'oförändrat')}</span>
                      ) : (
                        <span className="pill warn">
                          {Math.round(((t.last - t.first) / Math.max(1, t.first)) * 100)}%
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted small">
            {tr(
              'While losing weight, flat strength = muscle successfully preserved. Rising strength = winning.',
              'Under viktnedgång: oförändrad styrka = musklerna bevarade. Ökande styrka = du vinner.',
            )}
          </p>
        </div>
      )}

      {streaks.length > 0 && (
        <div className="card">
          <h2>{tr('🔥 Habit streaks', '🔥 Vanor i rad')}</h2>
          <ul>
            {streaks.map((s) => (
              <li key={s.title}>
                {s.title} —{' '}
                <strong>
                  {tr(`${s.streak} day${s.streak > 1 ? 's' : ''}`, `${s.streak} dag${s.streak > 1 ? 'ar' : ''} i rad`)}
                </strong>
              </li>
            ))}
          </ul>
        </div>
      )}

      <details className="evidence card">
        <summary>
          {tr('🔥 Fat-loss pillars & the stall playbook', '🔥 Fettförbränningens grundpelare & spelboken vid platå')}
        </summary>
        {fatLossPillars().map((p) => (
          <div key={p.title} style={{ marginBottom: 10 }}>
            <h3>{L(p.title)}</h3>
            <p className="muted">{L(p.detail)}</p>
          </div>
        ))}
        <h3>{tr('When the scale stalls', 'När vågen står still')}</h3>
        <ol>
          <li>
            {tr(
              'Confirm it’s real: two consecutive flat weekly averages (one week is usually water).',
              'Bekräfta att det är på riktigt: två veckosnitt i rad utan förändring (en vecka är oftast vatten).',
            )}
          </li>
          <li>
            {tr(
              'Audit intake honestly for 3 days — oils, bites and weekends hide 200–400 kcal.',
              'Granska intaget ärligt i 3 dagar — oljor, smakbitar och helger gömmer 200–400 kcal.',
            )}
          </li>
          <li>
            {tr(
              'Add 1,500–2,000 steps/day before eating less.',
              'Lägg till 1 500–2 000 steg per dag innan du äter mindre.',
            )}
          </li>
          <li>
            {tr(
              'Then −5–10% calories (100–200 kcal); protein never drops.',
              'Sedan −5–10 % kalorier (100–200 kcal); proteinet sänks aldrig.',
            )}
          </li>
          <li>
            {tr(
              'Every 8–12 weeks: a 1-week diet break at maintenance (MATADOR study).',
              'Var 8–12:e vecka: en veckas dietpaus på underhållskalorier (MATADOR-studien).',
            )}
          </li>
        </ol>
      </details>

      <EvidencePanel />
    </main>
  )
}

/** Chronological feed of everything trained — logged workouts plus plain check-offs. */
function TrainingTimeline({
  completedWorkouts,
  workoutLog,
}: {
  completedWorkouts: CompletedWorkout[]
  workoutLog: { date: string; sessionName: string }[]
}) {
  // Check-offs without a matching logged workout still deserve a timeline entry.
  const checkedOnly = workoutLog.filter(
    (e) => !completedWorkouts.some((w) => w.date === e.date && w.sessionName === e.sessionName),
  )
  // Newest first; within a day, the most recently logged session on top.
  const entries = [
    ...completedWorkouts.map((w, order) => ({ ...w, checkedOnly: false, order })),
    ...checkedOnly.map((e, i) => ({
      date: e.date,
      sessionName: e.sessionName,
      category: 'strength' as ActivityCategory,
      durationMin: 0,
      totalSets: 0,
      totalVolumeKg: 0,
      exercises: [],
      checkedOnly: true,
      order: -1 - i,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date) || b.order - a.order)

  // Group by ISO week so it is obvious which sessions belong together.
  const weeks: { start: string; items: typeof entries }[] = []
  for (const e of entries.slice(0, 40)) {
    const start = startOfWeekIso(e.date)
    const last = weeks[weeks.length - 1]
    if (last && last.start === start) last.items.push(e)
    else weeks.push({ start, items: [e] })
  }
  const shortDate = (iso: string) => fmtDate(iso, { day: 'numeric', month: 'short' })
  const weekday = (iso: string) => fmtDate(iso, { weekday: 'short' })

  return (
    <div className="card">
      <h2>{tr('🗓️ Training timeline', '🗓️ Träningshistorik')}</h2>
      {entries.length === 0 ? (
        <p className="muted">
          {tr(
            'Every session you log from Let’s train lands here — strength, cardio, endurance and stretching, newest first and grouped by week.',
            'Varje pass du loggar under Träna hamnar här — styrka, kondition, uthållighet och stretch, nyast först och grupperat per vecka.',
          )}
        </p>
      ) : (
        <>
          {weeks.map((wk) => (
            <div key={wk.start}>
              <div className="timeline-week">
                <span>{tr(`Week ${isoWeek(wk.start)}`, `Vecka ${isoWeek(wk.start)}`)}</span>
                <span className="muted small">
                  {shortDate(wk.start)} – {shortDate(addDaysIso(wk.start, 6))} ·{' '}
                  {tr(`${wk.items.length} session${wk.items.length > 1 ? 's' : ''}`, `${wk.items.length} pass`)}
                </span>
              </div>
              <div className="timeline">
                {wk.items.map((e, i) => {
                  const meta = categoryMeta(e.category ?? 'strength')
                  return (
                    <div className="timeline-entry" key={`${e.date}-${e.sessionName}-${i}`}>
                      <span className="timeline-icon" aria-hidden>
                        {meta.icon}
                      </span>
                      <div className="timeline-body">
                        <div className="timeline-head">
                          <strong>{L(e.sessionName)}</strong>
                          <span className={`pill ${e.category === 'strength' ? 'info' : 'ok'}`}>{meta.label}</span>
                        </div>
                        <div className="muted small">
                          {weekday(e.date)} {shortDate(e.date)}
                          {e.checkedOnly
                            ? tr(' · checked off', ' · avbockat')
                            : e.category === 'strength'
                              ? tr(
                                  ` · ${e.durationMin} min · ${e.totalSets} sets · ${e.totalVolumeKg.toLocaleString(dateLocale())} kg volume`,
                                  ` · ${e.durationMin} min · ${e.totalSets} set · ${e.totalVolumeKg.toLocaleString(dateLocale())} kg volym`,
                                )
                              : ` · ${e.durationMin} min`}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
          {entries.length > 40 && (
            <p className="muted small">{tr('Showing the latest 40 sessions.', 'Visar de senaste 40 passen.')}</p>
          )}
        </>
      )}
    </div>
  )
}

/** Inline SVG chart: daily weigh-ins (dots), 7-day rolling average (line), goal (dashed). */
function WeightChart({
  weighIns,
  goalWeightKg,
  today,
}: {
  weighIns: WeighIn[]
  goalWeightKg?: number
  today: string
}) {
  const W = 640
  const H = 220
  const PAD = { l: 44, r: 12, t: 12, b: 26 }

  const points = weighIns.map((w) => ({ date: w.date, kg: w.weightKg }))
  const avgPoints = weighIns
    .map((w) => ({ date: w.date, kg: rollingAverage(weighIns, w.date) }))
    .filter((p): p is { date: string; kg: number } => p.kg !== null)

  const allKg = [...points.map((p) => p.kg), ...(goalWeightKg ? [goalWeightKg] : [])]
  const minKg = Math.floor(Math.min(...allKg) - 1)
  const maxKg = Math.ceil(Math.max(...allKg) + 1)
  const t0 = new Date(points[0].date + 'T00:00:00Z').getTime()
  const t1 = Math.max(new Date(today + 'T00:00:00Z').getTime(), new Date(points[points.length - 1].date + 'T00:00:00Z').getTime())
  const span = Math.max(1, t1 - t0)

  const x = (date: string) => PAD.l + ((new Date(date + 'T00:00:00Z').getTime() - t0) / span) * (W - PAD.l - PAD.r)
  const y = (kg: number) => PAD.t + ((maxKg - kg) / Math.max(1, maxKg - minKg)) * (H - PAD.t - PAD.b)

  const gridLines = []
  for (let kg = minKg; kg <= maxKg; kg += Math.max(1, Math.round((maxKg - minKg) / 4))) {
    gridLines.push(kg)
  }

  const avgPath = avgPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.date).toFixed(1)},${y(p.kg).toFixed(1)}`).join(' ')

  return (
    <div className="table-scroll">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="weight-chart"
        role="img"
        aria-label={tr('Weight trend chart', 'Vikttrendkurva')}
      >
        {gridLines.map((kg) => (
          <g key={kg}>
            <line x1={PAD.l} y1={y(kg)} x2={W - PAD.r} y2={y(kg)} className="chart-grid" />
            <text x={PAD.l - 6} y={y(kg) + 4} textAnchor="end" className="chart-label">
              {kg}
            </text>
          </g>
        ))}
        {goalWeightKg && goalWeightKg >= minKg && goalWeightKg <= maxKg && (
          <g>
            <line
              x1={PAD.l}
              y1={y(goalWeightKg)}
              x2={W - PAD.r}
              y2={y(goalWeightKg)}
              className="chart-goal"
            />
            <text x={W - PAD.r} y={y(goalWeightKg) - 5} textAnchor="end" className="chart-label goal">
              {tr('goal', 'mål')} {goalWeightKg}
            </text>
          </g>
        )}
        {points.map((p) => (
          <circle key={p.date} cx={x(p.date)} cy={y(p.kg)} r={3} className="chart-dot" />
        ))}
        {avgPoints.length >= 2 && <path d={avgPath} className="chart-avg" />}
        <text x={PAD.l} y={H - 8} className="chart-label">
          {points[0].date}
        </text>
        <text x={W - PAD.r} y={H - 8} textAnchor="end" className="chart-label">
          {today}
        </text>
      </svg>
      <p className="muted small">
        {tr(
          'Dots = daily weigh-ins · line = 7-day average (the truth) · dashed = goal.',
          'Prickar = dagliga invägningar · linje = 7-dagars snitt (sanningen) · streckad = målvikt.',
        )}
      </p>
    </div>
  )
}
