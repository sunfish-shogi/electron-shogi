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
import { isNative } from "@/renderer/ipc/api";
import { useErrorStore } from "@/renderer/store/error";
import { useBusyState } from "@/renderer/store/busy";

const store = useStore();
const busyState = useBusyState();
const dialog = ref();
const input = ref();
const localStorageLastURLKey = "LoadRemoteFileDialog.lastURL";

busyState.retain();
onMounted(async () => {
  try {
    showModalDialog(dialog.value);
    installHotKeyForDialog(dialog.value);
    input.value.focus();
    input.value.value = localStorage.getItem(localStorageLastURLKey);
    if (!isNative()) {
      return;
    }
    const copied = (await navigator.clipboard.readText()).trim();
    if (copied && copied.match(/^https?:\/\//)) {
      input.value.value = copied;
    }
  } finally {
    busyState.release();
  }
});

onBeforeUnmount(() => {
  uninstallHotKeyForDialog(dialog.value);
});

const onOK = () => {
  const url = input.value?.value.trim();
  if (!url) {
    useErrorStore().add("URL is required.");
    return;
  }
  localStorage.setItem(localStorageLastURLKey, url);
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
