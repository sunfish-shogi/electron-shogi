<template>
  <div>
    <dialog ref="dialog">
      <div class="dialog-title">対局</div>
      <div class="dialog-form-area">
        <div class="players">
          <div class="player">
            <div class="top-label">先手（下手）</div>
            <select
              ref="blackPlayerSelect"
              class="player-select"
              size="1"
              @change="onPlayerChange"
            >
              <option
                v-for="player in players"
                :key="player.uri"
                :value="player.uri"
              >
                {{ player.name }}
              </option>
            </select>
            <div class="player-info">
              先読み USI_Ponder: <span ref="blackPonderState"></span>
            </div>
            <button
              class="player-setting"
              :disabled="!isBlackPlayerSettingEnabled"
              @click="openBlackPlayerSetting"
            >
              <ButtonIcon class="icon" :icon="Icon.SETTINGS" />
              設定
            </button>
          </div>
          <div class="player">
            <div class="top-label">後手（上手）</div>
            <select
              ref="whitePlayerSelect"
              class="player-select"
              size="1"
              @change="onPlayerChange"
            >
              <option
                v-for="player in players"
                :key="player.uri"
                :value="player.uri"
              >
                {{ player.name }}
              </option>
            </select>
            <div class="player-info">
              先読み USI_Ponder: <span ref="whitePonderState"></span>
            </div>
            <button
              class="player-setting"
              :disabled="!isWhitePlayerSettingEnabled"
              @click="openWhitePlayerSetting"
            >
              <ButtonIcon class="icon" :icon="Icon.SETTINGS" />
              設定
            </button>
          </div>
        </div>
        <div class="players-control">
          <button @click="onSwapColor">
            <ButtonIcon class="icon" :icon="Icon.SWAP_H" />
            先後入れ替え
          </button>
        </div>
      </div>
      <div class="dialog-form-areas-h">
        <div class="dialog-form-area time-limit">
          <div class="dialog-form-item">
            <div class="dialog-form-item-label">持ち時間</div>
            <input
              ref="hours"
              class="time-input"
              type="number"
              min="0"
              max="99"
              step="1"
            />
            <div class="dialog-form-item-unit">時間</div>
            <input
              ref="minutes"
              class="time-input"
              type="number"
              min="0"
              max="59"
              step="1"
            />
            <div class="dialog-form-item-unit">分</div>
          </div>
          <div class="dialog-form-item">
            <div class="dialog-form-item-label">秒読み</div>
            <input
              ref="byoyomi"
              class="time-input single"
              type="number"
              min="0"
              max="60"
              step="1"
            />
            <div class="dialog-form-item-unit">秒</div>
          </div>
          <div class="dialog-form-item">
            <div class="dialog-form-item-label">増加</div>
            <input
              ref="increment"
              class="time-input single"
              type="number"
              min="0"
              max="99"
              step="1"
            />
            <div class="dialog-form-item-unit">秒</div>
          </div>
        </div>
        <div class="dialog-form-area flags">
          <div class="dialog-form-item">
            <select ref="startPosition">
              <option value="current">現在の局面</option>
              <option value="standard">平手</option>
              <option value="handicapLance">香落ち</option>
              <option value="handicapRightLance">右香落ち</option>
              <option value="handicapBishop">角落ち</option>
              <option value="handicapRook">飛車落ち</option>
              <option value="handicapRookLance">飛車香落ち</option>
              <option value="handicap2Pieces">2枚落ち</option>
              <option value="handicap4Pieces">4枚落ち</option>
              <option value="handicap6Pieces">6枚落ち</option>
              <option value="handicap8Pieces">8枚落ち</option>
            </select>
          </div>
          <div class="dialog-form-item">
            <input
              id="disable-engine-timeout"
              ref="enableEngineTimeout"
              type="checkbox"
            />
            <label for="disable-engine-timeout">エンジンの時間切れあり</label>
          </div>
          <div class="dialog-form-item">
            <input id="human-is-front" ref="humanIsFront" type="checkbox" />
            <label for="human-is-front">人を手前に表示する</label>
          </div>
        </div>
      </div>
      <!-- TODO: 連続対局 -->
      <div class="dialog-main-buttons">
        <button class="dialog-button" @click="onStart()">対局開始</button>
        <button class="dialog-button" @click="onCancel()">キャンセル</button>
      </div>
    </dialog>
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
import {
  getUSIEngineOptionCurrentValue,
  USIEngineSetting,
  USIEngineSettings,
  USIPonder,
} from "@/settings/usi";
import { ref, onMounted, defineComponent, Ref, computed, onUpdated } from "vue";
import api from "@/ipc/api";
import { useStore } from "@/store";
import {
  defaultGameSetting,
  GameSetting,
  PlayerSetting,
  validateGameSetting,
} from "@/settings/game";
import { showModalDialog } from "@/helpers/dialog";
import * as uri from "@/uri";
import ButtonIcon from "@/components/primitive/ButtonIcon.vue";
import { readInputAsNumber } from "@/helpers/form";
import { Icon } from "@/assets/icons";
import USIEngineOptionDialog from "@/components/dialog/USIEngineOptionDialog.vue";

export default defineComponent({
  name: "GameDialog",
  components: {
    ButtonIcon,
    USIEngineOptionDialog,
  },
  setup() {
    const store = useStore();
    const dialog: Ref = ref(null);
    const blackPlayerSelect: Ref = ref(null);
    const blackPonderState: Ref = ref(null);
    const whitePlayerSelect: Ref = ref(null);
    const whitePonderState: Ref = ref(null);
    const isBlackPlayerSettingEnabled = ref(false);
    const isWhitePlayerSettingEnabled = ref(false);
    const hours: Ref = ref(null);
    const minutes: Ref = ref(null);
    const byoyomi: Ref = ref(null);
    const increment: Ref = ref(null);
    const startPosition: Ref = ref(null);
    const enableEngineTimeout: Ref = ref(null);
    const humanIsFront: Ref = ref(null);
    const gameSetting = ref(defaultGameSetting());
    const engineSettings = ref(new USIEngineSettings());
    const engineSettingDialog: Ref<USIEngineSetting | null> = ref(null);

    store.retainBussyState();

    onMounted(async () => {
      try {
        gameSetting.value = await api.loadGameSetting();
        engineSettings.value = await api.loadUSIEngineSetting();
        showModalDialog(dialog.value);
      } catch (e) {
        store.pushError(e);
        store.closeDialog();
      } finally {
        store.releaseBussyState();
      }
    });

    let defaultValueApplied = false;
    onUpdated(() => {
      if (!defaultValueApplied) {
        blackPlayerSelect.value.value = gameSetting.value.black.uri;
        whitePlayerSelect.value.value = gameSetting.value.white.uri;
        hours.value.value = Math.floor(
          gameSetting.value.timeLimit.timeSeconds / 3600
        );
        minutes.value.value =
          Math.floor(gameSetting.value.timeLimit.timeSeconds / 60) % 60;
        byoyomi.value.value = gameSetting.value.timeLimit.byoyomi;
        increment.value.value = gameSetting.value.timeLimit.increment;
        startPosition.value.value =
          gameSetting.value.startPosition !== undefined
            ? gameSetting.value.startPosition
            : "current";
        enableEngineTimeout.value.checked =
          gameSetting.value.enableEngineTimeout;
        humanIsFront.value.checked = gameSetting.value.humanIsFront;
        onPlayerChange();
        defaultValueApplied = true;
      }
    });

    const onUpdatePlayer = (playerURI: string, info: HTMLDivElement) => {
      if (uri.isUSIEngine(playerURI)) {
        const engine = engineSettings.value.getEngine(playerURI);
        info.innerHTML =
          getUSIEngineOptionCurrentValue(engine.options[USIPonder]) === "true"
            ? "ON"
            : "OFF";
      } else {
        info.innerHTML = "N/A";
      }
    };

    onUpdated(() => {
      onUpdatePlayer(blackPlayerSelect.value.value, blackPonderState.value);
      onUpdatePlayer(whitePlayerSelect.value.value, whitePonderState.value);
    });

    const buildPlayerSetting = (playerURI: string): PlayerSetting => {
      if (uri.isUSIEngine(playerURI)) {
        const engine = engineSettings.value.getEngine(playerURI);
        return {
          name: engine.name,
          uri: playerURI,
          usi: engine,
        };
      }
      return {
        name: "人",
        uri: uri.ES_HUMAN,
      };
    };

    const onPlayerChange = () => {
      isBlackPlayerSettingEnabled.value =
        blackPlayerSelect.value &&
        uri.isUSIEngine(blackPlayerSelect.value.value);
      isWhitePlayerSettingEnabled.value =
        whitePlayerSelect.value &&
        uri.isUSIEngine(whitePlayerSelect.value.value);
    };

    const openPlayerSetting = (playerURI: string) => {
      if (uri.isUSIEngine(playerURI)) {
        const engine = engineSettings.value.getEngine(playerURI);
        engineSettingDialog.value = engine;
      }
    };

    const openBlackPlayerSetting = () => {
      const uri = blackPlayerSelect.value.value;
      openPlayerSetting(uri);
    };

    const openWhitePlayerSetting = () => {
      const uri = whitePlayerSelect.value.value;
      openPlayerSetting(uri);
    };

    const savePlayerSetting = async (setting: USIEngineSetting) => {
      const clone = new USIEngineSettings(engineSettings.value.json);
      clone.updateEngine(setting);
      store.retainBussyState();
      try {
        await api.saveUSIEngineSetting(clone);
        engineSettings.value = clone;
        engineSettingDialog.value = null;
      } catch (e) {
        store.pushError(e);
      } finally {
        store.releaseBussyState();
      }
    };

    const closePlayerSetting = () => {
      engineSettingDialog.value = null;
    };

    const onStart = () => {
      const gameSetting: GameSetting = {
        black: buildPlayerSetting(blackPlayerSelect.value.value),
        white: buildPlayerSetting(whitePlayerSelect.value.value),
        timeLimit: {
          timeSeconds:
            (readInputAsNumber(hours.value) * 60 +
              readInputAsNumber(minutes.value)) *
            60,
          byoyomi: readInputAsNumber(byoyomi.value),
          increment: readInputAsNumber(increment.value),
        },
        startPosition:
          startPosition.value.value !== "current"
            ? startPosition.value.value
            : undefined,
        enableEngineTimeout: enableEngineTimeout.value.checked,
        humanIsFront: humanIsFront.value.checked,
      };
      const error = validateGameSetting(gameSetting);
      if (error) {
        store.pushError(error);
      } else {
        store.startGame(gameSetting);
      }
    };

    const onCancel = () => {
      store.closeDialog();
    };

    const onSwapColor = () => {
      [blackPlayerSelect.value.value, whitePlayerSelect.value.value] = [
        whitePlayerSelect.value.value,
        blackPlayerSelect.value.value,
      ];
      onPlayerChange();
    };

    const players = computed(() => {
      return [
        { name: "人", uri: uri.ES_HUMAN },
        ...engineSettings.value.engineList,
      ];
    });

    return {
      dialog,
      blackPlayerSelect,
      blackPonderState,
      whitePlayerSelect,
      whitePonderState,
      hours,
      minutes,
      byoyomi,
      increment,
      startPosition,
      enableEngineTimeout,
      humanIsFront,
      players,
      isBlackPlayerSettingEnabled,
      isWhitePlayerSettingEnabled,
      engineSettingDialog,
      onPlayerChange,
      openBlackPlayerSetting,
      openWhitePlayerSetting,
      savePlayerSetting,
      closePlayerSetting,
      onStart,
      onCancel,
      onSwapColor,
      Icon,
    };
  },
});
</script>

<style scoped>
.top-label {
  text-align: center;
}
.dialog-form-area {
  width: 480px;
  display: flex;
  flex-direction: column;
}
.players {
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
  width: 100%;
}
.player {
  width: 220px;
}
.player-select {
  width: 200px;
}
.player-info {
  width: 200px;
  margin: 2px auto 2px auto;
  height: 1.4em;
  font-size: 0.8em;
}
.player-setting {
  margin: 0px auto 0px auto;
}
.players-control {
  width: 100%;
}
.players-control > * {
  margin-top: 5px;
}
.dialog-form-area.time-limit {
  width: 240px;
}
.time-input {
  text-align: right;
  width: 40px;
}
.dialog-form-area.flags {
  width: 225px;
  margin-left: 5px;
  margin-bottom: 5px;
}
</style>
