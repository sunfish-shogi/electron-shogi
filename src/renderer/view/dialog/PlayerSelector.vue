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
        <option v-for="player in players" :key="player.uri" :value="player.uri">
          {{ player.name }}
        </option>
      </select>
      <div v-if="displayPonderState" class="player-info">
        <span class="player-info-key">先読み(Ponder):</span>
        <span class="player-info-value">{{ ponderState || "---" }}</span>
      </div>
      <div v-if="displayThreadState" class="player-info">
        <span class="player-info-key">スレッド数:</span>
        <span class="player-info-value">{{ threadState || "---" }}</span>
      </div>
      <div v-if="displayMultiPvState" class="player-info">
        <span class="player-info-key">マルチPV:</span>
        <span class="player-info-value">{{ multiPVState || "---" }}</span>
      </div>
      <button
        class="player-setting"
        :disabled="!isPlayerSettingEnabled"
        @click="openPlayerSetting"
      >
        <ButtonIcon class="icon" :icon="Icon.SETTINGS" />
        設定
      </button>
    </div>
  </div>
  <USIEngineOptionDialog
    v-if="engineSettingDialog"
    :latest-engine-setting="engineSettingDialog"
    ok-button-text="保存"
    @ok="savePlayerSetting"
    @cancel="closePlayerSetting"
  />
</template>

<script lang="ts">
import { computed, defineComponent, PropType, Ref, ref } from "vue";
import * as uri from "@/common/uri.js";
import ButtonIcon from "@/renderer/view/primitive/ButtonIcon.vue";
import USIEngineOptionDialog from "@/renderer/view/dialog/USIEngineOptionDialog.vue";
import { Icon } from "@/renderer/assets/icons";
import {
  getUSIEngineOptionCurrentValue,
  USIEngineSetting,
  USIEngineSettings,
  USIPonder,
  USIMultiPV,
  Threads,
  NumberOfThreads,
  MultiPV,
} from "@/common/settings/usi";
import { useStore } from "@/renderer/store";

type Player = {
  name: string;
  uri: string;
};

export default defineComponent({
  name: "PlayerSelector",
  components: {
    ButtonIcon,
    USIEngineOptionDialog,
  },
  props: {
    players: {
      type: Array as PropType<Player[]>,
      required: true,
    },
    playerUri: {
      type: String,
      required: true,
    },
    engineSettings: {
      type: String,
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
  },
  emits: ["select-player", "update-engine-setting"],
  setup(props, context) {
    const store = useStore();
    const playerSelect: Ref = ref(null);
    const engineSettingDialog: Ref<USIEngineSetting | null> = ref(null);

    const ponderState = computed(() => {
      if (!uri.isUSIEngine(props.playerUri)) {
        return null;
      }
      const settings = new USIEngineSettings(props.engineSettings);
      const engine = settings.getEngine(props.playerUri);
      return engine &&
        getUSIEngineOptionCurrentValue(engine.options[USIPonder]) === "true"
        ? "ON"
        : "OFF";
    });

    const threadState = computed(() => {
      if (!uri.isUSIEngine(props.playerUri)) {
        return null;
      }
      const settings = new USIEngineSettings(props.engineSettings);
      const engine = settings.getEngine(props.playerUri);
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
      const settings = new USIEngineSettings(props.engineSettings);
      const engine = settings.getEngine(props.playerUri);
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
        const settings = new USIEngineSettings(props.engineSettings);
        const engine = settings.getEngine(props.playerUri);
        if (!engine) {
          store.pushError("利用可能なエンジンが選択されていません。");
          return;
        }
        engineSettingDialog.value = engine;
      }
    };

    const savePlayerSetting = (setting: USIEngineSetting) => {
      engineSettingDialog.value = null;
      context.emit("update-engine-setting", setting);
    };

    const closePlayerSetting = () => {
      engineSettingDialog.value = null;
    };

    const onPlayerChange = () => {
      context.emit("select-player", playerSelect.value.value);
    };

    return {
      playerSelect,
      ponderState,
      threadState,
      multiPVState,
      isPlayerSettingEnabled,
      engineSettingDialog,
      onPlayerChange,
      openPlayerSetting,
      savePlayerSetting,
      closePlayerSetting,
      Icon,
    };
  },
});
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
  display: flex;
  flex-direction: row;
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
