self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', () => {
    console.log('Service Worker activated.');
});

self.addEventListener('fetch', (event) => {
    // Pass-through strategy for now (Standard PWA requirement)
    event.respondWith(fetch(event.request));
});
