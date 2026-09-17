/**
 * Merges two copies of the app data (local device vs cloud row) so that a
 * sync never drops what was logged on either side. Append-only collections
 * are unioned by identity; everything else comes from the side that wrote
 * last. Pure and defensive: unknown shapes fall back to "newer side wins".
 */

type Rec = Record<string, unknown>
type Item = Record<string, unknown>

function arr(v: unknown): Item[] {
  return Array.isArray(v) ? (v as Item[]) : []
}

/** Union of two arrays by a key function; `preferred` wins when both have the key. Result ordered by `sortKey`. */
function unionBy(preferred: Item[], other: Item[], key: (x: Item) => string, sortKey?: (x: Item) => string): Item[] {
  const out = new Map<string, Item>()
  for (const x of other) out.set(key(x), x)
  for (const x of preferred) out.set(key(x), x)
  const list = [...out.values()]
  if (sortKey) list.sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
  return list
}

const s = (v: unknown) => (typeof v === 'string' || typeof v === 'number' ? String(v) : '')

export function mergeAppData(local: Rec, remote: Rec, remoteNewer: boolean): Rec {
  const newer = remoteNewer ? remote : local
  const older = remoteNewer ? local : remote
  const out: Rec = { ...older, ...newer }

  const workoutKey = (w: Item) => `${s(w.date)}|${s(w.sessionName)}|${s(w.durationMin)}|${s(w.totalVolumeKg)}|${s(w.totalSets)}`
  out.completedWorkouts = unionBy(arr(newer.completedWorkouts), arr(older.completedWorkouts), workoutKey, (w) => s(w.date))
  out.weighIns = unionBy(arr(newer.weighIns), arr(older.weighIns), (w) => s(w.date), (w) => s(w.date))
  out.workoutLog = unionBy(arr(newer.workoutLog), arr(older.workoutLog), (e) => `${s(e.date)}|${s(e.sessionName)}`, (e) => s(e.date))
  out.coachMessages = unionBy(arr(newer.coachMessages), arr(older.coachMessages), (m) => s(m.id), (m) => s(m.ts))
  out.planHistory = unionBy(arr(newer.planHistory), arr(older.planHistory), (r) => s(r.id))
    .sort((a, b) => s(b.ts).localeCompare(s(a.ts)))
    .slice(0, 50)
  out.aiProgramLog = unionBy(arr(newer.aiProgramLog), arr(older.aiProgramLog), (e) => s(e.ts))
    .sort((a, b) => s(b.ts).localeCompare(s(a.ts)))
    .slice(0, 30)

  const habits: Record<string, string[]> = {}
  for (const side of [older.habitChecks, newer.habitChecks]) {
    if (!side || typeof side !== 'object') continue
    for (const [id, dates] of Object.entries(side as Record<string, unknown>)) {
      const set = new Set([...(habits[id] ?? []), ...(Array.isArray(dates) ? (dates as string[]) : [])])
      habits[id] = [...set].sort()
    }
  }
  out.habitChecks = habits

  const custom = new Set<string>([...(arr(older.customExercises) as unknown as string[]), ...(arr(newer.customExercises) as unknown as string[])])
  out.customExercises = [...custom].filter((x) => typeof x === 'string').sort((a, b) => a.localeCompare(b))

  // Exercise memory: per exercise, the side that wrote last wins, but nothing is dropped.
  out.exerciseMemory = { ...((older.exerciseMemory as Rec) ?? {}), ...((newer.exerciseMemory as Rec) ?? {}) }

  // A workout in progress belongs to whichever device has one.
  out.activeWorkout = newer.activeWorkout ?? older.activeWorkout ?? null

  return out
}

/** Stable JSON for change detection (key order independent). */
export function stableJson(v: unknown): string {
  return JSON.stringify(v, (_k, val) =>
    val && typeof val === 'object' && !Array.isArray(val)
      ? Object.keys(val as Rec)
          .sort()
          .reduce((o, k) => ({ ...o, [k]: (val as Rec)[k] }), {} as Rec)
      : val,
  )
}
