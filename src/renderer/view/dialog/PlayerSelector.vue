<template>
  <div>
    <div class="root">
      <select
        ref="playerSelect"
        class="player-select"
        size="1"
        :value="playerUri"
        @change="onPlayerChange"
      >
        <option v-if="containsHuman" :value="uri.ES_HUMAN">人</option>
        <option
          v-for="engine in filteredEngineSettings.engineList"
          :key="engine.uri"
          :value="engine.uri"
        >
          {{ engine.name }}
        </option>
      </select>
      <div v-if="displayPonderState" class="row player-info">
        <span class="player-info-key">{{ t.ponder }}:</span>
        <span class="player-info-value">{{ ponderState || "---" }}</span>
      </div>
      <div v-if="displayThreadState" class="row player-info">
        <span class="player-info-key">{{ t.numberOfThreads }}:</span>
        <span class="player-info-value">{{ threadState || "---" }}</span>
      </div>
      <div v-if="displayMultiPvState" class="row player-info">
        <span class="player-info-key">{{ t.multiPV }}:</span>
        <span class="player-info-value">{{ multiPVState || "---" }}</span>
      </div>
      <button class="player-setting" :disabled="!isPlayerSettingEnabled" @click="openPlayerSetting">
        <Icon :icon="IconType.SETTINGS" />
        <span>{{ t.settings }}</span>
      </button>
    </div>
  </div>
  <USIEngineOptionDialog
    v-if="engineSettingDialog"
    :latest-engine-setting="engineSettingDialog"
    :ok-button-text="t.save"
    @ok="savePlayerSetting"
    @cancel="closePlayerSetting"
  />
</template>

<script setup lang="ts">
import { t } from "@/common/i18n";
import { computed, PropType, ref } from "vue";
import * as uri from "@/common/uri.js";
import Icon from "@/renderer/view/primitive/Icon.vue";
import USIEngineOptionDialog from "@/renderer/view/dialog/USIEngineOptionDialog.vue";
import { IconType } from "@/renderer/assets/icons";
import {
  getUSIEngineOptionCurrentValue,
  USIEngineSetting,
  ImmutableUSIEngineSettings,
  USIPonder,
  USIMultiPV,
  Threads,
  NumberOfThreads,
  MultiPV,
  USIEngineSettings,
  USIEngineLabel,
} from "@/common/settings/usi";
import { useStore } from "@/renderer/store";
import api from "@/renderer/ipc/api";

const props = defineProps({
  playerUri: {
    type: String,
    required: true,
  },
  containsHuman: {
    type: Boolean,
    default: false,
  },
  engineSettings: {
    type: Object as PropType<ImmutableUSIEngineSettings>,
    required: true,
  },
  filterLabel: {
    type: String as PropType<USIEngineLabel>,
    required: true,
  },
  displayPonderState: {
    type: Boolean,
    default: false,
  },
  displayThreadState: {
    type: Boolean,
    default: false,
  },
  displayMultiPvState: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  selectPlayer: [uri: string];
  updateEngineSetting: [setting: USIEngineSettings];
}>();

const store = useStore();
const playerSelect = ref();
const engineSettingDialog = ref(null as USIEngineSetting | null);

const filteredEngineSettings = computed(() => {
  return props.engineSettings.filterByLabel(props.filterLabel);
});

const ponderState = computed(() => {
  if (!uri.isUSIEngine(props.playerUri)) {
    return null;
  }
  const engine = filteredEngineSettings.value.getEngine(props.playerUri);
  return engine && getUSIEngineOptionCurrentValue(engine.options[USIPonder]) === "true"
    ? "ON"
    : "OFF";
});

const threadState = computed(() => {
  if (!uri.isUSIEngine(props.playerUri)) {
    return null;
  }
  const engine = filteredEngineSettings.value.getEngine(props.playerUri);
  if (!engine) {
    return null;
  }
  const threads =
    getUSIEngineOptionCurrentValue(engine.options[Threads]) ||
    getUSIEngineOptionCurrentValue(engine.options[NumberOfThreads]);
  return threads;
});

const multiPVState = computed(() => {
  if (!uri.isUSIEngine(props.playerUri)) {
    return null;
  }
  const engine = filteredEngineSettings.value.getEngine(props.playerUri);
  if (!engine) {
    return null;
  }
  const multiPV =
    getUSIEngineOptionCurrentValue(engine.options[USIMultiPV]) ||
    getUSIEngineOptionCurrentValue(engine.options[MultiPV]);
  return multiPV;
});

const isPlayerSettingEnabled = computed(() => {
  return uri.isUSIEngine(props.playerUri);
});

const openPlayerSetting = () => {
  if (uri.isUSIEngine(props.playerUri)) {
    const engine = filteredEngineSettings.value.getEngine(props.playerUri);
    if (!engine) {
      store.pushError("利用可能なエンジンが選択されていません。");
      return;
    }
    engineSettingDialog.value = engine;
  }
};

const savePlayerSetting = async (setting: USIEngineSetting) => {
  engineSettingDialog.value = null;
  const clone = props.engineSettings.getClone();
  clone.updateEngine(setting);
  store.retainBussyState();
  try {
    await api.saveUSIEngineSetting(clone);
    emit("updateEngineSetting", clone);
  } catch (e) {
    store.pushError(e);
  } finally {
    store.releaseBussyState();
  }
};

const closePlayerSetting = () => {
  engineSettingDialog.value = null;
};

const onPlayerChange = () => {
  emit("selectPlayer", playerSelect.value.value);
};
</script>

<style scoped>
.root {
  width: 100%;
}
.player-select {
  width: 100%;
  margin-bottom: 5px;
}
.player-info {
  line-height: 1.3em;
  font-size: 0.8em;
}
.player-info-key {
  width: 110px;
  height: 100%;
  text-align: left;
  vertical-align: baseline;
}
.player-info-value {
  height: 100%;
  text-align: left;
  vertical-align: baseline;
}
.player-setting {
  margin: 5px auto 0px auto;
}
</style>
