<template>
  <div>
    <dialog ref="dialog" class="menu">
      <div class="groups">
        <div class="group">
          <button class="close" @click="onClose">
            <Icon :icon="IconType.CLOSE" />
            <div class="label">{{ t.back }}</div>
          </button>
        </div>
        <div class="group">
          <button :disabled="!states.newFile" @click="onNewFile">
            <Icon :icon="IconType.FILE" />
            <div class="label">{{ t.clear }}</div>
          </button>
          <button :disabled="!states.open" @click="onOpen">
            <Icon :icon="IconType.OPEN" />
            <div class="label">{{ t.open }}</div>
          </button>
          <button :disabled="!states.save" @click="onSave">
            <Icon :icon="IconType.SAVE" />
            <div class="label">{{ t.saveOverwrite }}</div>
          </button>
          <button :disabled="!states.saveAs" @click="onSaveAs">
            <Icon :icon="IconType.SAVE_AS" />
            <div class="label">{{ t.saveAs }}</div>
          </button>
          <button :disabled="!states.exportImage" @click="onExportImage">
            <Icon :icon="IconType.GRID" />
            <div class="label">{{ t.positionImage }}</div>
          </button>
        </div>
        <div class="group">
          <button @click="onCopyKIF">
            <Icon :icon="IconType.COPY" />
            <div class="label">{{ t.copyAsKIF }}</div>
          </button>
          <button @click="onCopyKI2">
            <Icon :icon="IconType.COPY" />
            <div class="label">{{ t.copyAsKI2 }}</div>
          </button>
          <button @click="onCopyCSA">
            <Icon :icon="IconType.COPY" />
            <div class="label">{{ t.copyAsCSA }}</div>
          </button>
          <button @click="onCopyUSI">
            <Icon :icon="IconType.COPY" />
            <div class="label">{{ t.copyAsUSI }}</div>
          </button>
          <button @click="onCopySFEN">
            <Icon :icon="IconType.COPY" />
            <div class="label">{{ t.copyAsSFEN }}</div>
          </button>
          <button :disabled="!states.paste" @click="onPaste">
            <Icon :icon="IconType.PASTE" />
            <div class="label">{{ t.paste }}</div>
          </button>
        </div>
      </div>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { t } from "@/common/i18n";
import { showModalDialog } from "@/renderer/helpers/dialog.js";
import { computed, onMounted, ref } from "vue";
import Icon from "@/renderer/view/primitive/Icon.vue";
import { IconType } from "@/renderer/assets/icons";
import { useStore } from "@/renderer/store";
import { AppState } from "@/common/control/state.js";

const emit = defineEmits(["close"]);

const store = useStore();
const dialog = ref();
const onClose = () => {
  emit("close");
};
onMounted(() => {
  showModalDialog(dialog.value, onClose);
});
const onNewFile = () => {
  store.resetRecord();
  emit("close");
};
const onOpen = () => {
  store.openRecord();
  emit("close");
};
const onSave = () => {
  store.saveRecord({ overwrite: true });
  emit("close");
};
const onSaveAs = () => {
  store.saveRecord();
  emit("close");
};
const onExportImage = () => {
  store.showExportBoardImageDialog();
  emit("close");
};
const onCopyKIF = () => {
  store.copyRecordKIF();
  emit("close");
};
const onCopyKI2 = () => {
  store.copyRecordKI2();
  emit("close");
};
const onCopyCSA = () => {
  store.copyRecordCSA();
  emit("close");
};
const onCopyUSI = () => {
  store.copyRecordUSIAll();
  emit("close");
};
const onCopySFEN = () => {
  store.copyBoardSFEN();
  emit("close");
};
const onPaste = () => {
  store.showPasteDialog();
  emit("close");
};
const states = computed(() => {
  return {
    newFile: store.appState === AppState.NORMAL,
    open: store.appState === AppState.NORMAL,
    save: store.appState === AppState.NORMAL,
    saveAs: store.appState === AppState.NORMAL,
    exportImage: store.appState === AppState.NORMAL,
    paste: store.appState === AppState.NORMAL,
  };
});
</script>
