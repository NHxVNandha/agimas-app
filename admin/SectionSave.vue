<script setup>
/* Tombol Batal/Simpan milik satu bagian (kartu) halaman. Muncul hanya bila isi bagian itu berubah. */
import Button from "primevue/button";
import { useToast } from "primevue/usetoast";
import { S, changed, revertPaths, saveAndTell } from "./state.js";

defineProps({ paths: { type: Array, required: true } });   // jalur data bagian ini, misal ["admin"], ["tarif.orang"]
const toast = useToast();
</script>

<template>
  <div v-if="changed(paths)" class="sect-save" role="region" aria-label="Simpan perubahan bagian ini">
    <span class="grow">Belum disimpan</span>
    <Button label="Batal" severity="secondary" text size="small" :disabled="S.saving" @click="revertPaths(paths)" />
    <Button label="Simpan" size="small" :loading="S.saving" @click="saveAndTell(toast)" />
  </div>
</template>
