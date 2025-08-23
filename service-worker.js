const CACHE_NAME = 'final-fantasy-tasks-cache-v101';
const OFFLINE_URL = 'offline.html';

// Archivos esenciales para precache
const urlsToCache = [
    '',             // raíz
    OFFLINE_URL,
    'index.html',
    'manifest.json',
    'base.css',
    'components.css',
    'forms-modals.css',
    'layout.css',
    'sections.css',
    'style.css',
    'shop.css',
    'today.css',
    'script.js',
    'app-init.js',
    'app-state.js',
    'ui-events.js',
    'ui-render-general.js',
    'ui-render-history.js',
    'ui-render-missions.js',
    'ui-render-scheduled.js',
    'ui-render-shop.js',
    'ui-render-today.js',
    'utils.js',
];

// ------------------- Install -------------------
self.addEventListener('install', event => {
    console.log('Service Worker: Instalando y precacheando recursos.');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting())
            .catch(err => console.error('Service Worker: Error precacheando:', err))
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
        }).then(() => {
            clients.claim();

            // Avisar a todas las páginas que hay nueva versión
            self.clients.matchAll().then(allClients => {
                allClients.forEach(client => {
                    client.postMessage({ type: 'NEW_VERSION' });
                });
            });
        })
    );
});

// ------------------- Fetch -------------------
self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);

    if (!event.request.url.startsWith('http')) return;

    // Network First para archivos críticos
    const networkFirstFiles = [
        'index.html',
        'app-init.js',
        'app-state.js',
        'script.js',
        'ui-events.js',
        'ui-render-general.js',
        'ui-render-history.js',
        'ui-render-missions.js',
        'ui-render-scheduled.js',
        'ui-render-shop.js',
        'ui-render-today.js',
    ];

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
