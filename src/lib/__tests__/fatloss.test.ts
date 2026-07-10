import { describe, expect, it } from 'vitest'
import { analyzeProgress, rollingAverage } from '../fatloss'
import type { WeighIn } from '../types'

function series(startDate: string, weights: number[]): WeighIn[] {
  const out: WeighIn[] = []
  const d = new Date(startDate + 'T00:00:00Z')
  for (const w of weights) {
    out.push({ date: d.toISOString().slice(0, 10), weightKg: w })
    d.setUTCDate(d.getUTCDate() + 1)
  }
  return out
}

describe('rollingAverage', () => {
  it('averages the last 7 days', () => {
    const data = series('2026-07-01', [80, 80, 80, 81, 81, 81, 81]) // ends 2026-07-07
    expect(rollingAverage(data, '2026-07-07')).toBeCloseTo(80.57, 1)
  })
  it('returns null with fewer than 3 points in the window', () => {
    const data = series('2026-07-01', [80, 81])
    expect(rollingAverage(data, '2026-07-30')).toBeNull()
  })
})

describe('analyzeProgress', () => {
  it('reports insufficient data early on', () => {
    const a = analyzeProgress(series('2026-07-01', [80, 80]), '2026-07-02', 80, 0)
    expect(a.status).toBe('insufficient_data')
  })

  it('detects on-track loss (~0.6%/week)', () => {
    // 14 days trending 80 → 79 (≈0.5 kg/week)
    const weights = Array.from({ length: 14 }, (_, i) => 80 - i * 0.071)
    const a = analyzeProgress(series('2026-07-01', weights), '2026-07-14', 80, 2)
    expect(a.status).toBe('on_track')
  })

  it('detects a stall and prescribes the adjustment ladder', () => {
    const weights = Array.from({ length: 14 }, () => 80)
    const a = analyzeProgress(series('2026-07-01', weights), '2026-07-14', 80, 4)
    expect(a.status).toBe('stalled')
    expect(a.recommendation.join(' ')).toMatch(/steps/i)
    expect(a.recommendation.join(' ')).toMatch(/5–10%/)
  })

  it('flags too-fast loss', () => {
    // losing ~1.4 kg/week on an 80 kg person (>1.5x the 0.56 target)
    const weights = Array.from({ length: 14 }, (_, i) => 80 - i * 0.2)
    const a = analyzeProgress(series('2026-07-01', weights), '2026-07-14', 80, 2)
    expect(a.status).toBe('too_fast')
    expect(a.recommendation.join(' ')).toMatch(/add/i)
  })

  it('suggests a diet break after 10+ weeks of dieting', () => {
    const weights = Array.from({ length: 14 }, () => 74)
    const a = analyzeProgress(series('2026-07-01', weights), '2026-07-14', 80, 11)
    expect(a.dietBreakSuggested).toBe(true)
    expect(a.recommendation.join(' ')).toMatch(/diet break/i)
  })
})
