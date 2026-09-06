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
import { tr, L } from '../../i18n'

/**
 * Training building blocks. The home screen (features/train/TrainHome) composes
 * these; this file keeps the workout logger, the summary, the program editor
 * and the cardio/endurance/stretch proposals.
 */

/* ---------------- Cardio / endurance / stretch proposals ---------------- */

function sectionIntro(category: Exclude<ActivityCategory, 'strength'>): string {
  switch (category) {
    case 'cardio':
      return tr(
        'Conditioning sessions that fit around your strength days. Do them, tap Log, and they land on your Progress timeline.',
        'Konditionspass som passar in runt dina styrkepass. Kör dem, tryck Logga, så hamnar de på din tidslinje under Utveckling.',
      )
    case 'endurance':
      return tr(
        'Longer engine-building work — one of these a week compounds into a big aerobic base. Scaled to your level.',
        'Längre pass som bygger motorn – ett i veckan växer med tiden till en stor aerob bas. Anpassat till din nivå.',
      )
    case 'stretch':
      return tr(
        'Short mobility routines. The best one is the one you actually do — pick by how your body feels today.',
        'Korta rörlighetsrutiner. Den bästa är den du faktiskt gör – välj efter hur kroppen känns idag.',
      )
  }
}

export function ActivitySection({ category }: { category: Exclude<ActivityCategory, 'strength'> }) {
  const profile = useAppStore((s) => s.profile)!
  const proposals = proposalsFor(profile, category)
  return (
    <>
      <p className="muted" style={{ margin: '0 4px 4px' }}>
        {sectionIntro(category)}
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
        {L(proposal.name)} <span className="pill info">~{proposal.durationMin} min</span>
      </h2>
      <p className="muted">{L(proposal.description)}</p>
      <ol>
        {proposal.steps.map((s) => (
          <li key={s}>{L(s)}</li>
        ))}
      </ol>
      {logged ? (
        <p className="banner ok" role="status">
          ✅ {tr(`Logged ${minutes} min — it's on your Progress timeline.`, `${minutes} min loggade – de finns på din tidslinje under Utveckling.`)}
        </p>
      ) : (
        <div className="log-row">
          <div className="stepper activity-stepper">
            <button type="button" aria-label={tr(`Decrease minutes for ${L(proposal.name)}`, `Minska minuter för ${L(proposal.name)}`)} onClick={() => setMinutes((m) => Math.max(5, m - 5))}>
              −
            </button>
            <input
              type="number"
              inputMode="numeric"
              value={minutes}
              aria-label={tr(`Minutes for ${L(proposal.name)}`, `Minuter för ${L(proposal.name)}`)}
              onChange={(e) => setMinutes(Math.max(0, Number(e.target.value) || 0))}
            />
            <button type="button" aria-label={tr(`Increase minutes for ${L(proposal.name)}`, `Öka minuter för ${L(proposal.name)}`)} onClick={() => setMinutes((m) => m + 5)}>
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
            ✓ {tr('Log session', 'Logga pass')}
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
  const customExercises = useAppStore((s) => s.customExercises)
  const addCustomExercise = useAppStore((s) => s.addCustomExercise)
  const [draft, setDraft] = useState<WorkoutProgram>(() => JSON.parse(JSON.stringify(program)))
  const [newName, setNewName] = useState<{ session: number; text: string } | null>(null)
  const library = useMemo(
    () => exerciseLibrary(profile.equipment, profile.injuries),
    [profile.equipment, profile.injuries],
  )
  const known = (name: string) => library.some((l) => l.name === name) || customExercises.includes(name)

  const appendExercise = (si: number, name: string) =>
    setDraft((d) => ({
      ...d,
      sessions: d.sessions.map((s, i) =>
        i === si
          ? { ...s, exercises: [...s.exercises, { name, sets: 3, reps: '8–12', rpe: 'RPE 7–8 (1–3 reps in reserve)' }] }
          : s,
      ),
    }))

  const createExercise = (si: number) => {
    const name = addCustomExercise(newName?.text ?? '')
    if (!name) return
    appendExercise(si, name)
    setNewName(null)
  }

  const updateSession = (idx: number, patch: Partial<WorkoutSession>) =>
    setDraft((d) => ({
      ...d,
      sessions: d.sessions.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    }))

  return (
    <div className="program-editor">
      <div className="card">
        <h1>{tr('Customize your program', 'Anpassa ditt program')}</h1>
        <p className="muted small">
          {tr(
            'Swap exercises (your equipment and injury flags are respected), change targets, rename sessions. ⚠ marks exercises that load an area you flagged as injured.',
            'Byt övningar (din utrustning och dina skador respekteras), ändra mål, döp om pass. ⚠ markerar övningar som belastar ett område du angett som skadat.',
          )}
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="primary" onClick={() => onSave(draft)}>
            {tr('Save program', 'Spara program')}
          </button>
          <button className="ghost" onClick={onCancel}>
            {tr('Cancel', 'Avbryt')}
          </button>
        </div>
      </div>

      {draft.sessions.map((s, si) => (
        <div className="card" key={si}>
          <div className="field">
            <label>{tr('Session name', 'Passets namn')}</label>
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
                {!known(ex.name) && <option value={ex.name}>{L(ex.name)}</option>}
                {customExercises.length > 0 && (
                  <optgroup label={tr('My exercises', 'Mina övningar')}>
                    {customExercises.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label={tr('Library', 'Bibliotek')}>
                  {library.map((l) => (
                    <option key={l.name} value={l.name}>
                      {l.flagged ? '⚠ ' : ''}
                      {L(l.name)}
                    </option>
                  ))}
                </optgroup>
              </select>
              <input
                type="number"
                min={1}
                max={8}
                value={ex.sets}
                aria-label={tr('Sets', 'Set')}
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
                aria-label={tr('Rep target', 'Repsmål')}
                onChange={(e) =>
                  updateSession(si, {
                    exercises: s.exercises.map((x, i) => (i === ei ? { ...x, reps: e.target.value } : x)),
                  })
                }
              />
              <button
                className="ghost icon-btn"
                aria-label={tr('Remove exercise', 'Ta bort övning')}
                onClick={() =>
                  updateSession(si, { exercises: s.exercises.filter((_, i) => i !== ei) })
                }
              >
                ✕
              </button>
            </div>
          ))}
          <div className="editor-actions">
            <button className="ghost" onClick={() => appendExercise(si, library[0]?.name ?? 'Exercise')}>
              + {tr('Add exercise', 'Lägg till övning')}
            </button>
            {newName?.session !== si && (
              <button className="ghost" onClick={() => setNewName({ session: si, text: '' })}>
                ✎ {tr('New exercise…', 'Ny övning…')}
              </button>
            )}
          </div>
          {newName?.session === si && (
            <div className="new-exercise">
              <input
                type="text"
                autoFocus
                value={newName.text}
                placeholder={tr('Exercise name, e.g. Hack squat', 'Övningens namn, t.ex. Hacklift')}
                aria-label={tr('New exercise name', 'Namn på ny övning')}
                onChange={(e) => setNewName({ session: si, text: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') createExercise(si)
                  if (e.key === 'Escape') setNewName(null)
                }}
              />
              <button className="primary small-btn" disabled={!newName.text.trim()} onClick={() => createExercise(si)}>
                {tr('Add', 'Lägg till')}
              </button>
              <button className="ghost small-btn" onClick={() => setNewName(null)}>
                {tr('Cancel', 'Avbryt')}
              </button>
            </div>
          )}
          <p className="muted small">
            {tr(
              'Missing something? Create your own exercise — it is saved to your profile and shows up under “My exercises” next time.',
              'Saknas något? Skapa en egen övning – den sparas i din profil och finns under ”Mina övningar” nästa gång.',
            )}
          </p>
        </div>
      ))}
    </div>
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
        <h1>{L(activeWorkout.sessionName)}</h1>
        <p className="muted small">
          {tr(
            'Weight × reps are prefilled from last time. Tap ✓ when a set is done. Beat one number today.',
            'Vikt × reps är förifyllda från förra gången. Tryck ✓ när ett set är klart. Slå en siffra idag.',
          )}
        </p>
      </div>

      {restEndsAt && restLeft > 0 && (
        <div className="rest-banner" role="timer">
          ⏱ {tr('Rest', 'Vila')}: <strong>{restLeft}s</strong>
          <button className="ghost icon-btn" onClick={() => setRestEndsAt(null)} aria-label={tr('Dismiss rest timer', 'Stäng vilotimern')}>
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
                  {L(ex.name)} ↗
                </a>
              ) : (
                L(ex.name)
              )}{' '}
              <span className="muted small">
                {tr('target', 'mål')} {L(ex.targetReps)}
              </span>
            </h3>
            <button
              className="ghost small-btn"
              onClick={() => skipActiveExercise(exIdx, !ex.skipped)}
              aria-label={
                ex.skipped
                  ? tr(`Do ${L(ex.name)} after all`, `Kör ${L(ex.name)} ändå`)
                  : tr(`Skip ${L(ex.name)}`, `Hoppa över ${L(ex.name)}`)
              }
            >
              {ex.skipped ? tr('Undo skip', 'Ångra hoppa över') : tr('Skip', 'Hoppa över')}
            </button>
          </div>
          {ex.skipped ? (
            <p className="muted small">
              {tr('Skipped today. Your last numbers stay saved for next time.', 'Överhoppad idag. Dina senaste siffror sparas till nästa gång.')}
            </p>
          ) : (
            <>
          <div className="set-header">
            <span>{tr('Set', 'Set')}</span>
            <span>kg</span>
            <span>{tr('reps', 'reps')}</span>
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
                ariaLabel={tr(`${L(ex.name)} set ${setIdx + 1} weight in kg`, `${L(ex.name)} set ${setIdx + 1} vikt i kg`)}
                onChange={(v) => updateActiveSet(exIdx, setIdx, { weightKg: v })}
              />
              <Stepper
                value={st.reps}
                step={1}
                decimals={0}
                placeholder="reps"
                ariaLabel={tr(`${L(ex.name)} set ${setIdx + 1} reps`, `${L(ex.name)} set ${setIdx + 1} reps`)}
                onChange={(v) => updateActiveSet(exIdx, setIdx, { reps: v })}
              />
              <button
                className={`set-check ${st.done ? 'checked' : ''}`}
                aria-label={
                  st.done
                    ? tr(`Mark set ${setIdx + 1} not done`, `Markera set ${setIdx + 1} som inte klart`)
                    : tr(`Mark set ${setIdx + 1} done`, `Markera set ${setIdx + 1} som klart`)
                }
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
            + {tr('Add set', 'Lägg till set')}
          </button>
            </>
          )}
        </div>
      ))}

      <div className="workout-footer">
        <span className="elapsed">
          ⏱ {elapsedMin}:{String(elapsedSec).padStart(2, '0')} · {doneSets} {tr('sets', 'set')}
        </span>
        {!confirmCancel ? (
          <button className="ghost" onClick={() => setConfirmCancel(true)}>
            {tr('Discard', 'Släng')}
          </button>
        ) : (
          <button className="ghost" style={{ color: 'var(--danger)' }} onClick={cancelWorkout}>
            {tr('Really discard?', 'Släng passet?')}
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
          {tr('Finish', 'Avsluta')}
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
        aria-label={tr(`Decrease ${ariaLabel}`, `Minska ${ariaLabel}`)}
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
      <button type="button" aria-label={tr(`Increase ${ariaLabel}`, `Öka ${ariaLabel}`)} onClick={() => onChange(round((value ?? 0) + step))}>
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
        <h1>💪 {tr('Workout saved', 'Passet sparat')}</h1>
        <div className="stat-row">
          <div className="stat">
            <div className="value">{workout.durationMin}</div>
            <div className="label">{tr('minutes', 'minuter')}</div>
          </div>
          <div className="stat">
            <div className="value">{workout.totalSets}</div>
            <div className="label">{tr('sets', 'set')}</div>
          </div>
          <div className="stat">
            <div className="value">{workout.totalVolumeKg.toLocaleString()}</div>
            <div className="label">{tr('kg volume', 'kg volym')}</div>
          </div>
        </div>
        <h2>{tr('Best set per exercise', 'Bästa set per övning')}</h2>
        <ul>
          {workout.exercises.map((ex) => {
            const best = ex.sets.reduce(
              (b, st) => ((st.weightKg ?? 0) > (b.weightKg ?? 0) ? st : b),
              ex.sets[0],
            )
            const isPr = (best.weightKg ?? 0) > previousBest(ex.name) && (best.weightKg ?? 0) > 0
            return (
              <li key={ex.name}>
                {L(ex.name)}: <strong>{best.weightKg ?? 0} kg × {best.reps ?? 0}</strong>{' '}
                {isPr && <span className="pill ok">PR</span>}
              </li>
            )
          })}
        </ul>
        <p className="muted small">
          {tr('Volume, strength trend and your weight curve live under Progress.', 'Volym, styrketrend och din viktkurva finns under Utveckling.')}
        </p>
        <button className="primary" onClick={onClose}>
          {tr('Done', 'Klar')}
        </button>
      </div>
    </main>
  )
}
