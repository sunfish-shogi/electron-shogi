<template>
  <div>
    <dialog ref="dialog" class="menu">
      <div class="groups">
        <div class="group">
          <button class="close" @click="onClose">
            <ButtonIcon class="icon" :icon="Icon.CLOSE" />
            <div class="label">戻る</div>
          </button>
        </div>
        <div class="group">
          <button :disabled="!states.newFile" @click="onNewFile">
            <ButtonIcon class="icon" :icon="Icon.FILE" />
            <div class="label">初期化</div>
          </button>
          <button :disabled="!states.open" @click="onOpen">
            <ButtonIcon class="icon" :icon="Icon.OPEN" />
            <div class="label">開く</div>
          </button>
          <button :disabled="!states.saveAs" @click="onSave">
            <ButtonIcon class="icon" :icon="Icon.SAVE" />
            <div class="label">上書き保存</div>
          </button>
          <button :disabled="!states.save" @click="onSaveAs">
            <ButtonIcon class="icon" :icon="Icon.SAVE_AS" />
            <div class="label">保存</div>
          </button>
        </div>
        <div class="group">
          <button @click="onCopyKIF">
            <ButtonIcon class="icon" :icon="Icon.COPY" />
            <div class="label">コピー・KIF</div>
          </button>
          <button @click="onCopyCSA">
            <ButtonIcon class="icon" :icon="Icon.COPY" />
            <div class="label">コピー・CSA</div>
          </button>
          <button @click="onCopyUSI">
            <ButtonIcon class="icon" :icon="Icon.COPY" />
            <div class="label">コピー・USI</div>
          </button>
          <button @click="onCopySFEN">
            <ButtonIcon class="icon" :icon="Icon.COPY" />
            <div class="label">コピー・SFEN</div>
          </button>
          <button :disabled="!states.paste" @click="onPaste">
            <ButtonIcon class="icon" :icon="Icon.PASTE" />
            <div class="label">貼り付け</div>
          </button>
        </div>
      </div>
    </dialog>
  </div>
</template>

<script lang="ts">
import { showModalDialog } from "@/renderer/helpers/dialog.js";
import { computed, defineComponent, onMounted, ref, Ref } from "vue";
import ButtonIcon from "@/renderer/view/primitive/ButtonIcon.vue";
import { Icon } from "@/renderer/assets/icons";
import { useStore } from "@/renderer/store";
import { AppState } from "@/common/control/state.js";

export default defineComponent({
  name: "FileMenu",
  components: {
    ButtonIcon,
  },
  emits: ["close"],
  setup(_, context) {
    const store = useStore();
    const dialog: Ref = ref(null);
    const onClose = () => {
      context.emit("close");
    };
    onMounted(() => {
      showModalDialog(dialog.value, onClose);
    });
    const onNewFile = () => {
      store.resetRecord();
      context.emit("close");
    };
    const onOpen = () => {
      store.openRecord();
      context.emit("close");
    };
    const onSave = () => {
      store.saveRecord({ overwrite: true });
      context.emit("close");
    };
    const onSaveAs = () => {
      store.saveRecord();
      context.emit("close");
    };
    const onCopyKIF = () => {
      store.copyRecordKIF();
      context.emit("close");
    };
    const onCopyCSA = () => {
      store.copyRecordCSA();
      context.emit("close");
    };
    const onCopyUSI = () => {
      store.copyRecordUSIAll();
      context.emit("close");
    };
    const onCopySFEN = () => {
      store.copyBoardSFEN();
      context.emit("close");
    };
    const onPaste = () => {
      store.showPasteDialog();
      context.emit("close");
    };
    const states = computed(() => {
      return {
        newFile: store.appState === AppState.NORMAL,
        open: store.appState === AppState.NORMAL,
        save: store.appState === AppState.NORMAL,
        saveAs: store.appState === AppState.NORMAL,
        paste: store.appState === AppState.NORMAL,
      };
    });
    return {
      dialog,
      Icon,
      onClose,
      onNewFile,
      onOpen,
      onSave,
      onSaveAs,
      onCopyKIF,
      onCopyCSA,
      onCopyUSI,
      onCopySFEN,
      onPaste,
      states,
    };
  },
});
</script>
