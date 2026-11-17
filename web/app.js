(function () {
  var P = window.Pricing, D, T, META;
  /* Pembanding: kisaran tarif ojek online Zona I (Kemenhub), hanya untuk antar penumpang (sama seperti website). */
  var BAND = { loMin: 8000, hiMin: 10000, loKm: 2000, hiKm: 2500 };
  var TITLES = { ulasan: "Ulasan", bantuan: "Bantuan", kirim: "Kirim ke admin" };
  var VIEWS = ["home", "pesan", "kirim", "ulasan", "bantuan"];
  var o = { night: false, rain: false, svc: "orang", beliType: "makan", beliCat: "", km: null, w: 0, name: "", item: "", from: "", to: "", note: "", nearest: null, fromPt: null, toPt: null, mitra: "", picks: {}, cart: [], mitraName: "" };
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

  /* ---------- Mitra (misal Lingkar Kopi): menu dari panel admin ---------- */
  function mitraById(id) { return id ? ((D.mitra || []).filter(function (m) { return m.id === id && m.active; })[0] || null) : null; }
  function shownMitra() { return (D.mitra || []).filter(function (m) { return m.active && m.menu && m.menu.length; }); }
  function syncCart() {
    var mt = mitraById(o.mitra);
    o.cart = mt ? P.cartOf(mt, o.picks) : []; o.mitraName = mt ? mt.name : "";
    return mt;
  }
  /* Ganti mitra (dari link Beranda #pesan/beli/makan/<id>): titik ambil terisi alamat mitra, pilihan menu dikosongkan. */
  function setMitra(id) {
    var had = !!o.mitra, mt = mitraById(id);
    o.mitra = mt ? id : ""; o.picks = {}; $("menuMsg").textContent = "";
    if (mt) {
      $("from").value = mt.name + (mt.place ? " — " + mt.place : "");
      o.fromPt = mt.lat != null ? { lat: mt.lat, lng: mt.lng } : null;
    } else if (had) { $("from").value = ""; o.fromPt = null; }
    if (mt || had) { o.km = null; readForm(); renderPts(); updateRoute(); }
  }
  function renderMenu(mt) {
    var cats = [], by = {};
    mt.menu.forEach(function (m) {
      if (P.soldOut(m)) delete o.picks[m.id];                             // habis: keluarkan dari pilihan
      else if (m.stock != null && o.picks[m.id] > m.stock) o.picks[m.id] = m.stock;
      var c = m.cat || "Menu"; if (!by[c]) { by[c] = []; cats.push(c); } by[c].push(m);
    });
    var cart = P.cartOf(mt, o.picks), n = cart.reduce(function (a, c) { return a + c.qty; }, 0);
    $("menuList").innerHTML = '<div class="mhd"><span class="ti"><svg class="i"><use href="#i-coffee"/></svg></span><div><b>Menu ' + esc(mt.name) + "</b><small>" + esc(mt.tagline || "Pilih menu dan jumlahnya") + "</small></div></div>" +
      cats.map(function (c) {
        return (cats.length > 1 || c !== "Menu" ? '<p class="mcat">' + esc(c) + "</p>" : "") + by[c].map(function (m) {
          var off = P.soldOut(m), q = o.picks[m.id] || 0, max = m.stock != null ? m.stock : 99;
          var tag = off ? '<span class="mstk">Habis</span>' : (m.stock != null && m.stock <= 5 ? '<span class="mstk">Sisa ' + m.stock + "</span>" : "");
          return '<div class="mitem' + (off ? " off" : "") + '"><div class="grow"><b>' + esc(m.name) + "</b>" + (m.desc ? "<small>" + esc(m.desc) + "</small>" : "") +
            '<span class="mprice">' + esc(P.rp(m.price)) + "</span>" + tag + "</div>" +
            '<div class="qty' + (q ? " has" : "") + '"><button type="button" data-q="-1" data-id="' + esc(m.id) + '" aria-label="Kurangi ' + esc(m.name) + '"' + (q ? "" : " disabled") + ">−</button>" +
            "<output>" + q + '</output><button type="button" data-q="1" data-id="' + esc(m.id) + '" aria-label="Tambah ' + esc(m.name) + '"' + (off || q >= max ? " disabled" : "") + ">+</button></div></div>";
        }).join("");
      }).join("") +
      (n ? '<div class="menusum"><span>' + n + " item dipilih</span><span>" + esc(P.rp(P.menuTotal(cart))) + "</span></div>" : "");
  }

  function renderForm() {
    var f = P.fields(o), lain = f.noKm, mt = syncCart();
    $("menuBox").hidden = !mt;
    if (mt) renderMenu(mt), syncCart();
    $("beliBox").hidden = o.svc !== "beli" || !!mt;
    if (o.svc === "beli") { press("beliType", o.beliType); $("catBox").hidden = o.beliType !== "harian"; press("beliCat", o.beliCat); }
    $("kmField").hidden = lain;
    $("toStop").hidden = !f.to;
    $("wField").hidden = !(o.svc === "barang" || o.svc === "beli");
    $("itemField").hidden = !f.item;
    $("itemLab").textContent = mt ? "Pesanan tambahan (opsional)" : f.item || ""; $("item").placeholder = mt ? "Contoh: es dipisah, gula sedikit" : f.itemPh || "";
    $("fromLab").textContent = f.from; $("from").placeholder = f.fromPh;
    $("toLab").textContent = f.to || ""; $("to").placeholder = f.toPh || "";
    var calc = !lain && routing; // rute sedang dihitung: tampilkan kerangka
    if (calc) $("kmOut").innerHTML = '<span class="sk skt" style="width:64px;height:1.1em"></span>';
    else $("kmOut").textContent = o.km == null ? "–" : P.numTxt(o.km) + " km";
    var waiting = !lain && o.km == null; // harga baru ada setelah jarak rute dihitung
    var noMenu = !!mt && !o.cart.length && !o.item;                    // mitra: pilih menu dulu
    $("next").setAttribute("aria-disabled", String(waiting || noMenu));
    $("lines").hidden = (waiting && !calc) || lain;
    if (lain) { $("price").textContent = "Harga dari admin"; $("priceNote").textContent = "Admin memberi harga dari keterangan Anda"; }
    else if (waiting) {
      if (calc) {
        $("price").innerHTML = '<span class="sk skt" style="width:130px;height:1.1em"></span><span class="sr">Menghitung harga</span>';
        $("priceNote").textContent = "Menghitung jarak & harga…";
        $("lines").innerHTML = [62, 48, 70].map(function (w) { return '<li class="sk-row" aria-hidden="true"><span class="sk skt" style="width:' + w + '%"></span><span class="sk skt" style="width:22%"></span></li>'; }).join("");
      } else {
        $("price").textContent = "Rp –";
        $("priceNote").textContent = o.fromPt && !o.toPt ? "Pilih titik tujuan di peta" : !o.fromPt && o.toPt ? "Pilih titik jemput di peta" : "Pilih titik jemput dan tujuan di peta";
      }
      $("band").hidden = true;
    } else {
      o.night = P.isNight(new Date()); // tambahan malam otomatis dari jam HP
      var q = P.quote(T, o.svc, o.km, o.w, { night: o.night }), total = q.total;
      // Rincian harga seperti di website: tarif jarak, biaya berat, jasa belanja, pembulatan.
      var mtot = P.menuTotal(o.cart), lines = q.lines.slice();
      if (o.cart.length) { lines = [{ t: "Menu " + o.mitraName, v: mtot }].concat(lines.map(function (l) { return { t: "Ongkir: " + l.t.charAt(0).toLowerCase() + l.t.slice(1), v: l.v }; })); total += mtot; }
      $("lines").innerHTML = lines.map(function (l) { return "<li><span>" + esc(l.t) + "</span><span>" + esc(P.rp(l.v)) + "</span></li>"; }).join("") +
        '<li class="tot"><span>Perkiraan total' + (o.cart.length ? " (menu + ongkir)" : "") + "</span><span>" + esc(P.rp(total)) + "</span></li>";
      $("price").textContent = P.rp(total);
      $("priceNote").textContent = noMenu ? "Pilih menu dulu" : o.night ? "Perkiraan, sudah termasuk tambahan malam" : "Perkiraan, belum termasuk tambahan hujan";
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
    syncCart();
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
    var nItem = o.cart.reduce(function (a, c) { return a + c.qty; }, 0);
    $("sumMeta").textContent = [f.noKm ? "" : P.numTxt(o.km) + " km", nItem ? nItem + " menu " + o.mitraName + " (" + P.rp(P.menuTotal(o.cart)) + ")" : "", o.item].filter(Boolean).join(" · ");
    if (o.mitraName) $("sumSvc").textContent = f.name + " · " + o.mitraName;
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
      var mid = o.svc === "beli" ? parts[3] || "" : "";
      if (mid !== o.mitra) { if (mid && !mitraById(mid)) { location.replace("#pesan/beli/makan"); return; } o.item = ""; $("item").value = ""; setMitra(mid); }
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
    if (view === "ulasan") loadPublicReviews();
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
    Array.prototype.slice.call(document.querySelectorAll("#hl .hlc.m")).forEach(function (x) { x.parentNode.removeChild(x); });
    shownMitra().reverse().forEach(function (mt) {
      var a = document.createElement("a");
      a.className = "hlc m"; a.href = "#pesan/beli/makan/" + encodeURIComponent(mt.id);
      a.innerHTML = '<div class="hlt"><span class="hlk">Mitra Agimas</span><span class="hli"><svg class="i"><use href="#i-coffee"/></svg></span></div><b>' + esc(mt.name) + "</b><small>" + esc(mt.tagline ? mt.tagline + " · " : "") + "<b>Lihat menu →</b></small>";
      $("hl").insertBefore(a, $("hl").firstChild);
    });
    $("hlDots").innerHTML = Array.prototype.map.call($("hl").children, function (x, i) { return i ? "<i></i>" : '<i class="on"></i>'; }).join("");

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
  /* Ulasan semua pelanggan di bawah formulir: rata-rata, persentase & jumlah per bintang, daftar terbaru di atas. */
  var PUB_STEP = 20, pubAll = [], pubShown = 0;
  function starTxt(n) { return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n); }
  function renderPubList() {
    $("pubList").innerHTML = pubAll.slice(0, pubShown).map(function (r) {
      var name = r.name || "Anonim", when = r.at ? new Date(r.at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "";
      return '<article class="pubrev"><div class="top"><span class="av" aria-hidden="true">' + esc(name.charAt(0).toUpperCase()) + '</span>' +
        '<div class="who"><b>' + esc(name) + '</b><span aria-label="' + r.stars + ' bintang">' + starTxt(r.stars) + '</span></div><time>' + when + "</time></div>" +
        (r.text ? "<p>" + esc(r.text) + "</p>" : "") + "</article>";
    }).join("") + (pubShown < pubAll.length ? '<button type="button" class="btn ghost sm" id="pubMore">Lihat ulasan lainnya (' + (pubAll.length - pubShown) + ')</button>' : "");
  }
  function loadPublicReviews() {
    Store.listReviews().then(function (list) {
      pubAll = list.filter(function (r) { return r.stars >= 1 && r.stars <= 5; }); pubShown = PUB_STEP;
      if (!pubAll.length) { $("pubSum").innerHTML = '<p class="muted">Belum ada ulasan. Jadilah yang pertama!</p>'; $("pubList").innerHTML = ""; return; }
      var sum = 0, cnt = [0, 0, 0, 0, 0, 0], n = pubAll.length;
      pubAll.forEach(function (r) { sum += r.stars; cnt[r.stars]++; });
      var avg = sum / n;
      $("pubSum").innerHTML = '<div class="pubavg"><b>' + avg.toFixed(1).replace(".", ",") + "</b><span>" + starTxt(Math.round(avg)) + "</span><small>" + n + " ulasan</small></div>" +
        '<div class="pubbars">' + [5, 4, 3, 2, 1].map(function (s) {
          var pct = Math.round(cnt[s] / n * 100);
          return "<div><span>" + s + '★</span><i><em style="width:' + pct + '%"></em></i><small>' + pct + "% · " + cnt[s] + "</small></div>";
        }).join("") + "</div>";
      renderPubList();
    }).catch(function (e) {
      $("pubSum").innerHTML = '<p class="muted">' + (e.status === 403 ? "Ulasan belum bisa ditampilkan." : "Gagal memuat ulasan. Periksa koneksi internet.") + "</p>";
      $("pubList").innerHTML = "";
    });
  }
  function initReview() {
    $("pubList").addEventListener("click", function (e) { if (e.target.closest("#pubMore")) { pubShown += PUB_STEP; renderPubList(); } });
    $("stars").addEventListener("click", function (e) { var b = e.target.closest("button[data-v]"); if (b) { setStars(+b.dataset.v); revMsg(""); } });
    $("revName").value = o.name;
    $("revForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var r = { stars: stars, text: $("revText").value.trim().slice(0, 1000), name: $("revName").value.trim().slice(0, 60) };
      if (!r.stars) { revMsg("Pilih bintang dulu (1–5).", true); return; }
      $("revSend").disabled = true; revMsg("Mengirim…");
      Store.sendReview(r).then(function () {
        $("revForm").hidden = true; $("revThanks").hidden = false; revMsg(""); loadPublicReviews();
      }).catch(function () {
        // Cadangan: kirim lewat WhatsApp admin bila penyimpanan gagal (offline / belum disetel)
        var wa = adminWa("Ulasan aplikasi Agi Mas: " + "★".repeat(r.stars) + " (" + r.stars + "/5)\n" + (r.text || "-") + (r.name ? "\n— " + r.name : ""));
        revMsg('Gagal mengirim. Periksa koneksi, atau <a href="' + esc(wa) + '" target="_blank" rel="noopener">kirim lewat WhatsApp admin</a>.', true);
      }).then(function () { $("revSend").disabled = false; });
    });
    $("revAgain").addEventListener("click", function () { setStars(0); $("revText").value = ""; $("revThanks").hidden = true; $("revForm").hidden = false; });
  }

  /* ---------- Pembaruan aplikasi ----------
     Web/iPhone: file diambil dari server, jadi versi baru cukup dimuat ulang.
     APK: tampilan tersimpan di dalam APK (tanpa badge Netlify). Versi baru dicek di server; pengguna melihat daftar fitur
     barunya lalu mengunduh APK terbaru langsung dari aplikasi (dipasang di atas versi lama, data tetap).
     "Yang baru" tampil sekali setelah versi berubah. */
  var VER = window.AGIMAS_VERSION || "0", lastCheck = 0, remote = null;
  var SITE = "https://solusiagimas.netlify.app/";
  var NATIVE = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  var OLD_APK = NATIVE && location.hostname === "solusiagimas.netlify.app"; // APK 3.0 memuat dari server: minta pasang APK baru
  // APK 3.2+: plugin native AppUpdate mengunduh APK di dalam aplikasi dengan progres (AppUpdatePlugin.java).
  var IN_APP = NATIVE && (window.Capacitor.PluginHeaders || []).some(function (p) { return p.name === "AppUpdate"; });
  var waitPerm = false, NOTE = "";
  function newer(a, b) { a = String(a).split("."); b = String(b).split("."); for (var i = 0; i < 3; i++) { var d = (+a[i] || 0) - (+b[i] || 0); if (d) return d > 0; } return false; }
  /* list: catatan versi; dl: versi yang bisa diunduh (APK) atau kosong (hanya info). */
  function showNews(list, dl) {
    var dlg = $("newsDlg");
    list = list.slice(0, 3);
    if (!list.length || !dlg.showModal) return;
    $("newsTitle").textContent = dl ? "Versi " + dl + " sudah tersedia" : "Yang baru di Agi Mas";
    $("newsList").innerHTML = list.map(function (c) {
      return '<section><h3>Versi ' + esc(c.v) + (c.v === VER && !dl ? ' <span class="chip">Sekarang</span>' : "") + "</h3><ul>" + c.items.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul></section>";
    }).join("");
    $("newsOk").textContent = dl ? "Unduh & pasang" : "Oke, mengerti";
    $("newsOk").dataset.dl = dl ? "1" : "";
    $("newsLater").hidden = !dl;
    $("newsNote").hidden = !dl;
    $("newsNote").textContent = NOTE || (NOTE = $("newsNote").textContent);
    $("newsProg").hidden = true; $("newsOk").disabled = false;
    if (!dlg.open) dlg.showModal();
  }
  function localNews(since) { return (window.AGIMAS_CHANGES || []).filter(function (c) { return !since || newer(c.v, since); }); }
  function remoteNews() { return remote.changes.filter(function (c) { return OLD_APK || newer(c.v, VER); }); }
  function prog(text, pct) { $("newsProg").hidden = false; $("newsBar").style.width = pct + "%"; $("newsProgTxt").textContent = text; }
  function mb(n) { return (n / 1048576).toFixed(1).replace(".", ","); }
  /* Unduh di dalam aplikasi lalu buka layar pasang Android. Izin "pasang aplikasi" diminta sekali (Android 8+). */
  function inAppUpdate() {
    var C = window.Capacitor;
    C.nativePromise("AppUpdate", "canInstall", {}).then(function (r) {
      if (!r.allowed) {
        waitPerm = true;
        $("newsNote").hidden = false;
        $("newsNote").textContent = "Langkah sekali saja: nyalakan \"Izinkan dari sumber ini\" untuk Agi Mas, lalu kembali ke aplikasi. Unduhan mulai otomatis.";
        C.nativePromise("AppUpdate", "openInstallSettings", {});
        return;
      }
      $("newsOk").disabled = true; $("newsOk").textContent = "Mengunduh…"; $("newsLater").hidden = true; $("newsNote").hidden = true;
      prog("Mengunduh… 0%", 0);
      C.nativeCallback("AppUpdate", "download", { url: SITE + "unduh/AgiMas.apk" }, function (d, err) {
        if (err || !d) {
          prog("Gagal: " + ((err && err.message) || "periksa koneksi internet") + ".", 0);
          $("newsOk").disabled = false; $("newsOk").textContent = "Coba lagi"; $("newsLater").hidden = false; return;
        }
        if (d.done) {
          prog("Unduhan selesai. Ketuk \"Update\" lalu \"Buka\" di layar pemasangan.", 100);
          $("newsOk").disabled = false; $("newsOk").textContent = "Pasang lagi"; $("newsLater").hidden = false; return;
        }
        var pct = d.total > 0 ? Math.round(d.loaded / d.total * 100) : 0;
        prog("Mengunduh… " + (d.total > 0 ? pct + "% · " + mb(d.loaded) + " / " + mb(d.total) + " MB" : mb(d.loaded) + " MB"), pct);
      });
    }).catch(function () { prog("Gagal memulai pembaruan.", 0); });
  }
  function checkUpdate(manual) {
    lastCheck = Date.now();
    if (manual) { $("updMsg").textContent = "Mengecek…"; $("updCheck").disabled = true; }
    return fetch((NATIVE ? SITE : "") + "version.js?t=" + Date.now(), { cache: "no-store" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); }).then(function (t) {
      var m = /AGIMAS_VERSION\s*=\s*"([^"]+)"/.exec(t), c = /AGIMAS_CHANGES\s*=\s*(\[[\s\S]*\]);/.exec(t), changes = [];
      try { changes = c ? JSON.parse(c[1]) : []; } catch (e) {}
      remote = { v: m && m[1], changes: changes };
      if (remote.v && (newer(remote.v, VER) || OLD_APK)) {
        $("updVer").textContent = remote.v; $("updBar").hidden = false;
        if (manual) $("updMsg").textContent = "Versi " + remote.v + " tersedia. Tekan Perbarui di atas.";
      } else if (manual) $("updMsg").textContent = "Sudah versi terbaru (" + VER + ").";
    }).catch(function () { if (manual) $("updMsg").textContent = "Gagal mengecek. Periksa koneksi internet."; })
      .then(function () { if (manual) $("updCheck").disabled = false; });
  }
  function initUpdate() {
    $("updCheck").addEventListener("click", function () { checkUpdate(true); });
    $("newsOpen").addEventListener("click", function () { showNews(localNews(""), ""); });
    $("newsLater").addEventListener("click", function () { $("newsDlg").close(); });
    $("newsOk").addEventListener("click", function () {
      if (this.dataset.dl && IN_APP) { inAppUpdate(); return; }
      $("newsDlg").close();
      // Alamat di luar aplikasi dibuka Capacitor di browser HP, yang mengunduh APK-nya. APK 3.0 menganggap alamat Netlify
      // https sebagai miliknya sendiri, jadi dipakai http (Netlify mengalihkan ke https di browser).
      if (this.dataset.dl) location.href = (OLD_APK ? SITE.replace("https:", "http:") : SITE) + "unduh/AgiMas.apk";
    });
    $("updNow").addEventListener("click", function () {
      if (NATIVE) { var l = remote ? remoteNews() : []; showNews(l.length ? l : [{ v: remote.v, items: ["Perbaikan dan penyempurnaan."] }], remote.v); return; }
      // Web: hapus salinan lama di HP lalu muat ulang, supaya semua file diambil baru dari server.
      $("updNow").disabled = true; $("updNow").textContent = "Memperbarui…";
      var wipe = window.caches ? caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); }) : Promise.resolve();
      wipe.catch(function () {}).then(function () { location.reload(); });
    });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) return;
      // Kembali dari pengaturan izin: lanjutkan unduhan bila izin sudah dinyalakan.
      if (waitPerm) {
        waitPerm = false;
        window.Capacitor.nativePromise("AppUpdate", "canInstall", {}).then(function (r) {
          if (r.allowed) inAppUpdate(); else $("newsNote").textContent = "Izin belum dinyalakan. Ketuk Unduh & pasang untuk mencoba lagi.";
        });
      }
      if (Date.now() - lastCheck > 10 * 60 * 1000) checkUpdate(false);
    });
    var seen = "";
    try { seen = localStorage.getItem("agimas.seenVersion") || ""; localStorage.setItem("agimas.seenVersion", VER); } catch (e) { seen = VER; }
    function after() {
      // Belum pernah tercatat (pengguna baru / dari APK lama): tampilkan catatan versi ini saja.
      var prev = (window.AGIMAS_CHANGES || [])[1];
      if (seen !== VER && !OLD_APK) showNews(localNews(seen || (prev ? prev.v : "")), "");
      checkUpdate(false);
    }
    if (document.getElementById("splash")) window.addEventListener("agimas-splash-done", after); else after();
  }

  /* Kartu sorotan Beranda: titik ikut posisi geser; sekali di HP baru, kartu "mengintip" ke kiri sebagai tanda bisa digeser. */
  function initHighlights() {
    var hl = $("hl"), dots = $("hlDots").children;
    hl.addEventListener("scroll", function () {
      var step = hl.children[1].offsetLeft - hl.children[0].offsetLeft, i = Math.round(hl.scrollLeft / step);
      if (hl.scrollLeft + hl.clientWidth >= hl.scrollWidth - 4) i = dots.length - 1; // kartu terakhir
      Array.prototype.forEach.call(dots, function (d, k) { d.classList.toggle("on", k === i); });
    }, { passive: true });
    var seen = false;
    try { seen = !!localStorage.getItem("agimas.hlhint"); localStorage.setItem("agimas.hlhint", "1"); } catch (e) {}
    var still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (seen || still) return;
    function nudge() { setTimeout(function () { if (hl.scrollWidth <= hl.clientWidth) return; hl.classList.add("nudge"); setTimeout(function () { hl.classList.remove("nudge"); }, 1700); }, 400); }
    if (document.getElementById("splash")) window.addEventListener("agimas-splash-done", nudge); else nudge();
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
    initReview(); initUpdate(); initHighlights();
    $("menuList").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-q]"); if (!b || b.disabled) return;
      var id = b.dataset.id, q = (o.picks[id] || 0) + Number(b.dataset.q);
      if (q > 0) o.picks[id] = q; else delete o.picks[id];
      $("menuMsg").textContent = ""; renderForm();
    });
    // Sebelum lanjut, cek stok terbaru di server: menu yang baru saja habis/berkurang disesuaikan dulu.
    $("next").addEventListener("click", function (e) {
      var mt = mitraById(o.mitra);
      if (!mt || !o.cart.length || $("next").getAttribute("aria-disabled") === "true") return;
      e.preventDefault();
      $("menuMsg").textContent = ""; $("priceNote").textContent = "Mengecek stok terbaru…";
      Store.load().then(function (res) {
        if (res.source === "online" && res.data.mitra) D.mitra = res.data.mitra;
        var fresh = mitraById(o.mitra), bad = fresh ? P.checkCart(fresh, o.picks) : [{ why: "tidak tersedia" }];
        if (!fresh) { location.replace("#pesan/beli/makan"); return; }
        if (!bad.length) { location.hash = "#kirim"; return; }
        bad.forEach(function (x) { if (x.max) o.picks[x.id] = x.max; else delete o.picks[x.id]; });
        $("menuMsg").textContent = "Stok berubah: " + bad.map(function (x) { return (x.name || "menu") + " " + x.why; }).join(", ") + ". Pesanan sudah disesuaikan, cek lagi lalu tekan Lanjut.";
        renderForm();
      }).catch(function () { location.hash = "#kirim"; });                // offline: admin tetap mengecek lewat WA
    });
    function goBack() { history.length > 1 ? history.back() : (location.hash = ""); }
    $("back").addEventListener("click", goBack);
    // Tombol back HP (dipanggil MainActivity di APK). true = kembali ke layar sebelumnya; false = di Beranda, aplikasi ditutup.
    window.agimasBack = function () {
      if ($("newsDlg").open) { $("newsDlg").close(); return true; }
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
  if ("serviceWorker" in navigator && !NATIVE) navigator.serviceWorker.register("sw.js");
})();
