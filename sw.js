// Offline shell: network first for the page (so updates arrive), cache as fallback.
const CACHE = "door-v5";
const SHELL = ["./", "index.html", "manifest.webmanifest", "version.json", "icon.svg", "icon-180.png", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  // Own files skip the browser's HTTP cache (GitHub Pages allows 10 min), so updates show up at once.
  const own = new URL(e.request.url).origin === location.origin;
  e.respondWith(
    (own ? fetch(e.request.url, { cache: "no-store" }) : fetch(e.request))
      .then(res => {
        if (res.ok && new URL(e.request.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match("index.html")))
  );
});
