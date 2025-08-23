const CACHE_NAME = 'final-fantasy-tasks-cache-v100';
const OFFLINE_URL = 'offline.html';

// Recursos esenciales para funcionar offline
const urlsToCache = [
    '',             // raíz
    OFFLINE_URL
];

// Archivos que siempre deben intentar descargarse de la red primero
const networkFirstFiles = [
    'app-init.js',
    'app-state.js',
    'basic.css',
    'forms-modals.css',
    'index.html',
    'layout.css',
    'manifest.json',
    'offline.html',
    'script.js',
    'sections.css',
    'style.css',
    'ui-events.js',
    'ui-render.js',
    'utils.js'
];

// ------------------- Install -------------------
self.addEventListener('install', event => {
    console.log('Service Worker: Instalando y precacheando recursos.');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting())
            .catch(error => console.error('Service Worker: Error precacheando:', error))
    );
});

// ------------------- Activate -------------------
self.addEventListener('activate', event => {
    console.log('Service Worker: Activando y limpiando cachés antiguos.');
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        console.log('Service Worker: Eliminando caché antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => clients.claim())
    );
});

// ------------------- Fetch -------------------
self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);

    if (!event.request.url.startsWith('http')) return;

    // Network First para archivos importantes
    if (networkFirstFiles.some(file => requestUrl.pathname.endsWith(file))) {
        event.respondWith(
            fetch(event.request)
                .then(networkResponse => {
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse.clone()));
                    return networkResponse;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Cache First para otros recursos
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) return response;
                return fetch(event.request)
                    .then(networkResponse => {
                        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                            caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse.clone()));
                        }
                        return networkResponse;
                    })
                    .catch(() => {
                        if (event.request.mode === 'navigate' || event.request.destination === 'document') {
                            return caches.match(OFFLINE_URL);
                        }
                        return new Response(null, { status: 503, statusText: 'Service Unavailable (Offline)' });
                    });
            })
    );
});
