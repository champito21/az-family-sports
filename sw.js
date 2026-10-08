// AZ Family Sports - service worker
// Job: keep a copy of the app's own files so it opens even with no signal
// (like a dugout with bad reception), while always trying the network first
// so you see fresh changes when you're online.

const CACHE = 'az-family-sports-v1';   // bump this number (v2, v3...) when you want to force a refresh

const CORE_FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

// 1. Install: save the core files
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE_FILES)));
  self.skipWaiting();
});

// 2. Activate: delete old caches from previous versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 3. Fetch: network first, fall back to the saved copy
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle GET requests for our own site.
  // Firebase, Google Fonts, etc. are left alone so live data stays live.
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(req, copy));
        return response;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html')))
  );
});
