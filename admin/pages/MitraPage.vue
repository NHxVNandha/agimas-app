<script setup>
import { reactive, ref, computed } from "vue";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import InputNumber from "primevue/inputnumber";
import Textarea from "primevue/textarea";
import ToggleSwitch from "primevue/toggleswitch";
import SelectButton from "primevue/selectbutton";
import AppDialog from "../AppDialog.vue";
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import { Coffee, MapPin, Plus, Pencil, Trash2, RotateCcw, Minus, Info, Store, ImagePlus, Image as ImageIcon, Camera, Clock, Users, UserPlus } from "lucide-vue-next";
import { S, P, Store as DB, token, uid, rp, toThumb, saveAndTell } from "../state.js";
import SectionSave from "../SectionSave.vue";

const confirm = useConfirm(), toast = useToast();
const adminUrl = location.origin + "/admin/";
// Pegawai mitra hanya melihat mitranya sendiri
const list = computed(() => (S.staff ? S.data.mitra.filter((x) => x.id === S.staff.mitra) : S.data.mitra));

function hoursPill(mt) {
  if (!mt.open && !mt.close) return "muted";
  if (!mt.open || !mt.close) return "bad";
  return P.mitraOpen(mt).open ? "good" : "warn";
}
function hoursTxt(mt) {
  if (!mt.open && !mt.close) return "Buka 24 jam";
  if (!mt.open || !mt.close) return "Isi jam buka dan jam tutup";
  return P.mitraOpen(mt).open ? "Sekarang buka" : "Sekarang tutup";
}

// Akun pegawai mitra (hanya admin): email + kata sandi untuk masuk ke panel ini, hanya bisa mengubah menu, stok & jam buka mitranya.
const sd = reactive({ show: false, mitra: null, list: null, email: "", pass: "", busy: false, msg: "" });
async function openStaff(mt) {
  Object.assign(sd, { show: true, mitra: mt, list: null, email: "", pass: "", msg: "" });
  try { sd.list = (await DB.listStaff(token())).filter((x) => x.mitra === mt.id); }
  catch (e) { sd.list = []; sd.msg = e.status === 403 ? "Pasang aturan database terbaru (firestore.rules) dulu." : "Gagal memuat daftar pegawai."; }
}
function authMsg(e) {
  const m = String(e.message || "");
  if (/WEAK_PASSWORD/.test(m)) return "Kata sandi minimal 6 karakter.";
  if (/INVALID_EMAIL/.test(m)) return "Email tidak valid.";
  if (/OPERATION_NOT_ALLOWED|ADMIN_ONLY/.test(m)) return "Pendaftaran akun dimatikan di Firebase (Authentication → Settings → User actions → Enable create).";
  return "Gagal membuat akun: " + m;
}
async function addStaff() {
  const email = sd.email.trim().toLowerCase();
  sd.msg = "";
  if (email === String(S.email).toLowerCase()) { sd.msg = "Itu email admin. Pakai email lain untuk pegawai."; return; }
  sd.busy = true;
  try {
    let id;
    try { id = await DB.signUp(email, sd.pass); }
    catch (e) {
      if (!/EMAIL_EXISTS/.test(e.message)) { sd.msg = authMsg(e); return; }
      try { id = (await DB.login(email, sd.pass)).uid; }   // akun sudah ada (misal pernah dihapus dari daftar): pakai lagi bila sandinya cocok
      catch (_) { sd.msg = "Email ini sudah terdaftar dengan kata sandi lain. Pakai email lain."; return; }
    }
    await DB.setStaff(token(), id, sd.mitra.id, email);
    sd.list = sd.list.filter((x) => x.uid !== id).concat([{ uid: id, mitra: sd.mitra.id, email }]);
    toast.add({ severity: "success", summary: "Akun pegawai dibuat", detail: email + " bisa masuk di " + location.origin + "/admin/", life: 6000 });
    sd.email = ""; sd.pass = "";
  } catch (e) { sd.msg = e.status === 403 ? "Tidak punya izin. Pasang aturan database terbaru (firestore.rules)." : "Gagal menyimpan: " + e.message; }
  finally { sd.busy = false; }
}
function removeStaff(x) {
  confirm.require({
    message: "Cabut akses " + x.email + "? Akun ini tidak bisa lagi mengubah menu " + sd.mitra.name + ".", header: "Cabut akses pegawai",
    acceptLabel: "Cabut", rejectLabel: "Batal", acceptProps: { severity: "danger" }, rejectProps: { severity: "secondary", text: true },
    accept: () => DB.delStaff(token(), x.uid).then(() => { sd.list = sd.list.filter((y) => y !== x); toast.add({ severity: "success", summary: "Akses dicabut", life: 2500 }); })
      .catch(() => toast.add({ severity: "error", summary: "Gagal mencabut akses", life: 4000 }))
  });
}

function stock(m) {
  if (!m.available) return { t: "Habis", c: "bad" };
  if (m.stock == null) return { t: "Stok bebas", c: "muted" };
  if (m.stock <= 0) return { t: "Habis", c: "bad" };
  return { t: "Sisa " + m.stock, c: m.stock <= 5 ? "warn" : "good" };
}
function geo(mt) {
  if (mt.lat != null && mt.geoArea === (mt.place || "").trim()) return { ok: true, t: mt.geoPlace || mt.place };
  return { ok: false, t: mt.place ? mt.place + " · lokasi dicari saat disimpan" : "Alamat belum diisi" };
}
const CATS = ["Makanan", "Minuman"];
function groups(mt) {
  const out = [];
  mt.menu.forEach((m) => { const c = m.cat || "Lainnya"; let g = out.find((x) => x.c === c); if (!g) out.push(g = { c, items: [] }); g.items.push(m); });
  return out;
}
function ask(msg, header, fn) {
  confirm.require({ message: msg, header, acceptLabel: "Hapus", rejectLabel: "Batal", acceptProps: { severity: "danger" }, rejectProps: { severity: "secondary", text: true }, accept: fn });
}
const quick = () => saveAndTell(toast, true);   // sakelar, −1: langsung tersimpan
function dec(m) { if (m.stock != null && !S.saving) { m.stock = Math.max(0, m.stock - 1); quick(); } }
function refill(mt) {
  mt.menu.forEach((m) => { if (m.stockStart != null) m.stock = m.stockStart; m.available = true; });
  saveAndTell(toast);
}

// Dialog mitra
const md = reactive({ show: false, item: null, name: "", tagline: "", place: "" });
function editMitra(mt) { Object.assign(md, { show: true, item: mt, name: mt ? mt.name : "", tagline: mt ? mt.tagline : "", place: mt ? mt.place : "" }); }
function applyMitra() {
  if (!md.name.trim()) return;
  const v = { name: md.name, tagline: md.tagline, place: md.place };
  if (md.item) Object.assign(md.item, v); else S.data.mitra.push({ id: uid("p"), active: false, menu: [], ...v });
  md.show = false;
  saveAndTell(toast);
}
const delMitra = (mt) => ask("Hapus mitra " + (mt.name || "ini") + " beserta semua menunya?", "Hapus mitra", () => { S.data.mitra.splice(S.data.mitra.indexOf(mt), 1); md.show = false; saveAndTell(toast); });

// Dialog menu
const blank = { name: "", price: null, cat: "Minuman", desc: "", info: "", available: true, stock: null, stockStart: null, img: "" };
const mn = reactive({ show: false, mitra: null, item: null, ...blank });
function editMenu(mt, m) { Object.assign(mn, { show: true, mitra: mt, item: m || null }, m ? { name: m.name, price: m.price, cat: m.cat, desc: m.desc, info: m.info || "", available: m.available, stock: m.stock, stockStart: m.stockStart, img: (S.foto || {})[m.id] || "" }
    : { ...blank, cat: mt.menu.length ? mt.menu[mt.menu.length - 1].cat || "Minuman" : "Minuman" }); }
function applyMenu() {
  if (!mn.name.trim() || mn.price == null) return;
  const v = { name: mn.name, price: mn.price, cat: mn.cat, desc: mn.desc, info: mn.info, available: mn.available, stock: mn.stock, stockStart: mn.stockStart };
  let id = mn.item && mn.item.id;
  if (mn.item) Object.assign(mn.item, v); else mn.mitra.menu.push({ id: id = uid("m"), ...v });
  if (S.foto) { if (mn.img) S.foto[id] = mn.img; else delete S.foto[id]; }
  mn.show = false;
  saveAndTell(toast);   // menu langsung terkirim ke aplikasi, tanpa menekan Simpan lagi
}
const delMenu = () => ask("Hapus menu " + (mn.item.name || "ini") + "?", "Hapus menu", () => { mn.mitra.menu.splice(mn.mitra.menu.indexOf(mn.item), 1); if (S.foto) delete S.foto[mn.item.id]; mn.show = false; saveAndTell(toast); });

// Foto menu: dikecilkan di browser lalu disimpan bersama tombol Simpan
const picker = ref(null), fotoMsg = ref("");
async function pickFoto(e) {
  const f = e.target.files[0]; e.target.value = ""; fotoMsg.value = "";
  if (!f) return;
  try { mn.img = await toThumb(f); } catch (err) { fotoMsg.value = err.message; }
}
</script>

<template>
  <div class="page-actions">
    <p v-if="S.staff" class="muted small grow">Ubah menu, stok, dan jam buka. Tekan <b>Simpan</b> agar langsung tampil di aplikasi Agi Mas.</p>
    <p v-else class="muted small grow">Mitra yang <b>tampil</b> muncul di Beranda aplikasi. Menu habis tidak bisa dipesan.</p>
    <Button v-if="!S.staff" label="Tambah mitra" @click="editMitra(null)"><template #icon><Plus :size="17" /></template></Button>
  </div>

  <div v-if="!list.length" class="card empty-state"><Store :size="34" /><p>{{ S.staff ? "Mitra Anda tidak ditemukan. Hubungi admin Agi Mas." : "Belum ada mitra." }}</p></div>

  <section v-for="mt in list" :key="mt.id" class="card mitra" :data-mitra="mt.id">
    <div class="mitra-cover">
      <span class="mitra-logo"><Coffee :size="26" :stroke-width="1.8" /></span>
      <div class="grow">
        <h2>{{ mt.name || "(tanpa nama)" }}</h2>
        <p>{{ mt.tagline || "Tanpa keterangan" }}</p>
        <small :class="{ ok: geo(mt).ok }"><MapPin :size="13" /> {{ geo(mt).t }}</small>
      </div>
      <button v-if="!S.staff" class="icon-btn light" :aria-label="'Akun pegawai ' + mt.name" title="Akun pegawai" @click="openStaff(mt)"><Users :size="17" /></button>
      <button v-if="!S.staff" class="icon-btn light" :aria-label="'Ubah info ' + mt.name" @click="editMitra(mt)"><Pencil :size="17" /></button>
    </div>
    <div class="hours-row">
      <span class="hours-ic"><Clock :size="18" /></span>
      <div class="hours-title grow"><b>Jam operasional</b><span class="pill" :class="hoursPill(mt)">{{ hoursTxt(mt) }}</span></div>
      <div class="hours-fields">
        <label class="tfield" :for="'op-' + mt.id"><span>Buka</span><input :id="'op-' + mt.id" v-model="mt.open" type="time" /></label>
        <span class="tsep" aria-hidden="true">–</span>
        <label class="tfield" :for="'cl-' + mt.id"><span>Tutup</span><input :id="'cl-' + mt.id" v-model="mt.close" type="time" /></label>
        <button v-if="mt.open || mt.close" class="link" @click="mt.open = ''; mt.close = ''">Jadikan 24 jam</button>
      </div>
      <SectionSave class="full" :paths="['mitra.' + S.data.mitra.indexOf(mt) + '.open', 'mitra.' + S.data.mitra.indexOf(mt) + '.close']" />
    </div>
    <label v-if="!S.staff" class="show-row">
      <ToggleSwitch v-model="mt.active" :inputId="'act-' + mt.id" :disabled="S.saving" @change="quick" />
      <span><b>Tampil di aplikasi</b><small>{{ mt.active ? "Pelanggan bisa memesan dari mitra ini" : "Disembunyikan dari pelanggan" }}</small></span>
    </label>

    <div class="section-head">
      <h3>Menu <span class="count">{{ mt.menu.length }}</span></h3>
      <div class="btns">
        <Button label="Isi ulang stok" severity="secondary" outlined size="small" @click="refill(mt)"><template #icon><RotateCcw :size="15" /></template></Button>
        <Button label="Tambah menu" size="small" @click="editMenu(mt, null)"><template #icon><Plus :size="15" /></template></Button>
      </div>
    </div>
    <p v-if="!mt.menu.length" class="empty">Belum ada menu. Tekan "Tambah menu".</p>

    <template v-for="g in groups(mt)" :key="g.c">
      <p class="group-label">{{ g.c }}</p>
      <div v-for="m in g.items" :key="m.id" class="list-row menu" :class="{ off: P.soldOut(m) }">
        <img v-if="S.foto && S.foto[m.id]" class="thumb" :src="S.foto[m.id]" alt="" />
        <span v-else class="thumb empty"><ImageIcon :size="18" /></span>
        <div class="grow info">
          <b>{{ m.name || "(tanpa nama)" }}</b>
          <small>{{ m.desc || " " }}</small>
        </div>
        <span class="price">{{ rp(m.price) }}</span>
        <span class="pill" :class="stock(m).c">{{ stock(m).t }}</span>
        <button v-if="m.stock != null" class="icon-btn" :aria-label="'Kurangi stok ' + m.name" title="Kurangi stok 1" :disabled="m.stock <= 0 || S.saving" @click="dec(m)"><Minus :size="16" /></button>
        <ToggleSwitch v-model="m.available" :ariaLabel="'Tersedia ' + m.name" :title="m.available ? 'Tersedia' : 'Habis'" :disabled="S.saving" @change="quick" />
        <button class="icon-btn" :aria-label="'Ubah menu ' + m.name" @click="editMenu(mt, m)"><Pencil :size="17" /></button>
      </div>
    </template>
  </section>
  <p class="note"><Info :size="15" /> Sakelar di kanan = tersedia/habis, langsung tersimpan. Stok kosong berarti tidak dihitung; "Isi ulang stok" mengembalikan stok ke jumlah awal harian.</p>

  <!-- Dialog info mitra -->
  <AppDialog v-model:visible="md.show" :header="md.item ? 'Ubah info mitra' : 'Tambah mitra'">
    <label for="mName">Nama mitra</label><InputText id="mName" v-model="md.name" placeholder="Misal: Lingkar Kopi" fluid />
    <label for="mTag">Keterangan singkat</label><InputText id="mTag" v-model="md.tagline" placeholder="Misal: Kopi kafe harga gerobak" fluid />
    <label for="mPlace">Alamat / tempat ambil pesanan</label><InputText id="mPlace" v-model="md.place" placeholder="Misal: Jl. Sri Rejeki, Sukosari, Madiun" fluid />
    <p class="hint">Titik peta dicari otomatis dari alamat saat Simpan, lalu terisi otomatis untuk pelanggan.</p>
    <template #footer>
      <Button v-if="md.item" label="Hapus" severity="danger" text class="mr-auto" @click="delMitra(md.item)"><template #icon><Trash2 :size="16" /></template></Button>
      <Button label="Batal" severity="secondary" text @click="md.show = false" />
      <Button :label="md.item ? 'Simpan' : 'Tambahkan'" :loading="S.saving" :disabled="!md.name.trim() || S.saving" @click="applyMitra" />
    </template>
  </AppDialog>

  <!-- Dialog akun pegawai mitra -->
  <AppDialog v-model:visible="sd.show" :header="'Akun pegawai ' + (sd.mitra ? sd.mitra.name : '')">
    <p class="hint">Pegawai masuk di <b>{{ adminUrl }}</b> dengan email &amp; kata sandi ini. Mereka hanya bisa mengubah menu, stok, dan jam buka mitra ini, tidak bisa melihat tarif, driver, atau pesanan.</p>
    <p v-if="sd.list === null" class="muted small">Memuat…</p>
    <div v-for="x in sd.list || []" :key="x.uid" class="list-row flat staff-row">
      <span class="avatar">{{ x.email.charAt(0).toUpperCase() }}</span>
      <b class="grow">{{ x.email }}</b>
      <button class="icon-btn danger" :aria-label="'Cabut akses ' + x.email" @click="removeStaff(x)"><Trash2 :size="16" /></button>
    </div>
    <p v-if="sd.list && !sd.list.length" class="muted small">Belum ada akun pegawai.</p>
    <form class="staff-add" @submit.prevent="addStaff">
      <label for="sEmail">Email pegawai</label><InputText id="sEmail" v-model="sd.email" type="email" autocomplete="off" placeholder="misal: lingkarkopi@gmail.com" fluid />
      <label for="sPass">Kata sandi (min. 6 karakter)</label><InputText id="sPass" v-model="sd.pass" type="text" autocomplete="new-password" placeholder="Buat kata sandi untuk pegawai" fluid />
      <p v-if="sd.msg" class="hint bad">{{ sd.msg }}</p>
      <Button type="submit" label="Buat akun pegawai" :loading="sd.busy" :disabled="!sd.email.trim() || sd.pass.length < 6"><template #icon><UserPlus :size="16" /></template></Button>
    </form>
    <template #footer><Button label="Tutup" severity="secondary" text @click="sd.show = false" /></template>
  </AppDialog>

  <!-- Dialog menu -->
  <AppDialog v-model:visible="mn.show" :header="mn.item ? 'Ubah menu' : 'Tambah menu'">
    <div class="foto-row">
      <button type="button" class="foto" :class="{ has: mn.img }" :disabled="!S.foto || !!S.staff" aria-label="Pilih foto menu" @click="picker.click()">
        <img v-if="mn.img" :src="mn.img" alt="Foto menu" />
        <template v-else><ImagePlus :size="24" /><span>Foto</span></template>
      </button>
      <div class="grow">
        <p v-if="S.staff" class="hint">Foto menu diatur admin Agi Mas.</p>
        <template v-else-if="S.foto">
          <Button :label="mn.img ? 'Ganti foto' : 'Pilih foto'" severity="secondary" outlined size="small" @click="picker.click()"><template #icon><Camera :size="15" /></template></Button>
          <Button v-if="mn.img" label="Hapus foto" severity="danger" text size="small" @click="mn.img = ''" />
          <p class="hint">Opsional. Foto dipotong persegi dan dikecilkan otomatis.</p>
        </template>
        <p v-else class="hint">Foto belum bisa dimuat. Muat ulang halaman untuk mengubah foto.</p>
        <p v-if="fotoMsg" class="hint bad">{{ fotoMsg }}</p>
      </div>
      <input ref="picker" type="file" accept="image/*" hidden @change="pickFoto" />
    </div>
    <label for="nName">Nama menu</label><InputText id="nName" v-model="mn.name" placeholder="Misal: Nebula" fluid />
    <label for="nPrice">Harga</label><InputNumber inputId="nPrice" v-model="mn.price" mode="currency" currency="IDR" locale="id-ID" :minFractionDigits="0" :min="0" placeholder="Rp" fluid />
    <label id="nCatL">Kategori</label>
    <SelectButton v-model="mn.cat" :options="CATS" :allowEmpty="false" aria-labelledby="nCatL" class="cat-pick" />
    <label for="nDesc">Keterangan singkat <span class="muted">(opsional)</span></label><InputText id="nDesc" v-model="mn.desc" maxlength="80" placeholder="Misal: kopi susu gula aren" fluid />
    <label for="nInfo">Informasi lengkap <span class="muted">(opsional, tampil di detail menu)</span></label>
    <Textarea id="nInfo" v-model="mn.info" rows="4" maxlength="1000" autoResize placeholder="Misal: espresso, susu segar, gula aren. Ukuran 250 ml. Bisa less sugar atau tanpa es." fluid />
    <p class="hint">{{ (mn.info || "").length }}/1000 · Pelanggan melihatnya saat mengetuk menu di aplikasi.</p>
    <div class="two">
      <div><label for="nStock">Stok sekarang</label><InputNumber inputId="nStock" v-model="mn.stock" :min="0" :useGrouping="false" placeholder="Tidak dihitung" fluid /></div>
      <div><label for="nStart">Stok awal harian</label><InputNumber inputId="nStart" v-model="mn.stockStart" :min="0" :useGrouping="false" placeholder="Tidak dihitung" fluid /></div>
    </div>
    <label class="show-row tight"><ToggleSwitch v-model="mn.available" inputId="nAvail" /><span><b>Tersedia</b><small>Matikan bila sedang habis</small></span></label>
    <template #footer>
      <Button v-if="mn.item" label="Hapus" severity="danger" text class="mr-auto" @click="delMenu"><template #icon><Trash2 :size="16" /></template></Button>
      <Button label="Batal" severity="secondary" text @click="mn.show = false" />
      <Button label="Simpan" :loading="S.saving" :disabled="!mn.name.trim() || mn.price == null || S.saving" @click="applyMenu" />
    </template>
  </AppDialog>
</template>
