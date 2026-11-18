/* Pemakaian Firestore dari Google Cloud Monitoring (sumber yang sama dengan Firebase Console → Usage).
   Membaca grafik ini TIDAK memakai kuota baca Firestore. Butuh izin akun Google pemilik proyek (OAuth, scope monitoring.read),
   karena login admin Firebase (email + kata sandi) tidak punya akses ke data pemantauan. */

const SCOPE = "https://www.googleapis.com/auth/monitoring.read";
const KEY = "agimas.admin.gtoken";
const PT = "America/Los_Angeles";   // kuota harian gratis Firestore direset tengah malam waktu Pasifik
export const QUOTA = { read: 50000, write: 20000, del: 20000 };
const METRIC = { read: "document/read_count", write: "document/write_count", del: "document/delete_count" };

let gis = null, client = null, pending = null;
/* Muat skrip Google Identity Services lebih awal: requestAccessToken harus dipanggil langsung saat tombol ditekan,
   kalau tidak, browser memblokir jendela login. */
export function prepareGoogle(clientId) {
  gis = gis || new Promise((ok, fail) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client"; s.async = true;
    s.onload = ok; s.onerror = () => { gis = null; fail(new Error("Gagal memuat login Google. Periksa koneksi.")); };
    document.head.appendChild(s);
  });
  return gis.then(() => {
    if (client) return;
    client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId, scope: SCOPE,
      callback: (r) => {
        if (r.error) return pending && pending.fail(new Error(r.error_description || r.error));
        try { sessionStorage.setItem(KEY, JSON.stringify({ v: r.access_token, exp: Date.now() + ((Number(r.expires_in) || 3600) - 60) * 1000 })); } catch (e) {}
        pending && pending.ok(r.access_token);
      },
      error_callback: (e) => pending && pending.fail(new Error(e && e.type === "popup_closed" ? "Jendela login Google ditutup." : "Login Google gagal atau diblokir browser."))
    });
  });
}
export function googleLogin() {
  if (!client) return Promise.reject(new Error("Login Google belum siap. Coba lagi sebentar."));
  return new Promise((ok, fail) => { pending = { ok, fail }; client.requestAccessToken(); });
}
export function savedToken() {
  try { const t = JSON.parse(sessionStorage.getItem(KEY)); return t && t.exp > Date.now() ? t.v : ""; } catch (e) { return ""; }
}
export function forgetToken() { try { sessionStorage.removeItem(KEY); } catch (e) {} }

/* Tanggal (YYYY-MM-DD) menurut waktu Pasifik: dasar pembagian "hari" kuota. */
export const ptDay = (t) => new Intl.DateTimeFormat("en-CA", { timeZone: PT }).format(t);
/* Jam reset kuota berikutnya (tengah malam Pasifik), sebagai Date. */
export function nextReset(now = new Date()) {
  let t = new Date(now); t.setMinutes(0, 0, 0);
  const today = ptDay(now);
  while (ptDay(t) === today) t = new Date(t.getTime() + 3600e3);
  return t;
}

async function series(token, project, metric, start, end, period) {
  const q = new URLSearchParams({
    filter: 'metric.type="firestore.googleapis.com/' + metric + '"',
    "interval.startTime": start.toISOString(), "interval.endTime": end.toISOString(),
    "aggregation.alignmentPeriod": period + "s", "aggregation.perSeriesAligner": "ALIGN_SUM",
    "aggregation.crossSeriesReducer": "REDUCE_SUM"
  });
  const r = await fetch("https://monitoring.googleapis.com/v3/projects/" + project + "/timeSeries?" + q, { headers: { Authorization: "Bearer " + token } });
  const b = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error((b.error && b.error.message) || "HTTP " + r.status); e.status = r.status;
    e.disabled = /has not been used|is disabled|SERVICE_DISABLED/i.test(JSON.stringify(b));
    throw e;
  }
  const pts = [];
  (b.timeSeries || []).forEach((s) => s.points.forEach((p) => pts.push({ end: new Date(p.interval.endTime), n: Number(p.value.int64Value || p.value.doubleValue || 0) })));
  return pts;
}

/* Hasil: { days: ["2026-11-12", …, hari ini] (7 hari Pasifik), read|write|del: [jumlah per hari] }.
   Per jam (rapi di batas jam) + sisa jam berjalan, lalu dijumlah per hari Pasifik. */
export async function fetchUsage(token, project, now = new Date()) {
  const hour = new Date(now); hour.setMinutes(0, 0, 0);
  const start = new Date(hour.getTime() - 8 * 24 * 3600e3);
  const days = [];
  for (let i = 6; i >= 0; i--) days.push(ptDay(new Date(nextReset(now).getTime() - 1 - i * 24 * 3600e3)));
  const out = { days };
  await Promise.all(Object.keys(METRIC).map(async (k) => {
    const lastSec = Math.max(60, Math.round((now - hour) / 1000));
    const [a, b] = await Promise.all([
      series(token, project, METRIC[k], start, hour, 3600),
      now - hour >= 60e3 ? series(token, project, METRIC[k], hour, now, lastSec) : Promise.resolve([])
    ]);
    const sum = Object.fromEntries(days.map((d) => [d, 0]));
    a.concat(b).forEach((p) => { const d = ptDay(new Date(p.end.getTime() - 1)); if (d in sum) sum[d] += p.n; });
    out[k] = days.map((d) => sum[d]);
  }));
  return out;
}
