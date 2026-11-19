(function () {
  var P = window.Pricing, D, T, META;
  var QRIS = (window.AGIMAS_CONFIG || {}).qris || "";   // QRIS statis DANA Bisnis (config.js)
  /* Pembanding: kisaran tarif ojek online Zona I (Kemenhub), hanya untuk antar penumpang (sama seperti website). */
  var BAND = { loMin: 8000, hiMin: 10000, loKm: 2000, hiKm: 2500 };
  var TITLES = { ulasan: "Ulasan", bantuan: "Bantuan", kirim: "Kirim ke admin" };
  var VIEWS = ["home", "pesan", "kirim", "ulasan", "bantuan"];
  var o = { night: false, rain: false, svc: "orang", beliType: "makan", beliCat: "", km: null, w: 0, name: "", item: "", from: "", to: "", note: "", nearest: null, fromPt: null, toPt: null, mitra: "", picks: {}, cart: [], mitraName: "", pay: "tunai", paid: false, payAmt: 0, payTo: "", notes: {} };
  var routeSeq = 0, routing = false;
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function adminWa(text) { return P.validPhone(D.admin.phone) ? P.waLink(D.admin.phone, text) : "#bantuan"; }

  /* ---------- Keranjang: menu mitra yang dipilih, tersimpan di HP (localStorage), satu mitra per keranjang ----------
     cart.picks { idMenu: jumlah }, cart.notes { idMenu: catatan }. Di halaman menu mitra, o.picks/o.notes = objek yang sama. */
  var CART_KEY = "agimas.cart", view = "home", sentCart = false, goRoute = false, openCart = false;
  var cart = (function () {
    try { var c = JSON.parse(localStorage.getItem(CART_KEY)); if (c && c.mitra && c.picks) return { mitra: String(c.mitra), picks: c.picks, notes: c.notes || {} }; } catch (e) {}
    return { mitra: "", picks: {}, notes: {} };
  })();
  function cartCount() { var n = 0; for (var k in cart.picks) n += cart.picks[k]; return n; }
  function saveCart() {
    try { if (cart.mitra && cartCount()) localStorage.setItem(CART_KEY, JSON.stringify(cart)); else localStorage.removeItem(CART_KEY); } catch (e) {}
    renderSheetCart();
  }
  function clearCart() {
    cart = { mitra: "", picks: {}, notes: {} };
    if (o.mitra) { cart.mitra = o.mitra; o.picks = cart.picks; o.notes = cart.notes; }
    saveCart();
  }
  /* Sesuaikan isi keranjang dengan menu terbaru: menu dihapus/habis dikeluarkan, jumlah dibatasi stok. Hasil: daftar perubahan. */
  function fixCart(mt) {
    var out = [];
    Object.keys(cart.picks).forEach(function (id) {
      var m = mt && mt.menu.filter(function (x) { return x.id === id; })[0];
      if (!m || P.soldOut(m)) { out.push((m ? m.name : "Menu") + " habis"); delete cart.picks[id]; delete cart.notes[id]; }
      else if (m.stock != null && cart.picks[id] > m.stock) { out.push(m.name + " tinggal " + m.stock); cart.picks[id] = m.stock; }
    });
    if (out.length) saveCart();
    return out;
  }

  // Nama pelanggan diingat di HP ini saja, supaya pesanan berikutnya lebih cepat.
  try { o.name = localStorage.getItem("agimas.name") || ""; } catch (e) {}

  function readForm() {
    o.w = o.mitra ? 0 : parseInt($("w").value, 10) || 0;   // pesanan menu mitra: tanpa biaya berat // o.km hanya diisi dari rute peta (updateRoute)
    ["name", "item", "from", "to", "note"].forEach(function (k) { o[k] = $(k).value.trim(); });
    try { localStorage.setItem("agimas.name", o.name); } catch (e) {}
  }

  function press(box, val) { Array.prototype.forEach.call($(box).children, function (b) { b.setAttribute("aria-pressed", String(b.dataset.v === val)); }); }

  /* ---------- Mitra (misal Lingkar Kopi): menu dari panel admin ---------- */
  function mitraById(id) { return id ? ((D.mitra || []).filter(function (m) { return m.id === id && m.active; })[0] || null) : null; }
  function shownMitra() { return (D.mitra || []).filter(function (m) { return m.active && m.menu && m.menu.length; }); }
  function syncCart() {
    var mt = mitraById(o.mitra);
    o.cart = mt ? P.cartOf(mt, o.picks, o.notes) : []; o.mitraName = mt ? mt.name : "";
    return mt;
  }
  /* Ganti mitra (dari link Beranda #pesan/beli/makan/<id>): titik ambil terisi alamat mitra, pilihan menu dikosongkan. */
  function setMitra(id) {
    var had = !!o.mitra, mt = mitraById(id);
    // Keranjang berisi menu mitra lain: tanya dulu sebelum dikosongkan
    if (mt && cart.mitra && cart.mitra !== id && cartCount()) {
      var old = mitraById(cart.mitra);
      if (old && !window.confirm("Keranjang Anda berisi menu " + old.name + ". Kosongkan keranjang dan pesan dari " + mt.name + "?")) {
        location.replace("#pesan/beli/makan/" + encodeURIComponent(cart.mitra)); return false;
      }
      cart = { mitra: "", picks: {}, notes: {} };
    }
    if (mt) { cart.mitra = id; o.picks = cart.picks; o.notes = cart.notes; } else { o.picks = {}; o.notes = {}; }
    o.mitra = mt ? id : ""; $("menuMsg").textContent = "";
    saveCart();
    if (mt) {
      $("from").value = mt.name + (mt.place ? " — " + mt.place : "");
      o.fromPt = mt.lat != null ? { lat: mt.lat, lng: mt.lng } : null;
    } else if (had) { $("from").value = ""; o.fromPt = null; }
    if (mt || had) { o.km = null; readForm(); renderPts(); updateRoute(); }
    return true;
  }
  /* Foto menu (dokumen app/foto): diunduh sekali, saat menu mitra pertama kali dibuka. */
  var FOTO = null;
  function needFoto() {
    if (FOTO) return;
    FOTO = {};
    Store.loadFoto().then(function (f) { FOTO = f; var mt = syncCart(); if (mt) renderMenu(mt); }).catch(function () { FOTO = null; });
  }
  function fotoOf(id) { var f = FOTO && FOTO[id]; return /^data:image\/(webp|jpeg);base64,[A-Za-z0-9+\/=]+$/.test(f || "") ? f : ""; }
  /* Kartu mitra di Beranda = banner gelembung chat Lingkar Kopi di bawah kartu hero (tampil bila mitranya aktif & punya menu). */
  function mitraCards() { $("promoLk").hidden = !shownMitra().some(function (m) { return m.id === "lingkar"; }); }
  function renderMenu(mt) {
    needFoto();
    var cats = [], by = {}, hr = P.mitraOpen(mt), fixed = fixCart(mt);   // habis / stok kurang: keranjang disesuaikan
    if (fixed.length) $("menuMsg").textContent = "Keranjang disesuaikan: " + fixed.join(", ") + ".";
    mt.menu.forEach(function (m) {
      var c = m.cat || "Menu"; if (!by[c]) { by[c] = []; cats.push(c); } by[c].push(m);
    });
    var cart = P.cartOf(mt, o.picks), n = cart.reduce(function (a, c) { return a + c.qty; }, 0);
    $("menuList").innerHTML = '<div class="mhd"><span class="ti"><svg class="i"><use href="#i-coffee"/></svg></span><div><b>Menu ' + esc(mt.name) + "</b><small>" + esc(mt.tagline || "Pilih menu dan jumlahnya") + "</small></div></div>" +
      (hr.open ? (hr.text ? '<p class="mhours">' + esc(hr.text) + "</p>" : "") : '<p class="mclosed">' + esc(mt.name) + " sedang tutup. " + esc(hr.text.replace("Tutup · b", "B")) + " (jam buka " + esc(mt.open.replace(":", ".")) + "–" + esc(mt.close.replace(":", ".")) + ").</p>") +
      cats.map(function (c) {
        return (cats.length > 1 || c !== "Menu" ? '<p class="mcat">' + esc(c) + "</p>" : "") + by[c].map(function (m) {
          var off = P.soldOut(m), q = o.picks[m.id] || 0, max = m.stock != null ? m.stock : 99;
          var tag = off ? '<span class="mstk">Habis</span>' : (m.stock != null && m.stock <= 5 ? '<span class="mstk">Sisa ' + m.stock + "</span>" : "");
          var img = menuPic(m);   // selalu ada gambar: foto atau ilustrasi kategori
          var note = o.notes[m.id] ? '<small class="mnote">Catatan: ' + esc(o.notes[m.id]) + "</small>" : "";
          return '<div class="mitem' + (off ? " off" : "") + '"><button type="button" class="mopen" data-detail="' + esc(m.id) + '" aria-label="Detail ' + esc(m.name) + '">' + img + '<span class="grow"><b>' + esc(m.name) + "</b>" + (m.desc ? "<small>" + esc(m.desc) + "</small>" : "") +
            '<span class="mprice">' + esc(P.rp(m.price)) + "</span>" + tag + note + "</span></button>" +
            '<div class="qty' + (q ? " has" : "") + '"><button type="button" data-q="-1" data-id="' + esc(m.id) + '" aria-label="Kurangi ' + esc(m.name) + '"' + (q ? "" : " disabled") + ">−</button>" +
            "<output>" + q + '</output><button type="button" data-q="1" data-id="' + esc(m.id) + '" aria-label="Tambah ' + esc(m.name) + '"' + (off || q >= max || !hr.open ? " disabled" : "") + ">+</button></div></div>";
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
    $("wField").hidden = !(o.svc === "barang" || o.svc === "beli") || !!mt;
    // Mitra: lokasi ambil = alamat mitra, terkunci (tidak bisa diketik atau dipilih di peta)
    $("from").readOnly = !!mt; $("from").closest(".stop").classList.toggle("locked", !!mt);
    document.querySelector('[data-pick="from"]').hidden = !!mt;
    $("itemField").hidden = !f.item;
    $("itemLab").textContent = mt ? "Pesanan tambahan (opsional)" : f.item || ""; $("item").placeholder = mt ? "Contoh: es dipisah, gula sedikit" : f.itemPh || "";
    $("fromLab").textContent = mt ? "Ambil di (mitra)" : f.from; $("from").placeholder = f.fromPh;
    $("toLab").textContent = f.to || ""; $("to").placeholder = f.toPh || "";
    var calc = !lain && routing; // rute sedang dihitung: tampilkan kerangka
    if (calc) $("kmOut").innerHTML = '<span class="sk skt" style="width:64px;height:1.1em"></span>';
    else $("kmOut").textContent = o.km == null ? "–" : P.numTxt(o.km) + " km";
    var waiting = !lain && o.km == null; // harga baru ada setelah jarak rute dihitung
    var noMenu = !!mt && !o.cart.length && !o.item;                    // mitra: pilih menu dulu
    var shut = !!mt && !P.mitraOpen(mt).open;                          // mitra tutup: keranjang tetap disimpan, belum bisa dikirim
    $("next").setAttribute("aria-disabled", String(waiting || noMenu || shut));
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
      $("priceNote").textContent = shut ? mt.name + " sedang tutup" : noMenu ? "Pilih menu dulu" : o.night ? "Perkiraan, sudah termasuk tambahan malam" : "Perkiraan, belum termasuk tambahan hujan";
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

  /* Kode pesanan pendek (tanpa huruf/angka yang mirip: 0 O 1 I L), baru setiap membuka layar kirim. */
  function orderCode() {
    var A = "23456789ABCDEFGHJKMNPQRSTUVWXYZ", c = "AG";
    for (var i = 0; i < 5; i++) c += A.charAt(Math.floor(Math.random() * A.length));
    return c;
  }
  var sendText = "";
  // Total yang tertulis di pesan (menu + ongkir); 0 bila harga ditawar admin.
  function orderTotal() { return o.pay === "qris" && o.payAmt ? o.payAmt : orderTotalBase(); }
  function orderTotalBase() {
    if (P.fields(o).noKm) return 0;
    return P.quote(T, o.svc, o.km, o.w, { night: o.night }).total + P.menuTotal(o.cart || []);
  }
  /* QRIS hanya bila harga sudah pasti: bukan penawaran admin, tidak sedang hujan (tambahan ditetapkan admin),
     dan Agi Beli hanya untuk menu mitra (harga barang belanja lain belum diketahui). */
  function qrisWhyNot() {
    if (!P.qrisValid(QRIS)) return "-";
    if (P.fields(o).noKm) return "Harga layanan ini ditentukan admin. Bayar tunai, atau minta QRIS ke admin setelah harga disepakati.";
    if (o.svc === "beli" && !o.cart.length) return "Harga barang belanjaan belum diketahui. Bayar tunai ke driver, atau minta QRIS ke admin.";
    if (o.rain) return "Sedang hujan: tambahan hujan ditetapkan admin. Bayar tunai, atau minta QRIS ke admin.";
    return "";
  }
  function renderPay() {
    var why = qrisWhyNot(), can = !why;
    $("payCard").hidden = why === "-";
    $("payQris").disabled = !can;
    if (!can && o.pay === "qris") { o.pay = "tunai"; o.paid = false; $("paid").checked = false; }
    document.querySelector('input[name=pay][value="' + (o.pay || "tunai") + '"]').checked = true;
    $("payNote").textContent = can ? (o.pay === "qris" ? "" : "Bayar tunai ke driver setelah pesanan selesai.") : why;
    o.payAmt = 0;
    $("qrisBox").hidden = o.pay !== "qris";
    if (o.pay !== "qris") return;
    o.payAmt = orderTotalBase(); o.payTo = P.qrisName(QRIS);
    $("qrisAmt").textContent = P.rp(o.payAmt);
    $("priceNote").textContent = "Bayar lewat QRIS";
    $("qrisTo").textContent = o.payTo; $("qrisCode").textContent = "Kode " + o.code;
    var nmid = (QRIS.match(/ID\d{13}/) || [""])[0]; $("qrisNmid").textContent = nmid ? "NMID: " + nmid : "";   // NMID ada di data QRIS (tag 51)
    try {
      var qr = qrcode(0, "M"); qr.addData(P.qrisAmount(QRIS, o.payAmt, o.code)); qr.make();
      $("qrisQr").innerHTML = qr.createSvgTag({ cellSize: 6, margin: 0, scalable: true, alt: "QRIS " + P.rp(o.payAmt) });
      $("qrisSave").hidden = !!window.Capacitor;   // APK: unduhan gambar tidak didukung WebView, pakai screenshot
      $("qrisSave").href = qr.createDataURL(8, 16);   // cadangan: QR polos, diganti gambar berdesain begitu selesai digambar
      qrisImage(qr, nmid).then(function (u) { $("qrisSave").href = u; }).catch(function () {});
    } catch (e) { $("qrisQr").innerHTML = '<p class="qrnone">QR gagal dibuat. Pilih tunai atau minta QRIS ke admin.</p>'; o.payAmt = 0; }
  }
  /* Gambar QRIS untuk disimpan: kartu "Bayar dengan QRIS" yang sama dengan di layar, digambar di kanvas 3x agar QR tajam saat dipindai dari galeri. */
  function qrisImage(qr, nmid) {
    function load(src) { return new Promise(function (ok, no) { var i = new Image(); i.onload = function () { ok(i); }; i.onerror = no; i.src = src; }); }
    return Promise.all([load("logo.png"), load("qris-logo.png"), load("gpn-logo.png"), load(qr.createDataURL(10, 0)), document.fonts ? document.fonts.ready : null]).then(function (r) {
      var k = 3, Wd = 360, F = '"Plus Jakarta Sans", system-ui, sans-serif', c = document.createElement("canvas"), g = c.getContext("2d");
      var bodyY = 120, bodyH = 352, footY = bodyY + bodyH + 14, Ht = footY + 44;
      c.width = Wd * k; c.height = Ht * k; g.scale(k, k);
      function rr(x, y, w, h, rad) { g.beginPath(); g.moveTo(x + rad, y); g.arcTo(x + w, y, x + w, y + h, rad); g.arcTo(x + w, y + h, x, y + h, rad); g.arcTo(x, y + h, x, y, rad); g.arcTo(x, y, x + w, y, rad); g.closePath(); }
      function img(im, x, y, h) { var w = h * im.naturalWidth / im.naturalHeight; g.drawImage(im, x, y, w, h); return w; }
      g.fillStyle = "#f3f8fe"; g.fillRect(0, 0, Wd, Ht);   // latar terang (bukan transparan) agar rapi di galeri
      g.fillStyle = "#fff"; rr(0, 0, Wd, Ht, 22); g.fill(); g.save(); rr(0, 0, Wd, Ht, 22); g.clip();
      var gr = g.createLinearGradient(0, 0, Wd, 170); gr.addColorStop(0, "#3d9bff"); gr.addColorStop(.55, "#1e7be6"); gr.addColorStop(1, "#0f5bb5");
      g.fillStyle = gr; g.fillRect(0, 0, Wd, 166); g.restore();
      g.fillStyle = "#fff"; g.textBaseline = "alphabetic"; g.font = "800 17px " + F; g.fillText("Bayar dengan QRIS", 20, 38);
      var lw = 24 * r[0].naturalWidth / r[0].naturalHeight; rr(Wd - 20 - lw - 16, 16, lw + 16, 32, 10); g.fill(); img(r[0], Wd - 20 - lw - 8, 20, 24);
      g.globalAlpha = .9; g.font = "500 13px " + F; g.fillText("Total yang dibayar", 20, 74); g.globalAlpha = 1;
      g.font = "800 30px " + F; g.fillText(P.rp(o.payAmt), 20, 108);
      g.save(); g.shadowColor = "rgba(11,37,69,.25)"; g.shadowBlur = 18; g.shadowOffsetY = 6; g.fillStyle = "#fff"; rr(14, bodyY, Wd - 28, bodyH, 18); g.fill(); g.restore();
      img(r[1], 32, bodyY + 18, 26); var gw = 34 * r[2].naturalWidth / r[2].naturalHeight; img(r[2], Wd - 32 - gw, bodyY + 14, 34);
      g.imageSmoothingEnabled = false; g.drawImage(r[3], (Wd - 220) / 2, bodyY + 64, 220, 220); g.imageSmoothingEnabled = true;
      g.textAlign = "center"; g.fillStyle = "#0b2545"; g.font = "800 16px " + F; g.fillText(o.payTo, Wd / 2, bodyY + 310);
      g.fillStyle = "#6a7f97"; g.font = "600 12px " + F; if (nmid) g.fillText("NMID: " + nmid, Wd / 2, bodyY + 330);
      g.textAlign = "left"; g.font = "700 13px " + F; var ct = "Kode " + o.code, cw = g.measureText(ct).width + 24;
      g.fillStyle = "#e6f1fd"; rr(18, footY, cw, 28, 14); g.fill(); g.fillStyle = "#0f5bb5"; g.fillText(ct, 30, footY + 19);
      g.textAlign = "right"; g.fillStyle = "#6a7f97"; g.font = "600 12px " + F; g.fillText("Nominal sudah terisi", Wd - 18, footY + 19);
      return c.toDataURL("image/png");
    });
  }
  function renderSend() {
    o.nearest = P.nearestDriver(D.drivers, o.fromPt); // driver aktif terdekat, otomatis (untuk admin)
    syncCart();
    renderPay();
    var text = sendText = P.waText(T, D.admin.name, o);
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
    var prevView = view;
    if (parts[0] === "keranjang") {   // tautan lama (sebelum keranjang pindah ke bilah harga): buka menu mitranya dengan keranjang terbuka
      openCart = !!cart.mitra; location.replace(cart.mitra ? "#pesan/beli/makan/" + encodeURIComponent(cart.mitra) : "#"); return;
    }
    view = VIEWS.indexOf(parts[0]) > 0 ? parts[0] : "home";
    if (view === "pesan" && P.SVC[parts[1]]) {
      var prev = o.svc + o.beliType;
      o.svc = parts[1];
      if (o.svc === "beli" && P.BELI[parts[2]]) o.beliType = parts[2];
      // isian barang/daftar belanja berbeda arti tiap layanan: jangan terbawa
      if (o.svc + o.beliType !== prev) { o.item = ""; $("item").value = ""; }
      var mid = o.svc === "beli" ? parts[3] || "" : "";
      if (mid !== o.mitra) { if (mid && !mitraById(mid)) { location.replace("#pesan/beli/makan"); return; } o.item = ""; $("item").value = ""; if (setMitra(mid) === false) return; }
    }
    if (sentCart && prevView === "kirim" && view !== "kirim") { sentCart = false; clearCart(); }   // pesanan sudah dikirim ke WA: keranjang dikosongkan
    if (view === "kirim" && !P.fields(o).noKm && o.km == null) { location.replace("#pesan/" + o.svc); return; }
    VIEWS.forEach(function (v) { $("v-" + v).hidden = v !== view; });
    var tab = view === "home" || view === "ulasan" || view === "bantuan";
    $("bar").hidden = view === "home";
    $("title").textContent = TITLES[view] || P.SVC[o.svc].name;
    $("tabs").hidden = !tab; $("sheet").hidden = tab;
    Array.prototype.forEach.call($("tabs").children, function (a) { if (a.dataset.tab === view) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    $("next").hidden = view !== "pesan"; $("send").hidden = view !== "kirim";
    if (view === "pesan") renderForm();
    if (view === "kirim") {
      o.code = orderCode(); o.paid = false; $("paid").checked = false; readForm(); renderForm(); renderSend();
      refreshData().then(function (ok) { if (ok && view === "kirim") { renderForm(); renderSend(); } });   // driver terdekat dari status terbaru
    }
    if (view === "ulasan") loadPublicReviews();
    scrollTo(0, 0);
    if (goRoute && view === "pesan") { goRoute = false; var rc = document.querySelector("#form .card.route"); if (rc) rc.scrollIntoView({ block: "start" }); }
    renderSheetCart(); setSheet(openCart); openCart = false;
  }

  /* Gambar menu: foto dari admin, atau ilustrasi kategori (minuman / makanan) bila belum ada foto. */
  function isFood(m) { return /makan|snack|camil|roti|nasi|mie|gorengan/i.test((m.cat || "") + " " + (m.name || "")) && !/minum|kopi|teh|jus|susu/i.test(m.cat || ""); }
  function menuPic(m) {
    var f = fotoOf(m.id), food = isFood(m);
    return f ? '<img class="mimg" src="' + f + '" alt="" loading="lazy">'
      : '<span class="mimg ph' + (food ? " food" : "") + '" aria-hidden="true"><svg class="i"><use href="#i-' + (food ? "food" : "coffee") + '"/></svg></span>';
  }

  /* Keranjang di bilah harga (bottom sheet): tampil di halaman menu mitranya; geser ke atas / ketuk untuk membuka daftar. */
  function setSheet(open) {
    open = !!open && !$("sCart").hidden;
    $("sheet").classList.toggle("open", open); $("sGrab").setAttribute("aria-expanded", String(open));
    $("sDim").hidden = !open; $("sList").style.maxHeight = "";
    $("sSub").textContent = $("sSub").textContent.replace(/geser ke (atas untuk melihat|bawah untuk menutup)/, open ? "geser ke bawah untuk menutup" : "geser ke atas untuk melihat");
  }
  function renderSheetCart() {
    var n = cartCount(), mt = mitraById(cart.mitra);
    var show = n > 0 && !!mt && view === "pesan" && o.mitra === cart.mitra;
    $("sCart").hidden = !show; document.body.classList.toggle("has-cart", show);
    if (!show) { setSheet(false); return; }
    needFoto();
    var fixed = fixCart(mt), items = P.cartOf(mt, cart.picks, cart.notes), hr = P.mitraOpen(mt);
    if (!items.length) { $("sCart").hidden = true; document.body.classList.remove("has-cart"); setSheet(false); return; }
    $("sN").textContent = cartCount();
    $("sSub").textContent = cartCount() + " item · " + (hr.open ? "geser ke atas untuk melihat" : hr.text);
    $("sTot").textContent = P.rp(P.menuTotal(items));
    $("sList").innerHTML = (fixed.length ? '<p class="menumsg">Keranjang disesuaikan: ' + esc(fixed.join(", ")) + ".</p>" : "") +
      (hr.open ? "" : '<p class="mclosed">' + esc(mt.name) + " sedang tutup. Keranjang tetap tersimpan; pesan setelah buka.</p>") +
      items.map(function (c) {
        var m = mt.menu.filter(function (x) { return x.id === c.id; })[0], max = m.stock != null ? m.stock : 99;
        return '<div class="citem"><button type="button" class="mopen" data-detail="' + esc(c.id) + '" aria-label="Detail ' + esc(c.name) + '">' + menuPic(m) + "</button>" +
          '<div class="grow"><b>' + esc(c.name) + '</b><span class="mprice">' + esc(P.rp(c.price * c.qty)) + (c.qty > 1 ? ' <small>(' + esc(P.rp(c.price)) + " / item)</small>" : "") + "</span>" +
          '<input class="cnote" data-note="' + esc(c.id) + '" maxlength="80" value="' + esc(c.note) + '" placeholder="Tambah catatan (opsional)" aria-label="Catatan ' + esc(c.name) + '"></div>' +
          '<div class="qty has"><button type="button" data-cq="-1" data-id="' + esc(c.id) + '" aria-label="Kurangi ' + esc(c.name) + '">' + (c.qty > 1 ? "−" : '<svg class="i"><use href="#i-trash"/></svg>') + "</button><output>" + c.qty +
          '</output><button type="button" data-cq="1" data-id="' + esc(c.id) + '" aria-label="Tambah ' + esc(c.name) + '"' + (c.qty >= max || !hr.open ? " disabled" : "") + ">+</button></div></div>";
      }).join("");
  }

  /* Detail menu: foto besar, informasi lengkap, jumlah & catatan, tambah ke keranjang. */
  var md = null;
  function openDetail(id) {
    var mt = mitraById(cart.mitra) || mitraById(o.mitra), m = mt && mt.menu.filter(function (x) { return x.id === id; })[0];
    if (!m) return;
    var hr = P.mitraOpen(mt), have = cart.mitra === mt.id ? cart.picks[id] || 0 : 0;
    md = { mt: mt, m: m, have: have, n: have || 1, max: m.stock != null ? m.stock : 99, why: P.soldOut(m) ? "Menu sedang habis" : !hr.open ? mt.name + " sedang tutup" : "" };
    var pic = fotoOf(id);
    $("mdPic").innerHTML = pic ? '<img src="' + pic + '" alt="Foto ' + esc(m.name) + '">' : '<svg class="i"><use href="#i-' + (isFood(m) ? "food" : "coffee") + '"/></svg>';
    $("mdPic").classList.toggle("ph", !pic); $("mdPic").classList.toggle("food", !pic && isFood(m));
    $("mdCat").textContent = (m.cat || "Menu") + " · " + mt.name;
    $("mdName").textContent = m.name;
    $("mdPrice").textContent = P.rp(m.price);
    var st = P.soldOut(m) ? "Habis" : m.stock != null && m.stock <= 5 ? "Sisa " + m.stock : "";
    $("mdStock").hidden = !st; $("mdStock").textContent = st;
    $("mdDesc").textContent = m.desc || ""; $("mdDesc").hidden = !m.desc;
    $("mdInfo").textContent = m.info || ""; $("mdInfo").hidden = !m.info;
    $("mdNote").value = cart.mitra === mt.id ? cart.notes[id] || "" : "";
    $("mdMsg").textContent = md.why;
    renderMd();
    if (!$("menuDlg").open) $("menuDlg").showModal();
  }
  function renderMd() {
    $("mdN").textContent = md.n;
    var b = $("mdQty").children;
    b[0].disabled = md.n <= (md.have ? 0 : 1); b[2].disabled = !!md.why || md.n >= md.max;
    var add = $("mdAdd");
    add.disabled = !!md.why && !(md.have && md.n === 0);
    add.innerHTML = md.have && md.n === 0 ? "Hapus dari keranjang" : md.why ? esc(md.why)
      : "<span>" + (md.have ? "Perbarui keranjang" : "Tambah ke keranjang") + "</span><small>" + esc(P.rp(md.m.price * md.n)) + "</small>";
    add.classList.toggle("danger", !!(md.have && md.n === 0));
  }
  function applyDetail() {
    var id = md.m.id, note = $("mdNote").value.trim();
    if (cart.mitra !== md.mt.id) {          // dibuka dari keranjang mitra lain (tidak terjadi biasanya): mulai keranjang baru
      cart = { mitra: md.mt.id, picks: {}, notes: {} };
      if (o.mitra === md.mt.id) { o.picks = cart.picks; o.notes = cart.notes; }
    }
    if (md.n > 0) { cart.picks[id] = md.n; if (note) cart.notes[id] = note; else delete cart.notes[id]; }
    else { delete cart.picks[id]; delete cart.notes[id]; }
    saveCart(); $("menuDlg").close();
    if (view === "pesan") renderForm();
  }

  /* "Setiap hari, 05.00–23.00" → "05.00–23.00" (jam layanan admin) */

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
    var hr = new Date().getHours();
    $("hello").textContent = "Selamat " + (hr < 11 ? "pagi" : hr < 15 ? "siang" : hr < 18 ? "sore" : "malam") + "!";
    $("lainBtn").href = adminWa("Halo " + D.admin.name + ", saya mau tanya layanan lainnya: ");
    mitraCards();

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
  /* Ulasan per halaman: hanya halaman yang dibuka yang dibaca dari Firestore (5 kali baca);
     halaman yang sudah dibuka disimpan di sini, jadi kembali ke halaman sebelumnya tidak membaca ulang. */
  var PUB_N = 5, pub = { pages: [], next: [], at: 0, total: 0, busy: false };
  function starTxt(n) { return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n); }
  function renderPubList() {
    var list = pub.pages[pub.at] || [], last = Math.max(1, Math.ceil(pub.total / PUB_N));
    var hasNext = pub.at + 1 < last && !!pub.next[pub.at];
    $("pubList").innerHTML = list.map(function (r) {
      var name = r.name || "Anonim", when = r.at ? new Date(r.at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "";
      return '<article class="pubrev"><div class="top"><span class="av" aria-hidden="true">' + esc(name.charAt(0).toUpperCase()) + '</span>' +
        '<div class="who"><b>' + esc(name) + '</b><span aria-label="' + r.stars + ' bintang">' + starTxt(r.stars) + '</span></div><time>' + when + "</time></div>" +
        (r.text ? "<p>" + esc(r.text) + "</p>" : "") + "</article>";
    }).join("") + (last > 1 ? '<nav class="pubpager" aria-label="Halaman ulasan">' +
      '<button type="button" class="btn ghost sm" data-pg="-1"' + (pub.at ? "" : " disabled") + ' aria-label="Halaman sebelumnya"><svg class="i flip"><use href="#i-right"/></svg></button>' +
      "<span>Halaman <b>" + (pub.at + 1) + "</b> dari " + last + "</span>" +
      '<button type="button" class="btn ghost sm" data-pg="1"' + (hasNext && !pub.busy ? "" : " disabled") + ' aria-label="Halaman berikutnya"><svg class="i"><use href="#i-right"/></svg></button></nav>' : "");
  }
  function pubGo(step) {
    var to = pub.at + step;
    if (to < 0 || pub.busy) return;
    if (pub.pages[to]) { pub.at = to; renderPubList(); $("pubList").scrollIntoView({ block: "start", behavior: "smooth" }); return; }
    if (!pub.next[pub.at]) return;
    pub.busy = true; renderPubList();
    Store.latestReviews(PUB_N, pub.next[pub.at]).then(function (r) {
      pub.pages[to] = r.list; pub.next[to] = r.next; pub.at = to;
    }).catch(function () {}).then(function () { pub.busy = false; renderPubList(); $("pubList").scrollIntoView({ block: "start", behavior: "smooth" }); });
  }
  function loadPublicReviews() {
    Promise.all([Store.reviewStats(), Store.latestReviews(PUB_N)]).then(function (res) {
      var cnt = res[0];
      var n = cnt[1] + cnt[2] + cnt[3] + cnt[4] + cnt[5];
      if (!n) { $("pubSum").innerHTML = '<p class="muted">Belum ada ulasan. Jadilah yang pertama!</p>'; $("pubList").innerHTML = ""; return; }
      var avg = (cnt[1] + 2 * cnt[2] + 3 * cnt[3] + 4 * cnt[4] + 5 * cnt[5]) / n;
      $("pubSum").innerHTML = '<div class="pubavg"><b>' + avg.toFixed(1).replace(".", ",") + "</b><span>" + starTxt(Math.round(avg)) + "</span><small>" + n + " ulasan</small></div>" +
        '<div class="pubbars">' + [5, 4, 3, 2, 1].map(function (s) {
          var pct = Math.round(cnt[s] / n * 100);
          return "<div><span>" + s + '★</span><i><em style="width:' + pct + '%"></em></i><small>' + pct + "% · " + cnt[s] + "</small></div>";
        }).join("") + "</div>";
      pub = { pages: [res[1].list], next: [res[1].next], at: 0, total: n, busy: false };
      renderPubList();
    }).catch(function (e) {
      $("pubSum").innerHTML = '<p class="muted">' + (e.status === 403 ? "Ulasan belum bisa ditampilkan." : "Gagal memuat ulasan. Periksa koneksi internet.") + "</p>";
      $("pubList").innerHTML = "";
    });
  }
  function initReview() {
    $("pubList").addEventListener("click", function (e) { var b = e.target.closest("[data-pg]"); if (b) pubGo(+b.dataset.pg); });
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
      if (Date.now() - lastLoad > 5 * 60 * 1000) refreshData().then(function (ok) { if (ok) redraw(); });   // lama di latar belakang: status driver/menu mungkin berubah
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

  /* Data terbaru dari server (status driver, admin, mitra, tarif) tanpa memuat ulang halaman.
     Dipakai saat membuka layar kirim (driver terdekat harus dari status terbaru) dan saat aplikasi dibuka lagi setelah >5 menit. */
  var lastLoad = Date.now(), loading = null;
  function refreshData() {
    if (loading) return loading;
    loading = Store.load().then(function (res) {
      loading = null;
      if (res.source !== "online") return false;
      lastLoad = Date.now();
      D.drivers = res.data.drivers; D.admin = res.data.admin; D.mitra = res.data.mitra || []; D.tarif = T = res.data.tarif;
      return true;
    }).catch(function () { loading = null; return false; });
    return loading;
  }
  function redraw() {
    if (view === "home") renderHome();
    else if (view === "pesan") renderForm();
    else if (view === "kirim") { renderForm(); renderSend(); }
    renderSheetCart();
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
    document.querySelectorAll("input[name=pay]").forEach(function (r) {
      r.addEventListener("change", function () { o.pay = r.value; o.paid = false; $("paid").checked = false; renderForm(); renderSend(); });
    });
    $("paid").addEventListener("change", function () { o.paid = $("paid").checked; renderSend(); });
    // Catat isi pesan ke database (sekali per kode) agar admin bisa mencocokkan harga di WA. Gagal/offline: pesan WA tetap terkirim.
    var logged = "";
    $("send").addEventListener("click", function () {
      if ($("send").getAttribute("aria-disabled") === "true" || !o.code || logged === o.code) return;
      logged = o.code;
      Store.logOrder(o.code, sendText, orderTotal(), o.mitra, o.cart).catch(function () {});
      if (o.cart.length) sentCart = true;
    });
    $("copyNum").addEventListener("click", function () {
      function good() { $("copyMsg").textContent = "Nomor tersalin."; }
      function bad() { $("copyMsg").textContent = "Tekan lama nomor untuk menyalin."; }
      try { navigator.clipboard.writeText("+" + D.admin.phone).then(good, bad); } catch (e) { bad(); }
    });
    initReview(); initUpdate();
    $("menuList").addEventListener("click", function (e) {
      var d = e.target.closest("button[data-detail]"); if (d) { openDetail(d.dataset.detail); return; }
      var b = e.target.closest("button[data-q]"); if (!b || b.disabled) return;
      var id = b.dataset.id, q = (o.picks[id] || 0) + Number(b.dataset.q);
      if (q > 0) o.picks[id] = q; else { delete o.picks[id]; delete o.notes[id]; }
      $("menuMsg").textContent = ""; saveCart(); renderForm();
    });
    // Keranjang di bilah harga: jumlah, hapus, catatan, detail
    $("sList").addEventListener("click", function (e) {
      var d = e.target.closest("button[data-detail]"); if (d) { openDetail(d.dataset.detail); return; }
      var b = e.target.closest("button[data-cq]"); if (!b || b.disabled) return;
      var id = b.dataset.id, q = (cart.picks[id] || 0) + Number(b.dataset.cq);
      if (q > 0) cart.picks[id] = q; else { delete cart.picks[id]; delete cart.notes[id]; }
      saveCart(); if (view === "pesan") renderForm();
    });
    $("sList").addEventListener("input", function (e) {
      var id = e.target.dataset.note; if (!id) return;
      var v = e.target.value.trim(); if (v) cart.notes[id] = v; else delete cart.notes[id];
      try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (er) {}   // tanpa gambar ulang: kursor tetap di kolom catatan
    });
    // Geser bilah keranjang: ke atas = buka, ke bawah = tutup, ketuk = buka/tutup. Daftar mengikuti jari selama digeser.
    (function () {
      var g = $("sGrab"), list = $("sList"), y0 = 0, h0 = 0, moved = false, down = false;
      function full() { return Math.min(list.scrollHeight, innerHeight * 0.58); }
      g.addEventListener("pointerdown", function (e) {
        down = true; moved = false; y0 = e.clientY; h0 = $("sheet").classList.contains("open") ? full() : 0;
        try { g.setPointerCapture(e.pointerId); } catch (er) {}
      });
      g.addEventListener("pointermove", function (e) {
        if (!down) return;
        var dy = e.clientY - y0;
        if (!moved && Math.abs(dy) < 8) return;
        moved = true; list.style.transition = "none"; list.style.maxHeight = Math.max(0, Math.min(full(), h0 - dy)) + "px";
        $("sDim").hidden = false;
      });
      function end() {
        if (!down) return;
        down = false; list.style.transition = "";
        if (moved) setSheet((parseFloat(list.style.maxHeight) || 0) > full() * (h0 ? 0.75 : 0.25));   // dari tertutup cukup sedikit; dari terbuka harus ditarik jauh untuk menutup
      }
      g.addEventListener("pointerup", end); g.addEventListener("pointercancel", end);
      g.addEventListener("click", function () { if (!moved) setSheet(!$("sheet").classList.contains("open")); moved = false; });
      $("sDim").addEventListener("click", function () { setSheet(false); });
    })();
    $("mdQty").addEventListener("click", function (e) { var b = e.target.closest("button[data-d]"); if (!b || b.disabled) return; md.n = Math.max(0, md.n + Number(b.dataset.d)); renderMd(); });
    $("mdAdd").addEventListener("click", applyDetail);
    $("mdClose").addEventListener("click", function () { $("menuDlg").close(); });
    $("menuDlg").addEventListener("click", function (e) { if (e.target === $("menuDlg")) $("menuDlg").close(); });   // ketuk di luar kotak
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
        if (!P.mitraOpen(fresh).open) { renderForm(); $("menuMsg").textContent = fresh.name + " baru saja tutup. " + P.mitraOpen(fresh).text.replace("Tutup · b", "B") + "."; return; }
        if (!bad.length) { location.hash = "#kirim"; return; }
        bad.forEach(function (x) { if (x.max) o.picks[x.id] = x.max; else { delete o.picks[x.id]; delete o.notes[x.id]; } });
        saveCart();
        $("menuMsg").textContent = "Stok berubah: " + bad.map(function (x) { return (x.name || "menu") + " " + x.why; }).join(", ") + ". Pesanan sudah disesuaikan, cek lagi lalu tekan Lanjut.";
        renderForm();
      }).catch(function () { location.hash = "#kirim"; });                // offline: admin tetap mengecek lewat WA
    });
    function goBack() { history.length > 1 ? history.back() : (location.hash = ""); }
    $("back").addEventListener("click", goBack);
    // Tombol back HP (dipanggil MainActivity di APK). true = kembali ke layar sebelumnya; false = di Beranda, aplikasi ditutup.
    window.agimasBack = function () {
      if ($("newsDlg").open) { $("newsDlg").close(); return true; }
      if ($("menuDlg").open) { $("menuDlg").close(); return true; }
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
