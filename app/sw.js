// ─────────────────────────────────────────────
// ARIVAR Service Worker v2
// Cache-first for static, network-first for API
// ─────────────────────────────────────────────

const CACHE_NAME = 'arivar-v2';
const STATIC_ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/main.js',
    './js/core-engine.js',
    './js/llm-client.js',
    './js/profile-store.js',
    './js/card-renderer.js',
    './js/kolam-hash.js',
    './js/passport.js',
    './js/direction-detector.js',
    './js/voice-engine.js',
    './js/story-slides.js',
    './js/rarity-engine.js',
    './data/core-questions.json',
    './manifest.json',
    './assets/icons/icon-192.png',
    './assets/icons/icon-512.png'
];

// Install: cache all static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys
                .filter(key => key !== CACHE_NAME)
                .map(key => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

// Fetch: network-first for API, cache-first for everything else
self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    // Network-first for API calls (LLM providers)
    if (url.includes('openrouter.ai') ||
        url.includes('generativelanguage.googleapis.com') ||
        url.includes('api.openai.com') ||
        url.includes('/api/')) {
        event.respondWith(
            fetch(event.request).catch(() =>
                new Response(JSON.stringify({
                    error: 'offline',
                    message: 'No internet connection. Your profile data is safe on your device.'
                }), { headers: { 'Content-Type': 'application/json' } })
            )
        );
        return;
    }

    // Network-first for Google Fonts (cache them after first load)
    if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Cache-first for static assets
    event.respondWith(
        caches.match(event.request)
            .then(cached => cached || fetch(event.request))
    );
});
