const CACHE_NAME = 'final-fantasy-tasks-cache-v15'; 
const urlsToCache = [
    '/finalfantasytask/',
    '/finalfantasytask/index.html',
    '/finalfantasytask/styles.css',
    '/finalfantasytask/script.js',
    '/finalfantasytask/manifest.json',
    '/finalfantasytask/offline.html'
    // Ya no se incluye la carpeta 'images/' aquí
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request)
                    .catch(() => {
                        // If network is unavailable and not in cache, serve offline page
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
                        // Delete old caches
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
