import type { Profile, WeighIn } from '../src/lib/types'

export const profileSchema = {
  type: 'object', additionalProperties: false,
  required: ['age', 'sex', 'heightCm', 'weightKg', 'goal', 'fitnessLevel', 'equipment', 'daysPerWeek', 'minutesPerSession', 'activityLevel'],
  properties: {
    age: { type: 'integer', minimum: 18, maximum: 100 },
    sex: { type: 'string', enum: ['male', 'female'], description: 'Physiological input for the existing energy equation; ask the user.' },
    heightCm: { type: 'number', minimum: 120, maximum: 230 },
    weightKg: { type: 'number', minimum: 35, maximum: 300 },
    goal: { type: 'string', enum: ['fat_loss', 'muscle_gain', 'recomp', 'general_fitness'] },
    fitnessLevel: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
    equipment: { type: 'string', enum: ['none', 'dumbbells', 'full_gym'] },
    daysPerWeek: { type: 'integer', minimum: 2, maximum: 6 },
    minutesPerSession: { type: 'integer', minimum: 15, maximum: 120 },
    activityLevel: { type: 'string', enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'] },
    injuries: { type: 'array', maxItems: 6, uniqueItems: true, items: { type: 'string', enum: ['knee', 'shoulder', 'lower_back', 'hip', 'wrist_elbow', 'ankle'] } },
    medicalConditions: { type: 'array', maxItems: 7, uniqueItems: true, items: { type: 'string', enum: ['hypertension', 'diabetes', 'heart_condition', 'asthma', 'pregnancy', 'other'] } },
    dietPref: { type: 'string', enum: ['omnivore', 'vegetarian', 'vegan'] },
    sleepHours: { type: 'number', minimum: 0, maximum: 16 },
    stressLevel: { type: 'string', enum: ['low', 'moderate', 'high'] },
    mealsPerDay: { type: 'integer', minimum: 2, maximum: 6 },
    goalWeightKg: { type: 'number', minimum: 35, maximum: 300 },
  },
} as const

type Schema = { type: string; properties?: Record<string, Schema | undefined>; required?: readonly string[]; additionalProperties?: boolean; enum?: readonly string[]; minimum?: number; maximum?: number; items?: Schema; maxItems?: number; uniqueItems?: boolean }

// Match the advertised schema at the server boundary; never trust model arguments.
export function validate(value: unknown, schema: Schema, path = 'arguments'): void {
  if (schema.type === 'object') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${path}: expected object`)
    const record = value as Record<string, unknown>
    for (const key of schema.required ?? []) if (!(key in record)) throw new Error(`${path}.${key}: required`)
    for (const [key, item] of Object.entries(record)) {
      const child = schema.properties?.[key]
      if (!child) { if (schema.additionalProperties === false) throw new Error(`${path}.${key}: unknown field`) }
      else validate(item, child, `${path}.${key}`)
    }
  } else if (schema.type === 'array') {
    if (!Array.isArray(value) || value.length > (schema.maxItems ?? Infinity)) throw new Error(`${path}: invalid array`)
    if (schema.uniqueItems && new Set(value).size !== value.length) throw new Error(`${path}: duplicate values`)
    value.forEach((item, index) => validate(item, schema.items!, `${path}[${index}]`))
  } else if (schema.type === 'number' || schema.type === 'integer') {
    if (typeof value !== 'number' || !Number.isFinite(value) || (schema.type === 'integer' && !Number.isInteger(value)) || value < (schema.minimum ?? -Infinity) || value > (schema.maximum ?? Infinity)) throw new Error(`${path}: outside supported range`)
  } else if (typeof value !== 'string' || (schema.enum && !schema.enum.includes(value))) throw new Error(`${path}: invalid value`)
}

export function parseProfile(value: unknown): Profile {
  validate(value, profileSchema)
  const profile = value as Partial<Profile>
  return {
    name: '', injuries: [], medicalConditions: [], dietPref: 'omnivore', sleepHours: 8,
    stressLevel: 'moderate', mealsPerDay: 3,
    lifestyle: { allOrNothing: false, timeCrunched: false, travelsOften: false, eveningSnacker: false, deskJob: false, trainsAlone: false },
    ...profile,
  } as Profile
}

export function parseDate(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) throw new Error('Use a real date in YYYY-MM-DD format')
  return value
}

export function parseWeighIns(value: unknown, today: string): WeighIn[] {
  validate(value, { type: 'array', maxItems: 366, items: { type: 'object', additionalProperties: false, required: ['date', 'weightKg'], properties: { date: { type: 'string' }, weightKg: { type: 'number', minimum: 35, maximum: 300 } } } })
  const rows = value as WeighIn[]
  const dates = rows.map(row => parseDate(row.date))
  if (new Set(dates).size !== dates.length || dates.some(date => date > today)) throw new Error('Use unique dates no later than today')
  return [...rows].sort((a, b) => a.date.localeCompare(b.date))
}
