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

const txt = P.waText(T, "Admin Agimas", { svc: "barang", km: 6, w: 1, name: "Bu Sari", item: "dokumen", from: "A & B", to: "C", driver: "Mas Plencing 2" });
assert.ok(txt.startsWith("Halo Admin Agimas,\nsaya mau pesan *Antar barang*"));
assert.ok(txt.includes("Driver pilihan: *Mas Plencing 2* (jika tersedia)"));
assert.ok(P.waText(T, "A", { svc: "orang", km: 6, w: 0 }).includes("Driver pilihan: *bebas*"));
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
