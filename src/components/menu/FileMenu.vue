<template>
  <div>
    <dialog ref="dialog" class="background">
      <div class="groups">
        <div class="group">
          <button class="button" @click="onClose">
            <ButtonIcon class="icon" :icon="Icon.CLOSE" />
            <div class="label">戻る</div>
          </button>
        </div>
        <div class="group">
          <button class="button" :disabled="!states.newFile" @click="onNewFile">
            <ButtonIcon class="icon" :icon="Icon.FILE" />
            <div class="label">初期化</div>
          </button>
          <button class="button" :disabled="!states.open" @click="onOpen">
            <ButtonIcon class="icon" :icon="Icon.OPEN" />
            <div class="label">開く</div>
          </button>
          <button class="button" :disabled="!states.saveAs" @click="onSave">
            <ButtonIcon class="icon" :icon="Icon.SAVE" />
            <div class="label">上書き保存</div>
          </button>
          <button class="button" :disabled="!states.save" @click="onSaveAs">
            <ButtonIcon class="icon" :icon="Icon.SAVE_AS" />
            <div class="label">保存</div>
          </button>
        </div>
        <div class="group">
          <button class="button" @click="onCopyKIF">
            <ButtonIcon class="icon" :icon="Icon.COPY" />
            <div class="label">コピー・KIF</div>
          </button>
          <button class="button" @click="onCopyCSA">
            <ButtonIcon class="icon" :icon="Icon.COPY" />
            <div class="label">コピー・CSA</div>
          </button>
          <button class="button" @click="onCopyUSI">
            <ButtonIcon class="icon" :icon="Icon.COPY" />
            <div class="label">コピー・USI</div>
          </button>
          <button class="button" @click="onCopySFEN">
            <ButtonIcon class="icon" :icon="Icon.COPY" />
            <div class="label">コピー・SFEN</div>
          </button>
          <button class="button" :disabled="!states.paste" @click="onPaste">
            <ButtonIcon class="icon" :icon="Icon.PASTE" />
            <div class="label">貼り付け</div>
          </button>
        </div>
      </div>
    </dialog>
  </div>
</template>

<script lang="ts">
import { showModalDialog } from "@/helpers/dialog";
import { computed, defineComponent, onMounted, ref, Ref } from "vue";
import ButtonIcon from "@/components/primitive/ButtonIcon.vue";
import { Icon } from "@/assets/icons";
import { useStore } from "@/store";
import { AppState } from "@/store/state";

export default defineComponent({
  name: "FileMenu",
  components: {
    ButtonIcon,
  },
  emits: ["close"],
  setup(_, context) {
    const store = useStore();
    const dialog: Ref = ref(null);
    onMounted(() => {
      showModalDialog(dialog.value);
    });
    const onClose = () => {
      context.emit("close");
    };
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

<style scoped>
dialog.background {
  border-style: none;
  background-color: transparent;
}
.groups {
  width: 80%;
  margin: auto;
  display: flex;
  flex-direction: column;
}
.group {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  margin: 10px 0px 10px 0px;
}
.button {
  width: 150px;
  margin: 5px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 5px 5px 5px darkgray;
}
.icon {
  height: 36px;
  width: 36px;
  display: block;
}
.label {
  display: block;
  font-size: 14px;
  margin-top: 0.5em;
}
</style>
