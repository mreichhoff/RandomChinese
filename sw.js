const cacheName = 'tones-v1';

const cacheFiles = [
    './index.html',
    './css/css.css',
    './js/app.js',
    './data/syllables.json',
    './data/words.json',
    './data/characters.json',
    './data/dictionary.json'
];
self.addEventListener('fetch', (e) => {
    if (e.request.method === 'GET') {
        e.respondWith((async () => {
            const cache = await caches.open(cacheName);
            try {
                const response = await fetch(e.request);
                cache.put(e.request, response.clone());
                return response;
            } catch (e) {
                const r = await cache.match(e.request);
                if (r) {
                    return r;
                }
            }
        })());
    }
});

self.addEventListener('install', evt =>
    evt.waitUntil(
        caches.open(cacheName).then(cache => {
            return cache.addAll(cacheFiles);
        })
    )
);

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keyList) =>
            Promise.all(
                keyList.map((key) => {
                    if (key !== cacheName) {
                        return caches.delete(key);
                    }
                })
            )
        )
    );
});
