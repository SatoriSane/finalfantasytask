const CACHE_NAME = 'final-fantasy-tasks-cache-v3.31'; // Incremented version
const OFFLINE_URL = 'offline.html';

// Lista actualizada de todos los archivos de la aplicación a cachear
const APP_FILES = [
    '/', // Raíz
    'index.html',
    'offline.html',
    'manifest.json',
    
    // Scripts JS principales (raíz)
    'global/js/app-events.js',
    'global/js/app-init.js',
    'global/js/app-state.js',
    'global/js/feature-data.js',
    'global/js/feature-ui.js',
    'global/js/script.js',
    'global/js/utils.js',

    // Tab TODAY
    'tab-today/app-state-today.js',
    'tab-today/feature-today.js',
    'tab-today/quick-mission-modal.css',
    'tab-today/today-header.css',
    'tab-today/today.css',
    // Tab HABITS
    'tab-habits/app-state-habits.js',
    'tab-habits/feature-habits.js',
    'tab-habits/habits.css',
    'tab-habits/modal-abstinence-creation.js',
    'tab-habits/modal-abstinence-creation.css',

    // Tab MISSIONS
    'tab-missions/app-state-missions.js',
    'tab-missions/feature-missions.js',
    'tab-missions/tab-missions.css',

    // Tab SHOP
    'tab-shop/app-state-shop.js',
    'tab-shop/feature-shop.js',
    'tab-shop/shop.css',

    // Tab HISTORY
    'tab-history/feature-history.js',

    // Tab ANALYTICS
    'tab-analytics/feature-analytics.js',
    'tab-analytics/analytics.css',

    // Agenda (Scheduled)
    'agenda/feature-scheduled.js',
    'agenda/agenda.css',

    // Modal Subasta
    'modal-subasta/modal-subasta-simple.js',
    'modal-subasta/subasta-constantes-simple.js',
    'modal-subasta/modal-subasta.css',
    // GitHub Sync
    'github-sync/github-sync-events.js',
    'github-sync/github-sync-state.js',
    'github-sync/github-sync-ui.js',
    'github-sync/github-sync.css',

    // Estilos CSS globales
    'global/css/base.css',
    'global/css/components.css',
    'global/css/forms-modals.css',
    'global/css/layout.css',
    'global/css/notify.css',
    'style.css',
];

// ------------------- Install -------------------
self.addEventListener('install', event => {
    console.log('Service Worker: Instalando y precacheando recursos.');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Cacheando los siguientes archivos:', APP_FILES);
                return cache.addAll(APP_FILES);
            })
            .then(() => self.skipWaiting()) // Forzar la activación del nuevo SW
            .catch(err => console.error('Service Worker: Error al precachear los archivos.', err))
    );
});

// ------------------- Activate -------------------
self.addEventListener('activate', event => {
    console.log('Service Worker: Activando y limpiando cachés antiguos.');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Eliminando caché antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Tomar control inmediato de todas las páginas abiertas
            return self.clients.claim();
        })
    );
});

// ------------------- Fetch (Network First Strategy) -------------------
self.addEventListener('fetch', event => {
    // Solo gestionar peticiones GET
    if (event.request.method !== 'GET') {
        return;
    }

    // Ignorar peticiones que no son HTTP/HTTPS (ej. chrome-extension://)
    if (!event.request.url.startsWith('http')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(networkResponse => {
                // Si la petición a la red es exitosa, la usamos y la guardamos en caché
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME)
                    .then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                return networkResponse;
            })
            .catch(() => {
                // Si la red falla, intentamos obtener el recurso desde el caché
                return caches.match(event.request)
                    .then(cachedResponse => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        // Si no está en caché y es una navegación, mostrar la página offline
                        if (event.request.mode === 'navigate') {
                            return caches.match(OFFLINE_URL);
                        }
                        // Para otros recursos, simplemente fallar
                        return new Response('Contenido no disponible sin conexión.', {
                            status: 404,
                            statusText: 'Not Found'
                        });
                    });
            })
    );
});
