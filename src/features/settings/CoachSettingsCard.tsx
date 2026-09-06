import { useState } from 'react'
import { useAppStore } from '../../state/store'
import { CLAUDE_MODELS } from '../../lib/coach/claudeProvider'
import { OPENAI_MODELS } from '../../lib/coach/openaiProvider'
import { resolveCoach, type CoachProviderId } from '../../lib/coach'
import PlanHistory from '../coach/PlanHistory'
import { tr, useLocale } from '../../i18n'

type TestState = { status: 'idle' | 'testing' | 'ok' | 'error'; message?: string }

export default function CoachSettingsCard() {
  useLocale()
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
      setTest({
        status: 'error',
        message: tr(
          'No API key set for the selected provider — using the built-in coach.',
          'Ingen API-nyckel angiven för vald leverantör — den inbyggda coachen används.',
        ),
      })
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
      setTest({ status: 'ok', message: tr(`Connected to ${coach.label}.`, `Ansluten till ${coach.label}.`) })
    } catch (e) {
      const why = e instanceof Error ? e.message : tr('connection failed', 'anslutningen misslyckades')
      setTest({ status: 'error', message: why })
    }
  }

  const engines: { id: CoachProviderId; name: string; desc: string }[] = [
    {
      id: 'local',
      name: tr('Built-in', 'Inbyggd'),
      desc: tr('Offline, free, no key — handles common adjustments', 'Offline, gratis, ingen nyckel — klarar vanliga justeringar'),
    },
    { id: 'claude', name: 'Claude', desc: tr('Anthropic — needs an API key', 'Anthropic — kräver en API-nyckel') },
    { id: 'openai', name: 'OpenAI', desc: tr('GPT — needs an API key', 'GPT — kräver en API-nyckel') },
  ]

  return (
    <div className="card">
      <h2>{tr('🤖 AI training partner', '🤖 AI-träningspartner')}</h2>
      <p className="muted small">
        {tr(
          'Tap the 💬 button anywhere in the app to chat with your coach about your training — it can propose concrete plan changes you review and apply. Choose the engine below; the built-in coach works offline with no key.',
          'Tryck på 💬-knappen var som helst i appen för att chatta med din coach om träningen — den kan föreslå konkreta planändringar som du granskar och tillämpar. Välj motor nedan; den inbyggda coachen fungerar offline utan nyckel.',
        )}
      </p>

      <h3>{tr('Engine', 'Motor')}</h3>
      <div className="choice-grid">
        {engines.map((o) => (
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
            <label>{tr('Claude API key', 'Claude API-nyckel')}</label>
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
            <label>{tr('Model', 'Modell')}</label>
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
              {tr('Save key', 'Spara nyckel')}
            </button>
            {coachApiKeys.claude && (
              <button className="ghost small-btn" onClick={() => clearKey('claude')}>
                {tr('Clear key', 'Rensa nyckel')}
              </button>
            )}
          </div>
        </div>
      )}

      {provider === 'openai' && (
        <div className="coach-provider-config">
          <div className="field">
            <label>{tr('OpenAI API key', 'OpenAI API-nyckel')}</label>
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
            <label>{tr('Model', 'Modell')}</label>
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
              {tr('Save key', 'Spara nyckel')}
            </button>
            {coachApiKeys.openai && (
              <button className="ghost small-btn" onClick={() => clearKey('openai')}>
                {tr('Clear key', 'Rensa nyckel')}
              </button>
            )}
          </div>
        </div>
      )}

      {provider !== 'local' && (
        <div style={{ marginTop: 12 }}>
          <button className="ghost" onClick={testConnection} disabled={test.status === 'testing'}>
            {test.status === 'testing' ? tr('Testing…', 'Testar…') : tr('🔌 Test connection', '🔌 Testa anslutningen')}
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
        {tr(
          '🔐 Your API key is encrypted on this device with your passcode and is sent only to the provider you choose, and only when you chat. The hosted preview’s sandbox blocks these outbound calls, so the AI engines work in the installed/PWA build — in the preview the coach falls back to the built-in engine automatically.',
          '🔐 Din API-nyckel krypteras på den här enheten med din kod och skickas bara till leverantören du väljer, och bara när du chattar. Den hostade förhandsvisningens sandlåda blockerar de utgående anropen, så AI-motorerna fungerar i den installerade PWA-versionen — i förhandsvisningen faller coachen automatiskt tillbaka på den inbyggda motorn.',
        )}
      </p>

      <div style={{ marginTop: 12 }}>
        <button className="ghost" onClick={() => setShowHistory((v) => !v)}>
          🕑 {showHistory ? tr('Hide plan history', 'Dölj planhistorik') : tr('Show plan history', 'Visa planhistorik')}
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
