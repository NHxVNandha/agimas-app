// Network dulu, cache sebagai cadangan saat offline. Naikkan versi jika daftar file berubah.
var CACHE = "agimas-v32";
var FILES = ["./", "index.html", "style.css", "app.js", "pricing.js", "store.js", "config.js", "map.js", "vendor/qrcode.js", "region.js", "vendor/maplibre-gl.js", "vendor/maplibre-gl.css", "data.json", "logo.png", "splash.js", "badge.js", "version.js", "fonts.css", "fonts/PlusJakartaSans-1.woff2", "splash-text.png", "splash-motor.png", "icon-192.png", "apple-touch-icon.png", "icon-512.png", "manifest.webmanifest"];
self.addEventListener("install", function (e) { e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); })); self.skipWaiting(); });
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }));
});
// Internet lambat (> 4 detik): pakai salinan tersimpan dulu agar aplikasi tetap cepat terbuka. Cek versi (no-store) tidak disimpan.
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET" || !e.request.url.startsWith(self.location.origin) || e.request.cache === "no-store") return;
  e.respondWith(caches.match(e.request).then(function (hit) {
    var net = fetch(e.request).then(function (r) {
      if (r.ok) { var copy = r.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copy); }); }
      return r;
    });
    if (!hit) return net;
    return Promise.race([net.catch(function () { return hit; }), new Promise(function (ok) { setTimeout(function () { ok(hit); }, 4000); })]);
  }));
});
