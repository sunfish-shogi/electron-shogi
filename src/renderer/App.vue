<template>
  <div class="root" :class="thema">
    <StandardLayout class="main" />
    <GameDialog v-if="dialogVisibilities.game" />
    <CSAGameDialog v-if="dialogVisibilities.csaGame" />
    <ResearchDialog v-if="dialogVisibilities.research" />
    <AnalysisDialog v-if="dialogVisibilities.analysis" />
    <USIEngineManagementDialog v-if="dialogVisibilities.usiEngineSetting" />
    <AppSettingDialog v-if="dialogVisibilities.appSetting" />
    <PasteDialog v-if="dialogVisibilities.paste" />
    <BussyMessage v-if="dialogVisibilities.bussy" />
    <ConfirmDialog v-if="dialogVisibilities.confirm" />
    <CSAGameReadyDialog v-if="dialogVisibilities.csaGameReady" />
    <InfoMessage v-if="hasMessage" />
    <ErrorMessage v-if="hasErrors" />
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, onMounted } from "vue";
import StandardLayout from "@/renderer/view/main/StandardLayout.vue";
import GameDialog from "@/renderer/view/dialog/GameDialog.vue";
import CSAGameDialog from "@/renderer/view/dialog/CSAGameDialog.vue";
import ResearchDialog from "@/renderer/view/dialog/ResearchDialog.vue";
import USIEngineManagementDialog from "@/renderer/view/dialog/USIEngineManagementDialog.vue";
import AppSettingDialog from "@/renderer/view/dialog/AppSettingDialog.vue";
import PasteDialog from "@/renderer/view/dialog/PasteDialog.vue";
import BussyMessage from "@/renderer/view/dialog/BussyMessage.vue";
import ConfirmDialog from "@/renderer/view/dialog/ConfirmDialog.vue";
import InfoMessage from "@/renderer/view/dialog/InfoMessage.vue";
import ErrorMessage from "@/renderer/view/dialog/ErrorMessage.vue";
import { useStore } from "@/renderer/store";
import { AppState } from "@/common/control/state.js";
import AnalysisDialog from "@/renderer/view/dialog/AnalysisDialog.vue";
import CSAGameReadyDialog from "@/renderer/view/dialog/CSAGameReadyDialog.vue";
import { CSAGameState } from "@/renderer/store/csa";

export default defineComponent({
  name: "App",
  components: {
    StandardLayout,
    GameDialog,
    CSAGameDialog,
    ResearchDialog,
    USIEngineManagementDialog,
    AppSettingDialog,
    PasteDialog,
    BussyMessage,
    ConfirmDialog,
    InfoMessage,
    ErrorMessage,
    AnalysisDialog,
    CSAGameReadyDialog,
  },
  setup() {
    const store = useStore();

    const thema = computed(() => store.appSetting.thema);

    const dialogVisibilities = computed(() => {
      return {
        game: store.appState === AppState.GAME_DIALOG,
        csaGame: store.appState === AppState.CSA_GAME_DIALOG,
        research: store.appState === AppState.RESEARCH_DIALOG,
        analysis: store.appState === AppState.ANALYSIS_DIALOG,
        usiEngineSetting: store.appState === AppState.USI_ENGINE_SETTING_DIALOG,
        appSetting: store.isAppSettingDialogVisible,
        paste: store.appState === AppState.PASTE_DIALOG,
        bussy: store.isBussy,
        confirm: store.confirmation !== undefined,
        csaGameReady: store.csaGameState === CSAGameState.READY,
      };
    });

    const hasMessage = computed(() => store.hasMessage);

    const hasErrors = computed(() => store.hasError);

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

    return {
      thema,
      dialogVisibilities,
      hasMessage,
      hasErrors,
    };
  },
});
</script>

<style>
@import "./css/font.css";
@import "./css/color.css";
@import "./css/control.css";
@import "./css/dialog.css";

body {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-size: 17px;
  margin: 0;
}
body::-webkit-scrollbar {
  display: none;
}
#app {
  text-align: center;
  height: 100vh;
  width: 100vw;
}
</style>

<style scoped>
.root {
  color: var(--main-color);
  background-color: var(--main-bg-color);
  height: 100%;
  width: 100%;
}
.main {
  height: 100%;
  width: 100%;
}
</style>