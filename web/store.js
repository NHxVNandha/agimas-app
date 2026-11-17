/* Data aplikasi (tarif, admin, driver) di Firebase Firestore, lewat REST tanpa library.
   Satu dokumen app/data dengan satu field "json" berisi teks JSON (bentuk sama dengan data.json). */
(function () {
  var C = window.AGIMAS_CONFIG || {};
  var LS = "agimas.data";
  function on() { return !!(C.firebaseApiKey && C.firebaseProjectId); }
  function docUrl() { return "https://firestore.googleapis.com/v1/projects/" + C.firebaseProjectId + "/databases/(default)/documents/app/data"; }
  function json(r) {
    if (!r.ok) return r.json().catch(function () { return {}; }).then(function (b) {
      var e = new Error((b.error && b.error.message) || r.statusText); e.status = r.status; throw e;
    });
    return r.json();
  }
  function local() { try { return JSON.parse(localStorage.getItem(LS)); } catch (e) { return null; } }
  function fromDoc(doc) { return { data: JSON.parse(doc.fields.json.stringValue), updatedAt: doc.updateTime, source: "online" }; }

  /* Urutan: Firestore → salinan terakhir di HP → data.json. Mengembalikan { data, updatedAt, source }.
     source "kosong" = Firebase tersambung tapi belum ada data (admin belum pernah menyimpan). */
  function load() {
    if (!on()) return fallback(new Error("Firebase belum disetel"));
    return fetch(docUrl() + "?key=" + C.firebaseApiKey, { cache: "no-store" }).then(json).then(function (doc) {
      var v = fromDoc(doc);
      try { localStorage.setItem(LS, JSON.stringify(v)); } catch (e) {}
      return v;
    }).catch(fallback);
  }
  function fallback(err) {
    var l = err.status === 404 ? null : local();
    if (l) { l.source = "tersimpan"; return l; }
    return fetch("data.json", { cache: "no-cache" }).then(json).then(function (d) {
      return { data: d, updatedAt: "", source: err.status === 404 ? "kosong" : "bawaan", error: String(err.message) };
    });
  }

  /* Mengembalikan { token, expiresIn (detik) }. */
  function login(email, password) {
    return fetch("https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" + C.firebaseApiKey, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, password: password, returnSecureToken: true })
    }).then(json).then(function (r) { return { token: r.idToken, expiresIn: Number(r.expiresIn) || 3600 }; });
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

  /* ---------- Ulasan (rating, kritik & saran) di koleksi "ulasan" ----------
     Pelanggan boleh mengirim (tanpa login); hanya admin yang boleh membaca & menghapus (lihat firestore.rules). */
  function colUrl() { return "https://firestore.googleapis.com/v1/projects/" + C.firebaseProjectId + "/databases/(default)/documents/ulasan"; }
  function sendReview(r) {
    if (!on()) return Promise.reject(new Error("Firebase belum disetel"));
    return fetch(colUrl() + "?key=" + C.firebaseApiKey, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: { stars: { integerValue: String(r.stars) }, text: { stringValue: r.text }, name: { stringValue: r.name } } })
    }).then(json);
  }
  function listReviews(token) {
    if (!on()) return Promise.reject(new Error("Firebase belum disetel"));
    var opt = token ? { headers: { Authorization: "Bearer " + token }, cache: "no-store" } : { cache: "no-store" };
    return fetch(colUrl() + "?pageSize=300" + (token ? "" : "&key=" + C.firebaseApiKey), opt).then(json).then(function (r) {
      return (r.documents || []).map(function (d) {
        var f = d.fields || {};
        return { id: d.name, stars: Number((f.stars || {}).integerValue) || 0, text: (f.text || {}).stringValue || "", name: (f.name || {}).stringValue || "", at: d.createTime };
      }).sort(function (a, b) { return a.at < b.at ? 1 : -1; });   // terbaru di atas
    });
  }
  function deleteReview(token, id) {
    return fetch("https://firestore.googleapis.com/v1/" + id, { method: "DELETE", headers: { Authorization: "Bearer " + token } }).then(json);
  }

  window.Store = { on: on, load: load, login: login, save: save, sendReview: sendReview, listReviews: listReviews, deleteReview: deleteReview };
})();
