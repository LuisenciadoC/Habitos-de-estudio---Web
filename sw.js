// Guarda los archivos de la app para que abra rápido y funcione sin internet.
const CACHE = 'habitos-web-v1';
const ARCHIVOS = [
  './', './index.html', './manifest.json', './css/estilos.css',
  './js/backend/almacen.js', './js/backend/api.js',
  './js/ui/iconos.js', './js/ui/componentes.js', './js/ui/paneles.js',
  './js/vistas/auth.js', './js/vistas/inicio.js', './js/vistas/tareas.js', './js/vistas/materias.js', './js/vistas/flashcards.js',
  './js/app.js', './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png',
];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS))); self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
// Primero la red (siempre la última versión); sin internet, la copia guardada.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then((r) => {
    if (r.ok && new URL(e.request.url).origin === location.origin) { const copia = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copia)); }
    return r;
  }).catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html'))));
});
