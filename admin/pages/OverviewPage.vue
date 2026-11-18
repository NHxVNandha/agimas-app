<script setup>
import { ref, computed, onMounted } from "vue";
import { Users, Store, Star, Wallet, ChevronRight, PackageX, CircleCheck } from "lucide-vue-next";
import { S, P, Store as FB, token, rp, phoneTxt, initial } from "../state.js";

const emit = defineEmits(["go"]);
const D = computed(() => S.data);
const drivers = computed(() => {
  const c = { aktif: 0, istirahat: 0, offline: 0 };
  D.value.drivers.forEach((d) => { c[d.status] = (c[d.status] || 0) + 1; });
  return c;
});
// Menu yang habis atau tinggal sedikit (≤ 5), dari semua mitra
const lowStock = computed(() => {
  const out = [];
  D.value.mitra.forEach((mt) => mt.menu.forEach((m) => {
    if (P.soldOut(m)) out.push({ mitra: mt.name, name: m.name, label: "Habis", c: "bad" });
    else if (m.stock != null && m.stock <= 5) out.push({ mitra: mt.name, name: m.name, label: "Sisa " + m.stock, c: "warn" });
  }));
  return out;
});
const shown = computed(() => D.value.mitra.filter((m) => m.active).length);
const rating = ref(null);
const ST = { aktif: "Aktif", istirahat: "Istirahat", offline: "Tidak narik" };
onMounted(() => {
  const t = token();
  if (t) FB.listReviews(t).then((l) => {
    rating.value = l.length ? { avg: (l.reduce((a, r) => a + r.stars, 0) / l.length).toFixed(1).replace(".", ","), n: l.length } : { avg: "–", n: 0 };
  }).catch(() => { rating.value = { avg: "–", n: 0, err: true }; });
});
</script>

<template>
  <div class="stats">
    <button class="card stat" @click="emit('go', 'driver')">
      <div class="stat-top"><span>Driver aktif</span><i class="ic green"><Users :size="20" /></i></div>
      <b>{{ drivers.aktif }}<small> / {{ D.drivers.length }}</small></b>
      <p><span class="up">{{ drivers.istirahat }}</span> istirahat · {{ drivers.offline }} tidak narik</p>
    </button>
    <button class="card stat" @click="emit('go', 'mitra')">
      <div class="stat-top"><span>Mitra tampil</span><i class="ic orange"><Store :size="20" /></i></div>
      <b>{{ shown }}<small> / {{ D.mitra.length }}</small></b>
      <p>{{ lowStock.length ? lowStock.length + " menu perlu dicek" : "Stok aman" }}</p>
    </button>
    <button class="card stat" @click="emit('go', 'ulasan')">
      <div class="stat-top"><span>Rating</span><i class="ic yellow"><Star :size="20" /></i></div>
      <b>{{ rating ? rating.avg : "…" }}</b>
      <p>{{ rating ? (rating.err ? "Belum bisa dimuat" : rating.n + " ulasan") : "Memuat…" }}</p>
    </button>
    <button class="card stat" @click="emit('go', 'pengaturan')">
      <div class="stat-top"><span>Agi Antar mulai</span><i class="ic blue"><Wallet :size="20" /></i></div>
      <b class="sm">{{ rp(D.tarif.orang.minFare) }}</b>
      <p>Admin {{ phoneTxt(D.admin.phone) }}</p>
    </button>
  </div>

  <div class="cols">
    <section class="card">
      <div class="card-head"><h3>Stok perlu dicek</h3><button class="link" @click="emit('go', 'mitra')">Atur stok <ChevronRight :size="16" /></button></div>
      <div v-if="!lowStock.length" class="empty-state small"><CircleCheck :size="28" /><p>Tidak ada menu yang habis atau hampir habis.</p></div>
      <div v-for="(m, i) in lowStock" :key="i" class="list-row">
        <i class="ic sm" :class="m.c === 'bad' ? 'red' : 'orange'"><PackageX :size="17" /></i>
        <div class="grow info"><b>{{ m.name }}</b><small>{{ m.mitra }}</small></div>
        <span class="pill" :class="m.c">{{ m.label }}</span>
      </div>
    </section>

    <section class="card">
      <div class="card-head"><h3>Driver hari ini</h3><button class="link" @click="emit('go', 'driver')">Ubah status <ChevronRight :size="16" /></button></div>
      <div v-for="d in D.drivers" :key="d.id" class="list-row">
        <span class="avatar" :class="'st-' + d.status">{{ initial(d.name) }}</span>
        <div class="grow info"><b>{{ d.name || "(tanpa nama)" }}</b><small>{{ d.area || "area belum diisi" }}</small></div>
        <span class="pill" :class="{ aktif: 'good', istirahat: 'warn', offline: 'muted' }[d.status]">{{ ST[d.status] }}</span>
      </div>
    </section>
  </div>
</template>
