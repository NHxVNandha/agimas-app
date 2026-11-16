(function () {
  var P = window.Pricing, D, T, META;
  /* Pembanding: kisaran tarif ojek online Zona I (Kemenhub), hanya untuk antar penumpang (sama seperti website). */
  var BAND = { loMin: 8000, hiMin: 10000, loKm: 2000, hiKm: 2500 };
  var TITLES = { ulasan: "Ulasan", bantuan: "Bantuan", kirim: "Kirim ke admin" };
  var VIEWS = ["home", "pesan", "kirim", "ulasan", "bantuan"];
  var o = { night: false, rain: false, svc: "orang", beliType: "makan", beliCat: "", km: null, w: 0, name: "", item: "", from: "", to: "", note: "", nearest: null, fromPt: null, toPt: null };
  var routeSeq = 0, routing = false;
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function adminWa(text) { return P.validPhone(D.admin.phone) ? P.waLink(D.admin.phone, text) : "#bantuan"; }

  // Nama pelanggan diingat di HP ini saja, supaya pesanan berikutnya lebih cepat.
  try { o.name = localStorage.getItem("agimas.name") || ""; } catch (e) {}

  function readForm() {
    o.w = parseInt($("w").value, 10) || 0; // o.km hanya diisi dari rute peta (updateRoute)
    ["name", "item", "from", "to", "note"].forEach(function (k) { o[k] = $(k).value.trim(); });
    try { localStorage.setItem("agimas.name", o.name); } catch (e) {}
  }

  function press(box, val) { Array.prototype.forEach.call($(box).children, function (b) { b.setAttribute("aria-pressed", String(b.dataset.v === val)); }); }

  function renderForm() {
    var f = P.fields(o), lain = f.noKm;
    $("beliBox").hidden = o.svc !== "beli";
    if (o.svc === "beli") { press("beliType", o.beliType); $("catBox").hidden = o.beliType !== "harian"; press("beliCat", o.beliCat); }
    $("kmField").hidden = lain;
    $("toStop").hidden = !f.to;
    $("wField").hidden = !(o.svc === "barang" || o.svc === "beli");
    $("itemField").hidden = !f.item;
    $("itemLab").textContent = f.item || ""; $("item").placeholder = f.itemPh || "";
    $("fromLab").textContent = f.from; $("from").placeholder = f.fromPh;
    $("toLab").textContent = f.to || ""; $("to").placeholder = f.toPh || "";
    var calc = !lain && routing; // rute sedang dihitung: tampilkan kerangka
    if (calc) $("kmOut").innerHTML = '<span class="sk skt" style="width:64px;height:1.1em"></span>';
    else $("kmOut").textContent = o.km == null ? "–" : P.numTxt(o.km) + " km";
    var waiting = !lain && o.km == null; // harga baru ada setelah jarak rute dihitung
    $("next").setAttribute("aria-disabled", String(waiting));
    $("lines").hidden = (waiting && !calc) || lain;
    if (lain) { $("price").textContent = "Harga dari admin"; $("priceNote").textContent = "Admin memberi harga dari keterangan Anda"; }
    else if (waiting) {
      if (calc) {
        $("price").innerHTML = '<span class="sk skt" style="width:130px;height:1.1em"></span><span class="sr">Menghitung harga</span>';
        $("priceNote").textContent = "Menghitung jarak & harga…";
        $("lines").innerHTML = [62, 48, 70].map(function (w) { return '<li class="sk-row" aria-hidden="true"><span class="sk skt" style="width:' + w + '%"></span><span class="sk skt" style="width:22%"></span></li>'; }).join("");
      } else { $("price").textContent = "Rp –"; $("priceNote").textContent = "Pilih titik jemput dan tujuan di peta"; }
      $("band").hidden = true;
    } else {
      o.night = P.isNight(new Date()); // tambahan malam otomatis dari jam HP
      var q = P.quote(T, o.svc, o.km, o.w, { night: o.night }), total = q.total;
      // Rincian harga seperti di website: tarif jarak, biaya berat, jasa belanja, pembulatan.
      $("lines").innerHTML = q.lines.map(function (l) { return "<li><span>" + esc(l.t) + "</span><span>" + esc(P.rp(l.v)) + "</span></li>"; }).join("") +
        '<li class="tot"><span>Perkiraan total</span><span>' + esc(P.rp(total)) + "</span></li>";
      $("price").textContent = P.rp(total);
      $("priceNote").textContent = o.night ? "Perkiraan, sudah termasuk tambahan malam" : "Perkiraan, belum termasuk tambahan hujan";
    }
    if (!waiting) $("band").hidden = o.svc !== "orang";
    if (o.svc === "orang" && !waiting) {
      var mk = T.orang.minKm, lo = o.km <= mk ? BAND.loMin : BAND.loMin + (o.km - mk) * BAND.loKm, hi = o.km <= mk ? BAND.hiMin : BAND.hiMin + (o.km - mk) * BAND.hiKm;
      $("dot").style.left = Math.max(0, Math.min(1, (total - lo) / (hi - lo))) * 100 + "%";
      $("lo").textContent = P.rp(lo); $("hi").textContent = P.rp(hi);
      $("bandNote").textContent = "Garis kuning: kisaran tarif ojek online Zona I (Jawa di luar Jabodetabek) untuk jarak yang sama. Titik biru: tarif Agi Mas." + (total < lo ? " Tarif ini di bawah batas bawah kisaran." : "");
    }
    $("condNote").hidden = lain;
    $("condNote").textContent = (o.night ? "Sekarang jam malam (21.00–05.00): tambahan malam +" + P.rp(T.night.add) + " setiap " + P.numTxt(T.night.every) + " km sudah dihitung. "
        : "Malam (21.00–05.00): tambahan +" + P.rp(T.night.add) + " setiap " + P.numTxt(T.night.every) + " km dihitung otomatis. ") +
      (o.rain ? "Data cuaca: kemungkinan hujan di titik jemput — admin dapat menambah +" + P.rp(T.rain.perKm) + " per km."
        : "Hujan: tambahan +" + P.rp(T.rain.perKm) + " per km ditetapkan admin.");
    $("condNote").classList.toggle("rain", o.rain);
  }

  /* Titik dari peta: tampilkan tanda, lalu hitung jarak rute jika jemput dan tujuan sudah ada. */
  function pick(k) {
    var f = P.fields(o), label = k === "from" ? f.from : f.to;
    MapPick.open(label, o[k + "Pt"] || (k === "to" ? o.fromPt : o.toPt), function (pt, addr) {
      o[k + "Pt"] = pt; o.km = null; // titik berubah: jarak dihitung ulang
      if (k === "from") checkRain(pt);
      if (addr) $(k).value = addr;
      readForm(); renderPts(); updateRoute();
    });
  }
  /* Cuaca saat ini di titik jemput (Open-Meteo, gratis tanpa API key). Hanya penanda untuk admin, bukan tagihan otomatis.
     Gagal/lambat: dianggap tidak ada data (o.rain = false). */
  var rainSeq = 0;
  function checkRain(pt) {
    var seq = ++rainSeq; o.rain = false;
    var url = "https://api.open-meteo.com/v1/forecast?latitude=" + pt.lat.toFixed(4) + "&longitude=" + pt.lng.toFixed(4) + "&current=precipitation,rain,showers,weather_code&timezone=Asia%2FJakarta";
    var ctl = window.AbortController ? new AbortController() : null;
    if (ctl) setTimeout(function () { ctl.abort(); }, 8000);
    fetch(url, ctl ? { signal: ctl.signal } : {}).then(function (r) { return r.json(); }).then(function (d) {
      if (seq !== rainSeq || !d.current) return;
      var c = d.current, code = c.weather_code;
      // Hujan: ada curah hujan, atau kode cuaca gerimis/hujan/hujan lokal/badai (WMO 51–67, 80–82, 95–99)
      o.rain = c.precipitation > 0 || c.rain > 0 || c.showers > 0 || (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95;
      renderForm(); if (!$("v-kirim").hidden) renderSend();
    }).catch(function () {});
  }

  function renderPts() {
    ["from", "to"].forEach(function (k) {
      $(k + "Pt").hidden = !o[k + "Pt"];
      $(k + "Pt").textContent = "✓ Titik peta dipilih";
    });
  }
  function updateRoute() {
    if (P.fields(o).noKm) { renderForm(); return; }
    if (!o.fromPt || !o.toPt) { $("kmNote").textContent = "Pilih juga " + (o.fromPt ? "titik tujuan" : "titik jemput") + " di peta."; renderForm(); return; }
    var seq = ++routeSeq;
    $("kmNote").textContent = "Menghitung jarak rute…"; routing = true; renderForm();
    MapPick.route(o.fromPt, o.toPt).then(function (r) {
      if (seq !== routeSeq) return;
      routing = false;
      o.km = P.billKm(r.km);
      $("kmNote").textContent = (r.approx ? "Perkiraan jarak (rute tidak tersedia): ±" : "Jarak rute dari peta: ") + P.numTxt(r.km.toFixed(1)) + " km, ditagih " + P.numTxt(o.km) + " km.";
      readForm(); renderForm();
    });
  }

  function renderSend() {
    o.nearest = P.nearestDriver(D.drivers, o.fromPt); // driver aktif terdekat, otomatis (untuk admin)
    var text = P.waText(T, D.admin.name, o);
    // Pratinjau seperti tampilan WhatsApp: *tebal*, _miring_
    $("preview").innerHTML = esc(text).replace(/\*([^*\n]+)\*/g, "<b>$1</b>").replace(/(^|\s)_([^_\n]+)_(?=\s|$)/g, "$1<i>$2</i>");
    var ok = P.validPhone(D.admin.phone);
    $("send").setAttribute("aria-disabled", String(!ok));
    $("send").href = ok ? P.waLink(D.admin.phone, text) : "#kirim";
    $("send").querySelector("span").textContent = ok ? "Kirim ke admin" : "Nomor admin belum diisi";
    var f = P.fields(o);
    $("sumSvc").textContent = f.name + " · " + f.desc;
    $("sumFrom").textContent = o.from || f.from + " belum diisi";
    $("sumToRow").hidden = !f.to;
    $("sumTo").textContent = o.to || (f.to || "") + " belum diisi";
    $("sumMeta").textContent = [f.noKm ? "" : P.numTxt(o.km) + " km", o.item].filter(Boolean).join(" · ");
  }

  function route() {
    var parts = location.hash.replace("#", "").split("/");
    var view = VIEWS.indexOf(parts[0]) > 0 ? parts[0] : "home";
    if (view === "pesan" && P.SVC[parts[1]]) {
      var prev = o.svc + o.beliType;
      o.svc = parts[1];
      if (o.svc === "beli" && P.BELI[parts[2]]) o.beliType = parts[2];
      // isian barang/daftar belanja berbeda arti tiap layanan: jangan terbawa
      if (o.svc + o.beliType !== prev) { o.item = ""; $("item").value = ""; }
    }
    if (view === "kirim" && !P.fields(o).noKm && o.km == null) { location.replace("#pesan/" + o.svc); return; }
    VIEWS.forEach(function (v) { $("v-" + v).hidden = v !== view; });
    var tab = view === "home" || view === "ulasan" || view === "bantuan";
    $("bar").hidden = view === "home";
    $("title").textContent = TITLES[view] || P.SVC[o.svc].name;
    $("tabs").hidden = !tab; $("sheet").hidden = tab;
    Array.prototype.forEach.call($("tabs").children, function (a) { if (a.dataset.tab === view) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    $("next").hidden = view !== "pesan"; $("send").hidden = view !== "kirim";
    if (view === "pesan") renderForm();
    if (view === "kirim") { readForm(); renderForm(); renderSend(); }
    scrollTo(0, 0);
  }

  /* "Setiap hari, 05.00–23.00" → "05.00–23.00" (jam layanan admin) */
  function hoursShort(h) { if (/24\s*jam/i.test(h || "")) return "24 jam"; var m = String(h || "").match(/\d{1,2}[.:]\d{2}\s*[–-]\s*\d{1,2}[.:]\d{2}/); return m ? m[0].replace(/\s/g, "").replace("-", "–") : (h || "–"); }

  /* Bagikan aplikasi: QR berisi link unduhan APK (data.json "about.downloadUrl"). Kosong = belum diatur. */
  function renderShare(url) {
    var ok = /^https?:\/\/\S+$/i.test(url || "");
    $("shareActs").hidden = !ok; $("qrUrl").textContent = ok ? url : "";
    if (!ok) { $("qrBox").innerHTML = '<p class="qrnone">Link unduhan belum diatur.<br>Kode QR akan muncul setelah aplikasi diunggah ke internet.</p>'; return; }
    try {
      var qr = qrcode(0, "M"); qr.addData(url); qr.make();
      $("qrBox").innerHTML = qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true, alt: "Kode QR unduh aplikasi Agi Mas" });
    } catch (e) { $("qrBox").innerHTML = '<p class="qrnone">Kode QR gagal dibuat.</p>'; }
    $("shareWa").href = "https://wa.me/?text=" + encodeURIComponent("Unduh aplikasi Agi Mas — antar, beli, dan bantu di Madiun dan sekitarnya: " + url);
  }

  function renderHome() {
    var t = T.orang, hr = new Date().getHours();
    $("hello").textContent = "Selamat " + (hr < 11 ? "pagi" : hr < 15 ? "siang" : hr < 18 ? "sore" : "malam") + "!";
    $("hlFare").textContent = P.rp(t.minFare).replace("Rp ", "Rp"); $("hlHours").textContent = hoursShort(D.admin.hours);
    $("lainBtn").href = adminWa("Halo " + D.admin.name + ", saya mau tanya layanan lainnya: ");

    // Bantuan: admin, tarif lengkap
    var ok = P.validPhone(D.admin.phone), wa = adminWa("Halo " + D.admin.name + ", saya mau tanya.");
    $("adminName").textContent = D.admin.name; $("adminTxt").textContent = D.admin.hours || "";
    $("adminNum").textContent = ok ? "+62 " + D.admin.phone.slice(2, 5) + "-" + D.admin.phone.slice(5, 9) + "-" + D.admin.phone.slice(9) : "Nomor belum diisi";
    $("adminBtn").href = wa; $("adminTop").href = wa;
    $("adminBtn").setAttribute("aria-disabled", String(!ok)); $("copyNum").disabled = !ok;
    var row = function (a, b) { return "<li><span>" + esc(a) + "</span><span>" + esc(b) + "</span></li>"; };
    var base = function (k) { var x = T[k]; return P.numTxt(x.minKm) + " km pertama " + P.rp(x.minFare) + ", lalu " + P.rp(x.perKm) + "/km"; };
    $("rateList").innerHTML = row("Agi Antar (penumpang)", base("orang")) + row("Agi Kirim (barang)", base("barang") + " + biaya berat") +
      row("Agi Beli (makanan & kebutuhan harian)", base("beli") + " + berat + jasa belanja " + P.rp(T.shop)) + row("Agi Bersih & lainnya", "Harga dari admin") +
      T.weights.filter(function (w) { return w.add > 0; }).map(function (w) { return row("Berat " + w.label, "+" + P.rp(w.add)); }).join("") +
      row("Malam (21.00–05.00)", "+" + P.rp(T.night.add) + " setiap " + P.numTxt(T.night.every) + " km · dihitung otomatis") + row("Hujan", "+" + P.rp(T.rain.perKm) + " per km · ditetapkan admin");
    $("rateNote").textContent = "Tambahan malam dihitung otomatis dari jam HP. Tambahan hujan ditetapkan admin; aplikasi memberi tanda bila data cuaca menunjukkan hujan di titik jemput. Tarif adalah perkiraan. Pembanding untuk antar penumpang: aturan tarif ojek online Zona I dari Kementerian Perhubungan (Rp2.000–2.500 per km, biaya minimal Rp8.000–10.000).";
    // Tentang aplikasi: versi + kontak pengembang (data.json "about"; bagian kontak disembunyikan bila kosong)
    $("aboutVer").textContent = "Versi " + (window.AGIMAS_VERSION || "-");
    var ab = D.about || {}, devWa = P.validPhone(ab.whatsapp || "");
    $("devName").textContent = ab.developer ? ", " + ab.developer : "";
    $("devWa").hidden = !devWa; if (devWa) $("devWa").href = P.waLink(ab.whatsapp, "Halo " + (ab.developer || "") + ", saya mau tanya tentang aplikasi Agi Mas.");
    $("devMail").hidden = !ab.email; if (ab.email) $("devMail").href = "mailto:" + ab.email + "?subject=" + encodeURIComponent("Aplikasi Agi Mas");
    $("devBox").hidden = !(ab.developer || devWa || ab.email);
    renderShare(ab.downloadUrl);
    $("stamp").textContent = META.source === "online"
      ? (META.updatedAt ? "Data diperbarui " + new Date(META.updatedAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "")
      : META.source === "tersimpan" ? "Sedang offline, memakai data terakhir yang tersimpan." : "";
  }

  /* ---------- Ulasan: bintang 1–5 + kritik & saran, disimpan di Firebase (dibaca admin) ---------- */
  var STAR_TXT = ["", "Kurang sekali", "Kurang", "Cukup", "Bagus", "Sangat bagus!"], stars = 0;
  function setStars(n) {
    stars = n;
    Array.prototype.forEach.call($("stars").children, function (b) { var v = +b.dataset.v; b.classList.toggle("on", v <= n); b.setAttribute("aria-checked", String(v === n)); });
    $("starLab").textContent = n ? n + " bintang · " + STAR_TXT[n] : "Ketuk bintang";
  }
  function revMsg(html, err) { $("revMsg").innerHTML = html; $("revMsg").className = "revmsg" + (err ? " err" : ""); }
  function initReview() {
    $("stars").addEventListener("click", function (e) { var b = e.target.closest("button[data-v]"); if (b) { setStars(+b.dataset.v); revMsg(""); } });
    $("revName").value = o.name;
    $("revForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var r = { stars: stars, text: $("revText").value.trim().slice(0, 1000), name: $("revName").value.trim().slice(0, 60) };
      if (!r.stars) { revMsg("Pilih bintang dulu (1–5).", true); return; }
      $("revSend").disabled = true; revMsg("Mengirim…");
      Store.sendReview(r).then(function () {
        $("revForm").hidden = true; $("revThanks").hidden = false; revMsg("");
      }).catch(function () {
        // Cadangan: kirim lewat WhatsApp admin bila penyimpanan gagal (offline / belum disetel)
        var wa = adminWa("Ulasan aplikasi Agi Mas: " + "★".repeat(r.stars) + " (" + r.stars + "/5)\n" + (r.text || "-") + (r.name ? "\n— " + r.name : ""));
        revMsg('Gagal mengirim. Periksa koneksi, atau <a href="' + esc(wa) + '" target="_blank" rel="noopener">kirim lewat WhatsApp admin</a>.', true);
      }).then(function () { $("revSend").disabled = false; });
    });
    $("revAgain").addEventListener("click", function () { setStars(0); $("revText").value = ""; $("revThanks").hidden = true; $("revForm").hidden = false; });
  }

  function start(res) {
    META = res; D = res.data; T = D.tarif;
    T.weights.forEach(function (w, i) { var op = document.createElement("option"); op.value = i; op.textContent = w.label + (w.add ? " (+" + P.rp(w.add) + ")" : ""); $("w").appendChild(op); });
    $("name").value = o.name;
    $("form").addEventListener("input", function () { readForm(); renderForm(); });
    $("form").addEventListener("click", function (e) { var b = e.target.closest("[data-pick]"); if (b) pick(b.dataset.pick); });
    $("beliType").addEventListener("click", function (e) { var b = e.target.closest("button[data-v]"); if (b) { o.beliType = b.dataset.v; if (o.beliType !== "harian") o.beliCat = ""; renderForm(); } });
    $("beliCat").addEventListener("click", function (e) { var b = e.target.closest("button[data-v]"); if (b) { o.beliCat = b.dataset.v; renderForm(); } });
    $("copyLink").addEventListener("click", function () {
      var url = (D.about || {}).downloadUrl;
      function good() { $("shareMsg").textContent = "Link tersalin."; }
      function bad() { $("shareMsg").textContent = "Tekan lama link di atas untuk menyalin."; }
      try { navigator.clipboard.writeText(url).then(good, bad); } catch (e) { bad(); }
    });
    $("copyNum").addEventListener("click", function () {
      function good() { $("copyMsg").textContent = "Nomor tersalin."; }
      function bad() { $("copyMsg").textContent = "Tekan lama nomor untuk menyalin."; }
      try { navigator.clipboard.writeText("+" + D.admin.phone).then(good, bad); } catch (e) { bad(); }
    });
    initReview();
    function goBack() { history.length > 1 ? history.back() : (location.hash = ""); }
    $("back").addEventListener("click", goBack);
    // Tombol back HP (dipanggil MainActivity di APK). true = kembali ke layar sebelumnya; false = di Beranda, aplikasi ditutup.
    window.agimasBack = function () {
      if (location.hash.length > 1 || !$("mapSheet").hidden) { goBack(); return true; }
      return false;
    };
    window.addEventListener("hashchange", route);
    renderHome(); route();
    // Petunjuk pasang di iPhone: hanya Safari iOS, belum dibuka dari layar utama, belum pernah ditutup.
    var ua = navigator.userAgent, ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    var standalone = navigator.standalone || (window.matchMedia && matchMedia("(display-mode: standalone)").matches), dismissed = false;
    try { dismissed = !!localStorage.getItem("agimas.iostip"); } catch (e) {}
    $("iosTip").hidden = !(ios && !standalone && !window.Capacitor && !dismissed);
    $("iosTipX").addEventListener("click", function () { $("iosTip").hidden = true; try { localStorage.setItem("agimas.iostip", "1"); } catch (e) {} });
    var sk = $("v-skel"); if (sk) sk.parentNode.removeChild(sk); // data siap: kerangka diganti isi asli
    window.agimasReady = true; window.dispatchEvent(new Event("agimas-ready")); // splash boleh selesai
  }

  Store.load().then(start).catch(function () {
    document.querySelector("main").innerHTML = '<p class="card">Gagal memuat data. Periksa koneksi internet lalu buka ulang aplikasi.</p>';
  });

  // Di APK (Capacitor) file sudah ada di dalam aplikasi, service worker tidak perlu.
  if ("serviceWorker" in navigator && !window.Capacitor) navigator.serviceWorker.register("sw.js");
})();
