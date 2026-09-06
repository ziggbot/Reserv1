import { useState } from 'react'
import { useAppStore, todayIso } from '../../state/store'
import { defaultProgram } from '../../lib/threeDayFullBody'
import { buildWeeklySchedule } from '../../lib/weeklySchedule'
import { estimateMinutes, nextSession, rollingCycle } from '../../lib/trainWeek'
import { buildPresetProgram } from '../../lib/programs'
import { ActiveWorkoutScreen, ActivitySection, WorkoutSummary } from '../action/ActionView'
import type { ActivityCategory, CompletedWorkout, Profile, WorkoutProgram, WorkoutSession } from '../../lib/types'
import type { Tab } from '../../App'

type Other = Exclude<ActivityCategory, 'strength'> | 'bonus'

const OTHER: { id: Other; icon: string; label: string }[] = [
  { id: 'cardio', icon: '🫀', label: 'Cardio' },
  { id: 'endurance', icon: '🏃', label: 'Endurance' },
  { id: 'stretch', icon: '🧘', label: 'Stretch' },
  { id: 'bonus', icon: '💪', label: 'Bonus strength' },
]

export const BONUS_SESSION_NAME = 'Bonus full body'

/** A standalone full-body session that never counts toward the program rotation. */
function bonusSession(profile: Profile): WorkoutSession {
  const base = buildPresetProgram(profile, 'fullbody3').sessions[0]
  return { ...base, name: BONUS_SESSION_NAME, focus: 'Whole-body strength · extra, outside your rotation' }
}

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
  const [other, setOther] = useState<Other | null>(null)

  if (!profile) return null
  if (activeWorkout) return <ActiveWorkoutScreen onFinished={setSummary} />
  if (summary) return <WorkoutSummary workout={summary} history={completedWorkouts} onClose={() => setSummary(null)} />

  const program: WorkoutProgram = defaultProgram(profile, customProgram)
  const today = todayIso()
  const next = nextSession(program, completedWorkouts)
  const chosenIndex = pickedIndex ?? next.index
  const chosen = program.sessions[chosenIndex] ?? next.session
  const schedule = buildWeeklySchedule(profile, program)
  const cycle = rollingCycle(program, schedule, completedWorkouts)
  const week = cycle.days
  const doneCount = cycle.doneCount
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
          <span className="aside">
            {cycle.startedOn
              ? `rolling · started ${new Date(cycle.startedOn + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`
              : 'rolling · starts with your next session'}
          </span>
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
          {schedule.summaryLine}. The list resets the moment you finish the last session of the pass,
          whatever day it is.
        </p>
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
        {other === 'bonus' && <BonusStrength session={bonusSession(profile)} onStart={startWorkout} />}
        {other && other !== 'bonus' && <ActivitySection category={other} />}
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

function BonusStrength({ session, onStart }: { session: WorkoutSession; onStart: (s: WorkoutSession) => void }) {
  return (
    <div className="card">
      <h2>
        {session.name} <span className="pill info">{session.exercises.length} exercises</span>
      </h2>
      <p className="muted">
        An extra whole-body session for days when you want more. It is logged like any workout but
        leaves your rotation and this week’s checklist untouched.
      </p>
      <ul className="exercise-peek" style={{ paddingLeft: 0 }}>
        {session.exercises.map((e, i) => (
          <li key={i}>
            {e.name} <span>{e.sets}×{e.reps}</span>
          </li>
        ))}
      </ul>
      <button className="primary" onClick={() => onStart(session)}>
        ▶ Start bonus session
      </button>
    </div>
  )
}
