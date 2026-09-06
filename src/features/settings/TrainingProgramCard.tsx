import { useState } from 'react'
import { useAppStore } from '../../state/store'
import { buildPresetProgram, buildProgram, PROGRAM_PRESETS, presetDescription, presetLabel } from '../../lib/programs'
import { recommendProgram } from '../../lib/programMatrix'
import { threeDayFullBody } from '../../lib/threeDayFullBody'
import { ProgramEditor } from '../action/ActionView'
import { tr, L, useLocale } from '../../i18n'

export default function TrainingProgramCard() {
  useLocale()
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
  const mark = (id: string) =>
    current === id ? (
      <span className="check" aria-label={tr('selected', 'valt')}>
        ✓
      </span>
    ) : null

  return (
    <div className="card">
      <h2>{tr('🏋️ Training program', '🏋️ Träningsprogram')}</h2>
      <p className="muted small">
        {tr(
          'Your main schema is chosen from research for your goal, days and experience. You don’t have to pick — but you can swap or edit here.',
          'Ditt huvudupplägg väljs utifrån forskning för ditt mål, dina dagar och din erfarenhet. Du behöver inte välja — men du kan byta eller redigera här.',
        )}
      </p>

      <div className="banner info small">
        <strong>
          {tr('Recommended:', 'Rekommenderat:')} {L(rec.splitName)}
        </strong>
        <p style={{ margin: '4px 0 0' }}>{rec.rationale}</p>
        <a href={rec.sourceUrl} target="_blank" rel="noopener noreferrer">
          {rec.sourceName} ↗
        </a>
      </div>

      <h3>{tr('Weekly setup', 'Veckoupplägg')}</h3>
      <div className="setup-row">
        <span>{tr('Training days / week', 'Träningsdagar / vecka')}</span>
        <div className="stepper activity-stepper">
          <button type="button" aria-label={tr('Fewer training days', 'Färre träningsdagar')} onClick={() => stepDays(-1)}>
            −
          </button>
          <input
            type="number"
            value={profile.daysPerWeek}
            readOnly
            aria-label={tr('Training days per week', 'Träningsdagar per vecka')}
          />
          <button type="button" aria-label={tr('More training days', 'Fler träningsdagar')} onClick={() => stepDays(1)}>
            +
          </button>
        </div>
      </div>
      <div className="setup-row">
        <span>{tr('Minutes / session', 'Minuter / pass')}</span>
        <div className="stepper activity-stepper">
          <button type="button" aria-label={tr('Shorter sessions', 'Kortare pass')} onClick={() => stepMinutes(-15)}>
            −
          </button>
          <input
            type="number"
            value={profile.minutesPerSession}
            readOnly
            aria-label={tr('Minutes per session', 'Minuter per pass')}
          />
          <button type="button" aria-label={tr('Longer sessions', 'Längre pass')} onClick={() => stepMinutes(15)}>
            +
          </button>
        </div>
      </div>

      <h3>{tr('Choose a program', 'Välj program')}</h3>
      <div className="choice-grid">
        <button
          type="button"
          className={`choice ${current === 'recommended' ? 'selected' : ''}`}
          onClick={() => commit('Use recommended program', null, 'recommended')}
        >
          {mark('recommended')}
          {tr('Recommended', 'Rekommenderat')}
          <span className="desc">
            {L(rec.splitName)} {tr('— research-based for you', '— forskningsbaserat för dig')}
          </span>
        </button>
        <button
          type="button"
          className={`choice ${current === 'imported' ? 'selected' : ''}`}
          onClick={() => commit('Use imported 3 Day Full Body', threeDayFullBody(profile), 'imported')}
        >
          {mark('imported')}
          {tr('My 3 Day Full Body log', `Min logg: ${L('3 Day Full Body')}`)}
          <span className="desc">
            {tr('Your imported program — latest weights prefilled', 'Ditt importerade program — senaste vikterna ifyllda')}
          </span>
        </button>
        {PROGRAM_PRESETS.filter((p) => p.id !== 'recommended').map((p) => (
          <button
            key={p.id}
            type="button"
            className={`choice ${current === p.id ? 'selected' : ''}`}
            onClick={() => commit(`Use preset: ${p.name}`, buildPresetProgram(profile, p.id), p.id)}
          >
            {mark(p.id)}
            {presetLabel(p)}
            <span className="desc">{presetDescription(p)}</span>
          </button>
        ))}
        <button
          type="button"
          className={`choice ${current === 'generated' ? 'selected' : ''}`}
          onClick={() => commit('Use generated program', buildProgram(profile), 'generated')}
        >
          {mark('generated')}
          {tr('Generated for you', 'Genererat för dig')}
          <span className="desc">{tr('Built from your interview answers', 'Byggt från dina intervjusvar')}</span>
        </button>
      </div>

      <div className="program-overview">
        <h3>
          {tr('Your program:', 'Ditt program:')} {L(active.splitName)}
          {current === 'custom' && <span className="pill info">{tr('edited', 'redigerat')}</span>}
        </h3>
        <p className="muted small">
          {tr(
            `${active.sessions.length} sessions · ${profile.daysPerWeek} training days a week. Edits you make here are saved to this profile.`,
            `${active.sessions.length} pass · ${profile.daysPerWeek} träningsdagar i veckan. Ändringar du gör här sparas i den här profilen.`,
          )}
        </p>
        {active.sessions.map((s) => (
          <div className="overview-session" key={s.name}>
            <strong>{L(s.name)}</strong> <span className="muted small">{L(s.focus)}</span>
            <ul className="exercise-peek" style={{ paddingLeft: 0 }}>
              {s.exercises.map((e, i) => (
                <li key={i}>
                  {L(e.name)}{' '}
                  <span>
                    {e.sets}×{L(e.reps)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
        <button className="ghost" onClick={() => setEditing(true)}>
          {tr('✏️ Edit current program', '✏️ Redigera aktuellt program')}
        </button>
        {customProgram && (
          <button className="ghost" onClick={() => commit('Reset to recommended', null, 'recommended')}>
            {tr('↩ Reset to recommended', '↩ Återställ till rekommenderat')}
          </button>
        )}
      </div>
    </div>
  )
}
