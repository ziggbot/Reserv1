import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../../state/store'
import { defaultProgram } from '../../lib/threeDayFullBody'
import { buildWeeklySchedule } from '../../lib/weeklySchedule'
import { resolveCoach } from '../../lib/coach'
import { describeChange, type ChatMessage, type PlanProposal } from '../../lib/coach/types'
import PlanHistory from './PlanHistory'

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
      reply = { text: 'Something went wrong reaching the coach. Please try again.' }
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
    <div className="coach-overlay" role="dialog" aria-label="AI training partner">
      <div className="coach-sheet">
        <div className="coach-header">
          <div>
            <strong>🤝 Training partner</strong>
            <div className="muted small">{coach.label}</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="ghost icon-btn" onClick={() => setShowHistory((v) => !v)} title="Plan history">
              🕑
            </button>
            <button className="ghost icon-btn" onClick={onClose} aria-label="Close">
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
                  Hi {profile.name}! I’m your training partner. Tell me what’s going on and I’ll suggest
                  concrete plan changes you can apply — every change is saved to your plan history so you
                  can undo it.
                </p>
                <p>Try:</p>
                <ul>
                  <li>“I can only train 2 days a week”</li>
                  <li>“Only 30 minutes per session”</li>
                  <li>“Switch my goal to building muscle”</li>
                  <li>“My knee hurts”</li>
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
                      <span className="pill ok">Applied</span>
                    ) : m.proposalDismissed ? (
                      <span className="pill info">Dismissed</span>
                    ) : (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="primary small-btn" onClick={() => apply(m.id, m.proposal!)}>
                          ✅ Apply change
                        </button>
                        <button className="ghost small-btn" onClick={() => markProposal(m.id, 'dismissed')}>
                          Dismiss
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
              placeholder="Message your coach…"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              aria-label="Message your coach"
            />
            <button className="primary" disabled={!input.trim() || busy} onClick={send}>
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
