// Network dulu, cache sebagai cadangan saat offline. Naikkan versi jika daftar file berubah.
var CACHE = "agimas-v31";
var FILES = ["./", "index.html", "style.css", "app.js", "pricing.js", "store.js", "config.js", "map.js", "vendor/qrcode.js", "region.js", "vendor/maplibre-gl.js", "vendor/maplibre-gl.css", "data.json", "logo.png", "splash.js", "badge.js", "version.js", "fonts.css", "fonts/PlusJakartaSans-1.woff2", "splash-text.png", "splash-motor.png", "icon-192.png", "apple-touch-icon.png", "icon-512.png", "manifest.webmanifest"];
self.addEventListener("install", function (e) { e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); })); self.skipWaiting(); });
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }));
});
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET" || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(fetch(e.request).then(function (r) {
    var copy = r.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copy); }); return r;
  }).catch(function () { return caches.match(e.request); }));
});
