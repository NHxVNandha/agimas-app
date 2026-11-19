// Pratinjau cepat: bundel sekali, lalu foto frame tengah tiap kalimat terakhir di setiap adegan (untuk memeriksa ilustrasi).
// Pakai: node preview.mjs <id-komposisi> <folder-keluaran>
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

const [id, outDir] = process.argv.slice(2);
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
mkdirSync(outDir, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const comp = await selectComposition({ serveUrl, id, browserExecutable: CHROME });
const d = JSON.parse(readFileSync(`src/gen/${id.startsWith("Agimas") ? "agimas" : "kasir"}.json`, "utf8"));
const frames = [];
if (id.includes("Tutorial")) {
  let t = 0;
  for (const sc of d.tutorial) { const len = sc.beats.reduce((a, b) => a + b.frames, 0), last = sc.beats[sc.beats.length - 1].frames; frames.push(t + len - Math.round(last / 2)); t += len; }
} else {
  let t = 0;
  for (const l of (id.includes("Promosi") ? d.promo : d.desc)) { frames.push(t + Math.round(l.frames * 0.8)); t += l.frames; }
}
for (const [k, frame] of frames.entries()) {
  await renderStill({ composition: comp, serveUrl, frame, output: path.join(outDir, `${String(k).padStart(2, "0")}.png`), browserExecutable: CHROME, scale: 0.5 });
}
console.log(id, frames.length, "gambar");
