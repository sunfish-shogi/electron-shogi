<template>
  <div>
    <dialog ref="dialog">
      <div ref="content">
        <div class="dialog-form-area">
          <div class="message">以下の棋譜を取り込みます。</div>
          <div v-if="!isNative" class="message">
            ※テキストエリアに棋譜を貼り付けてください。<br />
            ※インストールアプリ版では自動的に貼り付けられます。
          </div>
          <textarea ref="textarea" />
        </div>
      </div>
      <div class="dialog-main-buttons">
        <button class="dialog-button" @click="onOk">取り込む</button>
        <button class="dialog-button" @click="onCancel">キャンセル</button>
      </div>
    </dialog>
  </div>
</template>

<script lang="ts">
import { showModalDialog } from "@/helpers/dialog";
import { isNative } from "@/ipc/renderer";
import { useStore } from "@/store";
import { defineComponent, onMounted, ref, Ref } from "vue";

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
        if (isNative()) {
          textarea.value.value = await navigator.clipboard.readText();
        }
      } finally {
        store.releaseBussyState();
      }
    });

    const onOk = () => {
      const data = textarea.value.value;
      store.closePasteDialog();
      if (data) {
        store.pasteRecord(data);
      }
    };

    const onCancel = () => {
      store.closePasteDialog();
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
  width: 400px;
  text-align: left;
  font-size: 0.8rem;
}
textarea {
  width: 400px;
  height: 50vh;
  min-height: 100px;
  resize: none;
}
</style>
