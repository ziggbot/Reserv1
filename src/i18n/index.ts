import { useSyncExternalStore } from 'react'
import { rawStorage } from '../state/storage'
import { GLOSSARY } from './glossary'

/**
 * Two-language UI: Swedish (default) and English.
 *
 *  - `tr(en, sv)` picks the text for the active language. Call it where the
 *    text is USED (inside a function or a component render), never at module
 *    top level — a module-level constant would freeze the language it was
 *    loaded with.
 *  - `L(name)` translates a stored/canonical English name (exercise, session,
 *    split, focus…) for display. Names stay English in storage so histories
 *    and prefills keep matching when the language changes; anything not in
 *    the glossary (e.g. the user's own Swedish program) passes through.
 */

export type Locale = 'sv' | 'en'

const KEY = 'fitblueprint-locale'

function readStored(): Locale {
  try {
    const v = rawStorage.getItem(KEY)
    return v === 'en' || v === 'sv' ? v : 'sv'
  } catch {
    return 'sv'
  }
}

let locale: Locale = readStored()
const listeners = new Set<() => void>()

export function getLocale(): Locale {
  return locale
}

export function setLocale(next: Locale): void {
  if (next === locale) return
  locale = next
  try {
    rawStorage.setItem(KEY, next)
  } catch {
    /* sandbox without storage */
  }
  if (typeof document !== 'undefined') document.documentElement.lang = next
  listeners.forEach((l) => l())
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** Current language; re-renders the caller when it changes. */
export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, getLocale, getLocale)
}

/** Text for the active language. */
export function tr<T>(en: T, sv: T): T {
  return locale === 'sv' ? sv : en
}

const LIGHT_SUFFIX = ' (light, pain-free range only)'

/** Display label for a canonical English name; falls back to the name itself. */
export function L(name: string): string {
  if (locale === 'en') return name
  const hit = GLOSSARY[name]
  if (hit) return hit
  if (name.endsWith(LIGHT_SUFFIX)) {
    return `${L(name.slice(0, -LIGHT_SUFFIX.length))} (lätt, endast smärtfritt rörelseomfång)`
  }
  return name
}

/** BCP-47 tag for Intl formatting in the active language. */
export function dateLocale(): string {
  return locale === 'sv' ? 'sv-SE' : 'en-GB'
}

/** Format an ISO date (yyyy-mm-dd) in the active language. */
export function fmtDate(iso: string, opts: Intl.DateTimeFormatOptions): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString(dateLocale(), opts)
}
