<template>
  <StandardLayout class="main" />
  <GameDialog v-if="dialogVisibilities.game" />
  <ResearchDialog v-if="dialogVisibilities.research" />
  <USIEngineManagementDialog v-if="dialogVisibilities.usiEngineSetting" />
  <AppSettingDialog v-if="dialogVisibilities.appSetting" />
  <PasteDialog v-if="dialogVisibilities.paste" />
  <BussyMessage v-if="dialogVisibilities.bussy" />
  <ConfirmDialog v-if="dialogVisibilities.confirm" />
  <InfoMessage v-if="hasMessage" />
  <ErrorMessage v-if="hasErrors" />
</template>

<script lang="ts">
import { defineComponent, computed, onMounted } from "vue";
import StandardLayout from "@/components/main/StandardLayout.vue";
import GameDialog from "@/components/dialog/GameDialog.vue";
import ResearchDialog from "@/components/dialog/ResearchDialog.vue";
import USIEngineManagementDialog from "@/components/dialog/USIEngineManagementDialog.vue";
import AppSettingDialog from "@/components/dialog/AppSettingDialog.vue";
import PasteDialog from "@/components/dialog/PasteDialog.vue";
import BussyMessage from "@/components/dialog/BussyMessage.vue";
import ConfirmDialog from "@/components/dialog/ConfirmDialog.vue";
import InfoMessage from "@/components/dialog/InfoMessage.vue";
import ErrorMessage from "@/components/dialog/ErrorMessage.vue";
import { Action, Mutation, useStore } from "@/store";
import { Mode } from "@/store/mode";
import { handleKeyDownEvent } from "@/helpers/key";

export default defineComponent({
  name: "App",
  components: {
    StandardLayout,
    GameDialog,
    ResearchDialog,
    USIEngineManagementDialog,
    AppSettingDialog,
    PasteDialog,
    BussyMessage,
    ConfirmDialog,
    InfoMessage,
    ErrorMessage,
  },
  setup() {
    const store = useStore();

    const dialogVisibilities = computed(() => {
      return {
        game: store.state.mode === Mode.GAME_DIALOG,
        research: store.state.mode === Mode.RESEARCH_DIALOG,
        usiEngineSetting: store.state.mode === Mode.USI_ENGINE_SETTING_DIALOG,
        appSetting: store.state.mode === Mode.APP_SETTING_DIALOG,
        paste: store.state.mode === Mode.PASTE_DIALOG,
        bussy: store.getters.isBussy,
        confirm: store.state.confirmation.confirmation,
      };
    });

    const hasMessage = computed(() => store.getters.hasMessage);

    const hasErrors = computed(() => store.getters.hasError);

    onMounted(() => {
      const body = document.getElementsByTagName("body")[0];
      body.addEventListener("copy", (event) => {
        store.dispatch(Action.COPY_RECORD);
        event.preventDefault();
      });
      body.addEventListener("paste", (event) => {
        store.commit(Mutation.SHOW_PASTE_DIALOG);
        event.preventDefault();
      });
      body.addEventListener("dragover", (event: DragEvent) => {
        event.preventDefault();
      });
      body.addEventListener("drop", (event: DragEvent) => {
        if (event.dataTransfer && event.dataTransfer.files[0]) {
          const path = event.dataTransfer.files[0].path;
          store.dispatch(Action.OPEN_RECORD, path);
        }
        event.preventDefault();
      });
      handleKeyDownEvent({
        onArrowUp(): void {
          const moveNumber = store.state.record.current.number;
          store.commit(Mutation.CHANGE_MOVE_NUMBER, moveNumber - 1);
        },
        onArrowDown(): void {
          const moveNumber = store.state.record.current.number;
          store.commit(Mutation.CHANGE_MOVE_NUMBER, moveNumber + 1);
        },
        onArrowLeft(): void {
          store.commit(Mutation.CHANGE_MOVE_NUMBER, 0);
        },
        onArrowRight(): void {
          store.commit(Mutation.CHANGE_MOVE_NUMBER, Number.MAX_SAFE_INTEGER);
        },
      });
    });

    return {
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
  margin: 0;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: var(--main-color);
  background-color: var(--main-bg-color);
  height: 100vh;
}
.main {
  height: 100%;
  width: 100%;
}
</style>
