<script setup>
import { ref } from "vue";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Password from "primevue/password";
import Message from "primevue/message";
import { LogIn } from "lucide-vue-next";
import { S, login } from "../state.js";

const email = ref(S.email || ""), pass = ref(""), busy = ref(false);
async function submit() {
  busy.value = true;
  await login(email.value.trim(), pass.value);
  pass.value = ""; busy.value = false;
}
</script>

<template>
  <div class="login-wrap">
    <div class="login-art">
      <img src="/logo.png" alt="Agimas">
      <h1>Panel Admin<br>Agi Mas</h1>
      <p>Kelola driver, mitra & menu, tarif, dan ulasan. Perubahan langsung tampil di aplikasi pelanggan.</p>
    </div>
    <form class="card login" @submit.prevent="submit">
      <h2>Masuk</h2>
      <p class="muted small">Gunakan akun admin yang terdaftar di Firebase.</p>
      <label for="email">Email admin</label>
      <InputText id="email" v-model="email" type="email" autocomplete="username" required fluid />
      <label for="pass">Kata sandi</label>
      <Password inputId="pass" v-model="pass" :feedback="false" toggleMask :inputProps="{ autocomplete: 'current-password', required: true }" fluid />
      <Message v-if="S.loginMsg" severity="error" size="small" variant="simple">{{ S.loginMsg }}</Message>
      <Button type="submit" label="Masuk" :loading="busy" fluid><template #icon><LogIn :size="17" /></template></Button>
    </form>
  </div>
</template>
