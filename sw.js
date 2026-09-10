/* Service Worker — Central de Chamados SAC · Nova Macabu
   Estratégia: rede primeiro (painel sempre atualizado), cache como
   reserva offline. O webhook Make NUNCA passa pelo cache. */
const CACHE = "sac-nm-v1";
const APP_SHELL = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  if (url.hostname.endsWith("make.com")) return; // dados ao vivo: sem cache
  e.respondWith(
    fetch(e.request).then(r => {
      const copia = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copia)).catch(() => {});
      return r;
    }).catch(() =>
      caches.match(e.request).then(m => m || (e.request.mode === "navigate" ? caches.match("./index.html") : undefined))
    )
  );
});
