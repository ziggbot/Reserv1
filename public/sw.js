/* Cache only the app shell and versioned assets. Never cache auth or API data. */
const CACHE = 'fitblueprint-v2'

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', './index.html', './icon.svg'])))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/') || url.pathname === '/health') return
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(res => {
      if (res.ok) caches.open(CACHE).then(cache => cache.put('./index.html', res.clone()))
      return res
    }).catch(() => caches.match('./index.html')))
    return
  }
  if (!url.pathname.startsWith('/assets/') && !['/icon.svg', '/manifest.webmanifest'].includes(url.pathname)) return
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(request, copy))
          }
          return res
        }),
    ),
  )
})
