/* Data panel admin: dimuat dari Firebase (store.js), diedit di halaman, disimpan kembali dengan tombol Simpan.
   Logika harga/validasi (pricing.js) dan pencarian lokasi (map.js) dipakai bersama aplikasi pelanggan. */
import { reactive, computed } from "vue";

export const P = window.Pricing;
export const Store = window.Store;
const TOKEN_KEY = "agimas.admin.token"; // sama dengan panel lama, jadi sesi yang masih berlaku tetap terpakai

export const S = reactive({
  view: "loading",   // loading | notSet | login | editor
  data: null,        // data yang sedang diedit
  snap: "",          // JSON data terakhir yang tersimpan (untuk tahu ada perubahan & membatalkan)
  savedAt: "",
  online: false,     // false = Firebase belum pernah diisi (aplikasi masih memakai data bawaan)
  email: "",
  saving: false,
  progress: "",
  loginMsg: "",
  foto: null,        // { idMenu: dataURL }; null = belum/gagal dimuat (foto tidak bisa diubah agar foto lama tidak tertimpa)
  fotoSnap: "{}",
  staff: null,       // { mitra, email } bila yang masuk pegawai mitra: hanya boleh mengubah menu, stok & jam buka mitranya
  mitraAt: {},       // { idMitra: updateTime dokumen mitra/{id} } untuk mencegah saling menimpa
  mitraSaved: {}     // { idMitra: JSON isi dokumen terakhir di server } untuk tahu mitra mana yang berubah
});
export const dirty = computed(() => !!S.data && (JSON.stringify(S.data) !== S.snap || (!!S.foto && JSON.stringify(S.foto) !== S.fotoSnap)));
export const FOTO_MAX = 950000;   // batas dokumen Firestore 1 MB (lihat firestore.rules)

export function token() {
  try { const t = JSON.parse(sessionStorage.getItem(TOKEN_KEY)); return t && t.exp > Date.now() ? t.v : ""; } catch (e) { return ""; }
}
function tokenInfo() { try { return JSON.parse(sessionStorage.getItem(TOKEN_KEY)) || {}; } catch (e) { return {}; } }

export function uid(p) { return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }

/* Bentuk data untuk diedit: area kosong "Belum diisi" ditampilkan kosong, mitra/stok selalu ada. */
function normalize(src) {
  const d = JSON.parse(JSON.stringify(src));
  d.mitra = d.mitra || [];
  d.drivers.forEach((x) => { if (x.area === "Belum diisi") x.area = ""; });
  d.mitra.forEach((m) => { m.open = m.open || ""; m.close = m.close || ""; });
  d.mitra.forEach((m) => m.menu.forEach((x) => {
    if (x.stock === undefined) x.stock = null;
    if (x.stockStart === undefined) x.stockStart = null;
  }));
  return d;
}
/* Isi dokumen mitra/{id}: menu, stok & jam buka (bentuk sama untuk admin, pegawai, dan konfirmasi pesanan). */
const docOf = (m) => ({ menu: m.menu, open: m.open || "", close: m.close || "" });
function use(res) {
  S.data = normalize(res.data); S.snap = JSON.stringify(S.data);
  S.online = res.source === "online"; S.savedAt = res.updatedAt || ""; S.view = "editor";
  S.mitraAt = res.mitraAt || {}; S.mitraSaved = {};
  collect().mitra.forEach((m) => { if (S.mitraAt[m.id]) S.mitraSaved[m.id] = JSON.stringify(docOf(m)); });
  if (!S.foto) loadFoto();
}
async function loadFoto() {
  try { const f = await Store.loadFoto(); S.fotoSnap = JSON.stringify(f); S.foto = f; } catch (e) { S.foto = null; }
}
/* Simpan per bagian: jalur titik seperti "tarif.orang" atau "mitra.0.open". */
const at = (o, p) => p.split(".").reduce((x, k) => (x == null ? x : x[k]), o);
export function changed(paths) {
  if (!S.data) return false;
  const snap = JSON.parse(S.snap);
  return paths.some((p) => JSON.stringify(at(S.data, p)) !== JSON.stringify(at(snap, p)));
}
export function revertPaths(paths) {
  const snap = JSON.parse(S.snap);
  paths.forEach((p) => {
    const ks = p.split("."), last = ks.pop(), dst = ks.length ? at(S.data, ks.join(".")) : S.data, src = ks.length ? at(snap, ks.join(".")) : snap;
    if (dst && src) dst[last] = JSON.parse(JSON.stringify(src[last] ?? null));
  });
}
export function revert() { S.data = JSON.parse(S.snap); if (S.foto) S.foto = JSON.parse(S.fotoSnap); }

/* Foto dari HP/komputer -> kotak 240×240 (dipotong di tengah), WebP ±10 KB. */
export function toThumb(file) {
  return new Promise((ok, fail) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const n = 240, c = document.createElement("canvas"), s = Math.min(img.naturalWidth, img.naturalHeight);
      c.width = c.height = n;
      c.getContext("2d").drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, n, n);
      URL.revokeObjectURL(url);
      const w = c.toDataURL("image/webp", 0.72);
      ok(w.startsWith("data:image/webp") ? w : c.toDataURL("image/jpeg", 0.75));   // Safari lama tidak bisa WebP
    };
    img.onerror = () => { URL.revokeObjectURL(url); fail(new Error("File bukan gambar yang bisa dibuka.")); };
    img.src = url;
  });
}

/* Data siap simpan: dirapikan; koordinat hanya dipertahankan bila masih cocok dengan area/alamatnya. */
export function collect() {
  const d = JSON.parse(JSON.stringify(S.data));
  d.admin = { name: String(d.admin.name || "").trim(), phone: P.normPhone(d.admin.phone || ""), hours: String(d.admin.hours || "").trim() };
  d.drivers = d.drivers.map((x) => {
    const y = { id: x.id, name: String(x.name || "").trim(), area: String(x.area || "").trim() || "Belum diisi", status: x.status };
    if (x.lat != null && x.geoArea === y.area) Object.assign(y, { lat: x.lat, lng: x.lng, geoArea: x.geoArea, geoPlace: x.geoPlace });
    return y;
  });
  d.mitra = d.mitra.map((x) => {
    const y = {
      id: x.id, name: String(x.name || "").trim(), tagline: String(x.tagline || "").trim(), place: String(x.place || "").trim(), active: !!x.active,
      open: x.open || "", close: x.close || "",
      menu: x.menu.map((m) => ({ id: m.id, name: String(m.name || "").trim(), price: m.price, cat: String(m.cat || "").trim(),
        desc: String(m.desc || "").trim(), info: String(m.info || "").trim(), available: !!m.available, stock: m.stock, stockStart: m.stockStart }))
    };
    if (x.lat != null && x.geoArea === y.place) Object.assign(y, { lat: x.lat, lng: x.lng, geoArea: x.geoArea, geoPlace: x.geoPlace });
    return y;
  });
  return d;
}

/* Koordinat area driver & alamat mitra yang baru/berubah (untuk "driver terdekat" & titik ambil mitra).
   Satu per satu dengan jeda 1,1 detik (aturan Nominatim). Mengembalikan teks yang tidak ditemukan. */
async function geocode(d) {
  const todo = d.drivers.filter((x) => x.lat == null && x.area !== "Belum diisi").map((x) => ({ o: x, q: x.area }))
    .concat(d.mitra.filter((x) => x.lat == null && x.place).map((x) => ({ o: x, q: x.place })));
  const missed = [];
  for (let i = 0; i < todo.length; i++) {
    const t = todo[i];
    S.progress = "Mencari lokasi " + t.q + " (" + (i + 1) + "/" + todo.length + ")…";
    try {
      const r = await window.MapPick.search(t.q, true);
      if (r) Object.assign(t.o, { lat: +r.lat.toFixed(5), lng: +r.lng.toFixed(5), geoArea: t.q, geoPlace: r.place }); else missed.push(t.q);
    } catch (e) { missed.push(t.q); }
    if (i < todo.length - 1) await new Promise((ok) => setTimeout(ok, 1100));
  }
  return missed;
}

/* Simpan ke Firebase. Hasil: { ok, missed } atau { error, expired }. */
export async function save() {
  const d = collect(), err = P.validate(d);
  if (err) return { error: err };
  const t = token();
  if (!t) { S.view = "login"; S.loginMsg = "Sesi habis. Masuk lagi; perubahan Anda tetap tersimpan di layar."; return { error: "Sesi habis.", expired: true }; }
  S.saving = true;
  try {
    if (S.staff) {   // pegawai mitra: hanya dokumen mitranya
      const m = d.mitra.find((x) => x.id === S.staff.mitra);
      if (m) await saveMitraDoc(t, m);
      S.snap = JSON.stringify(S.data);
      return { ok: true, missed: [] };
    }
    const missed = await geocode(d);
    if (S.foto) {
      const ids = new Set(d.mitra.flatMap((x) => x.menu.map((m) => m.id)));
      const f = Object.fromEntries(Object.entries(S.foto).filter(([k]) => ids.has(k))), txt = JSON.stringify(f);
      if (txt.length > FOTO_MAX) return { error: "Foto menu terlalu banyak (batas ±80 foto). Hapus beberapa foto lalu Simpan lagi." };
      if (txt !== S.fotoSnap) { S.progress = "Menyimpan foto…"; await Store.saveFoto(t, f); S.fotoSnap = txt; S.foto = f; }
    }
    for (const m of d.mitra) { S.progress = "Menyimpan menu " + m.name + "…"; await saveMitraDoc(t, m); }
    S.progress = "Menyimpan…";
    const row = await Store.save(t, d);
    row.mitraAt = S.mitraAt;
    use(row);
    return { ok: true, missed };
  } catch (e) {
    if (e.conflict) return { error: "Menu " + (e.mitraName || "mitra") + " baru saja diubah di perangkat lain (pegawai mitra atau konfirmasi pesanan). Muat ulang halaman, lalu ulangi perubahan Anda." };
    if (e.status === 401) { sessionStorage.removeItem(TOKEN_KEY); S.view = "login"; S.loginMsg = "Sesi habis. Masuk lagi lalu tekan Simpan."; return { error: "Sesi habis.", expired: true }; }
    return { error: e.status === 403 ? e.message : "Gagal menyimpan. Periksa koneksi lalu coba lagi." };
  } finally { S.saving = false; S.progress = ""; }
}

/* Dokumen mitra hanya ditulis bila isinya berubah, dan hanya bila belum diubah orang lain sejak dimuat. */
async function saveMitraDoc(t, m) {
  const v = docOf(m), j = JSON.stringify(v);
  if (j === S.mitraSaved[m.id]) return;
  try { S.mitraAt[m.id] = await Store.saveMitra(t, m.id, v, S.mitraAt[m.id]); S.mitraSaved[m.id] = j; }
  catch (e) { e.mitraName = m.name; throw e; }
}

/* Stok tahap 3: admin mengonfirmasi pesanan -> pesanan ditandai, lalu stok menu mitra dikurangi sesuai jumlah pesanan.
   Hasil: { changes: [{ name, from, to }] } atau { error } (pesanan sudah ditandai tapi stok gagal dikurangi). */
export async function confirmOrder(o) {
  const t = token();
  await Store.confirmOrder(t, o);   // bentrok (sudah dikonfirmasi admin lain) -> error, stok tidak dikurangi dua kali
  if (!o.mitra || !Object.keys(o.items || {}).length) return { changes: [] };
  for (let i = 0; i < 3; i++) {
    const doc = await Store.getMitra(o.mitra);
    if (!doc) return { error: "Pesanan dikonfirmasi, tapi stok belum bisa dikurangi otomatis: buka Mitra & Menu lalu tekan Simpan sekali. Kurangi stok pesanan ini secara manual." };
    const changes = [];
    doc.v.menu.forEach((m) => { const q = o.items[m.id]; if (q && m.stock != null) { const from = m.stock; m.stock = Math.max(0, from - q); changes.push({ name: m.name, from, to: m.stock }); } });
    if (!changes.length) return { changes };
    try { const at = await Store.saveMitra(t, o.mitra, doc.v, doc.at); syncStock(o.mitra, doc.v, at); return { changes }; }
    catch (e) { if (!e.conflict || i === 2) return { error: "Pesanan dikonfirmasi, tapi stok gagal dikurangi (" + e.message + "). Kurangi stok secara manual." }; }
  }
}
/* Stok baru dari server ikut ke layar editor & snapshot, agar tombol Simpan berikutnya tidak menimpanya dengan angka lama. */
function syncStock(mid, v, at) {
  if (!S.data) return;
  const apply = (d) => { const mt = (d.mitra || []).find((x) => x.id === mid); if (mt) v.menu.forEach((m) => { const x = mt.menu.find((y) => y.id === m.id); if (x) x.stock = m.stock; }); };
  apply(S.data); const sn = JSON.parse(S.snap); apply(sn); S.snap = JSON.stringify(sn);
  S.mitraAt[mid] = at; S.mitraSaved[mid] = JSON.stringify(v);
}

/* Simpan lalu beri tahu hasilnya (toast PrimeVue). Dipakai tombol Simpan dan dialog menu. */
/* quick = aksi cepat (sakelar, status, −1): notifikasi singkat. */
export async function saveAndTell(toast, quick) {
  if (S.saving) return { busy: true };
  const r = await save();
  if (r.ok) {
    toast.add(quick ? { severity: "success", summary: "Tersimpan", life: 1500 } : { severity: "success", summary: "Tersimpan", detail: "Perubahan sudah tampil di aplikasi pelanggan.", life: 3000 });
    if (r.missed.length) toast.add({ severity: "warn", summary: "Lokasi tidak ditemukan", detail: r.missed.join(", ") + '. Tambahkan kecamatan, misal "Banjarejo, Taman".', life: 9000 });
  } else if (!r.expired) toast.add({ severity: "error", summary: "Belum tersimpan", detail: r.error, life: 7000 });
  return r;
}

export async function login(email, pass) {
  S.loginMsg = "";
  try {
    const r = await Store.login(email, pass);
    sessionStorage.setItem(TOKEN_KEY, JSON.stringify({ v: r.token, exp: Date.now() + (r.expiresIn - 60) * 1000, email, uid: r.uid }));
    S.email = email;
    await role(r.token, r.uid);
    if (S.data) { S.view = "editor"; return; }       // masuk lagi setelah sesi habis: perubahan di layar tetap ada
    const res = await Store.load();
    if (res.source !== "online" && res.source !== "kosong") throw new Error("Tidak bisa memuat data online: " + (res.error || res.source));
    use(res);
  } catch (err) {
    S.loginMsg = err.status === 400 ? "Email atau kata sandi salah." : (err.message || "Gagal masuk. Periksa koneksi.");
  }
}

/* Pegawai mitra atau admin? (staf/{uid} hanya ada untuk pegawai). Gagal membaca = admin; izin tetap dijaga firestore.rules. */
async function role(t, uid) {
  S.staff = null;
  if (!uid) return;
  try { const s = await Store.getStaff(t, uid); if (s && s.mitra) S.staff = s; } catch (e) {}
}

export function logout() { sessionStorage.removeItem(TOKEN_KEY); location.reload(); }

export async function boot() {
  if (!Store.on()) { S.view = "notSet"; return; }
  if (!token()) { S.view = "login"; return; }
  S.email = tokenInfo().email || "";
  await role(token(), tokenInfo().uid);
  const res = await Store.load();
  if (res.source === "online" || res.source === "kosong") use(res); else S.view = "login";
}

/* 6287818083068 -> +62 878-1808-3068 */
export function phoneTxt(p) { p = String(p || ""); return /^62\d{9,}$/.test(p) ? "+62 " + p.slice(2, 5) + "-" + p.slice(5, 9) + "-" + p.slice(9) : p || "belum diisi"; }
export function rp(n) { return P.rp(n || 0); }
export function fmtTime(t) { return t ? new Date(t).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : ""; }
export function initial(n) { return (String(n || "").replace(/^Mas\s+/i, "").charAt(0) || "?").toUpperCase(); }
