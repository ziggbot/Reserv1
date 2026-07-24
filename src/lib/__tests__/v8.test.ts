import { afterEach, describe, expect, it, vi } from 'vitest'
import { recommendProgram } from '../programMatrix'
import { makeClaudeProvider } from '../coach/claudeProvider'
import { makeOpenAIProvider } from '../coach/openaiProvider'
import { resolveCoach, DEFAULT_COACH_SETTINGS } from '../coach'
import { parseCoachJson, toCoachReply } from '../coach/prompt'
import { useAppStore } from '../../state/store'
import type { Profile } from '../types'
import type { CoachContext } from '../coach/types'

const base: Profile = {
  name: 'Peter',
  age: 38,
  sex: 'male',
  heightCm: 182,
  weightKg: 92,
  goal: 'muscle_gain',
  goalWeightKg: undefined,
  fitnessLevel: 'intermediate',
  medicalConditions: [],
  injuries: [],
  equipment: 'full_gym',
  daysPerWeek: 3,
  minutesPerSession: 60,
  sleepHours: 7,
  stressLevel: 'moderate',
  activityLevel: 'light',
  dietPref: 'omnivore',
  mealsPerDay: 3,
  lifestyle: {
    allOrNothing: false,
    timeCrunched: false,
    travelsOften: false,
    eveningSnacker: false,
    deskJob: true,
    trainsAlone: false,
  },
}

const ctx = (p: Profile): CoachContext => ({
  profile: p,
  program: recommendProgram(p).program,
  scheduleSummary: 'n/a',
})

afterEach(() => vi.restoreAllMocks())

describe('program matrix recommendations', () => {
  it('beginners get full body regardless of goal or day budget', () => {
    for (const goal of ['fat_loss', 'muscle_gain', 'recomp', 'general_fitness'] as const) {
      for (const days of [2, 3, 4, 5, 6]) {
        const rec = recommendProgram({ ...base, fitnessLevel: 'beginner', goal, daysPerWeek: days })
        expect(rec.splitName.toLowerCase()).toMatch(/full body/)
      }
    }
  })

  it('muscle gain, 5 days → Push/Pull/Legs', () => {
    const rec = recommendProgram({ ...base, goal: 'muscle_gain', daysPerWeek: 5 })
    expect(rec.splitName).toMatch(/Push \/ Pull \/ Legs/)
  })

  it('muscle gain, 4 days → Upper/Lower', () => {
    const rec = recommendProgram({ ...base, goal: 'muscle_gain', daysPerWeek: 4 })
    expect(rec.splitName).toMatch(/Upper \/ Lower/)
  })

  it('fat loss, 4 days → Upper/Lower', () => {
    const rec = recommendProgram({ ...base, goal: 'fat_loss', daysPerWeek: 4 })
    expect(rec.splitName).toMatch(/Upper \/ Lower/)
  })

  it('fat loss, 3 days → Full body ×3', () => {
    const rec = recommendProgram({ ...base, goal: 'fat_loss', daysPerWeek: 3 })
    expect(rec.splitName).toMatch(/Full body/)
  })

  it('every cell carries a rationale and an https source URL', () => {
    for (const goal of ['fat_loss', 'muscle_gain', 'recomp', 'general_fitness'] as const) {
      for (const level of ['beginner', 'intermediate', 'advanced'] as const) {
        for (const days of [2, 3, 4, 5, 6]) {
          const rec = recommendProgram({ ...base, goal, fitnessLevel: level, daysPerWeek: days })
          expect(rec.rationale.length).toBeGreaterThan(20)
          expect(rec.sourceName.length).toBeGreaterThan(0)
          expect(rec.sourceUrl).toMatch(/^https:\/\/[^/]+/)
          expect(rec.program.sessions.length).toBeGreaterThan(0)
        }
      }
    }
  })
})

describe('coach JSON parsing', () => {
  it('extracts a balanced object from fenced markdown', () => {
    const parsed = parseCoachJson('```json\n{"reply":"Sure","proposal":null}\n```')
    expect(parsed.reply).toBe('Sure')
  })

  it('validates and keeps only known change types', () => {
    const reply = toCoachReply({
      reply: 'Let’s cut to 2 days.',
      proposal: {
        summary: 'Fewer days',
        changes: [
          { type: 'daysPerWeek', value: 2 },
          { type: 'bogus', value: 9 },
        ],
      },
    })
    expect(reply.proposal?.changes).toHaveLength(1)
    expect(reply.proposal?.changes[0]).toEqual({ type: 'daysPerWeek', value: 2 })
  })

  it('non-JSON text becomes a plain reply with no proposal', () => {
    const reply = toCoachReply(parseCoachJson('Just keep going, you are doing great.'))
    expect(reply.proposal).toBeUndefined()
    expect(reply.text).toMatch(/keep going/)
  })
})

describe('Claude provider request shape', () => {
  it('POSTs to the Messages API with the browser headers and chosen model', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: [{ type: 'text', text: '{"reply":"Hi","proposal":null}' }] }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const provider = makeClaudeProvider('sk-ant-test', 'claude-sonnet-5')
    const reply = await provider.reply([{ id: '1', role: 'user', text: 'hej', ts: '' }], ctx(base))

    expect(reply.text).toBe('Hi')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.anthropic.com/v1/messages')
    expect(init.headers['x-api-key']).toBe('sk-ant-test')
    expect(init.headers['anthropic-version']).toBe('2023-06-01')
    expect(init.headers['anthropic-dangerous-direct-browser-access']).toBe('true')
    const body = JSON.parse(init.body)
    expect(body.model).toBe('claude-sonnet-5')
    expect(body.messages[0]).toEqual({ role: 'user', content: 'hej' })
  })

  it('throws on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401, text: async () => 'bad key' }))
    const provider = makeClaudeProvider('nope', 'claude-opus-5')
    await expect(provider.reply([{ id: '1', role: 'user', text: 'x', ts: '' }], ctx(base))).rejects.toThrow(/401/)
  })
})

describe('OpenAI provider request shape', () => {
  it('POSTs to chat completions with bearer auth and json_object format', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '{"reply":"Yo","proposal":null}' } }] }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const provider = makeOpenAIProvider('sk-openai', 'gpt-4o-mini')
    const reply = await provider.reply([{ id: '1', role: 'user', text: 'hey', ts: '' }], ctx(base))

    expect(reply.text).toBe('Yo')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.openai.com/v1/chat/completions')
    expect(init.headers.authorization).toBe('Bearer sk-openai')
    const body = JSON.parse(init.body)
    expect(body.model).toBe('gpt-4o-mini')
    expect(body.response_format).toEqual({ type: 'json_object' })
    expect(body.messages[0].role).toBe('system')
  })
})

describe('resolveCoach selection + fallback', () => {
  it('falls back to the built-in coach when the selected provider has no key', () => {
    const coach = resolveCoach({ ...DEFAULT_COACH_SETTINGS, provider: 'claude' }, {})
    expect(coach.id).toBe('local')
  })

  it('uses the built-in coach by default', () => {
    const coach = resolveCoach(DEFAULT_COACH_SETTINGS, {})
    expect(coach.id).toBe('local')
  })

  it('selects Claude when a key is present', () => {
    const coach = resolveCoach({ ...DEFAULT_COACH_SETTINGS, provider: 'claude' }, { claude: 'sk-ant' })
    expect(coach.id).toBe('claude')
  })

  it('transparently falls back to local on a network error, with a notice', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('blocked by CSP')))
    const coach = resolveCoach({ ...DEFAULT_COACH_SETTINGS, provider: 'openai' }, { openai: 'sk-x' })
    const reply = await coach.reply([{ id: '1', role: 'user', text: 'jag kan bara träna 2 dagar', ts: '' }], ctx(base))
    expect(reply.text).toMatch(/built-in coach/i)
    // the local fallback still parsed the intent
    expect(reply.proposal?.changes).toContainEqual({ type: 'daysPerWeek', value: 2 })
  })
})

describe('coach settings + keys persist in the store', () => {
  it('setCoachSettings patches provider/model', () => {
    useAppStore.getState().setCoachSettings({ provider: 'claude', claudeModel: 'claude-haiku-4-5' })
    expect(useAppStore.getState().coachSettings.provider).toBe('claude')
    expect(useAppStore.getState().coachSettings.claudeModel).toBe('claude-haiku-4-5')
  })

  it('setCoachApiKey stores and clears a key', () => {
    useAppStore.getState().setCoachApiKey('openai', 'sk-live')
    expect(useAppStore.getState().coachApiKeys.openai).toBe('sk-live')
    useAppStore.getState().setCoachApiKey('openai', undefined)
    expect(useAppStore.getState().coachApiKeys.openai).toBeUndefined()
  })
})
