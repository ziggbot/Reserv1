import { useState } from 'react'
import { useAppStore } from '../../state/store'
import { CLAUDE_MODELS } from '../../lib/coach/claudeProvider'
import { OPENAI_MODELS } from '../../lib/coach/openaiProvider'
import { resolveCoach, type CoachProviderId } from '../../lib/coach'
import PlanHistory from '../coach/PlanHistory'

type TestState = { status: 'idle' | 'testing' | 'ok' | 'error'; message?: string }

export default function CoachSettingsCard() {
  const { profile, coachSettings, coachApiKeys, setCoachSettings, setCoachApiKey } = useAppStore()
  const [claudeKey, setClaudeKey] = useState(coachApiKeys.claude ?? '')
  const [openaiKey, setOpenaiKey] = useState(coachApiKeys.openai ?? '')
  const [showHistory, setShowHistory] = useState(false)
  const [test, setTest] = useState<TestState>({ status: 'idle' })

  const provider = coachSettings.provider

  function selectProvider(p: CoachProviderId) {
    setCoachSettings({ provider: p })
    setTest({ status: 'idle' })
  }

  function saveKey(which: 'claude' | 'openai') {
    const value = which === 'claude' ? claudeKey : openaiKey
    setCoachApiKey(which, value.trim() ? value : undefined)
    setTest({ status: 'idle' })
  }

  function clearKey(which: 'claude' | 'openai') {
    if (which === 'claude') setClaudeKey('')
    else setOpenaiKey('')
    setCoachApiKey(which, undefined)
    setTest({ status: 'idle' })
  }

  async function testConnection() {
    if (!profile) return
    // Build a resolver from the freshest keys (include the just-typed value).
    const keys = {
      claude: (claudeKey.trim() || coachApiKeys.claude) || undefined,
      openai: (openaiKey.trim() || coachApiKeys.openai) || undefined,
    }
    const coach = resolveCoach(coachSettings, keys)
    if (coach.id === 'local') {
      setTest({ status: 'error', message: 'No API key set for the selected provider — using the built-in coach.' })
      return
    }
    setTest({ status: 'testing' })
    try {
      const ping = { id: 'ping', role: 'user' as const, text: 'Reply with a one-word greeting.', ts: '' }
      await coach.reply([ping], {
        profile,
        program: { splitName: '', sessions: [] } as never,
        scheduleSummary: 'n/a',
      })
      setTest({ status: 'ok', message: `Connected to ${coach.label}.` })
    } catch (e) {
      const why = e instanceof Error ? e.message : 'connection failed'
      setTest({ status: 'error', message: why })
    }
  }

  return (
    <div className="card">
      <h2>🤖 AI training partner</h2>
      <p className="muted small">
        Tap the 💬 button anywhere in the app to chat with your coach about your training — it can
        propose concrete plan changes you review and apply. Choose the engine below; the built-in coach
        works offline with no key.
      </p>

      <h3>Engine</h3>
      <div className="choice-grid">
        {(
          [
            { id: 'local', name: 'Built-in', desc: 'Offline, free, no key — handles common adjustments' },
            { id: 'claude', name: 'Claude', desc: 'Anthropic — needs an API key' },
            { id: 'openai', name: 'OpenAI', desc: 'GPT — needs an API key' },
          ] as { id: CoachProviderId; name: string; desc: string }[]
        ).map((o) => (
          <button
            key={o.id}
            type="button"
            className={`choice ${provider === o.id ? 'selected' : ''}`}
            onClick={() => selectProvider(o.id)}
          >
            {o.name}
            <span className="desc">{o.desc}</span>
          </button>
        ))}
      </div>

      {provider === 'claude' && (
        <div className="coach-provider-config">
          <div className="field">
            <label>Claude API key</label>
            <input
              type="password"
              autoComplete="off"
              placeholder="sk-ant-…"
              value={claudeKey}
              onChange={(e) => setClaudeKey(e.target.value)}
              onBlur={() => saveKey('claude')}
            />
          </div>
          <div className="field">
            <label>Model</label>
            <select
              value={coachSettings.claudeModel}
              onChange={(e) => setCoachSettings({ claudeModel: e.target.value as never })}
            >
              {CLAUDE_MODELS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="primary small-btn" onClick={() => saveKey('claude')}>
              Save key
            </button>
            {coachApiKeys.claude && (
              <button className="ghost small-btn" onClick={() => clearKey('claude')}>
                Clear key
              </button>
            )}
          </div>
        </div>
      )}

      {provider === 'openai' && (
        <div className="coach-provider-config">
          <div className="field">
            <label>OpenAI API key</label>
            <input
              type="password"
              autoComplete="off"
              placeholder="sk-…"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              onBlur={() => saveKey('openai')}
            />
          </div>
          <div className="field">
            <label>Model</label>
            <select
              value={coachSettings.openaiModel}
              onChange={(e) => setCoachSettings({ openaiModel: e.target.value as never })}
            >
              {OPENAI_MODELS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="primary small-btn" onClick={() => saveKey('openai')}>
              Save key
            </button>
            {coachApiKeys.openai && (
              <button className="ghost small-btn" onClick={() => clearKey('openai')}>
                Clear key
              </button>
            )}
          </div>
        </div>
      )}

      {provider !== 'local' && (
        <div style={{ marginTop: 12 }}>
          <button className="ghost" onClick={testConnection} disabled={test.status === 'testing'}>
            {test.status === 'testing' ? 'Testing…' : '🔌 Test connection'}
          </button>
          {test.status === 'ok' && <div className="banner ok small" style={{ marginTop: 8 }}>✅ {test.message}</div>}
          {test.status === 'error' && (
            <div className="banner danger small" style={{ marginTop: 8 }}>
              ⚠️ {test.message}
            </div>
          )}
        </div>
      )}

      <p className="muted small" style={{ marginTop: 12 }}>
        🔐 Your API key is encrypted on this device with your passcode and is sent only to the provider
        you choose, and only when you chat. The hosted preview’s sandbox blocks these outbound calls, so
        the AI engines work in the installed/PWA build — in the preview the coach falls back to the
        built-in engine automatically.
      </p>

      <div style={{ marginTop: 12 }}>
        <button className="ghost" onClick={() => setShowHistory((v) => !v)}>
          🕑 {showHistory ? 'Hide' : 'Show'} plan history
        </button>
        {showHistory && (
          <div style={{ marginTop: 10 }}>
            <PlanHistory />
          </div>
        )}
      </div>
    </div>
  )
}
