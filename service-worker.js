const CACHE_NAME = 'final-fantasy-task-cache-v15'; // ¡Incrementado a v15!
const OFFLINE_URL = '/finalfantasytask/offline.html';

const urlsToCache = [
    '/finalfantasytask/',
    '/finalfantasytask/index.html',
    '/finalfantasytask/manifest.json',
    '/finalfantasytask/service-worker.js',
    OFFLINE_URL,

    '/finalfantasytask/style.css',
    '/finalfantasytask/base.css',
    '/finalfantasytask/forms-modals.css',
    '/finalfantasytask/layout.css',
    '/finalfantasytask/sections.css',
    
    '/finalfantasytask/app-init.js',
    '/finalfantasytask/utils.js',
    '/finalfantasytask/app-state.js',
    '/finalfantasytask/ui-render.js',
    '/finalfantasytask/ui-events.js',
    '/finalfantasytask/script.js'
    // Referencias a iconos eliminadas para esta prueba
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
            .catch((error) => {
                console.error('SW: Error during install, cache.addAll failed:', error);
            })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    if (!event.request.url.startsWith('http')) {
        return;
    }

    const requestUrl = new URL(event.request.url);

    if (requestUrl.origin === 'https://fonts.googleapis.com' || requestUrl.origin === 'https://fonts.gstatic.com') {
        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(event.request).then(networkResponse => {
                    return caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                }).catch(() => {
                    // Font failed to load from network and not in cache.
                });
            })
        );
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return networkResponse;
                }).catch(() => {
                    if (event.request.mode === 'navigate' || event.request.destination === 'document') {
                        return caches.match(OFFLINE_URL);
                    }
                    return new Response(null, { status: 503, statusText: 'Service Unavailable (Offline)' });
                });
            })
            .catch((error) => {
                return caches.match(OFFLINE_URL);
            })
    );
});
