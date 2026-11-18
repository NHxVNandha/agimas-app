<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import Button from "primevue/button";
import Toast from "primevue/toast";
import ConfirmDialog from "primevue/confirmdialog";
import ProgressSpinner from "primevue/progressspinner";
import { useToast } from "primevue/usetoast";
import { LayoutDashboard, Users, Store, Star, ReceiptText, SlidersHorizontal, Gauge, LogOut, CloudCheck, CloudUpload, CircleAlert, Check, LoaderCircle } from "lucide-vue-next";
import { S, dirty, boot, logout, fmtTime, initial } from "./state.js";
import LoginView from "./pages/LoginView.vue";
import OverviewPage from "./pages/OverviewPage.vue";
import DriversPage from "./pages/DriversPage.vue";
import MitraPage from "./pages/MitraPage.vue";
import ReviewsPage from "./pages/ReviewsPage.vue";
import OrdersPage from "./pages/OrdersPage.vue";
import SettingsPage from "./pages/SettingsPage.vue";
import UsagePage from "./pages/UsagePage.vue";

// Gaya mengikuti template Sakai (PrimeVue, MIT): sidebar putih berkelompok, bilah atas, kartu lembut.
const PAGES = [
  { id: "ringkasan", group: "Utama", label: "Ringkasan", icon: LayoutDashboard, comp: OverviewPage, desc: "Kondisi layanan hari ini" },
  { id: "driver", group: "Operasional", label: "Driver", icon: Users, comp: DriversPage, desc: "Status harian & area driver" },
  { id: "mitra", group: "Operasional", label: "Mitra & Menu", short: "Mitra", icon: Store, comp: MitraPage, desc: "Menu, harga, dan stok mitra" },
  { id: "pesanan", group: "Pelanggan", label: "Cek Pesanan", short: "Pesanan", icon: ReceiptText, comp: OrdersPage, desc: "Cocokkan pesan WA dengan yang dikirim aplikasi" },
  { id: "ulasan", group: "Pelanggan", label: "Ulasan", icon: Star, comp: ReviewsPage, desc: "Rating, kritik & saran" },
  { id: "pengaturan", group: "Pengaturan", label: "Tarif & Admin", short: "Tarif", icon: SlidersHorizontal, comp: SettingsPage, desc: "Nomor admin & tarif layanan" },
  { id: "pemakaian", group: "Pengaturan", label: "Pemakaian Firebase", short: "Kuota", icon: Gauge, comp: UsagePage, desc: "Kuota gratis Firestore hari ini & 7 hari terakhir" }
];
// Pegawai mitra hanya melihat halaman Mitra & Menu (miliknya sendiri).
const pages = computed(() => (S.staff ? PAGES.filter((p) => p.id === "mitra") : PAGES));
const groups = computed(() => [...new Set(pages.value.map((p) => p.group))]);
const toast = useToast();
const page = ref(fromHash());
watch(() => S.staff, () => { page.value = fromHash(); });   // peran diketahui setelah masuk
function fromHash() { const h = location.hash.slice(1); return pages.value.some((p) => p.id === h) ? h : pages.value[0].id; }
function go(id) { if (location.hash.slice(1) !== id) location.hash = id; page.value = id; scrollTo(0, 0); }
const current = computed(() => pages.value.find((p) => p.id === page.value) || pages.value[0]);

const sync = computed(() => {
  if (S.saving) return { cls: "dirty", icon: LoaderCircle, title: S.progress || "Menyimpan…", spin: true };
  if (dirty.value) return { cls: "dirty", icon: CloudUpload, title: "Belum disimpan", sub: "Tekan Simpan di bagian yang diubah" };
  if (S.online) return { cls: "ok", icon: CloudCheck, title: "Tersinkron", sub: S.savedAt ? fmtTime(S.savedAt) : "" };
  return { cls: "warn", icon: CircleAlert, title: "Belum pernah disimpan", sub: "Tekan Simpan sekali" };
});

function onLogout() { if (dirty.value && !confirm("Ada perubahan yang belum disimpan. Tetap keluar?")) return; logout(); }

function onHash() { page.value = fromHash(); }
function onLeave(e) { if (dirty.value) { e.preventDefault(); e.returnValue = ""; } }
onMounted(() => { boot(); addEventListener("hashchange", onHash); addEventListener("beforeunload", onLeave); });
onBeforeUnmount(() => { removeEventListener("hashchange", onHash); removeEventListener("beforeunload", onLeave); });
</script>

<template>
  <Toast position="top-center" />
  <ConfirmDialog />

  <div v-if="S.view === 'loading'" class="center-screen"><ProgressSpinner style="width:40px;height:40px" strokeWidth="5" /></div>
  <div v-else-if="S.view === 'notSet'" class="center-screen">
    <div class="card narrow"><h2>Firebase belum disetel</h2><p class="muted">Isi <code>config.js</code> dan pasang <code>firestore.rules</code> (lihat README).</p></div>
  </div>
  <LoginView v-else-if="S.view === 'login'" />

  <div v-else class="layout">
    <aside class="sidebar">
      <div class="logo"><img src="/logo.png" alt="Agimas"><span>Admin</span></div>
      <nav>
        <template v-for="g in groups" :key="g">
          <p class="menu-label">{{ g }}</p>
          <a v-for="p in pages.filter((x) => x.group === g)" :key="p.id" :href="'#' + p.id" class="menu-item" :class="{ active: page === p.id }" @click.prevent="go(p.id)">
            <component :is="p.icon" :size="18" :stroke-width="1.9" />{{ p.label }}
          </a>
        </template>
      </nav>
      <div class="profile">
        <span class="avatar">{{ initial(S.email) }}</span>
        <div class="grow"><b>{{ S.staff ? "Pegawai mitra" : "Admin" }}</b><small :title="S.email">{{ S.email }}</small></div>
        <button class="icon-btn" title="Keluar" aria-label="Keluar" @click="onLogout"><LogOut :size="18" /></button>
      </div>
    </aside>

    <div class="main">
      <header class="topbar">
        <img class="m-logo" src="/logo.png" alt="Agimas">
        <div class="title grow">
          <h1>{{ current.label }}</h1>
          <p>{{ current.desc }}</p>
        </div>
        <span class="sync-pill" :class="sync.cls" role="status" :title="sync.sub">
          <component :is="sync.icon" :size="16" :class="{ spin: sync.spin }" /><span class="sync-txt">{{ sync.title }}</span>
        </span>
        <button class="icon-btn m-only" aria-label="Keluar" @click="onLogout"><LogOut :size="20" /></button>
      </header>

      <main class="content">
        <component :is="current.comp" @go="go" />
      </main>
    </div>

    <nav class="bottom-nav" aria-label="Menu admin">
      <a v-for="p in pages" :key="p.id" :href="'#' + p.id" :class="{ active: page === p.id }" @click.prevent="go(p.id)">
        <component :is="p.icon" :size="21" :stroke-width="1.9" /><span>{{ p.short || p.label }}</span>
      </a>
    </nav>
  </div>
</template>
