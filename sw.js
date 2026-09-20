/* Круговая борьба: работа без интернета.
   Сначала сеть (обновления приходят сразу), без сети — сохранённая копия.
   Установка не срывается, если какой-то файл не найден: файлы кэшируются по одному.
   Удаляются только свои старые кэши (приставка krug-): на github.io хранилище
   общее для всех приложений аккаунта, чужие кэши (например, «Срока абонемента») не трогаем. */
const PFX = 'krug-';
const CACHE = PFX + 'v3';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png',
  './icon-maskable-192.png', './icon-maskable-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f => c.add(f).catch(() => {})))));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith(PFX) && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok && new URL(e.request.url).origin === location.origin) {
      const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp));
    }
    return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true })
    .then(m => m || (e.request.mode === 'navigate' ? caches.match('./index.html') : undefined))
    .then(m => m || Response.error())));
});
