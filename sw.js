// Service Worker for Letty 日程管理 PWA
// ⚠️ 每次部署时更新此版本号，浏览器会自动检测 SW 文件变化并触发更新
const CACHE_VERSION = '20260506-2109';
const CACHE_NAME = `letty-schedule-${CACHE_VERSION}`;
const ASSETS_TO_CACHE = [
  '/letty-schedule/',
  '/letty-schedule/index.html',
  '/letty-schedule/manifest.json',
  '/letty-schedule/icons/icon-192.png',
  '/letty-schedule/icons/icon-512.png'
];

// Install: pre-cache core assets + force activate
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting(); // 立即激活新 SW，不等旧页面关闭
});

// Activate: clean ALL old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim(); // 立即接管所有页面
});

// Fetch: network-first for everything (确保总是最新内容)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and cross-origin API calls (Supabase, LLM, etc.)
  if (event.request.method !== 'GET') return;
  if (url.hostname.includes('supabase') || url.hostname.includes('deepseek') || url.hostname.includes('openai')) return;

  // Network-first for all requests: always try network, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
