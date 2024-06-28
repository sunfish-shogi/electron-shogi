<template>
  <div class="root full" :class="appSetting.thema" :style="style">
    <StandardLayout class="full" />
    <GameDialog v-if="store.appState === AppState.GAME_DIALOG" />
    <CSAGameDialog v-if="store.appState === AppState.CSA_GAME_DIALOG" />
    <AnalysisDialog v-if="store.appState === AppState.ANALYSIS_DIALOG" />
    <MateSearchDialog v-if="store.appState === AppState.MATE_SEARCH_DIALOG" />
    <USIEngineManagementDialog v-if="store.appState === AppState.USI_ENGINE_SETTING_DIALOG" />
    <RecordFileHistoryDialog v-if="store.appState === AppState.RECORD_FILE_HISTORY_DIALOG" />
    <BatchConversionDialog v-if="store.appState === AppState.BATCH_CONVERSION_DIALOG" />
    <PositionImageExportDialog v-if="store.appState === AppState.EXPORT_POSITION_IMAGE_DIALOG" />
    <AppSettingDialog v-if="store.isAppSettingDialogVisible" />
    <PasteDialog v-if="store.appState === AppState.PASTE_DIALOG" />
    <LaunchUSIEngineDialog v-if="store.appState === AppState.LAUNCH_USI_ENGINE_DIALOG" />
    <ConnectToCSAServerDialog v-if="store.appState === AppState.CONNECT_TO_CSA_SERVER_DIALOG" />
    <LoadRemoteFileDialog v-if="store.appState === AppState.LOAD_REMOTE_FILE_DIALOG" />
    <PieceSetChangeDialog v-if="store.appState === AppState.PIECE_SET_CHANGE_DIALOG" />
    <ResearchDialog v-if="store.researchState === ResearchState.STARTUP_DIALOG" />
    <BussyMessage v-if="bussyState.isBussy" />
    <ConfirmDialog v-if="confirmation.message" />
    <CSAGameReadyDialog
      v-if="
        store.csaGameState === CSAGameState.PLAYER_SETUP ||
        store.csaGameState === CSAGameState.WAITING_LOGIN ||
        store.csaGameState === CSAGameState.READY ||
        store.csaGameState === CSAGameState.LOGIN_RETRY_INTERVAL
      "
    />
    <PVPreviewDialog
      v-if="store.pvPreview"
      :position="store.pvPreview.position"
      :multi-pv="store.pvPreview.multiPV"
      :depth="store.pvPreview.depth"
      :selective-depth="store.pvPreview.selectiveDepth"
      :score="store.pvPreview.score"
      :mate="store.pvPreview.mate"
      :lower-bound="store.pvPreview.lowerBound"
      :upper-bound="store.pvPreview.upperBound"
      :pv="store.pvPreview.pv"
      @close="store.closePVPreviewDialog()"
    />
    <InfoMessage v-if="messageStore.hasMessage" />
    <ErrorMessage v-if="errorStore.hasError" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import StandardLayout from "@/renderer/view/main/StandardLayout.vue";
import GameDialog from "@/renderer/view/dialog/GameDialog.vue";
import CSAGameDialog from "@/renderer/view/dialog/CSAGameDialog.vue";
import ResearchDialog from "@/renderer/view/dialog/ResearchDialog.vue";
import USIEngineManagementDialog from "@/renderer/view/dialog/USIEngineManagementDialog.vue";
import PositionImageExportDialog from "@/renderer/view/dialog/PositionImageExportDialog.vue";
import AppSettingDialog from "@/renderer/view/dialog/AppSettingDialog.vue";
import PasteDialog from "@/renderer/view/dialog/PasteDialog.vue";
import BussyMessage from "@/renderer/view/dialog/BussyMessage.vue";
import ConfirmDialog from "@/renderer/view/dialog/ConfirmDialog.vue";
import InfoMessage from "@/renderer/view/dialog/InfoMessage.vue";
import ErrorMessage from "@/renderer/view/dialog/ErrorMessage.vue";
import { useStore } from "@/renderer/store";
import { AppState, ResearchState } from "@/common/control/state.js";
import AnalysisDialog from "@/renderer/view/dialog/AnalysisDialog.vue";
import CSAGameReadyDialog from "@/renderer/view/dialog/CSAGameReadyDialog.vue";
import { CSAGameState } from "@/renderer/store/csa";
import { useAppSetting } from "./store/setting";
import { BackgroundImageType } from "@/common/settings/app";
import MateSearchDialog from "./view/dialog/MateSearchDialog.vue";
import PVPreviewDialog from "./view/dialog/PVPreviewDialog.vue";
import RecordFileHistoryDialog from "./view/dialog/RecordFileHistoryDialog.vue";
import BatchConversionDialog from "./view/dialog/BatchConversionDialog.vue";
import LaunchUSIEngineDialog from "./view/dialog/LaunchUSIEngineDialog.vue";
import ConnectToCSAServerDialog from "./view/dialog/ConnectToCSAServerDialog.vue";
import PieceSetChangeDialog from "./view/dialog/PieceSetChangeDialog.vue";
import LoadRemoteFileDialog from "./view/dialog/LoadRemoteFileDialog.vue";
import { useBussyState } from "./store/bussy";
import { useMessageStore } from "./store/message";
import { useErrorStore } from "./store/error";
import { useConfirmationStore } from "./store/confirm";

const appSetting = useAppSetting();
const store = useStore();
const messageStore = useMessageStore();
const errorStore = useErrorStore();
const bussyState = useBussyState();
const confirmation = useConfirmationStore();

onMounted(() => {
  const body = document.getElementsByTagName("body")[0];
  body.addEventListener("copy", (event) => {
    store.copyRecordKIF();
    event.preventDefault();
  });
  body.addEventListener("paste", (event) => {
    store.showPasteDialog();
    event.preventDefault();
  });
  body.addEventListener("dragover", (event: DragEvent) => {
    event.preventDefault();
  });
  body.addEventListener("drop", (event: DragEvent) => {
    if (event.dataTransfer && event.dataTransfer.files[0]) {
      const path = event.dataTransfer.files[0].path;
      store.openRecord(path);
    }
    event.preventDefault();
  });
});

const style = computed(() => {
  if (
    appSetting.backgroundImageType == BackgroundImageType.NONE ||
    !appSetting.backgroundImageFileURL
  ) {
    return {};
  }
  let size = "";
  switch (appSetting.backgroundImageType) {
    case BackgroundImageType.COVER:
      size = "cover";
      break;
    case BackgroundImageType.CONTAIN:
      size = "contain";
      break;
    case BackgroundImageType.TILE:
      size = "auto";
      break;
  }
  return {
    "background-image": `url("${appSetting.backgroundImageFileURL}")`,
    "background-size": size,
  };
});
</script>

<style scoped>
.root {
  color: var(--main-color);
  background-color: var(--main-bg-color);
}
</style>
