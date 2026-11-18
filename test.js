// Jalankan: node test.js
const assert = require("assert");
const P = require("./web/pricing.js");
const { tarif: T } = require("./web/data.json");

assert.strictEqual(P.quote(T, "orang", 3, 0).total, 5500);            // di bawah jarak minimal
assert.strictEqual(P.quote(T, "orang", 6, 0).total, 9500);            // sama dengan website: 6 km = Rp 9.500
assert.strictEqual(P.quote(T, "orang", 4.5, 0).total, 6500);          // 6500 pas, tanpa pembulatan
assert.strictEqual(P.quote(T, "orang", 4.1, 0).total, 6000);          // 5700 dibulatkan ke atas jadi 6000
assert.strictEqual(P.quote(T, "barang", 6, 1).total, 12500);          // + berat 5–10 kg
assert.strictEqual(P.quote(T, "beli", 6, 0).total, 13500);            // + jasa belanja

assert.ok(P.validPhone("6281234567890"));
assert.ok(!P.validPhone("") && !P.validPhone("081234567890"));

const txt = P.waText(T, "Admin Agimas", { svc: "barang", km: 6, w: 1, name: "Bu Sari", item: "dokumen", from: "A & B", to: "C", nearest: { name: "Mas Plencing 2", km: 1.14 } });
assert.ok(txt.startsWith("Halo Admin Agimas,\nsaya mau pesan *Agi Kirim* (kirim barang)"));
assert.ok(txt.includes("Driver terdekat (otomatis): *Mas Plencing 2* — ±1,1 km dari titik jemput"));
assert.ok(P.waText(T, "A", { svc: "orang", km: 6, w: 0 }).includes("Driver: *dicarikan admin*"));
// Agi Beli: jenis belanja & kategori
const tb = P.waText(T, "A", { svc: "beli", beliType: "harian", beliCat: "pasar", km: 3, w: 0, item: "beras 5 kg" });
assert.ok(tb.includes("*Agi Beli* (belanja kebutuhan harian — pasar tradisional)") && tb.includes("Daftar belanja: beras 5 kg"));
assert.ok(P.waText(T, "A", { svc: "beli", beliType: "makan", km: 3, w: 0 }).includes("(beli makanan & minuman)"));
assert.strictEqual(P.fields({ svc: "beli", beliType: "harian", beliCat: "supermarket" }).fromPh, "Contoh: Superindo Madiun");
// Agi Bersih: tanpa jarak & tanpa tujuan, harga dari admin
const tbs = P.waText(T, "A", { svc: "bersih", from: "Jl. A", item: "rumah 2 kamar" });
assert.ok(tbs.includes("*Agi Bersih* (jasa bersih-bersih)") && tbs.includes("Mohon penawaran harga.") && !tbs.includes("Tujuan") && !tbs.includes("Jarak:"));
// driver terdekat: hanya yang aktif & punya koordinat
const drv = [{ name: "Jauh", status: "aktif", lat: -7.70, lng: 111.55 }, { name: "Dekat", status: "aktif", lat: -7.618, lng: 111.524 },
             { name: "Istirahat", status: "istirahat", lat: -7.6177, lng: 111.5235 }, { name: "TanpaLokasi", status: "aktif" }];
assert.strictEqual(P.nearestDriver(drv, { lat: -7.6177, lng: 111.5235 }).name, "Dekat");
assert.strictEqual(P.nearestDriver(drv, null), null);
assert.strictEqual(P.nearestDriver([{ name: "X", status: "aktif" }], { lat: -7.6, lng: 111.5 }), null);
assert.ok(txt.includes("Berat: 5–10 kg") && txt.includes("*PERKIRAAN HARGA: Rp 12.500*") && txt.includes("Jarak: *6 km*"));
assert.ok(txt.includes("\n\n*RUTE*\n") && txt.includes("\n\n*DETAIL PESANAN*\n"));      // bagian dipisah baris kosong
assert.ok(txt.includes("- Biaya berat 5–10 kg: Rp 3.000"));                               // rincian harga
assert.ok(P.waText(T, "A", { svc: "orang", km: 6, w: 0, name: "Bu *Sari*" }).includes("Nama: Bu Sari"));  // isian tidak merusak tebal
const link = P.waLink("6281234567890", txt);
assert.ok(link.startsWith("https://wa.me/6281234567890?text=") && !link.includes(" ") && link.includes("%26"));
assert.ok(P.waText(T, "X", { svc: "lain", km: 6, w: 0 }).includes("Mohon penawaran harga."));

// validasi panel admin
const data = require("./web/data.json");
const clone = () => JSON.parse(JSON.stringify(data));
assert.strictEqual(P.validate(data), "");
let d = clone(); d.admin.phone = "0812"; assert.ok(P.validate(d).includes("admin"));
d = clone(); d.tarif.orang.perKm = -1; assert.ok(P.validate(d).includes("Antar penumpang"));
d = clone(); d.tarif.night.every = 0; assert.ok(P.validate(d).includes("malam"));
d = clone(); d.drivers[0].name = " "; assert.ok(P.validate(d).includes("driver ke-1"));
d = clone(); d.drivers = []; assert.strictEqual(P.validate(d), "");      // boleh tanpa driver
assert.strictEqual(P.normPhone("0812-3456 7890"), "6281234567890");
assert.strictEqual(P.normPhone("+62 812 3456 7890"), "6281234567890");
assert.strictEqual(P.normPhone("812 3456 7890"), "6281234567890");

// peta
const stasiun = { lat: -7.6177, lng: 111.5235 }, alun = { lat: -7.6298, lng: 111.5239 };
const km = P.straightKm(stasiun, alun); assert.ok(km > 1.2 && km < 1.5, km);   // ±1,35 km
assert.strictEqual(P.billKm(5.3), 5.5); assert.strictEqual(P.billKm(5.5), 5.5); assert.strictEqual(P.billKm(0.2), 1);
const t2 = P.waText(T, "A", { svc: "orang", km: 2, w: 0, from: "Stasiun", fromPt: stasiun });
assert.ok(t2.includes("Lokasi jemput: Stasiun\nhttps://maps.google.com/?q=-7.617700,111.523500"));
assert.ok(!t2.includes("google.com/maps/dir"));                                   // tanpa tujuan: tidak ada link rute
const t3 = P.waText(T, "A", { svc: "orang", km: 2, w: 0, from: "Stasiun", to: "Alun-alun", fromPt: stasiun, toPt: alun });
assert.ok(t3.includes("*Rute di Google Maps* (jemput → tujuan):\nhttps://www.google.com/maps/dir/?api=1&origin=-7.617700,111.523500&destination=-7.629800,111.523900&travelmode=driving"));
assert.ok(decodeURIComponent(P.waLink("6281234567890", t3).split("text=")[1]) === t3);  // link utuh setelah dikirim lewat wa.me

// tambahan malam otomatis & tanda hujan
assert.ok(P.isNight(new Date(2026, 0, 1, 21, 0)) && P.isNight(new Date(2026, 0, 1, 4, 59)));
assert.ok(!P.isNight(new Date(2026, 0, 1, 5, 0)) && !P.isNight(new Date(2026, 0, 1, 20, 59)));
const qn = P.quote(T, "orang", 6, 0, { night: true });                     // 9.500 + ceil(6/3)*1.500 = 12.500
assert.strictEqual(qn.total, 12500); assert.ok(qn.lines.some(l => l.night && l.v === 3000));
assert.strictEqual(P.quote(T, "orang", 6.5, 0, { night: true }).total, 15000); // 10.500 + ceil(6,5/3)=3 x 1.500 = 15.000
assert.strictEqual(P.quote(T, "orang", 6, 0).total, 9500);                // siang: tanpa tambahan
const tn = P.waText(T, "A", { svc: "orang", km: 6, w: 0, night: true, rain: true });
assert.ok(tn.includes("*PERKIRAAN HARGA: Rp 12.500*") && tn.includes("- Tambahan malam (21.00–05.00): Rp 3.000"));
assert.ok(tn.includes("Sudah termasuk tambahan malam") && tn.includes("kemungkinan hujan di titik jemput"));
assert.ok(!P.waText(T, "A", { svc: "orang", km: 6, w: 0 }).includes("hujan di titik jemput"));

// menu mitra & stok
const MT = { id: "lk", name: "Lingkar Kopi", menu: [
  { id: "a", name: "Nebula", price: 15000, available: true, stock: null },
  { id: "b", name: "Kopi Susu", price: 8000, available: true, stock: 3 },
  { id: "c", name: "Teh", price: 5000, available: false, stock: null },
  { id: "e", name: "Roti", price: 7000, available: true, stock: 0 }] };
assert.ok(!P.soldOut(MT.menu[0]) && !P.soldOut(MT.menu[1]) && P.soldOut(MT.menu[2]) && P.soldOut(MT.menu[3]));
const cart = P.cartOf(MT, { b: 2, a: 1, c: 0 });
assert.deepStrictEqual(cart.map(c => c.id + c.qty), ["a1", "b2"]);           // urut sesuai menu, jumlah 0 dibuang
assert.strictEqual(P.menuTotal(cart), 31000);
assert.deepStrictEqual(P.checkCart(MT, { a: 9, b: 3 }), []);                  // stok tidak dihitung / pas
const bad = P.checkCart(MT, { b: 4, c: 1, e: 1, zz: 1 });
assert.deepStrictEqual(bad.map(x => x.id + ":" + x.why), ["b:sisa 3", "c:habis", "e:habis", "zz:tidak dijual lagi"]);
const tm = P.waText(T, "A", { svc: "beli", beliType: "makan", km: 2, w: 0, mitraName: "Lingkar Kopi", cart: cart, item: "" });
assert.ok(tm.includes("*PESANAN MENU — LINGKAR KOPI*\n- 1x Nebula @ Rp 15.000 = Rp 15.000\n- 2x Kopi Susu @ Rp 8.000 = Rp 16.000\nSubtotal menu: *Rp 31.000*"));
const ongkir = P.quote(T, "beli", 2, 0).total;
assert.ok(tm.includes("*PERKIRAAN ONGKIR: " + P.rp(ongkir) + "*") && tm.includes("*TOTAL (menu + ongkir): " + P.rp(31000 + ongkir) + "*"));
assert.ok(!tm.includes("Makanan/minuman yang dibeli"));                       // isian bebas kosong: tidak ditulis
assert.ok(P.waText(T, "A", { svc: "beli", beliType: "makan", km: 2, w: 0, cart: cart, item: "es batu dipisah" }).includes("Pesanan tambahan: es batu dipisah"));
assert.ok(!P.waText(T, "A", { svc: "beli", beliType: "makan", km: 2, w: 0, item: "x" }).includes("ONGKIR"));  // tanpa menu: seperti biasa
d = clone(); d.mitra = [JSON.parse(JSON.stringify(MT))]; assert.strictEqual(P.validate(d), "");
d.mitra[0].menu[0].price = -1; assert.ok(P.validate(d).includes("Harga Nebula"));
d.mitra[0].menu[0].price = 15000; d.mitra[0].menu[1].stock = 2.5; assert.ok(P.validate(d).includes("Stok Kopi Susu"));
d.mitra[0].menu[1].stock = 2; d.mitra[0].menu[2].name = ""; assert.ok(P.validate(d).includes("menu lingkar kopi ke-3"));
d = clone(); d.mitra = [{ name: "", menu: [] }]; assert.ok(P.validate(d).includes("mitra ke-1"));

console.log("semua tes lulus");

// wilayah layanan
const R = require("./web/region.js");
assert.ok(P.inRegion({ lat: -7.6298, lng: 111.5239 }, R));    // alun-alun Kota Madiun
assert.ok(P.inRegion({ lat: -7.71014, lng: 111.55272 }, R));  // Dagangan, Kab. Madiun
assert.ok(P.inRegion({ lat: -7.47, lng: 111.80 }, R));        // Saradan, Kab. Madiun
assert.ok(P.inRegion({ lat: -7.6478, lng: 111.3394 }, R));    // kota Magetan
assert.ok(P.inRegion({ lat: -7.8707, lng: 111.4620 }, R));    // kota Ponorogo
assert.ok(P.inRegion({ lat: -7.4040, lng: 111.4460 }, R));    // kota Ngawi
assert.ok(P.inRegion({ lat: -7.6050, lng: 111.9030 }, R));    // kota Nganjuk
assert.ok(!P.inRegion({ lat: -7.4260, lng: 111.0220 }, R));   // Sragen (Jawa Tengah)
assert.ok(!P.inRegion({ lat: -7.1500, lng: 111.8800 }, R));   // Bojonegoro
assert.ok(!P.inRegion({ lat: -8.1940, lng: 111.1050 }, R));   // Pacitan
console.log("tes wilayah lulus");

// QRIS bernominal dari QRIS statis DANA Bisnis Agi Mas
const QRIS = "00020101021126570011ID.DANA.WWW011893600915303282052602090328205260303UMI51440014ID.CO.QRIS.WWW0215ID10265381720850303UMI5204899953033605802ID5916AGI.PAY, Service6011Kota Madiun6105631366304B7B6";
assert.ok(P.qrisValid(QRIS));                                          // CRC asli cocok
assert.ok(!P.qrisValid(QRIS.slice(0, -1) + "7"));                      // CRC salah ditolak
assert.strictEqual(P.qrisName(QRIS), "AGI.PAY, Service");
const dyn = P.qrisAmount(QRIS, 25017);
assert.ok(dyn.startsWith("000201010212") && dyn.includes("53033605405250175802ID") && P.qrisValid(dyn));
assert.strictEqual(P.qrisAmount(P.qrisAmount(QRIS, 1000), 25017), dyn); // nominal diganti, bukan ditambah dua kali
assert.strictEqual(P.qrisAmount("bukan qris", 1000), "");
console.log("QRIS bernominal:", dyn);
const withBill = P.qrisAmount(QRIS, 1000, "AGTES22");
assert.ok(withBill.endsWith("62110107AGTES22" + "6304" + withBill.slice(-4)) && P.qrisValid(withBill));

// Jam buka mitra
const at = (h, m) => new Date(2026, 10, 18, h, m || 0);
assert.ok(P.mitraOpen({}, at(3)).open);                                                     // tanpa jam = 24 jam
assert.ok(P.mitraOpen({ open: "08:00", close: "23:00" }, at(8)).open);
assert.ok(!P.mitraOpen({ open: "08:00", close: "23:00" }, at(23)).open);
assert.ok(!P.mitraOpen({ open: "08:00", close: "23:00" }, at(7, 59)).open);
assert.strictEqual(P.mitraOpen({ open: "08:00", close: "23:00" }, at(7)).text, "Tutup · buka 08.00");
assert.strictEqual(P.mitraOpen({ open: "08:00", close: "23:00" }, at(12)).text, "Buka 08.00–23.00");
assert.ok(P.mitraOpen({ open: "08:00", close: "24:00" }, at(23, 59)).open && !P.mitraOpen({ open: "08:00", close: "24:00" }, at(0, 30)).open);
assert.ok(P.mitraOpen({ open: "16:00", close: "02:00" }, at(1)).open && !P.mitraOpen({ open: "16:00", close: "02:00" }, at(3)).open);
const vd = JSON.parse(JSON.stringify(require("./web/data.json"))); vd.mitra = [{ name: "X", menu: [], open: "08:00", close: "" }];
assert.ok(/keduanya/.test(P.validate(vd)));
vd.mitra[0].close = "8 malam"; assert.ok(/format/.test(P.validate(vd)));
vd.mitra[0].close = "22:00"; assert.strictEqual(P.validate(vd), "");
