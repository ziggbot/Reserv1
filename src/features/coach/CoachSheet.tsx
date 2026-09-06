import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../../state/store'
import { defaultProgram } from '../../lib/threeDayFullBody'
import { buildWeeklySchedule } from '../../lib/weeklySchedule'
import { resolveCoach } from '../../lib/coach'
import { describeChange, type ChatMessage, type PlanProposal } from '../../lib/coach/types'
import PlanHistory from './PlanHistory'
import { tr } from '../../i18n'

function newId(): string {
  const b = new Uint8Array(6)
  crypto.getRandomValues(b)
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
}

export default function CoachSheet({ onClose }: { onClose: () => void }) {
  const {
    profile,
    customProgram,
    coachMessages,
    coachSettings,
    coachApiKeys,
    addCoachMessage,
    markProposal,
    applyPlanChanges,
  } = useAppStore()
  const coach = resolveCoach(coachSettings, coachApiKeys)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [coachMessages, busy])

  if (!profile) return null
  const program = defaultProgram(profile, customProgram)

  async function send() {
    const text = input.trim()
    if (!text || busy) return
    setInput('')
    const userMsg: ChatMessage = { id: newId(), role: 'user', text, ts: new Date().toISOString() }
    addCoachMessage(userMsg)
    setBusy(true)
    const context = {
      profile: profile!,
      program,
      scheduleSummary: buildWeeklySchedule(profile!, program).summaryLine,
    }
    let reply
    try {
      reply = await coach.reply([...coachMessages, userMsg], context)
    } catch {
      reply = { text: tr('Something went wrong reaching the coach. Please try again.', 'Något gick fel när coachen skulle nås. Försök igen.') }
    }
    addCoachMessage({
      id: newId(),
      role: 'coach',
      text: reply.text,
      ts: new Date().toISOString(),
      proposal: reply.proposal,
    })
    setBusy(false)
  }

  function apply(messageId: string, proposal: PlanProposal) {
    applyPlanChanges(proposal.changes, 'coach', proposal.summary)
    markProposal(messageId, 'applied')
  }

  return (
    <div className="coach-overlay" role="dialog" aria-label={tr('AI training partner', 'AI-träningskompis')}>
      <div className="coach-sheet">
        <div className="coach-header">
          <div>
            <strong>🤝 {tr('Training partner', 'Träningskompis')}</strong>
            <div className="muted small">{coach.label}</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="ghost icon-btn" onClick={() => setShowHistory((v) => !v)} title={tr('Plan history', 'Planhistorik')}>
              🕑
            </button>
            <button className="ghost icon-btn" onClick={onClose} aria-label={tr('Close', 'Stäng')}>
              ✕
            </button>
          </div>
        </div>

        {showHistory ? (
          <div className="coach-body">
            <PlanHistory />
          </div>
        ) : (
          <div className="coach-body" ref={listRef}>
            {coachMessages.length === 0 && (
              <div className="coach-intro muted small">
                <p>
                  {tr(
                    `Hi ${profile.name}! I’m your training partner. Tell me what’s going on and I’ll suggest concrete plan changes you can apply — every change is saved to your plan history so you can undo it.`,
                    `Hej ${profile.name}! Jag är din träningskompis. Berätta vad som händer så föreslår jag konkreta ändringar i planen som du kan aktivera – varje ändring sparas i din planhistorik så att du kan ångra den.`,
                  )}
                </p>
                <p>{tr('Try:', 'Testa:')}</p>
                <ul>
                  <li>{tr('“I can only train 2 days a week”', '”Jag kan bara träna 2 dagar i veckan”')}</li>
                  <li>{tr('“Only 30 minutes per session”', '”Bara 30 minuter per pass”')}</li>
                  <li>{tr('“Switch my goal to building muscle”', '”Byt mitt mål till att bygga muskler”')}</li>
                  <li>{tr('“My knee hurts”', '”Mitt knä gör ont”')}</li>
                </ul>
              </div>
            )}
            {coachMessages.map((m) => (
              <div key={m.id} className={`bubble ${m.role}`}>
                <div className="bubble-text">{m.text}</div>
                {m.proposal && (
                  <div className="proposal">
                    <strong>{m.proposal.summary}</strong>
                    <ul>
                      {m.proposal.changes.map((c, i) => (
                        <li key={i}>{describeChange(c)}</li>
                      ))}
                    </ul>
                    {m.proposalApplied ? (
                      <span className="pill ok">{tr('Applied', 'Aktiverad')}</span>
                    ) : m.proposalDismissed ? (
                      <span className="pill info">{tr('Dismissed', 'Avvisad')}</span>
                    ) : (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="primary small-btn" onClick={() => apply(m.id, m.proposal!)}>
                          ✅ {tr('Apply change', 'Aktivera ändring')}
                        </button>
                        <button className="ghost small-btn" onClick={() => markProposal(m.id, 'dismissed')}>
                          {tr('Dismiss', 'Avvisa')}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {busy && <div className="bubble coach"><div className="bubble-text muted">…</div></div>}
          </div>
        )}

        {!showHistory && (
          <div className="coach-input">
            <input
              type="text"
              value={input}
              placeholder={tr('Message your coach…', 'Skriv till din coach…')}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              aria-label={tr('Message your coach', 'Skriv till din coach')}
            />
            <button className="primary" disabled={!input.trim() || busy} onClick={send}>
              {tr('Send', 'Skicka')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
