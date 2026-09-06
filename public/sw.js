/*
 * Offline-shell service worker.
 *  - Navigations (the HTML shell): network first, cached copy only when offline,
 *    so a new deploy shows up on the next load.
 *  - Hashed build assets and fonts: cache first — their names change per build,
 *    so a cached copy is never stale.
 *  - Everything else same-origin: network first with cache fallback.
 * Bump CACHE whenever the strategy changes so old caches are dropped.
 */
const CACHE = 'fitblueprint-v3'
const PRECACHE = [
  './',
  './index.html',
  './icon.svg',
  './fonts/caveat-latin.woff2',
  './fonts/caveat-latin-ext.woff2',
  './fonts/patrick-hand-latin.woff2',
  './fonts/patrick-hand-latin-ext.woff2',
]

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  )
  self.clients.claim()
})

function isImmutable(url) {
  return url.pathname.includes('/assets/') || url.pathname.includes('/fonts/')
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE)
  try {
    const res = await fetch(request)
    if (res && res.ok) cache.put(request, res.clone())
    return res
  } catch {
    const cached = await cache.match(request)
    if (cached) return cached
    if (request.mode === 'navigate') {
      const shell = await cache.match('./index.html')
      if (shell) return shell
    }
    throw new Error('offline')
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE)
  const cached = await cache.match(request)
  if (cached) return cached
  const res = await fetch(request)
  if (res && res.ok) cache.put(request, res.clone())
  return res
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request))
  } else if (isImmutable(url)) {
    event.respondWith(cacheFirst(request))
  } else {
    event.respondWith(networkFirst(request))
  }
})
