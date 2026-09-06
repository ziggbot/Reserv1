import { useState } from 'react'
import { useAppStore } from '../../state/store'
import { buildPresetProgram, buildProgram, PROGRAM_PRESETS } from '../../lib/programs'
import { recommendProgram } from '../../lib/programMatrix'
import { threeDayFullBody } from '../../lib/threeDayFullBody'
import { ProgramEditor } from '../action/ActionView'

export default function TrainingProgramCard() {
  const { profile, customProgram, programChoice, setCustomProgram } = useAppStore()
  const [editing, setEditing] = useState(false)
  if (!profile) return null

  const rec = recommendProgram(profile)
  const commit = (desc: string, program: (typeof rec)['program'] | null, choice: string) => {
    useAppStore.getState().commitPlanRevision('user', desc)
    setCustomProgram(program, choice)
  }

  function stepDays(delta: number) {
    const next = Math.min(6, Math.max(1, profile!.daysPerWeek + delta))
    if (next === profile!.daysPerWeek) return
    useAppStore.getState().applyPlanChanges(
      [{ type: 'daysPerWeek', value: next }],
      'user',
      `Training days → ${next}/week`,
    )
  }
  function stepMinutes(delta: number) {
    const next = Math.min(120, Math.max(15, profile!.minutesPerSession + delta))
    if (next === profile!.minutesPerSession) return
    useAppStore.getState().applyPlanChanges(
      [{ type: 'minutesPerSession', value: next }],
      'user',
      `Session length → ${next} min`,
    )
  }

  if (editing) {
    const program = customProgram ?? rec.program
    return (
      <ProgramEditor
        program={program}
        onSave={(p) => {
          commit('Edited program', p, 'custom')
          setEditing(false)
        }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  const current = programChoice ?? (customProgram ? 'custom' : 'recommended')
  const active = customProgram ?? rec.program
  const mark = (id: string) => (current === id ? <span className="check" aria-label="selected">✓</span> : null)

  return (
    <div className="card">
      <h2>🏋️ Training program</h2>
      <p className="muted small">
        Your main schema is chosen from research for your goal, days and experience. You don’t have to
        pick — but you can swap or edit here.
      </p>

      <div className="banner info small">
        <strong>Recommended: {rec.splitName}</strong>
        <p style={{ margin: '4px 0 0' }}>{rec.rationale}</p>
        <a href={rec.sourceUrl} target="_blank" rel="noopener noreferrer">
          {rec.sourceName} ↗
        </a>
      </div>

      <h3>Weekly setup</h3>
      <div className="setup-row">
        <span>Training days / week</span>
        <div className="stepper activity-stepper">
          <button type="button" aria-label="Fewer training days" onClick={() => stepDays(-1)}>−</button>
          <input type="number" value={profile.daysPerWeek} readOnly aria-label="Training days per week" />
          <button type="button" aria-label="More training days" onClick={() => stepDays(1)}>+</button>
        </div>
      </div>
      <div className="setup-row">
        <span>Minutes / session</span>
        <div className="stepper activity-stepper">
          <button type="button" aria-label="Shorter sessions" onClick={() => stepMinutes(-15)}>−</button>
          <input type="number" value={profile.minutesPerSession} readOnly aria-label="Minutes per session" />
          <button type="button" aria-label="Longer sessions" onClick={() => stepMinutes(15)}>+</button>
        </div>
      </div>

      <h3>Choose a program</h3>
      <div className="choice-grid">
        <button
          type="button"
          className={`choice ${current === 'recommended' ? 'selected' : ''}`}
          onClick={() => commit('Use recommended program', null, 'recommended')}
        >
          {mark('recommended')}Recommended
          <span className="desc">{rec.splitName} — research-based for you</span>
        </button>
        <button
          type="button"
          className={`choice ${current === 'imported' ? 'selected' : ''}`}
          onClick={() => commit('Use imported 3 Day Full Body', threeDayFullBody(profile), 'imported')}
        >
          {mark('imported')}My 3 Day Full Body log
          <span className="desc">Your imported program — latest weights prefilled</span>
        </button>
        {PROGRAM_PRESETS.filter((p) => p.id !== 'recommended').map((p) => (
          <button
            key={p.id}
            type="button"
            className={`choice ${current === p.id ? 'selected' : ''}`}
            onClick={() => commit(`Use preset: ${p.name}`, buildPresetProgram(profile, p.id), p.id)}
          >
            {mark(p.id)}{p.name}
            <span className="desc">{p.description}</span>
          </button>
        ))}
        <button
          type="button"
          className={`choice ${current === 'generated' ? 'selected' : ''}`}
          onClick={() => commit('Use generated program', buildProgram(profile), 'generated')}
        >
          {mark('generated')}Generated for you
          <span className="desc">Built from your interview answers</span>
        </button>
      </div>

      <div className="program-overview">
        <h3>
          Your program: {active.splitName}
          {current === 'custom' && <span className="pill info">edited</span>}
        </h3>
        <p className="muted small">
          {active.sessions.length} sessions · {profile.daysPerWeek} training days a week. Edits you make here
          are saved to this profile.
        </p>
        {active.sessions.map((s) => (
          <div className="overview-session" key={s.name}>
            <strong>{s.name}</strong> <span className="muted small">{s.focus}</span>
            <ul className="exercise-peek" style={{ paddingLeft: 0 }}>
              {s.exercises.map((e, i) => (
                <li key={i}>
                  {e.name} <span>{e.sets}×{e.reps}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
        <button className="ghost" onClick={() => setEditing(true)}>
          ✏️ Edit current program
        </button>
        {customProgram && (
          <button className="ghost" onClick={() => commit('Reset to recommended', null, 'recommended')}>
            ↩ Reset to recommended
          </button>
        )}
      </div>
    </div>
  )
}
