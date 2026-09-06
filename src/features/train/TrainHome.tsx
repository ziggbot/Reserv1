import { useState } from 'react'
import { useAppStore, todayIso } from '../../state/store'
import { defaultProgram } from '../../lib/threeDayFullBody'
import { buildWeeklySchedule } from '../../lib/weeklySchedule'
import { estimateMinutes, nextSession, rollingCycle } from '../../lib/trainWeek'
import { buildPresetProgram } from '../../lib/programs'
import { ActiveWorkoutScreen, ActivitySection, WorkoutSummary } from '../action/ActionView'
import type { ActivityCategory, CompletedWorkout, Profile, WorkoutProgram, WorkoutSession } from '../../lib/types'
import type { Tab } from '../../App'
import { tr, L, fmtDate } from '../../i18n'

type Other = Exclude<ActivityCategory, 'strength'> | 'bonus'

function otherChips(): { id: Other; icon: string; label: string }[] {
  return [
    { id: 'cardio', icon: '🫀', label: tr('Cardio', 'Kondition') },
    { id: 'endurance', icon: '🏃', label: tr('Endurance', 'Uthållighet') },
    { id: 'stretch', icon: '🧘', label: tr('Stretch', 'Rörlighet') },
    { id: 'bonus', icon: '💪', label: tr('Bonus strength', 'Bonusstyrka') },
  ]
}

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
        <h1>{tr(`Hi ${firstName}.`, `Hej ${firstName}.`)}</h1>
        <div className="date">
          {fmtDate(today, { weekday: 'long', day: 'numeric', month: 'long' })}
          {' · '}
          {tr(`${doneCount}/${week.length} sessions done this week`, `${doneCount}/${week.length} pass klara den här veckan`)}
        </div>
      </div>

      <div className="hero">
        <button
          className="big-cta"
          onClick={() => startWorkout(chosen)}
          aria-label={tr(`Let's train: start ${L(chosen.name)}`, `Nu kör vi: starta ${L(chosen.name)}`)}
        >
          {tr('Let’s train', 'Nu kör vi')}
        </button>
        <div className="next-up">
          <span className="muted">{pickedIndex === null ? tr('Next up', 'Nästa pass') : tr('You picked', 'Du valde')}</span>
          <span className="name">{L(chosen.name)}</span>
          <span className="meta">
            {L(chosen.focus)} · {chosen.exercises.length} {tr('exercises', 'övningar')} · ~{minutes} min
          </span>
        </div>
        <button className="link small" style={{ marginTop: 10 }} onClick={() => setPicking((p) => !p)}>
          {picking ? tr('Hide sessions', 'Dölj pass') : tr('Pick another session', 'Välj ett annat pass')}
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
                  <span className="title">{L(s.name)}</span>
                  <br />
                  <span className="sub">{L(s.focus)}</span>
                </span>
                <span className="count">
                  {s.exercises.length} {tr('ex', 'övn')} · ~{estimateMinutes(s, profile.minutesPerSession)} min
                </span>
              </button>
              {peekIndex === i && (
                <ul className="exercise-peek">
                  {s.exercises.map((e, j) => (
                    <li key={j}>
                      {L(e.name)} <span>{e.sets}×{L(e.reps)}</span>
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
          <h2>{tr('This week', 'Den här veckan')}</h2>
          <span className="aside">
            {cycle.startedOn
              ? tr(
                  `rolling · started ${fmtDate(cycle.startedOn, { day: 'numeric', month: 'short' })}`,
                  `rullande · startade ${fmtDate(cycle.startedOn, { day: 'numeric', month: 'short' })}`,
                )
              : tr('rolling · starts with your next session', 'rullande · börjar med ditt nästa pass')}
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
                <span className="title-text">{L(day.title)}</span>
                <div className="muted small">{day.detail}</div>
              </span>
              <span className="tick" aria-label={day.done ? tr('done', 'klart') : tr('not done', 'inte klart')}>
                {day.done ? '✓' : ''}
              </span>
            </li>
          ))}
        </ol>
        <p className="muted small">
          {schedule.summaryLine}.{' '}
          {tr(
            'The list resets the moment you finish the last session of the pass, whatever day it is.',
            'Listan nollställs så fort du är klar med det sista passet i omgången, oavsett veckodag.',
          )}
        </p>
        <p className="muted small">
          👟 {tr(`${schedule.dailySteps.toLocaleString()} steps a day.`, `${schedule.dailySteps.toLocaleString()} steg per dag.`)}{' '}
          {schedule.conditioning.note}
        </p>
        {schedule.rotationNote && <p className="muted small">🔁 {schedule.rotationNote}</p>}
        <p className="small">
          <button className="link" onClick={() => onNavigate('settings')}>
            {tr('Change program or training days', 'Byt program eller träningsdagar')}
          </button>
        </p>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>{tr('Something else today?', 'Något annat idag?')}</h2>
        </div>
        <div className="chip-row" role="tablist" aria-label={tr('Other training', 'Annan träning')}>
          {otherChips().map((c) => (
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
            <h2>{tr('Lately', 'Senaste')}</h2>
            <button className="link small" onClick={() => onNavigate('progress')}>
              {tr('All progress', 'All utveckling')}
            </button>
          </div>
          {recent.map((w, i) => (
            <div className="check-row" key={`${w.date}-${w.sessionName}-${i}`}>
              <span>
                <strong>{L(w.sessionName)}</strong>{' '}
                <span className="muted small">
                  {w.date} · {w.durationMin} min
                  {w.totalSets > 0 && ` · ${w.totalSets} ${tr('sets', 'set')} · ${w.totalVolumeKg.toLocaleString()} kg`}
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
        {L(session.name)}{' '}
        <span className="pill info">
          {session.exercises.length} {tr('exercises', 'övningar')}
        </span>
      </h2>
      <p className="muted">
        {tr(
          'An extra whole-body session for days when you want more. It is logged like any workout but leaves your rotation and this week’s checklist untouched.',
          'Ett extra helkroppspass för dagar när du vill ha mer. Det loggas som vilket pass som helst men rör inte din rotation eller veckans checklista.',
        )}
      </p>
      <ul className="exercise-peek" style={{ paddingLeft: 0 }}>
        {session.exercises.map((e, i) => (
          <li key={i}>
            {L(e.name)} <span>{e.sets}×{L(e.reps)}</span>
          </li>
        ))}
      </ul>
      <button className="primary" onClick={() => onStart(session)}>
        ▶ {tr('Start bonus session', 'Starta bonuspass')}
      </button>
    </div>
  )
}
