/** localStorage when available; in-memory Map fallback for sandboxed embeds. */
function makeRawStorage() {
  try {
    const probe = '__fb_probe__'
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    return { store: window.localStorage as Storage, persistent: true }
  } catch {
    const mem = new Map<string, string>()
    const shim: Storage = {
      get length() {
        return mem.size
      },
      clear: () => mem.clear(),
      getItem: (k: string) => mem.get(k) ?? null,
      key: (i: number) => [...mem.keys()][i] ?? null,
      removeItem: (k: string) => void mem.delete(k),
      setItem: (k: string, v: string) => void mem.set(k, v),
    }
    return { store: shim, persistent: false }
  }
}

const { store, persistent } = makeRawStorage()

/** True when data survives reloads (real localStorage), false in a sandbox. */
export const storageIsPersistent = persistent
export const rawStorage = store
