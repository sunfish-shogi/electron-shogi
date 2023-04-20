<template>
  <div>
    <dialog ref="dialog" class="root">
      <div class="title">{{ t.research }}</div>
      <div class="form-group">
        <div class="form-group">
          <PlayerSelector
            :player-uri="engineURI"
            :engine-settings="engineSettings"
            :display-thread-state="true"
            :display-multi-pv-state="true"
            @update-engine-setting="onUpdatePlayerSetting"
            @select-player="
              (uri: string) => {
                engineURI = uri;
              }
            "
          />
        </div>
        <div
          v-for="(uri, index) in secondaryEngineURIs"
          :key="index"
          class="form-group"
        >
          <PlayerSelector
            :player-uri="uri"
            :engine-settings="engineSettings"
            :display-thread-state="true"
            :display-multi-pv-state="true"
            @update-engine-setting="onUpdatePlayerSetting"
            @select-player="
              (uri: string) => {
                secondaryEngineURIs[index] = uri;
              }
            "
          />
          <button
            class="remove-button"
            @click="secondaryEngineURIs.splice(index, 1)"
          >
            {{ t.remove }}
          </button>
        </div>
        <div class="form-item center">
          <button @click="secondaryEngineURIs.push('')">
            {{ t.addNthEngine(secondaryEngineURIs.length + 2) }}
          </button>
        </div>
      </div>
      <div class="main-buttons">
        <button data-hotkey="Enter" autofocus @click="onStart()">
          {{ t.startResearch }}
        </button>
        <button data-hotkey="Escape" @click="onCancel()">
          {{ t.cancel }}
        </button>
      </div>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { t } from "@/common/i18n";
import { showModalDialog } from "@/renderer/helpers/dialog.js";
import api from "@/renderer/ipc/api";
import {
  defaultResearchSetting,
  ResearchSetting,
  validateResearchSetting,
} from "@/common/settings/research";
import { USIEngineSettings } from "@/common/settings/usi";
import { useStore } from "@/renderer/store";
import { onBeforeUnmount, onMounted, ref } from "vue";
import PlayerSelector from "@/renderer/view/dialog/PlayerSelector.vue";
import {
  installHotKeyForDialog,
  uninstallHotKeyForDialog,
} from "@/renderer/keyboard/hotkey";

const store = useStore();
const dialog = ref();
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
</script>

<style scoped>
.root {
  width: 380px;
}
.remove-button {
  margin-top: 5px;
}
</style>
