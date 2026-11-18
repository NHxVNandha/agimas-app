/* Data aplikasi (tarif, admin, driver) di Firebase Firestore, lewat REST tanpa library.
   Satu dokumen app/data dengan satu field "json" berisi teks JSON (bentuk sama dengan data.json). */
(function () {
  var C = window.AGIMAS_CONFIG || {};
  var LS = "agimas.data";
  function on() { return !!(C.firebaseApiKey && C.firebaseProjectId); }
  function docUrl(name) { return "https://firestore.googleapis.com/v1/projects/" + C.firebaseProjectId + "/databases/(default)/documents/app/" + (name || "data"); }
  function json(r) {
    if (!r.ok) return r.json().catch(function () { return {}; }).then(function (b) {
      var e = new Error((b.error && b.error.message) || r.statusText || "HTTP " + r.status + " " + r.url.split("?")[0]); e.status = r.status; e.code = b.error && b.error.status; throw e;
    });
    return r.json();
  }
  function local() { try { return JSON.parse(localStorage.getItem(LS)); } catch (e) { return null; } }
  function fromDoc(doc) { return { data: JSON.parse(doc.fields.json.stringValue), updatedAt: doc.updateTime, source: "online" }; }

  /* Urutan: Firestore → salinan terakhir di HP → data.json. Mengembalikan { data, updatedAt, source }.
     source "kosong" = Firebase tersambung tapi belum ada data (admin belum pernah menyimpan). */
  function load() {
    if (!on()) return fallback(new Error("Firebase belum disetel"));
    return Promise.all([
      fetch(docUrl() + "?key=" + C.firebaseApiKey, { cache: "no-store" }).then(json),
      loadMitra().catch(function () { return {}; })     // belum ada / aturan lama: pakai menu di app/data
    ]).then(function (r) {
      var v = fromDoc(r[0]);
      v.mitraAt = overlay(v.data, r[1]);
      try { localStorage.setItem(LS, JSON.stringify(v)); } catch (e) {}
      return v;
    }).catch(fallback);
  }

  /* ---------- Dokumen per mitra: mitra/{id}, field "json" = { menu, open, close } ----------
     Menu, stok, dan jam buka mitra dipisah dari app/data agar pegawai mitra bisa mengubahnya sendiri
     (firestore.rules hanya mengizinkan dokumen mitranya). app/data tetap menyimpan salinan untuk aplikasi versi lama. */
  function fsUrl(path) { return "https://firestore.googleapis.com/v1/projects/" + C.firebaseProjectId + "/databases/(default)/documents/" + path; }
  function toMitraDoc(d) { return { v: JSON.parse(d.fields.json.stringValue), at: d.updateTime }; }
  function loadMitra() {   // { idMitra: { v: {menu, open, close}, at } }
    return fetch(fsUrl("mitra?pageSize=50&key=" + C.firebaseApiKey), { cache: "no-store" }).then(json).then(function (r) {
      var out = {};
      (r.documents || []).forEach(function (d) { out[d.name.split("/").pop()] = toMitraDoc(d); });
      return out;
    });
  }
  function overlay(data, docs) {   // data.mitra[i] diganti isi dokumennya; hasil: { idMitra: updateTime }
    var at = {};
    (data.mitra || []).forEach(function (m) {
      var d = docs[m.id]; if (!d) return;
      m.menu = d.v.menu || m.menu; m.open = d.v.open || ""; m.close = d.v.close || ""; at[m.id] = d.at;
    });
    return at;
  }
  function getMitra(id) {
    return fetch(fsUrl("mitra/" + encodeURIComponent(id) + "?key=" + C.firebaseApiKey), { cache: "no-store" }).then(json).then(toMitraDoc)
      .catch(function (e) { if (e.status === 404) return null; throw e; });
  }
  /* Simpan dokumen mitra hanya bila belum diubah orang lain sejak dimuat (at = updateTime saat dimuat; kosong = belum ada).
     Bentrok: error dengan e.conflict = true. Hasil: updateTime baru. */
  function saveMitra(token, id, v, at) {
    var pre = at ? "&currentDocument.updateTime=" + encodeURIComponent(at) : "&currentDocument.exists=false";
    return fetch(fsUrl("mitra/" + encodeURIComponent(id) + "?updateMask.fieldPaths=json" + pre), {
      method: "PATCH", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ fields: { json: { stringValue: JSON.stringify(v) } } })
    }).then(json).then(function (d) { return d.updateTime; }).catch(function (e) {
      if (/FAILED_PRECONDITION|ALREADY_EXISTS|NOT_FOUND/.test(e.code || "")) e.conflict = true;
      if (e.status === 403) e.message = "Tidak punya izin mengubah mitra ini. Pastikan aturan database terbaru (firestore.rules) sudah dipasang.";
      throw e;
    });
  }

  /* ---------- Akun pegawai mitra: staf/{uid} = { mitra, email } (hanya admin yang membuat) ---------- */
  function signUp(email, password) {
    return fetch("https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=" + C.firebaseApiKey, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, password: password, returnSecureToken: true })
    }).then(json).then(function (r) { return r.localId; });
  }
  function authGet(token, path) { return fetch(fsUrl(path), { headers: { Authorization: "Bearer " + token }, cache: "no-store" }).then(json); }
  function str(f, k) { return ((f || {})[k] || {}).stringValue || ""; }
  function getStaff(token, uid) {   // null = bukan pegawai mitra
    return authGet(token, "staf/" + uid).then(function (d) { return { uid: uid, mitra: str(d.fields, "mitra"), email: str(d.fields, "email") }; })
      .catch(function (e) { if (e.status === 404) return null; throw e; });
  }
  function listStaff(token) {
    return authGet(token, "staf?pageSize=100").then(function (r) {
      return (r.documents || []).map(function (d) { return { uid: d.name.split("/").pop(), mitra: str(d.fields, "mitra"), email: str(d.fields, "email") }; });
    });
  }
  function setStaff(token, uid, mitra, email) {
    return fetch(fsUrl("staf/" + uid), { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ fields: { mitra: { stringValue: mitra }, email: { stringValue: email } } }) }).then(json);
  }
  function delStaff(token, uid) { return fetch(fsUrl("staf/" + uid), { method: "DELETE", headers: { Authorization: "Bearer " + token } }).then(json); }
  function fallback(err) {
    var l = err.status === 404 ? null : local();
    if (l) { l.source = "tersimpan"; return l; }
    // Alamat dari akar situs: dipakai juga oleh panel admin di /admin/.
    return fetch("/data.json", { cache: "no-cache" }).then(json).then(function (d) {
      return { data: d, updatedAt: "", source: err.status === 404 ? "kosong" : "bawaan", error: String(err.message) };
    });
  }

  /* Mengembalikan { token, expiresIn (detik) }. */
  function login(email, password) {
    return fetch("https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" + C.firebaseApiKey, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, password: password, returnSecureToken: true })
    }).then(json).then(function (r) { return { token: r.idToken, uid: r.localId, expiresIn: Number(r.expiresIn) || 3600 }; });
  }

  /* Simpan seluruh data. Ditolak (403) oleh firestore.rules jika email login bukan admin. */
  function save(token, data) {
    return fetch(docUrl() + "?updateMask.fieldPaths=json", {
      method: "PATCH", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ fields: { json: { stringValue: JSON.stringify(data) } } })
    }).then(json).then(fromDoc).catch(function (e) {
      if (e.status === 403) e.message = "Tidak punya izin menyimpan. Pastikan email Anda terdaftar di firestore.rules.";
      throw e;
    });
  }

  /* ---------- Foto menu mitra: dokumen terpisah app/foto, field "json" = { idMenu: "data:image/webp;base64,…" } ----------
     Dipisah dari app/data agar aplikasi tidak mengunduh foto setiap dibuka (hanya saat menu mitra dibuka).
     Firebase Storage butuh paket berbayar (Blaze), jadi foto kecil disimpan langsung di Firestore (gratis, maks ~1 MB). */
  function loadFoto() {
    if (!on()) return Promise.resolve({});
    return fetch(docUrl("foto") + "?key=" + C.firebaseApiKey, { cache: "no-store" }).then(json)
      .then(function (doc) { return JSON.parse(doc.fields.json.stringValue); })
      .catch(function (e) { if (e.status === 404) return {}; throw e; });   // 404 = belum ada foto sama sekali
  }
  function saveFoto(token, map) {
    return fetch(docUrl("foto") + "?updateMask.fieldPaths=json", {
      method: "PATCH", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ fields: { json: { stringValue: JSON.stringify(map) } } })
    }).then(json).catch(function (e) {
      if (e.status === 403) e.message = "Tidak punya izin menyimpan foto. Pastikan aturan app/foto sudah ada di firestore.rules.";
      throw e;
    });
  }

  /* ---------- Ulasan (rating, kritik & saran) di koleksi "ulasan" ----------
     Pelanggan boleh mengirim (tanpa login); hanya admin yang boleh membaca & menghapus (lihat firestore.rules). */
  function colUrl() { return "https://firestore.googleapis.com/v1/projects/" + C.firebaseProjectId + "/databases/(default)/documents/ulasan"; }
  /* ID ulasan berurutan terbaru dulu: Firestore mengurutkan daftar menurut ID, dan tidak bisa mengurutkan menurut waktu dibuat.
     "000" + (9999999999999 − waktu sekarang) → ulasan lebih baru = ID lebih kecil = tampil lebih dulu.
     Ulasan lama ber-ID acak (huruf) otomatis berada di belakang. */
  function newestFirstId() {
    return "000" + String(9999999999999 - Date.now()).padStart(13, "0") + Math.random().toString(36).slice(2, 6);
  }
  function sendReview(r) {
    if (!on()) return Promise.reject(new Error("Firebase belum disetel"));
    return fetch(colUrl() + "?documentId=" + newestFirstId() + "&key=" + C.firebaseApiKey, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: { stars: { integerValue: String(r.stars) }, text: { stringValue: r.text }, name: { stringValue: r.name } } })
    }).then(json);
  }
  function toReview(d) {
    var f = d.fields || {};
    return { id: d.name, stars: Number((f.stars || {}).integerValue) || 0, text: (f.text || {}).stringValue || "", name: (f.name || {}).stringValue || "", at: d.createTime };
  }
  function byNewest(a, b) { return a.at < b.at ? 1 : -1; }
  /* Aplikasi pelanggan: satu halaman berisi n ulasan terbaru (n kali baca). page = token halaman berikutnya dari hasil sebelumnya.
     Hasil: { list, next } — next kosong bila sudah halaman terakhir. */
  function latestReviews(n, page) {
    if (!on()) return Promise.reject(new Error("Firebase belum disetel"));
    return fetch(colUrl() + "?pageSize=" + n + (page ? "&pageToken=" + encodeURIComponent(page) : "") + "&key=" + C.firebaseApiKey, { cache: "no-store" }).then(json)
      .then(function (r) { return { list: (r.documents || []).map(toReview).sort(byNewest), next: r.nextPageToken || "" }; });
  }
  /* Jumlah ulasan per bintang [_, ★1, …, ★5] lewat hitungan Firestore: 5 permintaan, ±1 kali baca masing-masing. */
  function reviewStats() {
    if (!on()) return Promise.reject(new Error("Firebase belum disetel"));
    var url = "https://firestore.googleapis.com/v1/projects/" + C.firebaseProjectId + "/databases/(default)/documents:runAggregationQuery?key=" + C.firebaseApiKey;
    return Promise.all([1, 2, 3, 4, 5].map(function (s) {
      return fetch(url, {
        method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
        body: JSON.stringify({ structuredAggregationQuery: { aggregations: [{ alias: "n", count: {} }], structuredQuery: { from: [{ collectionId: "ulasan" }],
          where: { fieldFilter: { field: { fieldPath: "stars" }, op: "EQUAL", value: { integerValue: String(s) } } } } } })
      }).then(json).then(function (r) { return Number(r[0].result.aggregateFields.n.integerValue) || 0; });
    })).then(function (c) { return [0].concat(c); });
  }
  /* Panel admin: semua ulasan (maks. 300) untuk dikelola. */
  function listReviews(token) {
    if (!on()) return Promise.reject(new Error("Firebase belum disetel"));
    var opt = token ? { headers: { Authorization: "Bearer " + token }, cache: "no-store" } : { cache: "no-store" };
    return fetch(colUrl() + "?pageSize=300" + (token ? "" : "&key=" + C.firebaseApiKey), opt).then(json).then(function (r) {
      return (r.documents || []).map(toReview).sort(byNewest);   // terbaru di atas
    });
  }
  function deleteReview(token, id) {
    return fetch("https://firestore.googleapis.com/v1/" + id, { method: "DELETE", headers: { Authorization: "Bearer " + token } }).then(json);
  }

  /* ---------- Catatan pesanan (koleksi "pesanan") ----------
     Saat pelanggan menekan "Kirim ke admin", isi pesan WA disimpan dengan kode pesanan sebagai ID.
     Pelanggan hanya boleh membuat (tidak bisa mengubah); hanya admin yang membaca, untuk mencocokkan harga di WA. */
  function pesananUrl(q) { return "https://firestore.googleapis.com/v1/projects/" + C.firebaseProjectId + "/databases/(default)/documents/pesanan" + (q || ""); }
  /* cart (opsional): [{id, qty}] menu mitra, agar stok bisa dikurangi saat admin mengonfirmasi. */
  function logOrder(code, text, total, mitra, cart) {
    if (!on()) return Promise.resolve();
    var f = { text: { stringValue: text }, total: { integerValue: String(Math.round(total) || 0) }, at: { timestampValue: new Date().toISOString() } };
    if (mitra && cart && cart.length) {
      var items = {}; cart.forEach(function (c) { items[c.id] = { integerValue: String(c.qty) }; });
      f.mitra = { stringValue: mitra }; f.items = { mapValue: { fields: items } };
    }
    return fetch(pesananUrl("?documentId=" + code + "&key=" + C.firebaseApiKey), {
      method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true,   // tetap terkirim walau aplikasi pindah ke WhatsApp
      body: JSON.stringify({ fields: f })
    }).then(json);
  }
  function toOrder(d) {
    var f = d.fields || {};
    var items = {}, raw = ((f.items || {}).mapValue || {}).fields || {};
    Object.keys(raw).forEach(function (k) { items[k] = Number(raw[k].integerValue) || 0; });
    return { code: d.name.split("/").pop(), text: (f.text || {}).stringValue || "", total: Number((f.total || {}).integerValue) || 0, at: (f.at || {}).timestampValue || d.createTime,
      mitra: (f.mitra || {}).stringValue || "", items: items, status: (f.status || {}).stringValue || "", updated: d.updateTime };
  }
  /* Panel admin: n pesanan terbaru (n kali baca). */
  function listOrders(token, n) {
    return fetch("https://firestore.googleapis.com/v1/projects/" + C.firebaseProjectId + "/databases/(default)/documents:runQuery", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, cache: "no-store",
      body: JSON.stringify({ structuredQuery: { from: [{ collectionId: "pesanan" }], orderBy: [{ field: { fieldPath: "at" }, direction: "DESCENDING" }], limit: n } })
    }).then(json).then(function (r) { return r.filter(function (x) { return x.document; }).map(function (x) { return toOrder(x.document); }); });
  }
  /* Panel admin: satu pesanan menurut kode (1 kali baca). null bila tidak ada. */
  function getOrder(token, code) {
    return fetch(pesananUrl("/" + encodeURIComponent(code)), { headers: { Authorization: "Bearer " + token }, cache: "no-store" }).then(json).then(toOrder)
      .catch(function (e) { if (e.status === 404) return null; throw e; });
  }

  /* Tandai pesanan dikonfirmasi admin. Gagal (bentrok) bila pesanan sudah diubah sejak dimuat, misal sudah dikonfirmasi admin lain. */
  function confirmOrder(token, o) {
    return fetch(pesananUrl("/" + o.code + "?updateMask.fieldPaths=status&currentDocument.updateTime=" + encodeURIComponent(o.updated)), {
      method: "PATCH", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ fields: { status: { stringValue: "ok" } } })
    }).then(json).catch(function (e) { if (/FAILED_PRECONDITION/.test(e.code || "")) e.conflict = true; throw e; });
  }

  window.Store = { confirmOrder: confirmOrder, getMitra: getMitra, saveMitra: saveMitra, signUp: signUp, getStaff: getStaff, listStaff: listStaff, setStaff: setStaff, delStaff: delStaff, logOrder: logOrder, listOrders: listOrders, getOrder: getOrder, on: on, load: load, login: login, save: save, loadFoto: loadFoto, saveFoto: saveFoto, sendReview: sendReview, latestReviews: latestReviews, reviewStats: reviewStats, listReviews: listReviews, deleteReview: deleteReview };
})();
