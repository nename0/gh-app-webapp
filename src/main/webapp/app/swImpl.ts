declare const serviceWorkerOption: {
    assets: Array<string>,
    assetsHash: string
}
declare const self: ServiceWorkerGlobalScope;

import { startupSWMessaging } from './shared/rxjs/serviceworker-server';
startupSWMessaging();

export const sessionCacheName = 'sessionCache-v1';
const staticCacheName = 'static-' + serviceWorkerOption.assetsHash;

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(staticCacheName).then(function(cache) {
            console.log('[ServiceWorker] Caching static assets');
            return cache.addAll(serviceWorkerOption.assets);
        })
            .then(() => console.log('[ServiceWorker] Installed'))
    );
});

self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activate');
    function testOldCaches(cacheName) {
        if (cacheName.startsWith('static-')) {
            return staticCacheName !== cacheName;
        }
        return cacheName !== sessionCacheName;
    }

    const deleteOldCaches = caches.keys().then((cacheNames) =>
        Promise.all(cacheNames.filter(testOldCaches)
            .map(function(cacheName) {
                console.log('[ServiceWorker] Removing old cache', cacheName);
                return caches.delete(cacheName);
            })));
    event.waitUntil(deleteOldCaches);
});

self.addEventListener('fetch', (event) => {
    const urlPath = new URL(event.request.url).pathname;
    if (urlPath.startsWith('/api/')) {
        return event.respondWith(fetch(event.request));
    }
    event.respondWith(
        caches.match(event.request).then(function(response) {
            return response || fetch(event.request);
        })
    );
});

self.addEventListener('push', function(event) {
    console.log('Received a push message', event);

    if ((<any>Notification).permission === 'denied') {
        return;
    }

    let data = {};
    if (event.data) {
        data = event.data.json();
    }
    const title = data['title'] || 'Something Has Happened';
    const message = data['message'] || 'Here\'s something you might want to check out.';
    const icon = 'images/new-notification.png';

    event.waitUntil(
        self.registration.showNotification(title, <any>{
            body: message,
            icon,
            tag: 'simple-push-demo-notification',
            data
        })
    );
});

self.addEventListener('notificationclick', function(event) {
    console.log('On notification click: ', event);

    event.waitUntil(self.clients.openWindow(location.origin));
});
