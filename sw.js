const CACHE = 'tight-lines-v2';
const ASSETS = [
  './', './index.html', './style.css', './data.js', './app.js', './icon.svg', './manifest.json',
  './img/largemouth-bass.jpg', './img/spotted-bass.jpg', './img/channel-catfish.jpg',
  './img/blue-catfish.jpg', './img/flathead-catfish.jpg', './img/bullhead-catfish.jpg',
  './img/bluegill.jpg', './img/redear-sunfish.jpg', './img/redbreast-sunfish.jpg',
  './img/warmouth.jpg', './img/crappie.jpg', './img/chain-pickerel.jpg',
  './img/bowfin.png', './img/longnose-gar.jpg', './img/yellow-perch.jpg',
  './img/american-shad.jpg', './img/red-drum.png', './img/spotted-seatrout.jpg',
  './img/flounder.jpg', './img/sheepshead.jpg',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
