/* Guarda o app no aparelho para abrir sem internet.
   Rede primeiro, sempre conferindo se há versão nova; a cópia guardada só é usada sem internet. */
const CACHE = "dimas-v11";
const ARQUIVOS = ["./", "index.html", "estilo.css", "app.js", "nucleo.js", "tema.js", "config.js", "icone.svg", "logo-dimas.png", "manifest.webmanifest"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQUIVOS.map((u) => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return; // base, fotos e vídeos vão direto à rede
  // "no-cache": pergunta ao servidor se o arquivo mudou, em vez de usar a cópia do navegador
  const pedido = e.request.mode === "navigate" ? new Request(e.request.url, { cache: "no-cache", credentials: "same-origin" }) : new Request(e.request, { cache: "no-cache" });
  e.respondWith(
    fetch(pedido).then((r) => { const copia = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copia)); return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match("index.html")))
  );
});
