<template>
  <StandardLayout class="main" />
  <GameDialog v-if="dialogVisibilities.game" />
  <ResearchDialog v-if="dialogVisibilities.research" />
  <USIEngineManagementDialog v-if="dialogVisibilities.usiEngineSetting" />
  <AppSettingDialog v-if="dialogVisibilities.appSetting" />
  <PasteDialog v-if="dialogVisibilities.paste" />
  <Bussy v-if="dialogVisibilities.processing" />
  <Message v-if="hasMessage" />
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
import Bussy from "@/components/dialog/Bussy.vue";
import Message from "@/components/dialog/Message.vue";
import ErrorMessage from "@/components/dialog/ErrorMessage.vue";
import { Action, Mutation, useStore } from "@/store";
import { Mode } from "@/store/state";

export default defineComponent({
  name: "App",
  components: {
    StandardLayout,
    GameDialog,
    ResearchDialog,
    USIEngineManagementDialog,
    AppSettingDialog,
    PasteDialog,
    Bussy,
    Message,
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
        processing: store.state.bussyState.isBussy,
      };
    });

    const hasMessage = computed(() => store.state.messages.length !== 0);

    const hasErrors = computed(() => store.state.errors.length !== 0);

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
      document.addEventListener("keydown", (event: KeyboardEvent) => {
        const moveNumber = store.state.record.current.number;
        switch (event.key) {
          default:
            return;
          case "ArrowUp":
            store.dispatch(Action.CHANGE_MOVE_NUMBER, moveNumber - 1);
            break;
          case "ArrowDown":
            store.dispatch(Action.CHANGE_MOVE_NUMBER, moveNumber + 1);
            break;
          case "ArrowLeft":
            store.dispatch(Action.CHANGE_MOVE_NUMBER, 0);
            break;
          case "ArrowRight":
            store.dispatch(Action.CHANGE_MOVE_NUMBER, Number.MAX_SAFE_INTEGER);
            break;
        }
        event.preventDefault();
        event.stopPropagation();
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
