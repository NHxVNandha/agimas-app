<script setup>
import { ref, computed, onMounted } from "vue";
import Button from "primevue/button";
import SelectButton from "primevue/selectbutton";
import { BookOpen, PencilLine, Trash2, RefreshCw, LogIn, Info, CircleAlert, ExternalLink } from "lucide-vue-next";
import { QUOTA, prepareGoogle, googleLogin, savedToken, forgetToken, fetchUsage, nextReset } from "../usage.js";

const C = window.AGIMAS_CONFIG || {};
const clientId = C.googleClientId || "", project = C.firebaseProjectId;
const ORIGIN = location.origin;
const KINDS = [
  { k: "read", l: "Baca", unit: "baca", icon: BookOpen, ic: "blue" },
  { k: "write", l: "Tulis", unit: "tulis", icon: PencilLine, ic: "green" },
  { k: "del", l: "Hapus", unit: "hapus", icon: Trash2, ic: "orange" }
];
const tok = ref(savedToken()), data = ref(null), busy = ref(false), err = ref(null), at = ref(null);
const pick = ref("read");
const nf = (n) => Math.round(n).toLocaleString("id-ID");

async function load() {
  busy.value = true; err.value = null;
  try { data.value = await fetchUsage(tok.value, project); at.value = new Date(); }
  catch (e) {
    if (e.status === 401) { forgetToken(); tok.value = ""; err.value = { t: "Sesi Google habis. Masuk lagi." }; }
    else if (e.disabled) err.value = { t: "Cloud Monitoring API belum diaktifkan di proyek ini.", link: "https://console.cloud.google.com/apis/library/monitoring.googleapis.com?project=" + project, ll: "Aktifkan Cloud Monitoring API" };
    else if (e.status === 403) err.value = { t: "Akun Google ini tidak punya akses ke proyek " + project + ". Masuk memakai akun pemilik proyek Firebase." };
    else err.value = { t: "Gagal memuat pemakaian: " + e.message };
  } finally { busy.value = false; }
}
async function login() {
  err.value = null;
  try { tok.value = await googleLogin(); load(); } catch (e) { err.value = { t: e.message }; }
}
function logoutGoogle() { forgetToken(); tok.value = ""; data.value = null; }
onMounted(() => {
  if (!clientId) return;
  prepareGoogle(clientId).catch((e) => { err.value = { t: e.message }; });
  if (tok.value) load();
});

const reset = computed(() => nextReset(at.value || new Date()).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
function level(p) { return p >= 80 ? { c: "bad", t: "Hampir habis" } : p >= 50 ? { c: "warn", t: "Waspada" } : { c: "good", t: "Aman" }; }
const tiles = computed(() => KINDS.map((x) => {
  const n = data.value ? data.value[x.k][6] : 0, p = Math.min(100, n / QUOTA[x.k] * 100);
  return { ...x, n, p, lv: level(p) };
}));

// Grafik 7 hari: satu seri (jenis yang dipilih), skala dari 0 sampai angka bulat di atas nilai tertinggi
const bars = computed(() => {
  if (!data.value) return null;
  const v = data.value[pick.value], max = Math.max(...v, 1);
  const mag = Math.pow(10, Math.floor(Math.log10(max))), top = Math.ceil(max / mag) * mag;
  const days = data.value.days.map((d, i) => {
    const dt = new Date(d + "T12:00:00");
    return { n: v[i], h: v[i] / top * 100, today: i === 6, short: i === 6 ? "Hari ini" : dt.toLocaleDateString("id-ID", { weekday: "short" }), long: dt.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short" }) };
  });
  return { top, ticks: [top, top / 2, 0], days, sum: v.reduce((a, b) => a + b, 0) };
});
const unit = computed(() => KINDS.find((x) => x.k === pick.value).unit);
const hover = ref(-1);
</script>

<template>
  <!-- Belum disetel: panduan sekali -->
  <section v-if="!clientId" class="card setup">
    <div class="card-head"><h3>Siapkan grafik pemakaian (sekali saja)</h3></div>
    <p class="muted small">Grafik diambil dari Google Cloud Monitoring, gratis dan tidak memakai kuota Firestore. Ikuti langkah ini dengan akun Google pemilik proyek Firebase:</p>
    <ol class="steps">
      <li>Buka <a :href="'https://console.cloud.google.com/apis/library/monitoring.googleapis.com?project=' + project" target="_blank" rel="noopener">Cloud Monitoring API <ExternalLink :size="13" /></a> lalu tekan <b>Enable / Aktifkan</b>.</li>
      <li>Buka <a :href="'https://console.cloud.google.com/auth/overview?project=' + project" target="_blank" rel="noopener">Google Auth Platform <ExternalLink :size="13" /></a> → <b>Get started</b>. Nama aplikasi: <i>Agi Mas Admin</i>, Audience: <b>External</b>. Di bagian <b>Audience → Test users</b>, tambahkan email Google Anda.</li>
      <li>Masuk ke <b>Clients → Create client</b>, jenis <b>Web application</b>. Di <b>Authorized JavaScript origins</b> isi: <code>{{ ORIGIN }}</code></li>
      <li>Salin <b>Client ID</b> (berakhiran <code>.apps.googleusercontent.com</code>) dan kirim ke pengembang untuk dipasang.</li>
    </ol>
  </section>

  <!-- Belum masuk Google -->
  <section v-else-if="!tok" class="card empty-state">
    <span class="ic blue"><LogIn :size="20" /></span>
    <p>Masuk dengan akun Google pemilik proyek Firebase untuk melihat pemakaian kuota gratis.<br>Melihat grafik ini tidak memakai kuota Firestore.</p>
    <Button label="Masuk dengan Google" @click="login"><template #icon><LogIn :size="17" /></template></Button>
    <p v-if="err" class="hint bad">{{ err.t }}</p>
  </section>

  <template v-else>
    <div class="page-actions">
      <p class="muted small grow">Hari ini menurut kuota Firebase, direset pukul <b>{{ reset }}</b>. Angka bisa tertunda beberapa menit.</p>
      <Button label="Muat ulang" severity="secondary" outlined size="small" :loading="busy" @click="load"><template #icon><RefreshCw :size="15" /></template></Button>
    </div>
    <p v-if="err" class="card errbox"><CircleAlert :size="18" /> <span>{{ err.t }} <a v-if="err.link" :href="err.link" target="_blank" rel="noopener">{{ err.ll }}</a>
      <button v-if="!tok" class="link" @click="login">Masuk dengan Google</button></span></p>

    <div class="stats three">
      <div v-for="x in tiles" :key="x.k" class="card stat usage">
        <div class="stat-top"><span>{{ x.l }} hari ini</span><i class="ic" :class="x.ic"><component :is="x.icon" :size="20" /></i></div>
        <b>{{ data ? nf(x.n) : "…" }}<small> / {{ nf(QUOTA[x.k]) }}</small></b>
        <div class="meter" role="progressbar" :aria-valuenow="Math.round(x.p)" aria-valuemin="0" aria-valuemax="100" :aria-label="x.l + ' hari ini'"><i :class="x.lv.c" :style="{ width: Math.max(x.p, x.n ? 1.5 : 0) + '%' }"></i></div>
        <p><span class="pill" :class="x.lv.c">{{ x.lv.t }}</span> {{ x.p < 0.1 && x.n ? "< 0,1" : x.p.toFixed(1).replace(".", ",") }}% terpakai</p>
      </div>
    </div>

    <section class="card">
      <div class="card-head wrap">
        <div><h3>7 hari terakhir</h3><p class="muted small" v-if="bars">Total {{ nf(bars.sum) }} {{ unit }}</p></div>
        <SelectButton v-model="pick" :options="KINDS" optionLabel="l" optionValue="k" :allowEmpty="false" aria-label="Jenis pemakaian" class="kind-pick" />
      </div>
      <div v-if="bars" class="vchart" @mouseleave="hover = -1">
        <div class="vgrid" aria-hidden="true"><div v-for="t in bars.ticks" :key="t"><span>{{ nf(t) }}</span></div></div>
        <div class="vbars">
          <div v-for="(d, i) in bars.days" :key="i" class="vcol" :class="{ on: hover === i, today: d.today }" tabindex="0"
               :aria-label="d.long + ': ' + nf(d.n) + ' ' + unit" @mouseenter="hover = i" @focus="hover = i" @blur="hover = -1">
            <div class="vtrack"><i :style="{ height: Math.max(d.h, d.n ? 1 : 0) + '%' }"></i>
              <span v-if="hover === i || (hover < 0 && d.today)" class="vtip" :style="{ bottom: 'calc(' + d.h + '% + 6px)' }">{{ nf(d.n) }}</span></div>
            <small>{{ d.short }}</small>
          </div>
        </div>
      </div>
      <div v-else class="empty-state small"><p>{{ busy ? "Memuat…" : "Belum ada data." }}</p></div>
      <p class="hint">Batas gratis per hari: {{ nf(QUOTA.read) }} baca, {{ nf(QUOTA.write) }} tulis, {{ nf(QUOTA.del) }} hapus. Bila habis, layanan berhenti sampai direset (tidak ada tagihan).</p>
    </section>
    <p class="note"><Info :size="15" /> Data dari Google Cloud Monitoring, sama dengan Firebase Console → Usage. <button class="link" @click="logoutGoogle">Keluar dari Google</button></p>
  </template>
</template>
