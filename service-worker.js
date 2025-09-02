const CACHE_NAME = 'final-fantasy-tasks-cache-v24'; // Incremented version
const OFFLINE_URL = 'offline.html';

// Lista actualizada de todos los archivos de la aplicación a cachear
const APP_FILES = [
    '/', // Raíz
    'index.html',
    'offline.html',
    'manifest.json',
    
    // Scripts JS principales
    'app-events.js',
    'app-init.js',
    'app-state.js',
    'app-state-habits.js',
    'app-state-missions.js',
    'app-state-shop.js',
    'app-state-today.js',
    'script.js',
    'utils.js',

    // Scripts de features
    'features/feature-habits.js',
    'features/feature-history.js',
    'features/feature-missions.js',
    'features/feature-scheduled.js',
    'features/feature-shop.js',
    'features/feature-today.js',
    'features/feature-ui.js',

    // Estilos CSS
    'base.css',
    'components.css',
    'forms-modals.css',
    'habits.css',
    'layout.css',
    'sections.css',
    'shop.css',
    'style.css',
    'today.css'
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
