/* Logika harga dan teks WhatsApp. Diambil dari website agimassolution.netlify.app. Dipakai oleh app.js dan test.js. */
(function (root) {
  var SVC = {
    orang: { name: "Antar penumpang", from: "Lokasi jemput", to: "Tujuan", fromPh: "Contoh: Stasiun Madiun", toPh: "Contoh: Alun-alun Kota Madiun" },
    barang: { name: "Antar barang", from: "Ambil barang di", to: "Antar ke", fromPh: "Contoh: Toko di Jl. Pahlawan", toPh: "Contoh: Perumahan Kartoharjo", item: "Isi barang", itemPh: "Contoh: paket dokumen" },
    beli: { name: "Beli barang", from: "Beli di (toko atau pasar)", to: "Antar ke", fromPh: "Contoh: Pasar Sleko", toPh: "Contoh: Jl. Cokroaminoto", item: "Barang yang dibeli", itemPh: "Contoh: 2 bungkus nasi pecel" },
    lain: { name: "Jasa lainnya", from: "Lokasi", to: "Tujuan (jika ada)", fromPh: "Contoh: Jl. Panglima Sudirman No. 5", toPh: "Kosongkan jika tidak perlu", item: "Jasa yang dibutuhkan", itemPh: "Contoh: antre di kantor layanan" }
  };

  function rp(n) { return "Rp " + Math.round(n).toLocaleString("id-ID"); }
  function numTxt(k) { return String(k).replace(".", ","); }

  /* Malam = 21.00–05.00 menurut jam HP. */
  function isNight(d) { var h = (d || new Date()).getHours(); return h >= 21 || h < 5; }

  /* Tarif jarak + biaya berat (barang, beli) + jasa belanja (beli) + tambahan malam (otomatis, opts.night),
     dibulatkan ke atas per Rp500. Tambahan hujan tetap ditetapkan admin. */
  function quote(T, svc, km, w, opts) {
    var t = T[svc], lines = [];
    lines.push({ t: "Tarif jarak " + numTxt(km) + " km", v: km <= t.minKm ? t.minFare : t.minFare + (km - t.minKm) * t.perKm });
    if (svc !== "orang") {
      var wt = T.weights[w] || T.weights[0];
      if (wt.add > 0) lines.push({ t: "Biaya berat " + wt.label, v: wt.add });
    }
    if (svc === "beli" && T.shop > 0) lines.push({ t: "Jasa belanja", v: T.shop });
    // Rumus sama dengan website: tambah T.night.add setiap T.night.every km (dibulatkan ke atas).
    if (opts && opts.night) lines.push({ t: "Tambahan malam (21.00–05.00)", v: Math.ceil(km / T.night.every) * T.night.add, night: true });
    var total = lines.reduce(function (a, l) { return a + l.v; }, 0);
    var rounded = Math.ceil(total / 500) * 500;
    if (rounded > total) lines.push({ t: "Pembulatan", v: rounded - total });
    return { lines: lines, total: rounded };
  }

  function validPhone(d) { return /^62\d{8,13}$/.test(String(d)); }

  /* Pesan ke admin. o: { svc, km, w, name, item, from, to, note, driver } — driver = nama driver pilihan, opsional */
  /* Teks dikelompokkan per bagian dengan baris kosong; *teks* = tebal di WhatsApp. */
  function waText(T, adminName, o) {
    var s = SVC[o.svc], lain = o.svc === "lain";
    function v(x) { return String(x || "-").replace(/[*_~]/g, ""); } // isian pelanggan: jangan merusak format tebal
    var L = ["Halo " + adminName + ",", "saya mau pesan *" + s.name + "* lewat aplikasi Agi Mas.", ""];
    L.push("*PEMESAN*", "Nama: " + v(o.name), "");
    L.push("*RUTE*", s.from + ": " + v(o.from));
    if (o.fromPt) L.push(mapLink(o.fromPt));
    L.push(s.to + ": " + v(o.to));
    if (o.toPt) L.push(mapLink(o.toPt));
    if (!lain) L.push("Jarak: *" + numTxt(o.km) + " km*");
    if (o.fromPt && o.toPt) L.push("*Rute di Google Maps* (jemput → tujuan):", routeLink(o.fromPt, o.toPt));
    L.push("");
    var det = [];
    if (s.item) det.push(s.item + ": " + v(o.item));
    if (o.svc === "barang" || o.svc === "beli") det.push("Berat: " + (T.weights[o.w] || T.weights[0]).label);
    if (o.note) det.push("Catatan: " + v(o.note));
    if (o.rain) det.push("Cuaca: *kemungkinan hujan di titik jemput* (data cuaca, mohon dicek)");
    det.push("Driver pilihan: *" + (o.driver ? v(o.driver) + "* (jika tersedia)" : "bebas*, admin yang menentukan"));
    L.push("*DETAIL PESANAN*"); L.push.apply(L, det); L.push("");
    if (lain) L.push("*HARGA*", "Mohon penawaran harga.");
    else {
      var q = quote(T, o.svc, o.km, o.w, { night: o.night });
      L.push("*PERKIRAAN HARGA: " + rp(q.total) + "*");
      q.lines.forEach(function (l) { L.push("- " + l.t + ": " + rp(l.v)); });
      L.push(o.night ? "_Sudah termasuk tambahan malam. Tambahan hujan (jika hujan) ditetapkan admin._" : "_Tambahan hujan (jika hujan) ditetapkan admin._");
    }
    L.push("", "Nomor WhatsApp ini boleh dibagikan ke driver yang bertugas.", "Terima kasih.");
    return L.join("\n");
  }

  function mapLink(pt) { return "https://maps.google.com/?q=" + pt.lat.toFixed(6) + "," + pt.lng.toFixed(6); }
  /* Google Maps petunjuk arah: asal & tujuan langsung terisi (format URL resmi, tanpa API key). */
  function routeLink(a, b) {
    return "https://www.google.com/maps/dir/?api=1&origin=" + a.lat.toFixed(6) + "," + a.lng.toFixed(6) +
      "&destination=" + b.lat.toFixed(6) + "," + b.lng.toFixed(6) + "&travelmode=driving";
  }

  /* Jarak garis lurus dalam km (haversine). */
  function straightKm(a, b) {
    var R = 6371, r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  /* Apakah titik {lat,lng} ada di dalam wilayah (REGION.polygons: daftar poligon GeoJSON [lng,lat], cincin pertama = batas luar). */
  function inRegion(pt, region) {
    function inRing(ring) {
      var inside = false;
      for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        var xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
        if ((yi > pt.lat) !== (yj > pt.lat) && pt.lng < (xj - xi) * (pt.lat - yi) / (yj - yi) + xi) inside = !inside;
      }
      return inside;
    }
    return region.polygons.some(function (poly) { return inRing(poly[0]) && !poly.slice(1).some(inRing); });
  }

  /* Jarak tagihan: dibulatkan ke atas per 0,5 km, minimal 1 km. */
  function billKm(km) { return Math.max(1, Math.ceil(km * 2) / 2); }

  function waLink(phone, text) { return "https://wa.me/" + phone + "?text=" + encodeURIComponent(text); }

  /* Cek data dari panel admin sebelum disimpan. Mengembalikan pesan kesalahan pertama, atau "" jika aman. */
  function validate(d) {
    function n(v, min) { return typeof v === "number" && isFinite(v) && v >= min; }
    if (!d || !d.tarif || !d.admin || !Array.isArray(d.drivers)) return "Data tidak lengkap.";
    var T = d.tarif, names = { orang: "Antar penumpang", barang: "Antar barang", beli: "Beli barang" };
    for (var k in names) {
      var t = T[k];
      if (!t || !n(t.minFare, 0) || !n(t.minKm, 0.5) || !n(t.perKm, 0)) return "Tarif " + names[k] + " tidak valid (jarak minimal paling kecil 0,5 km).";
    }
    if (!n(T.shop, 0)) return "Jasa belanja tidak valid.";
    if (!Array.isArray(T.weights) || !T.weights.length || T.weights.some(function (w) { return !String(w.label || "").trim() || !n(w.add, 0); })) return "Biaya berat tidak valid.";
    if (!T.night || !n(T.night.add, 0) || !n(T.night.every, 0.5) || !T.rain || !n(T.rain.perKm, 0)) return "Tambahan malam/hujan tidak valid.";
    if (!String(d.admin.name || "").trim()) return "Nama admin wajib diisi.";
    if (!validPhone(d.admin.phone)) return "Nomor WhatsApp admin tidak valid. Contoh: 0812 3456 7890.";
    for (var i = 0; i < d.drivers.length; i++) {
      var x = d.drivers[i];
      if (!String(x.name || "").trim()) return "Nama driver ke-" + (i + 1) + " wajib diisi.";
      if (["aktif", "istirahat", "offline"].indexOf(x.status) < 0) return "Status " + x.name + " tidak valid.";
    }
    return "";
  }

  /* 0812-3456 7890 / +62 812... / 812... → 62812... */
  function normPhone(v) {
    var d = String(v).replace(/\D/g, "");
    if (d.charAt(0) === "0") d = "62" + d.slice(1); else if (d.charAt(0) === "8") d = "62" + d;
    return d;
  }

  var api = { SVC: SVC, rp: rp, numTxt: numTxt, quote: quote, validPhone: validPhone, waText: waText, waLink: waLink, validate: validate, normPhone: normPhone, mapLink: mapLink, straightKm: straightKm, billKm: billKm, inRegion: inRegion, isNight: isNight };
  if (typeof module !== "undefined") module.exports = api; else root.Pricing = api;
})(this);
