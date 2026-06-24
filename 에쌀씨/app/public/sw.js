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

  // 1. GET 요청이 아니면 절대 캐싱하지 않음 (POST, PUT, DELETE 등 에러 방지)
  if (request.method !== 'GET') return

  // 2. 외부 요청(Supabase 등) 및 API 요청은 캐시하지 않음
  if (url.origin !== location.origin || url.pathname.startsWith('/api/') || url.pathname.includes('webpack-hmr')) return

  // 3. _next/static 파일은 Cache First (변하지 않는 빌드 자산)
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

  // 4. 정적 자산(이미지, 아이콘, 폰트, 매니페스트 등)만 캐싱
  const isStaticAsset = 
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname === '/manifest.json'

  if (isStaticAsset) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached
          return fetch(request).then((response) => {
            if (response.ok) {
              cache.put(request, response.clone())
            }
            return response
          })
        })
      )
    )
    return
  }

  // 5. 동적 페이지 및 RSC 데이터는 캐싱하지 않고 순수 네트워크를 통해 통과시킴
})
