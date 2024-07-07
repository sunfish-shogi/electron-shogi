<template>
  <div class="root full" :class="appSettings.thema">
    <CommandHistory class="history" />
    <CommandInput class="input" />
  </div>
</template>

<script setup lang="ts">
import { useAppSettings } from "@/renderer/store/settings";
import CommandInput from "./CommandInput.vue";
import CommandHistory from "./CommandHistory.vue";

const appSettings = useAppSettings();
</script>

<style scoped>
.root {
  height: 100vh;
  width: 100vw;
  padding: 4px 4px;
  box-sizing: border-box;
  color: var(--main-color);
  background-color: var(--main-bg-color);
}
.history {
  height: calc(100% - 48px);
}
.input {
  height: 48px;
}
</style>
