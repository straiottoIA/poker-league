// Service Worker mínimo — habilita instalação como PWA
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// Passa todas as requisições para a rede normalmente (sem cache offline)
self.addEventListener('fetch', (e) => {
  e.respondWith(fetch(e.request));
});
