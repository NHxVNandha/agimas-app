<script setup>
import InputText from "primevue/inputtext";
import InputNumber from "primevue/inputnumber";
import { MessageCircle, Bike, Package, ShoppingBag, Weight, Moon, CloudRain, Info } from "lucide-vue-next";
import { S } from "../state.js";
import SectionSave from "../SectionSave.vue";

const SVC = [["orang", "Agi Antar", "Antar penumpang", Bike, "blue"], ["barang", "Agi Kirim", "Kirim barang", Package, "orange"], ["beli", "Agi Beli", "Beli makanan & kebutuhan", ShoppingBag, "green"]];
const rupiah = { mode: "currency", currency: "IDR", locale: "id-ID", minFractionDigits: 0, min: 0 };
const km = { locale: "id-ID", minFractionDigits: 0, maxFractionDigits: 1, min: 0, suffix: " km" };
</script>

<template>
  <section class="card">
    <div class="card-head"><div class="head-ic"><i class="ic green"><MessageCircle :size="20" /></i><div><h3>Admin penerima pesanan</h3><small class="muted">Semua pesanan dari aplikasi dikirim ke WhatsApp ini</small></div></div></div>
    <div class="form-grid three">
      <div><label for="aName">Nama</label><InputText id="aName" v-model="S.data.admin.name" fluid /></div>
      <div><label for="aPhone">Nomor WhatsApp</label><InputText id="aPhone" v-model="S.data.admin.phone" inputmode="tel" placeholder="0812 3456 7890" fluid /></div>
      <div><label for="aHours">Jam layanan</label><InputText id="aHours" v-model="S.data.admin.hours" placeholder="Setiap hari, 24 jam" fluid /></div>
    </div>
    <SectionSave :paths="['admin']" />
  </section>

  <div class="grid3">
    <section v-for="s in SVC" :key="s[0]" class="card">
      <div class="head-ic"><i class="ic" :class="s[4]"><component :is="s[3]" :size="20" /></i><div><h3>{{ s[1] }}</h3><small class="muted">{{ s[2] }}</small></div></div>
      <label :for="'mf-' + s[0]">Tarif minimal</label><InputNumber :inputId="'mf-' + s[0]" v-model="S.data.tarif[s[0]].minFare" v-bind="rupiah" fluid />
      <label :for="'mk-' + s[0]">Untuk jarak sampai</label><InputNumber :inputId="'mk-' + s[0]" v-model="S.data.tarif[s[0]].minKm" v-bind="km" fluid />
      <label :for="'pk-' + s[0]">Per km berikutnya</label><InputNumber :inputId="'pk-' + s[0]" v-model="S.data.tarif[s[0]].perKm" v-bind="rupiah" fluid />
      <SectionSave :paths="['tarif.' + s[0]]" />
    </section>
  </div>

  <div class="grid2">
    <section class="card">
      <div class="head-ic"><i class="ic orange"><Weight :size="20" /></i><div><h3>Biaya berat</h3><small class="muted">Agi Kirim & Agi Beli</small></div></div>
      <template v-for="(w, i) in S.data.tarif.weights" :key="i">
        <label :for="'w-' + i">{{ w.label }}</label><InputNumber :inputId="'w-' + i" v-model="w.add" v-bind="rupiah" fluid />
      </template>
      <SectionSave :paths="['tarif.weights']" />
    </section>
    <section class="card">
      <div class="head-ic"><i class="ic purple"><Moon :size="20" /></i><div><h3>Tambahan & jasa</h3><small class="muted">Malam, hujan, jasa belanja</small></div></div>
      <label for="t-shop">Jasa belanja (Agi Beli)</label><InputNumber inputId="t-shop" v-model="S.data.tarif.shop" v-bind="rupiah" fluid />
      <div class="two">
        <div><label for="t-na">Malam: tambah</label><InputNumber inputId="t-na" v-model="S.data.tarif.night.add" v-bind="rupiah" fluid /></div>
        <div><label for="t-ne">setiap</label><InputNumber inputId="t-ne" v-model="S.data.tarif.night.every" v-bind="km" fluid /></div>
      </div>
      <label for="t-rain"><CloudRain :size="14" /> Hujan: per km</label><InputNumber inputId="t-rain" v-model="S.data.tarif.rain.perKm" v-bind="rupiah" fluid />
      <SectionSave :paths="['tarif.shop', 'tarif.night', 'tarif.rain']" />
    </section>
  </div>
  <p class="note"><Info :size="15" /> Tambahan malam (21.00–05.00) dihitung otomatis di aplikasi; tambahan hujan ditetapkan admin saat konfirmasi.</p>
</template>
