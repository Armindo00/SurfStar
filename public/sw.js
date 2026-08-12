/* Service worker — PWA install + network-first updates for app shell */
const CACHE = 'surfstar-shell-v3'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll(['/', '/index.html', '/manifest.webmanifest']),
    ),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return

  const isDocument = event.request.mode === 'navigate'
  const isAsset = url.pathname.startsWith('/assets/')

  if (isDocument || isAsset) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok && isDocument) {
            const copy = response.clone()
            void caches.open(CACHE).then((cache) => cache.put(event.request, copy))
          }
          return response
        })
        .catch(() =>
          caches.match(event.request).then((cached) => cached || caches.match('/index.html')),
        ),
    )
    return
  }

  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then((cached) => cached || caches.match('/index.html')),
    ),
  )
})
