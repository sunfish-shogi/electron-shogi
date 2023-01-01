<template>
  <div>
    <dialog ref="dialog">
      <div ref="content">
        <div class="dialog-form-area">
          <div class="message">以下の棋譜(または局面)を取り込みます。</div>
          <div class="message">※KIF形式/CSA形式/SFENに対応しています。</div>
          <div v-if="!isNative" class="message">
            ※テキストエリアに棋譜を貼り付けてください。<br />
            ※インストールアプリ版では自動的に貼り付けられます。
          </div>
          <textarea ref="textarea" />
        </div>
      </div>
      <div class="dialog-main-buttons">
        <button
          data-hotkey="Enter"
          autofocus
          class="dialog-button"
          @click="onOk"
        >
          取り込む
        </button>
        <button class="dialog-button" data-hotkey="Escape" @click="onCancel">
          キャンセル
        </button>
      </div>
    </dialog>
  </div>
</template>

<script lang="ts">
import { showModalDialog } from "@/renderer/helpers/dialog.js";
import { isNative } from "@/renderer/ipc/api";
import {
  installHotKeyForDialog,
  uninstallHotKeyForDialog,
} from "@/renderer/keyboard/hotkey";
import { useStore } from "@/renderer/store";
import { defineComponent, onBeforeUnmount, onMounted, ref, Ref } from "vue";

export default defineComponent({
  name: "PasteDialog",
  setup() {
    const store = useStore();
    const dialog: Ref = ref(null);
    const textarea: Ref = ref(null);

    store.retainBussyState();
    onMounted(async () => {
      try {
        showModalDialog(dialog.value);
        installHotKeyForDialog(dialog.value);
        if (isNative()) {
          textarea.value.value = await navigator.clipboard.readText();
        }
      } finally {
        store.releaseBussyState();
      }
    });

    onBeforeUnmount(() => {
      uninstallHotKeyForDialog(dialog.value);
    });

    const onOk = () => {
      const data = textarea.value.value;
      if (!data) {
        store.pushError(new Error("棋譜が入力されていません。"));
        return;
      }
      store.closeModalDialog();
      store.pasteRecord(data);
    };

    const onCancel = () => {
      store.closeModalDialog();
    };

    return {
      dialog,
      textarea,
      onOk,
      onCancel,
      isNative: isNative(),
    };
  },
});
</script>

<style scoped>
.message {
  width: 460px;
  text-align: left;
  font-size: 0.8em;
}
textarea {
  width: 460px;
  height: 60vh;
  min-height: 100px;
  resize: none;
}
</style>
