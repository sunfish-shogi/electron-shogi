<template>
  <div>
    <dialog ref="dialog" class="confirm">
      <div class="message-box">
        <Icon :icon="IconType.QUESTION" />
        <div class="message">{{ store.confirmation }}</div>
      </div>
      <div class="main-buttons">
        <button data-hotkey="Enter" autofocus @click="onOk()">OK</button>
        <button data-hotkey="Escape" @click="onClose()">
          {{ t.cancel }}
        </button>
      </div>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { t } from "@/common/i18n";
import { showModalDialog } from "@/renderer/helpers/dialog.js";
import { onBeforeUnmount, onMounted, ref } from "vue";
import Icon from "@/renderer/view/primitive/Icon.vue";
import { useStore } from "@/renderer/store";
import { IconType } from "@/renderer/assets/icons";
import {
  installHotKeyForDialog,
  uninstallHotKeyForDialog,
} from "@/renderer/keyboard/hotkey";

const store = useStore();
const dialog = ref();

const onOk = () => {
  store.confirmationOk();
};

const onClose = () => {
  store.confirmationCancel();
};

onMounted(() => {
  showModalDialog(dialog.value, onClose);
  installHotKeyForDialog(dialog.value);
});

onBeforeUnmount(() => {
  uninstallHotKeyForDialog(dialog.value);
});
</script>

<style scoped>
dialog.confirm {
  color: var(--info-dialog-color);
  background-color: var(--info-dialog-bg-color);
  border: 3px solid var(--info-dialog-border-color);
}
</style>
