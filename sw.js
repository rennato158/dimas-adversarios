/* Guarda o app no aparelho para abrir sem internet. Rede primeiro; cópia guardada como reserva. */
const CACHE = "dimas-v3";
const ARQUIVOS = ["./", "index.html", "estilo.css", "app.js", "nucleo.js", "config.js", "dados-iniciais.js", "base-sofascore.js", "icone.svg", "logo-dimas.png", "manifest.webmanifest"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return; // planilha, fotos e vídeos vão direto à rede
  e.respondWith(
    fetch(e.request).then((r) => { const copia = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copia)); return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match("index.html")))
  );
});
