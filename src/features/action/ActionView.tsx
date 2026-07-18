import { useEffect, useMemo, useState } from 'react'
import { useAppStore, todayIso } from '../../state/store'
import {
  buildPresetProgram,
  buildProgram,
  exerciseLibrary,
  PROGRAM_PRESETS,
} from '../../lib/programs'
import type { CompletedWorkout, WorkoutProgram, WorkoutSession } from '../../lib/types'

type Mode = 'list' | 'edit'

export default function ActionView() {
  const { profile, customProgram, setCustomProgram, activeWorkout, completedWorkouts, startWorkout } =
    useAppStore()
  const [mode, setMode] = useState<Mode>('list')
  const [presetId, setPresetId] = useState('recommended')
  const [summary, setSummary] = useState<CompletedWorkout | null>(null)

  if (!profile) return null

  const program: WorkoutProgram = customProgram ?? buildProgram(profile)

  const lastCompletedFor = (sessionName: string): CompletedWorkout | undefined =>
    [...completedWorkouts].reverse().find((w) => w.sessionName === sessionName)

  if (activeWorkout) return <ActiveWorkoutScreen onFinished={setSummary} />
  if (summary) return <WorkoutSummary workout={summary} history={completedWorkouts} onClose={() => setSummary(null)} />
  if (mode === 'edit')
    return (
      <ProgramEditor
        program={program}
        onSave={(p) => {
          setCustomProgram(p)
          setMode('list')
        }}
        onCancel={() => setMode('list')}
      />
    )

  return (
    <main>
      <div className="card">
        <h1>Action — your training programs</h1>
        <p className="muted">
          Pick a preset, customize any session, and hit <strong>Start workout</strong> at the gym — each
          set prefills what you lifted last time, so logging is two taps, not ten.
        </p>
        <div className="choice-grid">
          {PROGRAM_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`choice ${presetId === p.id && !customProgram ? 'selected' : ''}`}
              onClick={() => {
                setPresetId(p.id)
                setCustomProgram(p.id === 'recommended' ? null : buildPresetProgram(profile, p.id))
              }}
            >
              {p.name}
              <span className="desc">{p.description}</span>
            </button>
          ))}
        </div>
        {customProgram && (
          <p className="small muted" style={{ marginTop: 8 }}>
            Using a customized program.{' '}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                setCustomProgram(null)
                setPresetId('recommended')
              }}
            >
              Reset to recommended
            </a>
          </p>
        )}
        <div style={{ marginTop: 10 }}>
          <button className="ghost" onClick={() => setMode('edit')}>
            ✏️ Customize program
          </button>
        </div>
      </div>

      {program.sessions.map((s) => {
        const last = lastCompletedFor(s.name)
        return (
          <div className="card" key={s.name}>
            <h2>
              {s.name} <span className="pill info">{s.focus}</span>
            </h2>
            {last && (
              <p className="small muted">
                Last time: {last.date} — {last.totalSets} sets, {last.totalVolumeKg.toLocaleString()} kg
                total volume
              </p>
            )}
            <div className="table-scroll">
              <table className="exercise-table">
                <thead>
                  <tr>
                    <th>Exercise</th>
                    <th>Sets</th>
                    <th>Reps</th>
                    <th>Effort</th>
                  </tr>
                </thead>
                <tbody>
                  {s.exercises.map((e, i) => (
                    <tr key={i}>
                      <td>{e.name}</td>
                      <td>{e.sets}</td>
                      <td>{e.reps}</td>
                      <td>{e.rpe}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="small muted">Warm-up: {s.warmup[0]} · Mobility finisher: {s.mobilityFinisher.join(' · ')}</p>
            <button className="primary" onClick={() => startWorkout(s, last)}>
              ▶ Start workout
            </button>
          </div>
        )
      })}

      <div className="card">
        <h2>Cardio this week</h2>
        <p>{program.cardio.description}</p>
        <p>{program.cardio.hiitDescription}</p>
        <p className="small muted">
          Steps floor: {program.cardio.stepsTarget.toLocaleString()}/day · {program.deloadRule}
        </p>
      </div>

      {completedWorkouts.length > 0 && (
        <div className="card">
          <h2>Recent workouts</h2>
          {[...completedWorkouts]
            .slice(-6)
            .reverse()
            .map((w, i) => (
              <div className="check-row" key={`${w.date}-${w.sessionName}-${i}`}>
                <span>
                  <strong>{w.sessionName}</strong>{' '}
                  <span className="muted small">
                    {w.date} · {w.durationMin} min · {w.totalSets} sets · {w.totalVolumeKg.toLocaleString()} kg
                  </span>
                </span>
              </div>
            ))}
        </div>
      )}
    </main>
  )
}

/* ---------------- Program editor ---------------- */

function ProgramEditor({
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

function ActiveWorkoutScreen({ onFinished }: { onFinished: (w: CompletedWorkout) => void }) {
  const { activeWorkout, updateActiveSet, addActiveSet, cancelWorkout, finishWorkout } = useAppStore()
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
      <div className="card">
        <h1>{activeWorkout.sessionName}</h1>
        <p className="muted small">
          Fill weight × reps, tap ✓ when the set is done — values are prefilled from last time. Beat one
          number (a rep or 2.5 kg) somewhere today.
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
        <div className="card" key={exIdx}>
          <h3>
            {ex.name} <span className="muted small">target {ex.targetReps}</span>
          </h3>
          <div className="set-header">
            <span>Set</span>
            <span>kg</span>
            <span>reps</span>
            <span>✓</span>
          </div>
          {ex.sets.map((st, setIdx) => (
            <div className={`set-row ${st.done ? 'done' : ''}`} key={setIdx}>
              <span className="set-num">{setIdx + 1}</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.5"
                value={st.weightKg ?? ''}
                placeholder="kg"
                aria-label={`${ex.name} set ${setIdx + 1} weight`}
                onChange={(e) =>
                  updateActiveSet(exIdx, setIdx, {
                    weightKg: e.target.value === '' ? null : Number(e.target.value),
                  })
                }
              />
              <input
                type="number"
                inputMode="numeric"
                value={st.reps ?? ''}
                placeholder="reps"
                aria-label={`${ex.name} set ${setIdx + 1} reps`}
                onChange={(e) =>
                  updateActiveSet(exIdx, setIdx, {
                    reps: e.target.value === '' ? null : Number(e.target.value),
                  })
                }
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
        </div>
      ))}

      <div className="workout-footer">
        <span>
          ⏱ {elapsedMin}:{String(elapsedSec).padStart(2, '0')} · {doneSets} sets done
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

/* ---------------- Post-workout summary ---------------- */

function WorkoutSummary({
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
          Progress lives in the Progress tab — volume, strength trend and your weight curve.
        </p>
        <button className="primary" onClick={onClose}>
          Done
        </button>
      </div>
    </main>
  )
}
