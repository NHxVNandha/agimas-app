import { createApp } from "vue";
import PrimeVue from "primevue/config";
import ConfirmationService from "primevue/confirmationservice";
import ToastService from "primevue/toastservice";
import Aura from "@primeuix/themes/aura";
import { definePreset } from "@primeuix/themes";
import "primeicons/primeicons.css";
import "./admin.css";
import App from "./App.vue";

// Tema PrimeVue "Aura" dengan warna utama biru Agimas (#1e7be6).
const Agimas = definePreset(Aura, {
  semantic: {
    primary: {
      50: "#eef6fe", 100: "#d9eafc", 200: "#b6d6fa", 300: "#84bbf6", 400: "#4f9bf0", 500: "#1e7be6",
      600: "#1766c4", 700: "#14529f", 800: "#134683", 900: "#133b6b", 950: "#0b2545"
    }
  }
});

createApp(App)
  .use(PrimeVue, { theme: { preset: Agimas, options: { darkModeSelector: ".agimas-gelap" } } })
  .use(ConfirmationService)
  .use(ToastService)
  .mount("#app");
