// Define el nombre de la caché. ¡Incrementa este número cada vez que modifiques los archivos en urlsToCache
// o cualquier lógica que afecte el cacheo para forzar una actualización en los usuarios!
const CACHE_NAME = 'final-fantasy-tasks-cache-v15';
// La URL de la página offline.
const OFFLINE_URL = '/finalfantasytask/offline.html';

// Lista de URLs de todos los recursos que tu PWA necesita para funcionar offline.
// ¡Asegúrate de que todas estas rutas son absolutas para GitHub Pages!
const urlsToCache = [
    '/finalfantasytask/', // La raíz de tu aplicación en GitHub Pages
    '/finalfantasytask/index.html',
    '/finalfantasytask/style.css',
    '/finalfantasytask/app-init.js',
    '/finalfantasytask/utils.js',
    '/finalfantasytask/app-state.js',
    '/finalfantasytask/ui-render.js',
    '/finalfantasytask/ui-events.js',
    '/finalfantasytask/script.js',
    '/finalfantasytask/manifest.json',
    OFFLINE_URL
];

// Evento 'install': Se ejecuta la primera vez que el Service Worker se registra.
// Aquí precargamos todos los recursos esenciales en la caché.
self.addEventListener('install', (event) => {
    console.log('Service Worker: Instalando y precacheando recursos.');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(urlsToCache);
            })
            // self.skipWaiting() fuerza al Service Worker a activarse inmediatamente,
            // sin esperar a que las pestañas antiguas se cierren.
            .then(() => self.skipWaiting())
            .catch((error) => {
                console.error('Service Worker: Fallo durante la instalación al añadir URLs a caché:', error);
            })
    );
});

// Evento 'activate': Se ejecuta cuando el Service Worker se activa y toma el control.
// Aquí limpiamos cachés antiguas para asegurar que solo la versión actual esté activa.
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activando y limpiando cachés antiguos.');
    const cacheWhitelist = [CACHE_NAME]; // Solo el caché con el nombre actual debe permanecer
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        // Eliminar cachés que no están en la lista blanca (versiones antiguas)
                        console.log('Service Worker: Eliminando caché antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
        // clients.claim() asegura que el nuevo Service Worker tome el control de
        // todas las pestañas abiertas inmediatamente después de la activación.
        .then(() => clients.claim())
    );
});

// Evento 'fetch': Intercepta todas las solicitudes de red de la aplicación.
// Implementa una estrategia "cache-first with network fallback" para los recursos de la PWA.
self.addEventListener('fetch', (event) => {
    // Ignorar solicitudes que no son HTTP/HTTPS (ej. chrome-extension://)
    if (!event.request.url.startsWith('http')) {
        return;
    }

    const requestUrl = new URL(event.request.url);

    // Estrategia "Cache-First" para Google Fonts (u otras CDNs externas)
    // Si la fuente está en caché, la sirve; si no, la busca en la red y la cachea.
    if (requestUrl.origin === 'https://fonts.googleapis.com' || requestUrl.origin === 'https://fonts.gstatic.com') {
        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                if (cachedResponse) {
                    console.log('Service Worker: Sirviendo fuente desde caché:', event.request.url);
                    return cachedResponse;
                }
                return fetch(event.request).then(networkResponse => {
                    return caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, networkResponse.clone());
                        console.log('Service Worker: Cacheando fuente de red:', event.request.url);
                        return networkResponse;
                    });
                }).catch(() => {
                    console.warn('Service Worker: Fallo de red para fuente:', event.request.url);
                    // No hay un fallback específico para fuentes, simplemente fallará si no está en caché.
                });
            })
        );
        return; // Terminar el procesamiento para las fuentes aquí
    }

    // Estrategia "Cache-First with Network Fallback" para los recursos de tu aplicación.
    // Intenta encontrar el recurso en la caché primero.
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    console.log('Service Worker: Sirviendo desde caché:', event.request.url);
                    return response;
                }
                // Si no está en caché, intenta obtenerlo de la red.
                return fetch(event.request).then((networkResponse) => {
                    // Si la respuesta de red es válida, la cacheamos para futuras solicitudes.
                    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                        const responseToCache = networkResponse.clone(); // Clona la respuesta porque la original se consume.
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                            console.log('Service Worker: Cacheando de la red:', event.request.url);
                        });
                    }
                    return networkResponse;
                }).catch(() => {
                    // Si la red falla Y el recurso no estaba en caché:
                    console.log('Service Worker: Solicitud fallida para', event.request.url, '. Sirviendo offline.html si es una navegación.');
                    // Si la solicitud es para una página (navegación), servir offline.html.
                    if (event.request.mode === 'navigate' || event.request.destination === 'document') {
                        return caches.match(OFFLINE_URL);
                    }
                    // Para otros recursos (imágenes, CSS, JS que no sean navegación), devolver una respuesta de error.
                    return new Response(null, { status: 503, statusText: 'Service Unavailable (Offline)' });
                });
            })
            .catch((error) => {
                // Manejo de errores más general. Si algo falla drásticamente, intentar servir offline.html.
                console.error('Service Worker: Error general en el fetch (red o caché):', error);
                return caches.match(OFFLINE_URL);
            })
    );
});
