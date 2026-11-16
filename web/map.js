/* Peta gratis tanpa API key:
   - Peta vektor: MapLibre GL + OpenFreeMap (gaya "liberty", lengkap dengan patokan).
   - Saran pencarian saat mengetik: Photon (komoot) — jalan, kelurahan, kecamatan, tempat.
   - Alamat titik pin: Nominatim reverse. Rute: OSRM.
   - Wilayah layanan: window.REGION (region.js). Di luar wilayah diberi abu-abu dan tidak bisa dipilih.
   shortcut: server publik OSM/Photon/Nominatim/OSRM punya batas pemakaian wajar.
   Cukup untuk usaha lokal; jika pesanan ratusan per jam, pindah ke layanan berbayar/self-host. */
(function () {
  var MADIUN = { lat: -7.6298, lng: 111.5239 };
  var STYLE = "https://tiles.openfreemap.org/styles/liberty"; // "liberty": menampilkan patokan (toko, masjid, sekolah, SPBU)
  var NOMI = "https://nominatim.openstreetmap.org";
  var PHOTON = "https://photon.komoot.io/api/";
  var R = window.REGION;
  var map, onPick, revTimer, sugTimer, sugSeq = 0, lastRev = 0, isOpen = false, inside = true, pending = null, lastKey = "", revSeq = 0, chosen = "";
  function $(id) { return document.getElementById(id); }
  function json(r) { if (!r.ok) throw new Error(r.status); return r.json(); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function inRegion(pt) { return !R || Pricing.inRegion(pt, R); }
  function uniq(arr) { return arr.filter(function (x, i) { return x && arr.indexOf(x) === i; }); }

  /* Nama singkat dari alamat Nominatim: "Jalan Pahlawan 12, Kartoharjo" */
  function shortName(a, fallback) {
    if (!a) return fallback || "";
    var road = a.road ? a.road + (a.house_number ? " " + a.house_number : "") : (a.amenity || a.shop || a.building || "");
    var area = a.village || a.suburb || a.neighbourhood || a.city_district || a.town || a.city || "";
    return uniq([a.amenity && a.road ? a.amenity : "", road, area]).join(", ") || fallback || "";
  }
  /* Letak wilayah (untuk admin): "Manguharjo, Kota Madiun" */
  function placeName(a, fallback, name) {
    if (!a) return fallback || "";
    return uniq([name, a.village || a.suburb || a.hamlet || a.neighbourhood, a.city_district || a.municipality, a.city || a.county || a.town]).join(", ") || fallback || "";
  }

  function reverse(pt) {
    return fetch(NOMI + "/reverse?format=jsonv2&accept-language=id&zoom=18&lat=" + pt.lat + "&lon=" + pt.lng).then(json)
      .then(function (r) { return shortName(r.address, r.display_name); });
  }

  /* Cari satu tempat (dipakai panel admin untuk area driver). Nama kembar: pilih yang di dalam wilayah & paling dekat pusat Madiun. */
  function search(q) {
    var box = R ? R.bbox.join(",") : "111.25,-7.95,111.95,-7.35";
    return fetch(NOMI + "/search?format=jsonv2&addressdetails=1&accept-language=id&countrycodes=id&limit=5&bounded=1&viewbox=" + box + "&q=" + encodeURIComponent(q)).then(json)
      .then(function (rs) {
        rs = rs.filter(function (x) { return inRegion({ lat: +x.lat, lng: +x.lon }); });
        if (!rs.length) return null;
        var r = rs.map(function (x) { return { x: x, d: Pricing.straightKm(MADIUN, { lat: +x.lat, lng: +x.lon }) }; }).sort(function (a, b) { return a.d - b.d; })[0].x;
        return { lat: +r.lat, lng: +r.lon, name: shortName(r.address, r.display_name), place: placeName(r.address, r.display_name, r.name) };
      });
  }

  /* Jarak rute jalan (km). Jika server rute gagal: garis lurus x 1,3 (approx: true). */
  function route(a, b) {
    var url = "https://router.project-osrm.org/route/v1/driving/" + a.lng + "," + a.lat + ";" + b.lng + "," + b.lat + "?overview=false";
    return fetch(url).then(json).then(function (r) {
      if (r.code !== "Ok" || !r.routes[0]) throw new Error(r.code);
      return { km: r.routes[0].distance / 1000, approx: false };
    }).catch(function () { return { km: Pricing.straightKm(a, b) * 1.3, approx: true }; });
  }

  /* ---------- Saran pencarian (Photon) ---------- */
  var KIND = {
    village: "Desa/Kelurahan", suburb: "Kelurahan", neighbourhood: "Lingkungan", hamlet: "Dusun", quarter: "Kelurahan",
    city: "Kota", town: "Kecamatan", county: "Kabupaten", district: "Kecamatan", municipality: "Kecamatan", state: "Provinsi"
  };
  function kindOf(p) {
    if (p.osm_key === "highway") return "Jalan";
    if (p.osm_key === "place" || p.osm_key === "boundary") return KIND[p.osm_value] || KIND[p.type] || "Wilayah";
    return "Tempat";
  }
  function zoomOf(kind) { return { "Kabupaten": 11, "Kota": 13, "Kecamatan": 13, "Desa/Kelurahan": 15, "Kelurahan": 15, "Wilayah": 14, "Jalan": 16 }[kind] || 17; }

  function suggestNow(q) {
    var seq = ++sugSeq, c = map ? map.getCenter() : MADIUN;
    showSug([90, 70, 80].map(function (w) { return '<li class="sk-item" aria-hidden="true"><span class="sk sk-ic"></span><div><span class="sk skt" style="width:' + w + '%"></span><span class="sk skt" style="width:' + (w - 30) + '%;height:.7em"></span></div></li>'; }).join("") + '<li class="sr">Mencari…</li>');
    var url = PHOTON + "?limit=10&q=" + encodeURIComponent(q) + "&lat=" + c.lat + "&lon=" + c.lng + (R ? "&bbox=" + R.bbox.join(",") : "");
    fetch(url).then(json).then(function (fc) {
      if (seq !== sugSeq) return;
      var seen = {}, items = fc.features.map(function (f) {
        var p = f.properties, pt = { lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] }, kind = kindOf(p);
        var title = p.name || (p.street ? p.street + (p.housenumber ? " " + p.housenumber : "") : "");
        var sub = uniq([kind, p.name && p.street ? p.street : "", p.locality || p.district, p.city || p.county]).filter(function (x) { return x !== title; }).join(" · ");
        var label = uniq([title, p.street, p.locality || p.district]).join(", ");
        return { title: title, sub: sub, pt: pt, kind: kind, extent: p.extent, label: label };
      }).filter(function (x) {
        var key = x.title + "|" + x.sub;
        if (!x.title || seen[key] || !inRegion(x.pt)) return false;
        seen[key] = 1; return true;
      }).slice(0, 7);
      pending = items;
      showSug(items.length ? items.map(function (x, i) {
        return '<li><button type="button" data-i="' + i + '"><svg class="i"><use href="#i-pin"/></svg><span><b>' + esc(x.title) + '</b><small>' + esc(x.sub) + '</small></span></button></li>';
      }).join("") : '<li class="sug-note">Tidak ditemukan di wilayah layanan. Coba kata lain, atau geser peta.</li>');
    }).catch(function () { if (seq === sugSeq) showSug('<li class="sug-note">Gagal mencari. Periksa koneksi internet.</li>'); });
  }
  function showSug(html) { $("mapSug").innerHTML = html; $("mapSug").hidden = !html; }
  function choose(x) {
    showSug(""); $("mapQ").value = x.title; $("mapQ").blur();
    chosen = x.kind === "Tempat" || x.kind === "Jalan" ? x.label : ""; // nama tempat lebih tepat daripada tebakan alamat
    if (x.extent && x.kind !== "Jalan") map.fitBounds([[x.extent[0], x.extent[3]], [x.extent[2], x.extent[1]]], { padding: 40, maxZoom: 16 });
    else map.flyTo({ center: [x.pt.lng, x.pt.lat], zoom: zoomOf(x.kind) });
  }

  /* ---------- Pin tengah ---------- */
  /* Teks alamat; saat mencari, tampil kerangka berkilau (teksnya tetap ada untuk pembaca layar & pengecekan). */
  function setAddr(text) {
    var el = $("mapAddr");
    if (/^Mencari/.test(text)) el.innerHTML = '<span class="sk skt" style="width:72%"></span><span class="sr">' + text + "</span>";
    else el.textContent = text;
  }
  /* Tombol "Pakai lokasi ini": okState = boleh dipakai di titik saat ini; selama peta bergerak tombol selalu mati. */
  var okState = false;
  function setOk(v) { okState = v; $("mapOk").disabled = !v; }
  /* force: cek ulang walau titik tengah sama (saat peta baru dibuka). Tanpa ini, perubahan ukuran peta memicu pencarian berulang. */
  function check(force) {
    var c = map.getCenter(), key = c.lat.toFixed(6) + "," + c.lng.toFixed(6);
    if (!force && key === lastKey) { $("mapOk").disabled = !okState; return; } // hanya ukuran peta berubah
    lastKey = key;
    inside = inRegion({ lat: c.lat, lng: c.lng });
    $("mapPin").classList.toggle("out", !inside);
    setOk(inside);
    clearTimeout(revTimer);
    if (!inside) { setAddr("Di luar wilayah layanan (" + (R ? R.name : "Madiun") + ")"); return; }
    var seq = ++revSeq; // jawaban untuk posisi lama yang datang terlambat diabaikan
    if (chosen) { setAddr(chosen); chosen = ""; setOk(true); return; }
    setAddr("Mencari alamat…");
    setOk(false); // tunggu alamat, supaya teks isian sesuai titik yang dipilih
    // Jeda supaya tidak lebih dari 1 permintaan per detik ke Nominatim.
    revTimer = setTimeout(function () {
      lastRev = Date.now();
      reverse({ lat: c.lat, lng: c.lng }).then(function (a) { if (seq === revSeq) { setAddr(a); setOk(true); } })
        .catch(function () { if (seq === revSeq) { setAddr("Titik dipilih (alamat tidak ditemukan)"); setOk(true); } });
    }, Math.max(600, 1100 - (Date.now() - lastRev)));
  }

  function addRegionLayers() {
    if (!R) return;
    var world = [[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]];
    var holes = R.polygons.map(function (p) { return p[0]; });
    map.addSource("mask", { type: "geojson", data: { type: "Feature", geometry: { type: "Polygon", coordinates: [world].concat(holes) } } });
    map.addLayer({ id: "mask", type: "fill", source: "mask", paint: { "fill-color": "#7d8a99", "fill-opacity": 0.32 } });
    map.addSource("region", { type: "geojson", data: { type: "Feature", geometry: { type: "MultiPolygon", coordinates: R.polygons.map(function (p) { return [p[0]]; }) } } });
    map.addLayer({ id: "region-line", type: "line", source: "region", paint: { "line-color": "#1e7be6", "line-width": 2, "line-opacity": 0.8, "line-dasharray": [2, 1.5] } });
  }

  function init(center) {
    var b = R ? R.bbox : null, pad = 0.25;
    map = new maplibregl.Map({
      container: "map", style: STYLE, center: [center.lng, center.lat], zoom: 15, minZoom: 9,
      maxBounds: b ? [[b[0] - pad, b[1] - pad], [b[2] + pad, b[3] + pad]] : undefined,
      dragRotate: false, pitchWithRotate: false, touchPitch: false, attributionControl: false
    });
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
    map.touchZoomRotate.disableRotation();
    map.on("load", function () {
      $("mapLoading").classList.add("done");
      addRegionLayers();
      // Atribusi tetap ada (wajib), tapi dilipat jadi tombol (i) agar peta bersih.
      var a = document.querySelector("#map .maplibregl-ctrl-attrib"); if (a) a.classList.remove("maplibregl-compact-show");
    });
    map.on("movestart", function (e) { $("mapPin").classList.add("lift"); $("mapOk").disabled = true; // jangan pilih titik saat peta masih bergerak
      if (e.originalEvent) chosen = ""; }); // digeser jari: kembali ke alamat dari pin
    map.on("moveend", function () { $("mapPin").classList.remove("lift"); if (isOpen) check(); });

    $("mapQ").addEventListener("input", function () {
      var q = this.value.trim(); clearTimeout(sugTimer); pending = null;
      if (q.length < 3) { sugSeq++; showSug(""); return; }
      sugTimer = setTimeout(function () { suggestNow(q); }, 350);
    });
    $("mapSearch").addEventListener("submit", function (e) {
      e.preventDefault();
      if (pending && pending[0]) choose(pending[0]);
      else if ($("mapQ").value.trim().length >= 2) { clearTimeout(sugTimer); suggestNow($("mapQ").value.trim()); }
    });
    $("mapSug").addEventListener("click", function (e) { var b = e.target.closest("button[data-i]"); if (b && pending) choose(pending[+b.dataset.i]); });
    $("mapGps").addEventListener("click", function () {
      if (!navigator.geolocation) { setAddr("GPS tidak tersedia di HP ini."); return; }
      setAddr("Mencari lokasi Anda…");
      navigator.geolocation.getCurrentPosition(function (p) {
        var pt = { lat: p.coords.latitude, lng: p.coords.longitude };
        if (!inRegion(pt)) { setAddr("Lokasi Anda di luar wilayah layanan. Geser peta ke dalam wilayah."); return; }
        map.flyTo({ center: [pt.lng, pt.lat], zoom: 17 });
      }, function () { setAddr("Lokasi tidak bisa diambil. Nyalakan GPS dan izinkan akses lokasi."); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
    });
    $("mapOk").addEventListener("click", function () {
      if (!okState) return;
      var c = map.getCenter(), addr = $("mapAddr").textContent, cb = onPick;
      var good = !/^(Mencari|Gagal|Tidak ditemukan|Lokasi|GPS|Di luar)/.test(addr);
      close(); cb({ lat: c.lat, lng: c.lng }, good ? addr.replace(/ \(alamat tidak ditemukan\)$/, "") : "");
    });
    $("mapClose").addEventListener("click", function () { close(); });
    window.addEventListener("popstate", function () { if (isOpen) hide(); });
  }

  function hide() { isOpen = false; chosen = ""; $("mapSheet").hidden = true; clearTimeout(revTimer); showSug(""); }
  function close() { if (isOpen) { hide(); history.back(); } }

  /* Buka pemilih titik. start: titik awal (opsional). cb(pt, alamat) dipanggil saat "Pakai lokasi ini". */
  function open(title, start, cb) {
    onPick = cb; isOpen = true;
    $("mapTitle").textContent = title; $("mapQ").value = ""; showSug("");
    $("mapSheet").hidden = false;
    history.pushState({ map: 1 }, "");
    var c = start || (map ? null : MADIUN);
    if (!map) init(c);
    else { map.resize(); if (start) map.jumpTo({ center: [start.lng, start.lat], zoom: 17 }); }
    check(true);
  }

  window.MapPick = { open: open, route: route, search: search, map: function () { return map; } };
})();
