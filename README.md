# Agi Mas — aplikasi pesan (Android APK + web)

Pelanggan: pilih layanan → isi detail (harga langsung muncul) → pilih driver (opsional) → **Kirim ke admin** membuka WhatsApp admin dengan teks pesanan. Admin yang menugaskan driver.

Admin: `admin.html` — ubah status driver (Aktif / Istirahat / Tidak narik), tambah/hapus driver, nomor admin, dan tarif. Tersimpan di Firebase dan langsung terlihat di aplikasi pelanggan, **tanpa build APK baru**.

Semua gratis: Firebase paket Spark (tanpa kartu kredit, tidak dijeda), Netlify gratis, APK dibagikan langsung (tanpa Play Store).

## Tampilan
Tema terang biru mengikuti gaya NgajiQuest (`D:\HU\TemanNgaji\desain-ngajiquest`): pita biru di atas, kartu putih lembut, kartu pastel, ikon garis (Lucide), font Plus Jakarta Sans (disimpan di `web/fonts/`, tidak bergantung Google Fonts).
- **Beranda**: sapaan sesuai jam, kartu hero dengan motor Agimas, ringkasan (driver aktif, tarif mulai, jam admin), 4 layanan, kartu driver yang bisa dibuka.
- **Navigasi bawah**: Beranda · Driver · Bantuan (tarif lengkap, cara kerja 7 langkah, pembayaran, ketentuan, chat/salin nomor admin — semua isi website agimassolution.netlify.app).
- **Pesan**: rute jemput–tujuan (peta), jarak, rincian harga, pembanding tarif ojek online Zona I (antar penumpang), catatan malam/hujan → pilih driver (opsional) → Kirim ke admin.
- **Tambahan malam & hujan**: malam (21.00–05.00, menurut jam HP) **dihitung otomatis** — `T.night.add` setiap `T.night.every` km, masuk ke harga, rincian, dan pesan WA. Hujan **ditetapkan admin**; aplikasi hanya memberi tanda "kemungkinan hujan di titik jemput" bila data cuaca Open-Meteo (gratis, tanpa API key) menunjukkan hujan saat titik jemput dipilih.
- **Bagikan aplikasi** (menu Bantuan): kode QR + "Kirim lewat WhatsApp" + "Salin link", berisi link unduhan APK dari `about.downloadUrl` di `web/data.json`. Selama kosong, tampil "Link unduhan belum diatur". Isi dengan link publik APK (mis. Google Drive "Siapa saja yang memiliki link", atau situs Netlify), lalu build APK baru.
- **Animasi pembuka** (`web/splash.js`): logo, motor melaju ke kiri menghapus tulisan, lalu masuk. Sekali per sesi; dilewati jika HP mengatur "kurangi animasi".
- **Skeleton loader**: kerangka berkilau di Beranda selama data dimuat.
- **Tombol back HP**: peta → form → Beranda → keluar (`MainActivity.java` memanggil `window.agimasBack` di `app.js`).

## Isi folder
| Path | Isi |
|---|---|
| `web/` | Aplikasi (index.html, app.js, style.css), panel admin (admin.html), `pricing.js` (harga, teks WA, validasi, cek wilayah), `store.js` + `config.js` (Firebase), `map.js` + `region.js` (peta & wilayah), `splash.js`, `data.json` (data bawaan), `vendor/` (MapLibre), `fonts/` |
| `assets/` | Sumber gambar: `logo-agimas-fhd.png` (logo FHD 1920×1080 tanpa motor), `logo-crop-asli.png`, `preview.png` (pratinjau ikon) |
| `firestore.rules` | Aturan keamanan Firebase |
| `android/` | Project Android (Capacitor). Ikon & layar awal di `android/app/src/main/res/` |
| `agimas-release.jks`, `keystore.properties` | **Kunci tanda tangan APK. BACKUP keduanya.** Jika hilang, APK baru tidak bisa meng-update APK yang sudah terpasang (pengguna harus uninstall dulu). Jangan dibagikan. |
| `test.js` | `npm test` |

## 1. Setup Firebase (sekali, ±15 menit)
1. https://console.firebase.google.com → **Add project** (Google Analytics boleh dimatikan). Paket otomatis **Spark (gratis)**.
2. **Build → Firestore Database → Create database** → pilih lokasi `asia-southeast2 (Jakarta)` → mode production.
3. **Firestore → Rules**: tempel isi `firestore.rules`, ganti `admin@contoh.com` dengan email admin → **Publish**.
4. **Build → Authentication → Get started → Email/Password → Enable**. Tab **Users → Add user**: email admin yang sama + kata sandi.
5. **Project settings (ikon gerigi) → General → Your apps → Web (`</>`)** → daftarkan. Salin `apiKey` dan `projectId` ke `web/config.js`.
6. Buka `admin.html`, masuk, tekan **Simpan** sekali. Ini membuat data online pertama dari `data.json`.

## 2. Situs web, panel admin, dan unduhan (Netlify, gratis)
Situs: **https://solusiagimas.netlify.app** (akun Netlify tim `kurniahary-tz`, project ID `039a0056-e5b6-4e76-a75b-fba4a7e5803a`).

| Alamat | Isi |
|---|---|
| `/` | Aplikasi web. iPhone: Safari → Bagikan → "Tambah ke Layar Utama" |
| `/unduh/` | Halaman unduh: Android → APK, iPhone → petunjuk, komputer → QR |
| `/unduh/AgiMas.apk` | APK terbaru dari `release/` |
| `/admin.html` | Panel admin (tidak diindeks mesin pencari) |

Deploy ulang (setelah ada perubahan atau APK baru):
```
npm run site                                   # rakit dist/: web/ + site/unduh.html + APK terbaru + _headers
npx netlify-cli deploy --dir=dist --prod --site 039a0056-e5b6-4e76-a75b-fba4a7e5803a
```
Login sekali dengan `npx netlify-cli login`. Catatan: tim Netlify ini mengaktifkan "Visitor access" (hanya anggota tim) untuk situs baru; untuk situs ini sudah dimatikan (`sso_login: false`) supaya publik. Situs baru lain perlu dimatikan juga.

## 3. Build APK
Butuh JDK 21 dan Android SDK (sudah ada di komputer ini).
```
npm install
npm run apk
```
Hasil: `android/app/build/outputs/apk/release/app-release.apk` (salin ke `release/AgiMas-<versi>.apk`).

### Membagikan dan memasang
Kirim file APK lewat WhatsApp / Google Drive. Di HP: buka file → izinkan "Instal aplikasi tidak dikenal" untuk WhatsApp/Drive/File → **Instal**. Android menampilkan peringatan Play Protect karena bukan dari Play Store; pilih "Tetap instal".

### Kapan perlu APK baru?
- **Tidak perlu**: ganti driver, status, area, tarif, nomor admin → cukup lewat panel admin.
- **Perlu**: tampilan/kode berubah, atau **pertama kali setelah `web/config.js` diisi** (APK berisi salinan `config.js`).

### Checklist rilis
1. `npm test` lulus.
2. Naikkan `versionCode` (+1) dan `versionName` di `android/app/build.gradle`. Tanpa ini, HP menolak update.
3. `npm run apk`, salin hasilnya ke `release/AgiMas-<versi>.apk`.
4. Uji di 1–2 HP Android: pilih titik di peta (GPS), lanjut, Kirim ke admin → WhatsApp terbuka dengan teks pesanan.
5. Bagikan.

## Peta
- Peta vektor terang: MapLibre + OpenFreeMap (gaya `positron`). Saran pencarian: Photon. Alamat dari titik: Nominatim. Rute: OSRM. Semua gratis tanpa API key.
- Wilayah layanan = batas resmi **Kota & Kabupaten Madiun + Kabupaten Magetan, Ngawi, Nganjuk, Ponorogo** dari OpenStreetMap, di `web/region.js`. Di luar batas: abu-abu, pin abu-abu, tombol "Pakai lokasi ini" mati, saran pencarian disaring.
- Menambah wilayah (mis. Kabupaten Bojonegoro): ambil poligonnya dari Nominatim (`polygon_geojson=1&polygon_threshold=0.002`, untuk kabupaten pakai `county=<nama>&state=Jawa Timur`), gabungkan dengan wilayah lama memakai shapely (`unary_union` dengan buffer ±0,002 agar celah antar batas tertutup), tulis ke `polygons` dan `bbox` di `web/region.js`, lalu `npm test` dan build APK baru.
- Area driver dengan nama kembar dipilih yang di dalam wilayah dan paling dekat pusat Madiun; admin bisa cek tulisan 📍 di panel dan menambah kecamatan bila perlu ("Banjarejo, Taman").
