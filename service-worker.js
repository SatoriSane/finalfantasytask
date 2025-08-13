const CACHE_NAME = 'final-fantasy-tasks-cache-v16'; // ¡Aquí está la versión!
const urlsToCache = [
    '/finalfantasytask/',
    '/finalfantasytask/index.html',
    '/finalfantasytask/style.css', // Corregido a style.css como está en tu index.html
    '/finalfantasytask/app-init.js',
    '/finalfantasytask/utils.js',
    '/finalfantasytask/app-state.js',
    '/finalfantasytask/ui-render.js',
    '/finalfantasytask/ui-events.js',
    '/finalfantasytask/script.js',
    '/finalfantasytask/manifest.json',
    '/finalfantasytask/offline.html'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Abriendo caché y añadiendo URLs.');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Si la solicitud está en caché, la devolvemos
                if (response) {
                    return response;
                }
                // Si no está en caché, intentamos obtenerla de la red
                return fetch(event.request)
                    .catch(() => {
                        // Si la red no está disponible y no está en caché, servimos la página offline
                        console.log('Service Worker: Solicitud fallida, sirviendo offline.html');
                        return caches.match('/finalfantasytask/offline.html');
                    });
            })
    );
});

self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        // Eliminar cachés antiguos que no están en la lista blanca
                        console.log('Service Worker: Eliminando caché antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
