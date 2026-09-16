import { useState } from 'react'
import { useAppStore } from '../../state/store'
import { resolveCoach, resolvePrimaryCoach } from '../../lib/coach'
import { buildCoachContext } from '../../lib/coach/context'
import { generateRequest, programDiff, reviewRequest, toWorkoutProgram } from '../../lib/coach/programGen'
import type { ChatMessage, PlanProposal } from '../../lib/coach/types'
import { tr, L, fmtDate } from '../../i18n'
import type { Tab } from '../../App'

function newId(): string {
  const b = new Uint8Array(6)
  crypto.getRandomValues(b)
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
}

/**
 * The coach's own program for this person. Created from the profile and the
 * training log, then kept current through dialogue: every change arrives as a
 * proposal with a diff, is applied with one tap, and is logged with the
 * coach's reasoning. Needs a Claude or OpenAI key.
 */
export default function AiProgramCard({ onNavigate }: { onNavigate: (t: Tab) => void }) {
  const {
    profile,
    aiProgram,
    aiProgramLog,
    customProgram,
    programChoice,
    customExercises,
    completedWorkouts,
    coachSettings,
    coachApiKeys,
    addCoachMessage,
    markProposal,
    applyPlanChanges,
    setCustomProgram,
  } = useAppStore()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<{ messageId: string; proposal: PlanProposal; text: string } | null>(null)
  const [ask, setAsk] = useState('')
  if (!profile) return null

  const llm = resolvePrimaryCoach(coachSettings, coachApiKeys)
  const coach = resolveCoach(coachSettings, coachApiKeys)
  const current = programChoice ?? (customProgram ? 'custom' : 'recommended')
  const active = current === 'ai'
  const lastEntry = aiProgramLog[0]

  // Review nudge: 6+ program sessions since the last change, or feedback trending off.
  const since = lastEntry ? completedWorkouts.filter((w) => w.date >= lastEntry.ts.slice(0, 10)) : []
  const programSessions = aiProgram ? since.filter((w) => aiProgram.sessions.some((s) => s.name === w.sessionName)) : []
  const offFeedback = programSessions.filter((w) => w.feedback && (w.feedback.effort !== 'right' || w.feedback.flagged.length > 0)).length
  const nudge = aiProgram && active && (programSessions.length >= 6 || offFeedback >= 2)

  async function send(text: string, autoApply: boolean) {
    if (!llm || busy) return
    setBusy(true)
    setError(null)
    setPending(null)
    const userMsg: ChatMessage = { id: newId(), role: 'user', text, ts: new Date().toISOString() }
    addCoachMessage(userMsg)
    try {
      const history = [...useAppStore.getState().coachMessages]
      const reply = await coach.reply(history, buildCoachContext()!)
      const coachMsg: ChatMessage = { id: newId(), role: 'coach', text: reply.text, ts: new Date().toISOString(), proposal: reply.proposal }
      addCoachMessage(coachMsg)
      const update = reply.proposal?.changes.find((c) => c.type === 'programUpdate')
      if (reply.proposal && update) {
        if (autoApply) {
          applyPlanChanges(reply.proposal.changes, 'coach', reply.proposal.summary)
          markProposal(coachMsg.id, 'applied')
        } else {
          setPending({ messageId: coachMsg.id, proposal: reply.proposal, text: reply.text })
        }
      } else {
        setError(reply.text)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'failed')
    } finally {
      setBusy(false)
    }
  }

  const applyPending = () => {
    if (!pending) return
    applyPlanChanges(pending.proposal.changes, 'coach', pending.proposal.summary)
    markProposal(pending.messageId, 'applied')
    setPending(null)
  }
  const dismissPending = () => {
    if (!pending) return
    markProposal(pending.messageId, 'dismissed')
    setPending(null)
  }

  return (
    <div className={`card ai-program ${active ? 'active' : ''}`}>
      <h2>
        🤖 {tr('Your AI coach’s program', 'Din AI-coachs program')}{' '}
        {active && <span className="pill ok">{tr('in use', 'används')}</span>}
      </h2>
      <p className="muted small">
        {tr(
          'A program written for you from your profile and training log, then kept current through dialogue: rate each session, flag what hurts, ask for changes. Every update comes as a proposal you approve, with the coach’s reasoning logged.',
          'Ett program skrivet för dig utifrån din profil och träningslogg, som sedan hålls aktuellt genom dialog: betygsätt varje pass, flagga det som gör ont, be om ändringar. Varje uppdatering kommer som ett förslag du godkänner, med coachens motivering loggad.',
        )}
      </p>

      {!llm && (
        <div className="banner info small">
          {tr('Needs the AI coach. Add a Claude or OpenAI key under', 'Kräver AI-coachen. Lägg in en Claude- eller OpenAI-nyckel under')}{' '}
          <button className="link" onClick={() => onNavigate('settings')}>
            {tr('Settings → AI training partner', 'Inställningar → AI-träningspartner')}
          </button>
          .
        </div>
      )}

      {!aiProgram ? (
        <button className="primary" disabled={!llm || busy} onClick={() => void send(generateRequest(), true)}>
          {busy ? tr('Writing your program…', 'Skriver ditt program…') : tr('✨ Create my program', '✨ Skapa mitt program')}
        </button>
      ) : (
        <>
          <div className="program-overview" style={{ borderTop: 'none', paddingTop: 0, marginTop: 8 }}>
            <h3>
              {aiProgram.splitName}
              {lastEntry && (
                <span className="muted small" style={{ fontFamily: 'var(--body)', fontWeight: 400 }}>
                  · {tr('updated', 'uppdaterat')} {fmtDate(lastEntry.ts.slice(0, 10), { day: 'numeric', month: 'short' })}
                </span>
              )}
            </h3>
            {aiProgram.sessions.map((s) => (
              <div className="overview-session" key={s.name}>
                <strong>{L(s.name)}</strong> <span className="muted small">{L(s.focus)}</span>
                <ul className="exercise-peek" style={{ paddingLeft: 0 }}>
                  {s.exercises.map((e, i) => (
                    <li key={i}>
                      {L(e.name)} <span>{e.sets}×{L(e.reps)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {lastEntry?.unknownExercises && lastEntry.unknownExercises.length > 0 && (
            <p className="muted small">
              {tr('Coach-invented exercises (not in the library):', 'Övningar coachen hittade på (finns inte i biblioteket):')}{' '}
              {lastEntry.unknownExercises.join(', ')}
            </p>
          )}
          {nudge && (
            <div className="banner warn small">
              {tr(
                'Time for a review: several sessions logged since the last change, or your feedback says the load is off.',
                'Dags för en översyn: flera pass loggade sedan senaste ändringen, eller så säger din feedback att belastningen inte stämmer.',
              )}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            {!active && (
              <button
                className="primary"
                onClick={() => {
                  useAppStore.getState().commitPlanRevision('user', 'Use AI program')
                  setCustomProgram(aiProgram, 'ai')
                }}
              >
                {tr('Use this program', 'Använd det här programmet')}
              </button>
            )}
            <button className="ghost" disabled={!llm || busy} onClick={() => void send(reviewRequest(), false)}>
              {busy ? tr('Reviewing…', 'Går igenom…') : tr('🔍 Review against my log', '🔍 Gå igenom mot min logg')}
            </button>
            <button className="ghost" disabled={!llm || busy} onClick={() => void send(generateRequest(), false)}>
              {tr('↻ Rebuild', '↻ Bygg om')}
            </button>
          </div>
        </>
      )}

      <div className="new-exercise" style={{ marginTop: 12 }}>
        <input
          type="text"
          value={ask}
          disabled={!llm || busy}
          placeholder={tr('Ask for a change: “more arms”, “bench hurts my shoulder”…', 'Be om en ändring: ”mer armar”, ”bänken gör ont i axeln”…')}
          aria-label={tr('Ask the coach to change the program', 'Be coachen ändra programmet')}
          onChange={(e) => setAsk(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && ask.trim()) {
              void send(ask.trim(), false)
              setAsk('')
            }
          }}
        />
        <button
          className="primary small-btn"
          disabled={!llm || busy || !ask.trim()}
          onClick={() => {
            void send(ask.trim(), false)
            setAsk('')
          }}
        >
          {tr('Send', 'Skicka')}
        </button>
      </div>

      {error && <div className="banner warn small">{error}</div>}

      {pending && (
        <div className="proposal">
          <div className="bubble-text small" style={{ marginBottom: 6 }}>
            {pending.text}
          </div>
          <strong>{pending.proposal.summary}</strong>
          <ul className="diff">
            {(() => {
              const c = pending.proposal.changes.find((x) => x.type === 'programUpdate')
              if (!c || c.type !== 'programUpdate') return null
              const built = toWorkoutProgram(c.program, profile, customExercises)
              if (!built) return <li>{tr('Could not read the program', 'Kunde inte läsa programmet')}</li>
              return programDiff(aiProgram, built.program).map((line, i) => <li key={i}>{line}</li>)
            })()}
          </ul>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="primary small-btn" onClick={applyPending}>
              ✅ {tr('Apply', 'Aktivera')}
            </button>
            <button className="ghost small-btn" onClick={dismissPending}>
              {tr('Dismiss', 'Avvisa')}
            </button>
          </div>
        </div>
      )}

      {aiProgramLog.length > 0 && (
        <details className="evidence">
          <summary>{tr('Change log', 'Ändringslogg')} ({aiProgramLog.length})</summary>
          <ul>
            {aiProgramLog.slice(0, 8).map((e, i) => (
              <li key={i}>
                <strong>{fmtDate(e.ts.slice(0, 10), { day: 'numeric', month: 'short' })}</strong> — {e.summary}
                {e.rationale && <div className="muted small">{e.rationale}</div>}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
