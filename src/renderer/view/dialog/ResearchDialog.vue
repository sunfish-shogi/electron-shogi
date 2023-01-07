<template>
  <div>
    <dialog ref="dialog" class="root">
      <div class="dialog-title">検討</div>
      <div class="dialog-form-area">
        <div class="dialog-form-area">
          <PlayerSelector
            :player-uri="engineURI"
            :engine-settings="engineSettings"
            :display-thread-state="true"
            :display-multi-pv-state="true"
            @update-engine-setting="onUpdatePlayerSetting"
            @select-player="
              (uri) => {
                engineURI = uri;
              }
            "
          />
        </div>
        <div
          v-for="(uri, index) in secondaryEngineURIs"
          :key="index"
          class="dialog-form-area"
        >
          <PlayerSelector
            :player-uri="uri"
            :engine-settings="engineSettings"
            :display-thread-state="true"
            :display-multi-pv-state="true"
            @update-engine-setting="onUpdatePlayerSetting"
            @select-player="
              (uri) => {
                secondaryEngineURIs[index] = uri;
              }
            "
          />
          <button
            class="remove-button"
            @click="secondaryEngineURIs.splice(index, 1)"
          >
            削除
          </button>
        </div>
        <button @click="secondaryEngineURIs.push('')">
          {{ secondaryEngineURIs.length + 2 }} 個目のエンジンを追加
        </button>
      </div>
      <div class="dialog-main-buttons">
        <button
          data-hotkey="Enter"
          autofocus
          class="dialog-button"
          @click="onStart()"
        >
          検討開始
        </button>
        <button class="dialog-button" data-hotkey="Escape" @click="onCancel()">
          キャンセル
        </button>
      </div>
    </dialog>
  </div>
</template>

<script lang="ts">
import { showModalDialog } from "@/renderer/helpers/dialog.js";
import api from "@/renderer/ipc/api";
import {
  defaultResearchSetting,
  ResearchSetting,
  validateResearchSetting,
} from "@/common/settings/research";
import { USIEngineSettings } from "@/common/settings/usi";
import { useStore } from "@/renderer/store";
import { defineComponent, onBeforeUnmount, onMounted, ref, Ref } from "vue";
import PlayerSelector from "@/renderer/view/dialog/PlayerSelector.vue";
import {
  installHotKeyForDialog,
  uninstallHotKeyForDialog,
} from "@/renderer/keyboard/hotkey";

export default defineComponent({
  name: "ResearchDialog",
  components: {
    PlayerSelector,
  },
  setup() {
    const store = useStore();
    const dialog: Ref = ref(null);
    const researchSetting = ref(defaultResearchSetting());
    const engineSettings = ref(new USIEngineSettings());
    const engineURI = ref("");
    const secondaryEngineURIs = ref([] as string[]);

    store.retainBussyState();

    onMounted(async () => {
      showModalDialog(dialog.value);
      installHotKeyForDialog(dialog.value);
      try {
        researchSetting.value = await api.loadResearchSetting();
        engineSettings.value = await api.loadUSIEngineSetting();
        engineURI.value = researchSetting.value.usi?.uri || "";
        secondaryEngineURIs.value =
          researchSetting.value.secondaries?.map(
            (setting) => setting.usi?.uri || ""
          ) || [];
      } catch (e) {
        store.pushError(e);
        store.destroyModalDialog();
      } finally {
        store.releaseBussyState();
      }
    });

    onBeforeUnmount(() => {
      uninstallHotKeyForDialog(dialog.value);
    });

    const onStart = () => {
      const engineSetting = engineSettings.value.getEngine(engineURI.value);
      const secondaries = [];
      for (const uri of secondaryEngineURIs.value) {
        const engineSetting = engineSettings.value.getEngine(uri);
        secondaries.push({
          usi: engineSetting,
        });
      }
      const researchSetting: ResearchSetting = {
        usi: engineSetting,
        secondaries: secondaries,
      };
      const e = validateResearchSetting(researchSetting);
      if (e) {
        store.pushError(e);
        return;
      }
      store.startResearch(researchSetting);
    };

    const onCancel = () => {
      store.closeModalDialog();
    };

    const onUpdatePlayerSetting = async (settings: USIEngineSettings) => {
      engineSettings.value = settings;
    };

    return {
      dialog,
      engineSettings,
      engineURI,
      secondaryEngineURIs,
      onStart,
      onCancel,
      onUpdatePlayerSetting,
    };
  },
});
</script>

<style scoped>
.root {
  width: 380px;
}
.remove-button {
  margin-top: 5px;
}
</style>
