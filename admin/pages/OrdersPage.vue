<script setup>
import { ref, computed, onMounted } from "vue";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import Skeleton from "primevue/skeleton";
import { useToast } from "primevue/usetoast";
import { Search, RotateCcw, ReceiptText, ChevronDown, CheckCheck } from "lucide-vue-next";
import { P, Store, token, fmtTime, rp, confirmOrder } from "../state.js";

const toast = useToast();

const N = 10;   // tiap buka halaman = 10 kali baca Firestore
const list = ref(null), err = ref(""), q = ref(""), found = ref(undefined), busy = ref(false), open = ref("");

// Layanan dibaca dari isi pesan ("saya mau pesan *Agi Beli* …"), urut seperti di aplikasi.
const ORDER = Object.values(P.SVC).map((x) => x.name);
const svcOf = (t) => ((/pesan \*([^*\n]+)\*/.exec(t) || [])[1] || "Lainnya").trim();
const pick = ref("");
const groups = computed(() => {
  const m = {};
  (list.value || []).forEach((x) => { const k = svcOf(x.text); (m[k] = m[k] || []).push(x); });
  const rank = (k) => (ORDER.indexOf(k) + 1 || 99);
  return Object.keys(m).sort((a, b) => rank(a) - rank(b)).map((k) => ({ k, items: m[k] }));
});
const shown = computed(() => groups.value.filter((g) => !pick.value || g.k === pick.value));

// Stok tahap 3: konfirmasi pesanan -> stok menu mitra berkurang otomatis
const doing = ref("");
async function confirmIt(x) {
  doing.value = x.code;
  try {
    const r = await confirmOrder(x);
    x.status = "ok";
    if (r.error) toast.add({ severity: "warn", summary: "Pesanan dikonfirmasi", detail: r.error, life: 9000 });
    else toast.add({ severity: "success", summary: "Pesanan " + x.code + " dikonfirmasi",
      detail: r.changes.length ? "Stok: " + r.changes.map((c) => c.name + " " + c.from + " → " + c.to).join(", ") : "", life: 6000 });
  } catch (e) {
    toast.add({ severity: "error", summary: "Gagal mengonfirmasi", life: 7000,
      detail: e.conflict ? "Pesanan ini sudah dikonfirmasi di perangkat lain. Tekan Muat ulang." : e.status === 403 ? "Pasang aturan database terbaru (firestore.rules)." : "Periksa koneksi lalu coba lagi." });
  } finally { doing.value = ""; }
}

function fail(e) {
  return e.status === 403 ? "Belum bisa membaca pesanan: pasang aturan database terbaru (firestore.rules) di Firebase." : "Gagal memuat. Periksa koneksi.";
}
function load() {
  list.value = null; err.value = "";
  const t = token();
  if (!t) { err.value = "Sesi habis. Masuk lagi."; list.value = []; return; }
  Store.listOrders(t, N).then((l) => { list.value = l; }).catch((e) => { err.value = fail(e); list.value = []; });
}
async function find() {
  const code = q.value.trim().toUpperCase().replace(/[^0-9A-Z]/g, "");
  if (!code) { found.value = undefined; return; }
  busy.value = true; err.value = "";
  try { found.value = await Store.getOrder(token(), code); if (found.value) open.value = found.value.code; }
  catch (e) { err.value = fail(e); found.value = undefined; }
  finally { busy.value = false; }
}
onMounted(load);
</script>

<template>
  <section class="card">
    <div class="card-head"><h3>Cari kode pesanan</h3></div>
    <p class="muted small">Kode ada di pesan WA pelanggan, misal <b>AG7K3QM</b>. Bandingkan harga di WA dengan pesan asli dari aplikasi di bawah ini.</p>
    <form class="order-find" @submit.prevent="find">
      <InputText v-model="q" placeholder="AG…" aria-label="Kode pesanan" maxlength="12" autocapitalize="characters" fluid />
      <Button type="submit" label="Cari" :loading="busy"><template #icon><Search :size="16" /></template></Button>
    </form>
    <p v-if="found === null" class="hint bad">Kode tidak ditemukan. Bisa jadi pesan diketik atau diubah sendiri, atau pelanggan sedang offline saat mengirim.</p>
    <article v-else-if="found" class="order open">
      <div class="order-top"><b>{{ found.code }}</b><span>{{ found.total ? rp(found.total) : "Harga ditawar" }}</span><i v-if="found.status === 'ok'" class="pill good">Dikonfirmasi</i><time class="muted small">{{ fmtTime(found.at) }}</time></div>
      <pre class="order-text">{{ found.text }}</pre>
      <div v-if="found.status !== 'ok'" class="order-act">
        <Button label="Konfirmasi pesanan" size="small" :loading="doing === found.code" @click="confirmIt(found)"><template #icon><CheckCheck :size="16" /></template></Button>
        <small v-if="found.mitra" class="muted">Stok menu mitra berkurang otomatis.</small>
      </div>
    </article>
  </section>

  <div class="page-actions">
    <p class="muted small grow">{{ N }} pesanan terbaru dari aplikasi</p>
    <button class="link" @click="load"><RotateCcw :size="15" /> Muat ulang</button>
  </div>
  <div v-if="groups.length > 1" class="chips" role="tablist" aria-label="Saring menurut layanan">
    <button :class="{ on: !pick }" @click="pick = ''">Semua <b>{{ list.length }}</b></button>
    <button v-for="g in groups" :key="g.k" :class="{ on: pick === g.k }" @click="pick = g.k">{{ g.k }} <b>{{ g.items.length }}</b></button>
  </div>

  <section class="card">
    <Skeleton v-if="list === null" width="100%" height="120px" />
    <p v-else-if="err" class="muted">{{ err }}</p>
    <div v-else-if="!list.length" class="empty-state small"><ReceiptText :size="28" /><p>Belum ada pesanan tercatat.</p></div>
    <template v-for="g in shown" :key="g.k">
      <h4 class="order-group">{{ g.k }} <small>{{ g.items.length }}</small></h4>
      <article v-for="x in g.items" :key="x.code" class="order" :class="{ open: open === x.code }">
        <button class="order-top" :aria-expanded="open === x.code" @click="open = open === x.code ? '' : x.code">
          <b>{{ x.code }}</b><span>{{ x.total ? rp(x.total) : "Harga ditawar" }}</span><i v-if="x.status === 'ok'" class="pill good">Dikonfirmasi</i><time class="muted small">{{ fmtTime(x.at) }}</time><ChevronDown :size="16" class="chev" />
        </button>
        <template v-if="open === x.code">
          <pre class="order-text">{{ x.text }}</pre>
          <div v-if="x.status !== 'ok'" class="order-act">
            <Button label="Konfirmasi pesanan" size="small" :loading="doing === x.code" @click="confirmIt(x)"><template #icon><CheckCheck :size="16" /></template></Button>
            <small v-if="x.mitra" class="muted">Stok menu mitra berkurang otomatis.</small>
          </div>
        </template>
      </article>
    </template>
  </section>
</template>
