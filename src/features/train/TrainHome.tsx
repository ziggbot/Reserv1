import { useState } from 'react'
import { useAppStore, todayIso } from '../../state/store'
import { defaultProgram } from '../../lib/threeDayFullBody'
import { buildWeeklySchedule } from '../../lib/weeklySchedule'
import { estimateMinutes, nextSession, startOfWeekIso, weekStatus } from '../../lib/trainWeek'
import { ActiveWorkoutScreen, ActivitySection, WorkoutSummary } from '../action/ActionView'
import type { ActivityCategory, CompletedWorkout, WorkoutProgram } from '../../lib/types'
import type { Tab } from '../../App'

const OTHER: { id: Exclude<ActivityCategory, 'strength'>; icon: string; label: string }[] = [
  { id: 'cardio', icon: '🫀', label: 'Cardio' },
  { id: 'endurance', icon: '🏃', label: 'Endurance' },
  { id: 'stretch', icon: '🧘', label: 'Stretch' },
]

/**
 * The home screen. One job: get you into today's session with a single tap.
 * Everything else (plan, nutrition, progress…) lives behind the More tab.
 */
export default function TrainHome({ onNavigate }: { onNavigate: (t: Tab) => void }) {
  const { profile, customProgram, activeWorkout, completedWorkouts, startWorkout } = useAppStore()
  const [summary, setSummary] = useState<CompletedWorkout | null>(null)
  const [picking, setPicking] = useState(false)
  const [pickedIndex, setPickedIndex] = useState<number | null>(null)
  const [peekIndex, setPeekIndex] = useState<number | null>(null)
  const [other, setOther] = useState<Exclude<ActivityCategory, 'strength'> | null>(null)

  if (!profile) return null
  if (activeWorkout) return <ActiveWorkoutScreen onFinished={setSummary} />
  if (summary) return <WorkoutSummary workout={summary} history={completedWorkouts} onClose={() => setSummary(null)} />

  const program: WorkoutProgram = defaultProgram(profile, customProgram)
  const today = todayIso()
  const weekStart = startOfWeekIso(today)
  const next = nextSession(program, completedWorkouts)
  const chosenIndex = pickedIndex ?? next.index
  const chosen = program.sessions[chosenIndex] ?? next.session
  const schedule = buildWeeklySchedule(profile, program)
  const week = weekStatus(schedule, completedWorkouts, weekStart)
  const doneCount = week.filter((d) => d.done).length
  const minutes = estimateMinutes(chosen, profile.minutesPerSession)
  const firstName = profile.name.split(' ')[0]
  const recent = [...completedWorkouts].slice(-3).reverse()

  return (
    <main>
      <div className="home-greeting">
        <h1>Hi {firstName}.</h1>
        <div className="date">
          {new Date(today + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
          {' · '}
          {doneCount}/{week.length} sessions done this week
        </div>
      </div>

      <div className="hero">
        <button className="big-cta" onClick={() => startWorkout(chosen)} aria-label={`Let's train: start ${chosen.name}`}>
          Let’s train
        </button>
        <div className="next-up">
          <span className="muted">{pickedIndex === null ? 'Next up' : 'You picked'}</span>
          <span className="name">{chosen.name}</span>
          <span className="meta">
            {chosen.focus} · {chosen.exercises.length} exercises · ~{minutes} min
          </span>
        </div>
        <button className="link small" style={{ marginTop: 10 }} onClick={() => setPicking((p) => !p)}>
          {picking ? 'Hide sessions' : 'Pick another session'}
        </button>
      </div>

      {picking && (
        <div className="session-picker">
          {program.sessions.map((s, i) => (
            <div key={s.name}>
              <button
                className={`session-row ${i === chosenIndex ? 'selected' : ''}`}
                onClick={() => {
                  setPickedIndex(i === next.index ? null : i)
                  setPeekIndex((p) => (p === i ? null : i))
                }}
                aria-pressed={i === chosenIndex}
              >
                <span className="radio" aria-hidden />
                <span>
                  <span className="title">{s.name}</span>
                  <br />
                  <span className="sub">{s.focus}</span>
                </span>
                <span className="count">
                  {s.exercises.length} ex · ~{estimateMinutes(s, profile.minutesPerSession)} min
                </span>
              </button>
              {peekIndex === i && (
                <ul className="exercise-peek">
                  {s.exercises.map((e, j) => (
                    <li key={j}>
                      {e.name} <span>{e.sets}×{e.reps}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      <section className="section">
        <div className="section-head">
          <h2>This week</h2>
          <span className="aside">{schedule.summaryLine}</span>
        </div>
        <ol className="week-list">
          {week.map((day) => (
            <li className={`week-day ${day.done ? 'done' : ''}`} key={day.label}>
              <span className="week-icon" aria-hidden>
                {day.icon}
              </span>
              <span className="label">{day.label}</span>
              <span>
                <span className="title-text">{day.title}</span>
                <div className="muted small">{day.detail}</div>
              </span>
              <span className="tick" aria-label={day.done ? 'done' : 'not done'}>
                {day.done ? '✓' : ''}
              </span>
            </li>
          ))}
        </ol>
        <p className="muted small">
          👟 {schedule.dailySteps.toLocaleString()} steps a day. {schedule.conditioning.note}
        </p>
        {schedule.rotationNote && <p className="muted small">🔁 {schedule.rotationNote}</p>}
        <p className="small">
          <button className="link" onClick={() => onNavigate('settings')}>
            Change program or training days
          </button>
        </p>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Something else today?</h2>
        </div>
        <div className="chip-row" role="tablist" aria-label="Other training">
          {OTHER.map((c) => (
            <button
              key={c.id}
              role="tab"
              aria-selected={other === c.id}
              className={`chip ${other === c.id ? 'active' : ''}`}
              onClick={() => setOther((o) => (o === c.id ? null : c.id))}
            >
              <span aria-hidden>{c.icon}</span> {c.label}
            </button>
          ))}
        </div>
        {other && <ActivitySection category={other} />}
      </section>

      {recent.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>Lately</h2>
            <button className="link small" onClick={() => onNavigate('progress')}>
              All progress
            </button>
          </div>
          {recent.map((w, i) => (
            <div className="check-row" key={`${w.date}-${w.sessionName}-${i}`}>
              <span>
                <strong>{w.sessionName}</strong>{' '}
                <span className="muted small">
                  {w.date} · {w.durationMin} min
                  {w.totalSets > 0 && ` · ${w.totalSets} sets · ${w.totalVolumeKg.toLocaleString()} kg`}
                </span>
              </span>
            </div>
          ))}
        </section>
      )}
    </main>
  )
}
