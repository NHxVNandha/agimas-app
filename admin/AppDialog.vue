<script setup>
/* Dialog sederhana tanpa animasi (pengganti PrimeVue Dialog, yang bisa meninggalkan lapisan gelap
   bila ditutup saat animasi bukanya belum selesai). Tutup: tombol ×, Esc, atau ketuk latar. */
import { ref, watch, nextTick, onBeforeUnmount } from "vue";
import { X } from "lucide-vue-next";

const props = defineProps({ visible: Boolean, header: String });
const emit = defineEmits(["update:visible"]);
const box = ref(null);
const close = () => emit("update:visible", false);
function onKey(e) { if (e.key === "Escape") close(); }
watch(() => props.visible, async (v) => {
  document.body.style.overflow = v ? "hidden" : "";
  if (v) { addEventListener("keydown", onKey); await nextTick(); box.value?.querySelector("input, textarea, select")?.focus(); }
  else removeEventListener("keydown", onKey);
});
onBeforeUnmount(() => { document.body.style.overflow = ""; removeEventListener("keydown", onKey); });
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="adlg-mask" @mousedown.self="close">
      <div ref="box" class="adlg" role="dialog" aria-modal="true" :aria-label="header">
        <div class="adlg-head"><h3>{{ header }}</h3><button class="icon-btn" aria-label="Tutup" @click="close"><X :size="18" /></button></div>
        <div class="adlg-body"><slot /></div>
        <div class="adlg-foot"><slot name="footer" /></div>
      </div>
    </div>
  </Teleport>
</template>
