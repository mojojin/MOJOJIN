// SRC PWA Service Worker
const CACHE_NAME = 'src-pwa-v1'
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

// Install: 정적 자산 사전 캐시
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activate: 이전 캐시 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// Fetch: Network First → Cache Fallback 전략
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // 외부 요청(Supabase 등)은 캐시하지 않음
  if (url.origin !== location.origin) return

  // _next/static 파일은 Cache First (변하지 않는 빌드 자산)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached
          return fetch(request).then((response) => {
            cache.put(request, response.clone())
            return response
          })
        })
      )
    )
    return
  }

  // 나머지: Network First (항상 최신 데이터 우선)
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
      .catch(() => caches.match(request))
  )
})
