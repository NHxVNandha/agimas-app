// Render semua video Remotion ke promo/video-remotion/<agimas|saget-kasir>/ (versi vertikal di subfolder vertikal/).
// Pakai Chrome yang sudah terpasang (tidak mengunduh Chrome Headless Shell). Jalankan: npm run render [-- Agimas-Promosi ...]
import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT = path.resolve("..", "promo", "video-remotion");
const JOBS = [
  ["Agimas-Promosi", "agimas", "agimas-promosi.mp4"],
  ["Agimas-Deskripsi", "agimas", "agimas-deskripsi.mp4"],
  ["Agimas-Tutorial", "agimas", "agimas-tutorial.mp4"],
  ["SagetKasir-Promosi", "saget-kasir", "saget-kasir-promosi.mp4"],
  ["SagetKasir-Deskripsi", "saget-kasir", "saget-kasir-deskripsi.mp4"],
  ["SagetKasir-Tutorial", "saget-kasir", "saget-kasir-tutorial.mp4"],
  ["Agimas-Promosi-Vertikal", "agimas/vertikal", "agimas-promosi-vertikal.mp4"],
  ["Agimas-Deskripsi-Vertikal", "agimas/vertikal", "agimas-deskripsi-vertikal.mp4"],
  ["Agimas-Tutorial-Vertikal", "agimas/vertikal", "agimas-tutorial-vertikal.mp4"],
  ["SagetKasir-Promosi-Vertikal", "saget-kasir/vertikal", "saget-kasir-promosi-vertikal.mp4"],
  ["SagetKasir-Deskripsi-Vertikal", "saget-kasir/vertikal", "saget-kasir-deskripsi-vertikal.mp4"],
  ["SagetKasir-Tutorial-Vertikal", "saget-kasir/vertikal", "saget-kasir-tutorial-vertikal.mp4"],
];
// Animasi ilustrasi 2D -> promo/video-animasi-2d/<app>/ (vertikal di subfolder vertikal/)
for (const [app, dir] of [["Agimas", "agimas"], ["SagetKasir", "saget-kasir"]])
  for (const kind of ["Promosi", "Deskripsi", "Tutorial"])
    for (const v of [false, true])
      JOBS.push([`${app}-Animasi-${kind}${v ? "-Vertikal" : ""}`, `../video-animasi-2d/${dir}${v ? "/vertikal" : ""}`, `${dir}-animasi-${kind.toLowerCase()}${v ? "-vertikal" : ""}.mp4`]);
const only = process.argv.slice(2);
for (const [id, dir, file] of JOBS) {
  if (only.length && !only.includes(id)) continue;
  mkdirSync(path.join(OUT, dir), { recursive: true });
  const out = path.join(OUT, dir, file);
  console.log(`== ${id} -> ${out}`);
  execSync(`npx remotion render src/index.ts ${id} "${out}" --browser-executable="${CHROME}" --codec=h264 --crf=20 --concurrency=2 --timeout=60000 --log=warn`, { stdio: "inherit" });
}
