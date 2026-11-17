// Rakit folder dist/ untuk deploy web (Netlify): aplikasi web + halaman /unduh + APK terbaru.
// APK sengaja TIDAK ditaruh di web/, karena web/ ikut masuk ke dalam APK (Capacitor) dan ukurannya akan membengkak.
// Pakai: npm run site
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, ".."), dist = path.join(root, "dist");

fs.rmSync(dist, { recursive: true, force: true });
fs.cpSync(path.join(root, "web"), dist, { recursive: true });
fs.mkdirSync(path.join(dist, "unduh"), { recursive: true });
fs.copyFileSync(path.join(root, "site", "unduh.html"), path.join(dist, "unduh", "index.html"));

// APK terbaru = nomor versi tertinggi di release/
const apks = fs.readdirSync(path.join(root, "release")).filter(f => /^AgiMas-[\d.]+\.apk$/.test(f))
  .sort((a, b) => a.match(/[\d.]+(?=\.apk)/)[0].localeCompare(b.match(/[\d.]+(?=\.apk)/)[0], undefined, { numeric: true }));
if (!apks.length) throw new Error("Tidak ada APK di release/. Jalankan npm run apk dulu.");
const latest = apks[apks.length - 1];
fs.copyFileSync(path.join(root, "release", latest), path.join(dist, "unduh", "AgiMas.apk"));

// Header Netlify: tipe file APK, panel admin tidak diindeks mesin pencari, service worker & versi selalu dicek ulang.
fs.writeFileSync(path.join(dist, "_headers"), [
  "/unduh/AgiMas.apk",
  "  Content-Type: application/vnd.android.package-archive",
  "  Content-Disposition: attachment; filename=AgiMas.apk",
  "  Cache-Control: no-cache",
  "/admin.html",
  "  X-Robots-Tag: noindex",
  "/sw.js",
  "  Cache-Control: no-cache",
  "/data.json",
  "  Cache-Control: no-cache",
  // APK membaca versi terbaru & catatan pembaruan dari sini (beda asal: https://localhost), jadi perlu izin CORS.
  "/version.js",
  "  Access-Control-Allow-Origin: *",
  "  Cache-Control: no-cache",
  ""
].join("\n"));

const size = fs.statSync(path.join(dist, "unduh", "AgiMas.apk")).size;
console.log(`dist/ siap: web + /unduh + ${latest} (${(size / 1048576).toFixed(1)} MB)`);
