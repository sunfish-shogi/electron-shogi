<template>
  <div>
    <div class="full row controls">
      <button @click="store.changePly(0)">
        <Icon :icon="IconType.FIRST" />
      </button>
      <button @click="store.goBack()">
        <Icon :icon="IconType.BACK" />
      </button>
      <button @click="store.goForward()">
        <Icon :icon="IconType.NEXT" />
      </button>
      <button @click="store.changePly(Number.MAX_SAFE_INTEGER)">
        <Icon :icon="IconType.LAST" />
      </button>
      <button @click="store.removeCurrentMove()"><Icon :icon="IconType.DELETE" /></button>
      <button @click="isMobileMenuVisible = true">Menu</button>
    </div>
    <FileMenu v-if="isMobileMenuVisible" @close="isMobileMenuVisible = false" />
  </div>
</template>

<script setup lang="ts">
import { IconType } from "@/renderer/assets/icons";
import { useStore } from "@/renderer/store";
import Icon from "@/renderer/view/primitive/Icon.vue";
import FileMenu from "@/renderer/view/menu/FileMenu.vue";
import { ref } from "vue";

const store = useStore();
const isMobileMenuVisible = ref(false);
</script>

<style scoped>
.controls button {
  font-size: 100%;
  width: 100%;
  height: 100%;
}
.controls button .icon {
  height: 68%;
}
</style>
