<script setup>
import { ref, computed, onMounted } from "vue";
import Skeleton from "primevue/skeleton";
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import { Star, Trash2, RotateCcw, MessageSquareText } from "lucide-vue-next";
import { Store, token, fmtTime } from "../state.js";

const confirm = useConfirm(), toast = useToast();
const list = ref(null), err = ref(""), filter = ref(0);
const sum = computed(() => {
  const l = list.value || [], cnt = [0, 0, 0, 0, 0, 0];
  l.forEach((r) => cnt[r.stars]++);
  return { n: l.length, avg: l.length ? l.reduce((a, r) => a + r.stars, 0) / l.length : 0, cnt };
});
const shown = computed(() => (list.value || []).filter((r) => !filter.value || r.stars === filter.value));
const pct = (s) => (sum.value.n ? Math.round(sum.value.cnt[s] / sum.value.n * 100) : 0);

function load() {
  list.value = null; err.value = "";
  const t = token();
  if (!t) { err.value = "Sesi habis. Masuk lagi untuk melihat ulasan."; list.value = []; return; }
  Store.listReviews(t).then((l) => { list.value = l; }).catch((e) => {
    err.value = e.status === 403 ? "Belum bisa membaca ulasan: pasang aturan database terbaru (firestore.rules) di Firebase." : "Gagal memuat ulasan. Periksa koneksi.";
    list.value = [];
  });
}
function del(r) {
  confirm.require({
    message: "Hapus ulasan dari " + (r.name || "Anonim") + "? Ulasan langsung hilang dari aplikasi.", header: "Hapus ulasan",
    acceptLabel: "Hapus", rejectLabel: "Batal", acceptProps: { severity: "danger" }, rejectProps: { severity: "secondary", text: true },
    accept: () => Store.deleteReview(token(), r.id).then(() => { list.value = list.value.filter((x) => x !== r); toast.add({ severity: "success", summary: "Ulasan dihapus", life: 2500 }); })
      .catch(() => toast.add({ severity: "error", summary: "Gagal menghapus ulasan", life: 4000 }))
  });
}
onMounted(load);
</script>

<template>
  <section class="card revsum">
    <Skeleton v-if="list === null" width="100%" height="110px" />
    <p v-else-if="err" class="muted">{{ err }}</p>
    <div v-else-if="!sum.n" class="empty-state small"><MessageSquareText :size="28" /><p>Belum ada ulasan dari pelanggan.</p></div>
    <template v-else>
      <div class="revavg">
        <b>{{ sum.avg.toFixed(1).replace(".", ",") }}</b>
        <span class="stars"><Star v-for="i in 5" :key="i" :size="16" :fill="i <= Math.round(sum.avg) ? 'currentColor' : 'none'" /></span>
        <small class="muted">{{ sum.n }} ulasan</small>
      </div>
      <div class="revbars">
        <button v-for="s in [5, 4, 3, 2, 1]" :key="s" :class="{ on: filter === s }" @click="filter = filter === s ? 0 : s">
          <span>{{ s }} <Star :size="12" fill="currentColor" /></span><i><em :style="{ width: pct(s) + '%' }"></em></i><small>{{ pct(s) }}% · {{ sum.cnt[s] }}</small>
        </button>
      </div>
    </template>
  </section>

  <div class="page-actions">
    <p class="muted small grow">{{ filter ? "Menampilkan ulasan " + filter + " bintang · ketuk lagi untuk semua" : "Ketuk baris bintang untuk menyaring" }}</p>
    <button class="link" @click="load"><RotateCcw :size="15" /> Muat ulang</button>
  </div>

  <div class="grid2">
    <article v-for="r in shown" :key="r.id" class="card rev">
      <div class="list-row flat">
        <span class="avatar">{{ (r.name || "A").charAt(0).toUpperCase() }}</span>
        <div class="grow info"><b>{{ r.name || "Anonim" }}</b>
          <span class="stars sm"><Star v-for="i in 5" :key="i" :size="13" :fill="i <= r.stars ? 'currentColor' : 'none'" /></span></div>
        <time class="muted small">{{ fmtTime(r.at) }}</time>
        <button class="icon-btn danger" aria-label="Hapus ulasan" @click="del(r)"><Trash2 :size="17" /></button>
      </div>
      <p v-if="r.text" class="revtext">{{ r.text }}</p>
    </article>
  </div>
</template>
