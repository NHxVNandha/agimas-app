import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// Panel admin (Vue 3 + PrimeVue). Dibangun ke dist-admin/, lalu tools/build-site.js menyalinnya ke dist/admin/.
// Aplikasi pelanggan (web/) tidak memakai build ini, jadi APK tidak ikut membesar.
export default defineConfig({
  root: "admin",
  base: "/admin/",
  // Gambar/berkas di akar situs (/logo.png dll.) dipakai apa adanya, tidak dibundel.
  plugins: [vue({ template: { transformAssetUrls: { includeAbsolute: false } } })],
  build: { outDir: "../dist-admin", emptyOutDir: true, chunkSizeWarningLimit: 1500 }
});
