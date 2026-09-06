import { useState } from 'react'
import { useAppStore, todayIso, weeksSince } from '../../state/store'
import { analyzeProgress, FAT_LOSS_PILLARS, rollingAverage } from '../../lib/fatloss'
import { macroTargets, targetWeeklyLossKg, tdee } from '../../lib/calculations'
import { buildHabitPlan, currentStreak } from '../../lib/habits'
import { isoWeek, startOfWeekIso, addDaysIso } from '../../lib/trainWeek'
import EvidencePanel from '../shared/EvidencePanel'
import type { ActivityCategory, CompletedWorkout, WeighIn } from '../../lib/types'

const CATEGORY_META: Record<ActivityCategory, { icon: string; label: string }> = {
  strength: { icon: '🏋️', label: 'Strength' },
  cardio: { icon: '🫀', label: 'Cardio' },
  endurance: { icon: '🏃', label: 'Endurance' },
  stretch: { icon: '🧘', label: 'Stretch' },
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  insufficient_data: { label: 'Collecting data', cls: 'info' },
  on_track: { label: 'On track', cls: 'ok' },
  slow: { label: 'Slower than target', cls: 'warn' },
  stalled: { label: 'Stalled', cls: 'danger' },
  too_fast: { label: 'Too fast', cls: 'warn' },
}

export default function ProgressView() {
  const { profile, weighIns, planStartDate, completedWorkouts, workoutLog, habitChecks, addWeighIn, setProfile } =
    useAppStore()
  const [weight, setWeight] = useState('')
  const [statWeight, setStatWeight] = useState(profile ? String(profile.weightKg) : '')
  const [goalWeight, setGoalWeight] = useState(profile?.goalWeightKg ? String(profile.goalWeightKg) : '')
  const [statsSaved, setStatsSaved] = useState(false)
  if (!profile) return null

  const today = todayIso()
  const todayWeighIn = weighIns.find((w) => w.date === today)
  const weeks = weeksSince(planStartDate, today)
  const analysis = analyzeProgress(weighIns, today, profile.weightKg, weeks)
  const status = STATUS_LABEL[analysis.status]
  const isCutting = profile.goal === 'fat_loss'

  const thisWeek = completedWorkouts.filter((w) => weeksSince(w.date, today) === 0)
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
        <h1>Progress</h1>
        <p className="muted small">
          Week {weeks + 1} of your plan · every number below updates from your weigh-ins, workouts and
          habit checks.
        </p>
        <div className="stat-row">
          <div className="stat">
            <div className="value">{analysis.currentAvgKg ?? '—'}</div>
            <div className="label">7-day avg kg</div>
          </div>
          <div className="stat">
            <div className="value">{analysis.weeklyChangeKg ?? '—'}</div>
            <div className="label">kg this week</div>
          </div>
          <div className="stat">
            <div className="value">{thisWeek.length}/{profile.daysPerWeek}</div>
            <div className="label">workouts this wk</div>
          </div>
          <div className="stat">
            <div className="value">{weekVolume.toLocaleString()}</div>
            <div className="label">kg volume this wk</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>⚖️ Morning weigh-in</h2>
        {todayWeighIn ? (
          <p>
            Logged <strong>{todayWeighIn.weightKg} kg</strong> today. Only the weekly average matters —
            single days are water, not fat.
          </p>
        ) : (
          <div className="weigh-form">
            <input
              type="number"
              step="0.1"
              placeholder="Weight (kg)"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              aria-label="Today's weight in kg"
            />
            <button
              className="primary"
              disabled={!weight || Number(weight) < 35 || Number(weight) > 300}
              onClick={() => {
                addWeighIn({ date: today, weightKg: Number(weight) })
                setWeight('')
              }}
            >
              Log
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <h2>🎯 Your numbers</h2>
        <p className="muted small">
          Plan weight and goal. Update as you go and every target (calories, protein, pace) recalculates.
        </p>
        <div className="field">
          <label>Current weight (kg)</label>
          <input type="number" step="0.1" value={statWeight} onChange={(e) => setStatWeight(e.target.value)} />
        </div>
        <div className="field">
          <label>Goal weight (kg)</label>
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
            Save & recalculate
          </button>
          {statsSaved && <span className="muted small">Saved.</span>}
        </div>
      </div>

      <TrainingTimeline completedWorkouts={completedWorkouts} workoutLog={workoutLog} />

      <div className="card">
        <h2>⚖️ Weight trend</h2>
        {weighIns.length >= 2 ? (
          <WeightChart weighIns={weighIns} goalWeightKg={profile.goalWeightKg} today={today} />
        ) : (
          <p className="muted">
            Log at least two weigh-ins above and your trend chart appears here.
          </p>
        )}
      </div>

      {isCutting && (
        <div className="card">
          <h2>
            🧭 Coach’s call <span className={`pill ${status.cls}`}>{status.label}</span>
          </h2>
          <p className="muted small">
            Target: {analysis.targetWeeklyChangeKg} kg/week (~{targetWeeklyLossKg(profile.weightKg)} kg —
            the muscle-sparing zone). Cut calories {macroTargets(profile).calories} · maintenance ≈{' '}
            {tdee(profile)}.
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
          <h2>🏋️ Strength trend</h2>
          <div className="table-scroll">
            <table className="exercise-table">
              <thead>
                <tr>
                  <th>Exercise</th>
                  <th>First best set</th>
                  <th>Latest best set</th>
                  <th>Change</th>
                </tr>
              </thead>
              <tbody>
                {strengthTrends.map((t) => (
                  <tr key={t.name}>
                    <td>{t.name}</td>
                    <td>{t.first} kg</td>
                    <td>{t.last} kg</td>
                    <td>
                      {t.last > t.first ? (
                        <span className="pill ok">+{Math.round(((t.last - t.first) / Math.max(1, t.first)) * 100)}%</span>
                      ) : t.last === t.first ? (
                        <span className="pill info">flat</span>
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
            While losing weight, flat strength = muscle successfully preserved. Rising strength = winning.
          </p>
        </div>
      )}

      {streaks.length > 0 && (
        <div className="card">
          <h2>🔥 Habit streaks</h2>
          <ul>
            {streaks.map((s) => (
              <li key={s.title}>
                {s.title} — <strong>{s.streak} day{s.streak > 1 ? 's' : ''}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}

      <details className="evidence card">
        <summary>🔥 Fat-loss pillars & the stall playbook</summary>
        {FAT_LOSS_PILLARS.map((p) => (
          <div key={p.title} style={{ marginBottom: 10 }}>
            <h3>{p.title}</h3>
            <p className="muted">{p.detail}</p>
          </div>
        ))}
        <h3>When the scale stalls</h3>
        <ol>
          <li>Confirm it’s real: two consecutive flat weekly averages (one week is usually water).</li>
          <li>Audit intake honestly for 3 days — oils, bites and weekends hide 200–400 kcal.</li>
          <li>Add 1,500–2,000 steps/day before eating less.</li>
          <li>Then −5–10% calories (100–200 kcal); protein never drops.</li>
          <li>Every 8–12 weeks: a 1-week diet break at maintenance (MATADOR study).</li>
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
  const shortDate = (iso: string) =>
    new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
  const weekday = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short' })

  return (
    <div className="card">
      <h2>🗓️ Training timeline</h2>
      {entries.length === 0 ? (
        <p className="muted">
          Every session you log from Let’s train lands here — strength, cardio, endurance and
          stretching, newest first and grouped by week.
        </p>
      ) : (
        <>
          {weeks.map((wk) => (
            <div key={wk.start}>
              <div className="timeline-week">
                <span>Week {isoWeek(wk.start)}</span>
                <span className="muted small">
                  {shortDate(wk.start)} – {shortDate(addDaysIso(wk.start, 6))} · {wk.items.length} session
                  {wk.items.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="timeline">
                {wk.items.map((e, i) => {
                  const meta = CATEGORY_META[e.category ?? 'strength']
                  return (
                    <div className="timeline-entry" key={`${e.date}-${e.sessionName}-${i}`}>
                      <span className="timeline-icon" aria-hidden>
                        {meta.icon}
                      </span>
                      <div className="timeline-body">
                        <div className="timeline-head">
                          <strong>{e.sessionName}</strong>
                          <span className={`pill ${e.category === 'strength' ? 'info' : 'ok'}`}>{meta.label}</span>
                        </div>
                        <div className="muted small">
                          {weekday(e.date)} {shortDate(e.date)}
                          {e.checkedOnly
                            ? ' · checked off'
                            : e.category === 'strength'
                              ? ` · ${e.durationMin} min · ${e.totalSets} sets · ${e.totalVolumeKg.toLocaleString()} kg volume`
                              : ` · ${e.durationMin} min`}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
          {entries.length > 40 && <p className="muted small">Showing the latest 40 sessions.</p>}
        </>
      )}
    </div>
  )
}

/** Best-set weight trend for the most-logged exercises. */
function topExerciseTrends(workouts: { exercises: { name: string; sets: { weightKg: number | null }[] }[] }[]) {
  const byExercise = new Map<string, number[]>()
  for (const w of workouts) {
    for (const ex of w.exercises) {
      const best = ex.sets.reduce((b, s) => Math.max(b, s.weightKg ?? 0), 0)
      if (best <= 0) continue
      byExercise.set(ex.name, [...(byExercise.get(ex.name) ?? []), best])
    }
  }
  return [...byExercise.entries()]
    .filter(([, arr]) => arr.length >= 2)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 6)
    .map(([name, arr]) => ({ name, first: arr[0], last: arr[arr.length - 1] }))
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
      <svg viewBox={`0 0 ${W} ${H}`} className="weight-chart" role="img" aria-label="Weight trend chart">
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
              goal {goalWeightKg}
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
      <p className="muted small">Dots = daily weigh-ins · line = 7-day average (the truth) · dashed = goal.</p>
    </div>
  )
}
