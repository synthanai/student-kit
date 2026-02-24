const CACHE_NAME = 'arivar-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/main.js',
    '/js/core-engine.js',
    '/js/llm-client.js',
    '/js/profile-store.js',
    '/js/card-renderer.js',
    '/js/kolam-hash.js',
    '/js/passport.js',
    '/js/direction-detector.js',
    '/data/core-questions.json',
    '/manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

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

self.addEventListener('fetch', (event) => {
    // Network-first for API calls, cache-first for static assets
    if (event.request.url.includes('/api/') || event.request.url.includes('openrouter.ai')) {
        event.respondWith(
            fetch(event.request).catch(() =>
                new Response(JSON.stringify({ error: 'offline', message: 'No internet connection. Try manual mode.' }),
                    { headers: { 'Content-Type': 'application/json' } })
            )
        );
    } else {
        event.respondWith(
            caches.match(event.request)
                .then(cached => cached || fetch(event.request))
        );
    }
});
