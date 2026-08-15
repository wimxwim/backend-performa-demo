const CACHE = 'gr-presentasi-v1';
const ASSETS = ['./', './index.html', './output.css', './style.css', './fonts.css', './app.js', './fonts/plus-jakarta-sans-v8-latin-700.woff2', './fonts/plus-jakarta-sans-v8-latin-regular.woff2'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))));
self.addEventListener('fetch', e => e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))));
