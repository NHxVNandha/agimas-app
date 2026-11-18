<script setup>
import { ref, computed, reactive } from "vue";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import AppDialog from "../AppDialog.vue";
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import { MapPin, Plus, Pencil, Trash2, CircleCheck, Info } from "lucide-vue-next";
import { S, uid, initial, saveAndTell } from "../state.js";

const confirm = useConfirm(), toast = useToast();
function setStatus(d, v) { if (d.status === v || S.saving) return; d.status = v; saveAndTell(toast, true); }   // langsung tersimpan
const STATUS = [{ v: "aktif", l: "Aktif" }, { v: "istirahat", l: "Istirahat" }, { v: "offline", l: "Tidak narik" }];
const filter = ref("semua");
const count = (v) => S.data.drivers.filter((d) => d.status === v).length;
const list = computed(() => S.data.drivers.filter((d) => filter.value === "semua" || d.status === filter.value));

function geo(d) {
  if (d.lat != null && d.geoArea === (d.area || "").trim()) return { ok: true, t: d.geoPlace || d.area };
  return { ok: false, t: d.area ? "lokasi dicari saat disimpan" : "area belum diisi" };
}

// Ubah/tambah lewat dialog (draf; diterapkan saat "Terapkan")
const dlg = reactive({ show: false, item: null, name: "", area: "" });
function edit(d) { Object.assign(dlg, { show: true, item: d, name: d ? d.name : "", area: d ? d.area : "" }); }
function apply() {
  if (!dlg.name.trim()) return;
  if (dlg.item) Object.assign(dlg.item, { name: dlg.name, area: dlg.area });
  else S.data.drivers.push({ id: uid("d"), name: dlg.name, area: dlg.area, status: "aktif" });
  dlg.show = false;
  saveAndTell(toast);
}
function del(d) {
  confirm.require({
    message: "Hapus " + (d.name || "driver ini") + "?", header: "Hapus driver",
    acceptLabel: "Hapus", rejectLabel: "Batal", acceptProps: { severity: "danger" }, rejectProps: { severity: "secondary", text: true },
    accept: () => { S.data.drivers.splice(S.data.drivers.indexOf(d), 1); dlg.show = false; saveAndTell(toast); }
  });
}
</script>

<template>
  <div class="page-actions">
    <div class="chips" role="tablist">
      <button :class="{ on: filter === 'semua' }" @click="filter = 'semua'">Semua <b>{{ S.data.drivers.length }}</b></button>
      <button v-for="s in STATUS" :key="s.v" :class="['st-' + s.v, { on: filter === s.v }]" @click="filter = s.v"><i class="dot"></i>{{ s.l }} <b>{{ count(s.v) }}</b></button>
    </div>
    <Button label="Tambah driver" @click="edit(null)"><template #icon><Plus :size="17" /></template></Button>
  </div>

  <div class="card list">
    <div v-for="d in list" :key="d.id" class="list-row driver" :class="'st-' + d.status">
      <span class="avatar lg" :class="'st-' + d.status">{{ initial(d.name) }}</span>
      <div class="grow info">
        <b>{{ d.name || "(tanpa nama)" }}</b>
        <small :class="{ ok: geo(d).ok }"><MapPin :size="13" /> {{ d.area || "—" }}<template v-if="!geo(d).ok"> · {{ geo(d).t }}</template></small>
      </div>
      <div class="seg" role="group" :aria-label="'Status ' + d.name">
        <button v-for="s in STATUS" :key="s.v" :class="['st-' + s.v, { on: d.status === s.v }]" :aria-pressed="d.status === s.v" :disabled="S.saving" @click="setStatus(d, s.v)">{{ s.l }}</button>
      </div>
      <button class="icon-btn" :aria-label="'Ubah ' + d.name" @click="edit(d)"><Pencil :size="17" /></button>
    </div>
    <p v-if="!list.length" class="empty">Tidak ada driver{{ filter === "semua" ? "" : " dengan status ini" }}.</p>
  </div>
  <p class="note"><Info :size="15" /> Ubah status setiap hari. Pelanggan dicarikan driver <b>Aktif</b> terdekat dari area driver.</p>

  <AppDialog v-model:visible="dlg.show" :header="dlg.item ? 'Ubah driver' : 'Tambah driver'">
    <label for="dName">Nama</label>
    <InputText id="dName" v-model="dlg.name" placeholder="Misal: Mas Plencing 8" fluid autofocus />
    <label for="dArea">Area (desa/kelurahan)</label>
    <InputText id="dArea" v-model="dlg.area" placeholder="Misal: Banjarejo, Taman" fluid />
    <p class="hint">Jika lokasi salah tempat, tambahkan kecamatan. Lokasi dicari otomatis saat Simpan.</p>
    <template #footer>
      <Button v-if="dlg.item" label="Hapus" severity="danger" text class="mr-auto" @click="del(dlg.item)"><template #icon><Trash2 :size="16" /></template></Button>
      <Button label="Batal" severity="secondary" text @click="dlg.show = false" />
      <Button :label="dlg.item ? 'Simpan' : 'Tambahkan'" :loading="S.saving" :disabled="!dlg.name.trim() || S.saving" @click="apply" />
    </template>
  </AppDialog>
</template>
