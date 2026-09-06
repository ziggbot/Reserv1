import { useEffect, useMemo, useState } from 'react'
import { useAppStore, todayIso } from '../../state/store'
import { exerciseLibrary } from '../../lib/programs'
import { proposalsFor } from '../../lib/activities'
import type {
  ActivityCategory,
  ActivityProposal,
  CompletedWorkout,
  WorkoutProgram,
  WorkoutSession,
} from '../../lib/types'

/**
 * Training building blocks. The home screen (features/train/TrainHome) composes
 * these; this file keeps the workout logger, the summary, the program editor
 * and the cardio/endurance/stretch proposals.
 */

/* ---------------- Cardio / endurance / stretch proposals ---------------- */

const SECTION_INTRO: Record<Exclude<ActivityCategory, 'strength'>, string> = {
  cardio:
    'Conditioning sessions that fit around your strength days. Do them, tap Log, and they land on your Progress timeline.',
  endurance:
    'Longer engine-building work — one of these a week compounds into a big aerobic base. Scaled to your level.',
  stretch:
    'Short mobility routines. The best one is the one you actually do — pick by how your body feels today.',
}

export function ActivitySection({ category }: { category: Exclude<ActivityCategory, 'strength'> }) {
  const profile = useAppStore((s) => s.profile)!
  const proposals = proposalsFor(profile, category)
  return (
    <>
      <p className="muted" style={{ margin: '0 4px 4px' }}>
        {SECTION_INTRO[category]}
      </p>
      {proposals.map((p) => (
        <ActivityCard key={p.name} proposal={p} />
      ))}
    </>
  )
}

function ActivityCard({ proposal }: { proposal: ActivityProposal }) {
  const logActivity = useAppStore((s) => s.logActivity)
  const [minutes, setMinutes] = useState(proposal.durationMin)
  const [logged, setLogged] = useState(false)

  return (
    <div className="card">
      <h2>
        {proposal.name} <span className="pill info">~{proposal.durationMin} min</span>
      </h2>
      <p className="muted">{proposal.description}</p>
      <ol>
        {proposal.steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      {logged ? (
        <p className="banner ok" role="status">
          ✅ Logged {minutes} min — it's on your Progress timeline.
        </p>
      ) : (
        <div className="log-row">
          <div className="stepper activity-stepper">
            <button type="button" aria-label={`Decrease minutes for ${proposal.name}`} onClick={() => setMinutes((m) => Math.max(5, m - 5))}>
              −
            </button>
            <input
              type="number"
              inputMode="numeric"
              value={minutes}
              aria-label={`Minutes for ${proposal.name}`}
              onChange={(e) => setMinutes(Math.max(0, Number(e.target.value) || 0))}
            />
            <button type="button" aria-label={`Increase minutes for ${proposal.name}`} onClick={() => setMinutes((m) => m + 5)}>
              +
            </button>
          </div>
          <span className="muted small">min</span>
          <button
            className="primary"
            disabled={minutes <= 0}
            onClick={() => {
              logActivity(proposal.category, proposal.name, minutes, todayIso())
              setLogged(true)
            }}
          >
            ✓ Log session
          </button>
        </div>
      )}
    </div>
  )
}

/* ---------------- Program editor ---------------- */

export function ProgramEditor({
  program,
  onSave,
  onCancel,
}: {
  program: WorkoutProgram
  onSave: (p: WorkoutProgram) => void
  onCancel: () => void
}) {
  const profile = useAppStore((s) => s.profile)!
  const [draft, setDraft] = useState<WorkoutProgram>(() => JSON.parse(JSON.stringify(program)))
  const library = useMemo(
    () => exerciseLibrary(profile.equipment, profile.injuries),
    [profile.equipment, profile.injuries],
  )

  const updateSession = (idx: number, patch: Partial<WorkoutSession>) =>
    setDraft((d) => ({
      ...d,
      sessions: d.sessions.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    }))

  return (
    <main>
      <div className="card">
        <h1>Customize your program</h1>
        <p className="muted small">
          Swap exercises (your equipment and injury flags are respected), change targets, rename
          sessions. ⚠ marks exercises that load an area you flagged as injured.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="primary" onClick={() => onSave(draft)}>
            Save program
          </button>
          <button className="ghost" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>

      {draft.sessions.map((s, si) => (
        <div className="card" key={si}>
          <div className="field">
            <label>Session name</label>
            <input type="text" value={s.name} onChange={(e) => updateSession(si, { name: e.target.value })} />
          </div>
          {s.exercises.map((ex, ei) => (
            <div className="editor-row" key={ei}>
              <select
                value={ex.name}
                onChange={(e) =>
                  updateSession(si, {
                    exercises: s.exercises.map((x, i) => (i === ei ? { ...x, name: e.target.value } : x)),
                  })
                }
              >
                {!library.some((l) => l.name === ex.name) && <option value={ex.name}>{ex.name}</option>}
                {library.map((l) => (
                  <option key={l.name} value={l.name}>
                    {l.flagged ? '⚠ ' : ''}
                    {l.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                max={8}
                value={ex.sets}
                aria-label="Sets"
                onChange={(e) =>
                  updateSession(si, {
                    exercises: s.exercises.map((x, i) =>
                      i === ei ? { ...x, sets: Math.max(1, Number(e.target.value) || 1) } : x,
                    ),
                  })
                }
              />
              <input
                type="text"
                value={ex.reps}
                aria-label="Rep target"
                onChange={(e) =>
                  updateSession(si, {
                    exercises: s.exercises.map((x, i) => (i === ei ? { ...x, reps: e.target.value } : x)),
                  })
                }
              />
              <button
                className="ghost icon-btn"
                aria-label="Remove exercise"
                onClick={() =>
                  updateSession(si, { exercises: s.exercises.filter((_, i) => i !== ei) })
                }
              >
                ✕
              </button>
            </div>
          ))}
          <button
            className="ghost"
            onClick={() =>
              updateSession(si, {
                exercises: [
                  ...s.exercises,
                  { name: library[0]?.name ?? 'Exercise', sets: 3, reps: '8–12', rpe: 'RPE 7–8 (1–3 reps in reserve)' },
                ],
              })
            }
          >
            + Add exercise
          </button>
        </div>
      ))}
    </main>
  )
}

/* ---------------- Active workout logger ---------------- */

export function ActiveWorkoutScreen({ onFinished }: { onFinished: (w: CompletedWorkout) => void }) {
  const { activeWorkout, updateActiveSet, addActiveSet, skipActiveExercise, cancelWorkout, finishWorkout } = useAppStore()
  const [now, setNow] = useState(Date.now())
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null)
  const [confirmCancel, setConfirmCancel] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  if (!activeWorkout) return null

  const elapsedMin = Math.floor((now - new Date(activeWorkout.startedAt).getTime()) / 60000)
  const elapsedSec = Math.floor(((now - new Date(activeWorkout.startedAt).getTime()) % 60000) / 1000)
  const restLeft = restEndsAt ? Math.max(0, Math.ceil((restEndsAt - now) / 1000)) : 0
  const doneSets = activeWorkout.exercises.reduce((a, ex) => a + ex.sets.filter((s) => s.done).length, 0)

  return (
    <main className="workout-screen">
      <div className="card plain">
        <h1>{activeWorkout.sessionName}</h1>
        <p className="muted small">
          Weight × reps are prefilled from last time. Tap ✓ when a set is done. Beat one number today.
        </p>
      </div>

      {restEndsAt && restLeft > 0 && (
        <div className="rest-banner" role="timer">
          ⏱ Rest: <strong>{restLeft}s</strong>
          <button className="ghost icon-btn" onClick={() => setRestEndsAt(null)} aria-label="Dismiss rest timer">
            ✕
          </button>
        </div>
      )}

      {activeWorkout.exercises.map((ex, exIdx) => (
        <div className={`exercise-block ${ex.skipped ? 'skipped' : ''}`} key={exIdx}>
          <div className="exercise-head">
            <h3>
              {ex.linkUrl ? (
                <a href={ex.linkUrl} target="_blank" rel="noopener noreferrer">
                  {ex.name} ↗
                </a>
              ) : (
                ex.name
              )}{' '}
              <span className="muted small">target {ex.targetReps}</span>
            </h3>
            <button
              className="ghost small-btn"
              onClick={() => skipActiveExercise(exIdx, !ex.skipped)}
              aria-label={ex.skipped ? `Do ${ex.name} after all` : `Skip ${ex.name}`}
            >
              {ex.skipped ? 'Undo skip' : 'Skip'}
            </button>
          </div>
          {ex.skipped ? (
            <p className="muted small">Skipped today. Your last numbers stay saved for next time.</p>
          ) : (
            <>
          <div className="set-header">
            <span>Set</span>
            <span>kg</span>
            <span>reps</span>
            <span>✓</span>
          </div>
          {ex.sets.map((st, setIdx) => (
            <div className={`set-row ${st.done ? 'done' : ''}`} key={setIdx}>
              <span className="set-num">{setIdx + 1}</span>
              <Stepper
                value={st.weightKg}
                step={2.5}
                decimals={1}
                placeholder="kg"
                ariaLabel={`${ex.name} set ${setIdx + 1} weight in kg`}
                onChange={(v) => updateActiveSet(exIdx, setIdx, { weightKg: v })}
              />
              <Stepper
                value={st.reps}
                step={1}
                decimals={0}
                placeholder="reps"
                ariaLabel={`${ex.name} set ${setIdx + 1} reps`}
                onChange={(v) => updateActiveSet(exIdx, setIdx, { reps: v })}
              />
              <button
                className={`set-check ${st.done ? 'checked' : ''}`}
                aria-label={`Mark set ${setIdx + 1} ${st.done ? 'not done' : 'done'}`}
                onClick={() => {
                  const nowDone = !st.done
                  updateActiveSet(exIdx, setIdx, { done: nowDone })
                  if (nowDone) setRestEndsAt(Date.now() + 90_000)
                }}
              >
                ✓
              </button>
            </div>
          ))}
          <button className="ghost small-btn" onClick={() => addActiveSet(exIdx)}>
            + Add set
          </button>
            </>
          )}
        </div>
      ))}

      <div className="workout-footer">
        <span className="elapsed">
          ⏱ {elapsedMin}:{String(elapsedSec).padStart(2, '0')} · {doneSets} sets
        </span>
        {!confirmCancel ? (
          <button className="ghost" onClick={() => setConfirmCancel(true)}>
            Discard
          </button>
        ) : (
          <button className="ghost" style={{ color: 'var(--danger)' }} onClick={cancelWorkout}>
            Really discard?
          </button>
        )}
        <button
          className="primary"
          disabled={doneSets === 0}
          onClick={() => {
            const w = finishWorkout(todayIso())
            if (w) onFinished(w)
          }}
        >
          Finish
        </button>
      </div>
    </main>
  )
}

/**
 * Number field with big −/+ touch targets so a value can be adjusted
 * one-handed mid-set. Weight steps 2.5 kg (smallest plate pair), reps step 1.
 */
function Stepper({
  value,
  step,
  decimals,
  placeholder,
  ariaLabel,
  onChange,
}: {
  value: number | null
  step: number
  decimals: number
  placeholder: string
  ariaLabel: string
  onChange: (v: number | null) => void
}) {
  const round = (n: number) => Number(n.toFixed(decimals))
  return (
    <div className="stepper">
      <button
        type="button"
        aria-label={`Decrease ${ariaLabel}`}
        onClick={() => onChange(round(Math.max(0, (value ?? 0) - step)))}
      >
        −
      </button>
      <input
        type="number"
        inputMode={decimals > 0 ? 'decimal' : 'numeric'}
        step={step}
        min={0}
        value={value ?? ''}
        placeholder={placeholder}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      />
      <button type="button" aria-label={`Increase ${ariaLabel}`} onClick={() => onChange(round((value ?? 0) + step))}>
        +
      </button>
    </div>
  )
}

/* ---------------- Post-workout summary ---------------- */

export function WorkoutSummary({
  workout,
  history,
  onClose,
}: {
  workout: CompletedWorkout
  history: CompletedWorkout[]
  onClose: () => void
}) {
  const previousBest = (exName: string): number => {
    let best = 0
    for (const w of history) {
      if (w.date === workout.date && w.sessionName === workout.sessionName) continue
      for (const ex of w.exercises) {
        if (ex.name !== exName) continue
        for (const st of ex.sets) best = Math.max(best, st.weightKg ?? 0)
      }
    }
    return best
  }

  return (
    <main>
      <div className="card">
        <h1>💪 Workout saved</h1>
        <div className="stat-row">
          <div className="stat">
            <div className="value">{workout.durationMin}</div>
            <div className="label">minutes</div>
          </div>
          <div className="stat">
            <div className="value">{workout.totalSets}</div>
            <div className="label">sets</div>
          </div>
          <div className="stat">
            <div className="value">{workout.totalVolumeKg.toLocaleString()}</div>
            <div className="label">kg volume</div>
          </div>
        </div>
        <h2>Best set per exercise</h2>
        <ul>
          {workout.exercises.map((ex) => {
            const best = ex.sets.reduce(
              (b, st) => ((st.weightKg ?? 0) > (b.weightKg ?? 0) ? st : b),
              ex.sets[0],
            )
            const isPr = (best.weightKg ?? 0) > previousBest(ex.name) && (best.weightKg ?? 0) > 0
            return (
              <li key={ex.name}>
                {ex.name}: <strong>{best.weightKg ?? 0} kg × {best.reps ?? 0}</strong>{' '}
                {isPr && <span className="pill ok">PR</span>}
              </li>
            )
          })}
        </ul>
        <p className="muted small">
          Volume, strength trend and your weight curve live under Progress.
        </p>
        <button className="primary" onClick={onClose}>
          Done
        </button>
      </div>
    </main>
  )
}
