<template>
  <div>
    <dialog ref="dialog" class="root">
      <div class="title">{{ t.loadRecordFromWeb }}</div>
      <div class="form-group">
        <div class="form-item">
          <input ref="input" class="url" type="text" placeholder="URL" />
        </div>
        <div class="note">{{ t.supportsKIF_KI2_CSA_USI_SFEN_JKF }}</div>
        <div class="note">{{ t.pleaseSpecifyPlainTextURL }}</div>
        <div class="note">{{ t.redirectNotSupported }}</div>
      </div>
      <div class="main-buttons">
        <button data-hotkey="Enter" autofocus @click="onOK()">
          {{ t.ok }}
        </button>
        <button data-hotkey="Escape" @click="onCancel()">
          {{ t.cancel }}
        </button>
      </div>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { t } from "@/common/i18n";
import { onBeforeUnmount, onMounted, ref } from "vue";
import { showModalDialog } from "@/renderer/helpers/dialog";
import { installHotKeyForDialog, uninstallHotKeyForDialog } from "@/renderer/devices/hotkey";
import { useStore } from "@/renderer/store";

const store = useStore();
const dialog = ref();
const input = ref();

onMounted(async () => {
  showModalDialog(dialog.value);
  installHotKeyForDialog(dialog.value);
  input.value.focus();
});

onBeforeUnmount(() => {
  uninstallHotKeyForDialog(dialog.value);
});

const onOK = () => {
  const url = input.value?.value.trim();
  if (!url) {
    store.pushError("URL is required.");
    return;
  }
  store.closeModalDialog();
  store.loadRemoteRecordFile(url);
};

const onCancel = () => {
  store.closeModalDialog();
};
</script>

<style scoped>
.root {
  width: 600px;
  max-width: calc(100vw - 50px);
}
.url {
  width: calc(100% - 20px);
}
</style>
