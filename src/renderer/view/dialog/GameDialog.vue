<template>
  <div>
    <dialog ref="dialog">
      <div class="title">{{ t.game }}</div>
      <div class="form-group players">
        <div class="row regular-interval">
          <div class="player">
            <div class="top-label">{{ t.senteOrShitate }}</div>
            <PlayerSelector
              :player-uri="blackPlayerURI"
              :contains-human="true"
              :engine-settings="engineSettings"
              :display-ponder-state="true"
              :display-thread-state="true"
              :display-multi-pv-state="true"
              @update-engine-setting="onUpdatePlayerSetting"
              @select-player="onSelectBlackPlayer"
            />
          </div>
          <div class="player">
            <div class="top-label">{{ t.goteOrUwate }}</div>
            <PlayerSelector
              v-if="whitePlayerURI"
              :player-uri="whitePlayerURI"
              :contains-human="true"
              :engine-settings="engineSettings"
              :display-ponder-state="true"
              :display-thread-state="true"
              :display-multi-pv-state="true"
              @update-engine-setting="onUpdatePlayerSetting"
              @select-player="onSelectWhitePlayer"
            />
          </div>
        </div>
        <div class="players-control">
          <button @click="onSwapColor">
            <Icon :icon="IconType.SWAP_H" />
            <span>{{ t.swapSenteGote }}</span>
          </button>
        </div>
      </div>
      <div class="row regular-interval">
        <div class="form-group time-limit">
          <div class="top-label">{{ t.time }}</div>
          <div class="form-item">
            <div class="form-item-label">{{ t.allottedTime }}</div>
            <input
              ref="hours"
              class="time"
              type="number"
              min="0"
              max="99"
              step="1"
            />
            <div class="form-item-unit">{{ t.hoursSuffix }}</div>
            <input
              ref="minutes"
              class="time"
              type="number"
              min="0"
              max="59"
              step="1"
            />
            <div class="form-item-unit">{{ t.minutesSuffix }}</div>
          </div>
          <div class="form-item">
            <div class="form-item-label">{{ t.byoyomi }}</div>
            <input
              ref="byoyomi"
              class="time"
              type="number"
              min="0"
              max="60"
              step="1"
            />
            <div class="form-item-unit">{{ t.secondsSuffix }}</div>
          </div>
          <div class="form-item">
            <div class="form-item-label">{{ t.increments }}</div>
            <input
              ref="increment"
              class="time"
              type="number"
              min="0"
              max="99"
              step="1"
            />
            <div class="form-item-unit">{{ t.secondsSuffix }}</div>
          </div>
          <div class="form-item">
            <ToggleButton
              :label="t.enableEngineTimeout"
              :value="enableEngineTimeout"
              @change="
                (value) => {
                  enableEngineTimeout = value;
                }
              "
            />
          </div>
        </div>
        <div class="form-group others">
          <div class="top-label">{{ t.others }}</div>
          <div class="form-item">
            <div class="form-item-label">{{ t.startPosition }}</div>
            <select ref="startPosition">
              <option value="current">{{ t.currentPosition }}</option>
              <option value="standard">{{ t.nonHandicap }}</option>
              <option value="handicapLance">{{ t.lanceHandicap }}</option>
              <option value="handicapRightLance">
                {{ t.rightLanceHandicap }}
              </option>
              <option value="handicapBishop">{{ t.bishopHandicap }}</option>
              <option value="handicapRook">{{ t.rookHandicap }}</option>
              <option value="handicapRookLance">
                {{ t.rookLanceHandicap }}
              </option>
              <option value="handicap2Pieces">{{ t.twoPiecesHandicap }}</option>
              <option value="handicap4Pieces">
                {{ t.fourPiecesHandicap }}
              </option>
              <option value="handicap6Pieces">{{ t.sixPiecesHandicap }}</option>
              <option value="handicap8Pieces">
                {{ t.eightPiecesHandicap }}
              </option>
            </select>
          </div>
          <div class="form-item">
            <div class="form-item-label">{{ t.maxMoves }}</div>
            <input ref="maxMoves" class="number" type="number" min="1" />
          </div>
          <div class="form-item">
            <div class="form-item-label">{{ t.gameRepetition }}</div>
            <input ref="repeat" class="number" type="number" min="1" />
          </div>
          <div class="form-item">
            <ToggleButton
              :label="t.swapTurnWhenGameRepetition"
              :value="swapPlayers"
              @change="
                (value) => {
                  swapPlayers = value;
                }
              "
            />
          </div>
          <div class="form-item">
            <ToggleButton
              :label="t.outputComments"
              :value="enableComment"
              @change="
                (value) => {
                  enableComment = value;
                }
              "
            />
          </div>
          <div class="form-item">
            <ToggleButton
              :label="t.saveRecordAutomatically"
              :value="enableAutoSave"
              @change="
                (value) => {
                  enableAutoSave = value;
                }
              "
            />
          </div>
          <div class="form-item">
            <ToggleButton
              :label="t.adjustBoardToHumanPlayer"
              :value="humanIsFront"
              @change="
                (value) => {
                  humanIsFront = value;
                }
              "
            />
          </div>
        </div>
      </div>
      <div class="main-buttons">
        <button data-hotkey="Enter" autofocus @click="onStart()">
          {{ t.startGame }}
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
import { USIEngineSetting, USIEngineSettings } from "@/common/settings/usi";
import { ref, onMounted, onUpdated, onBeforeUnmount } from "vue";
import api, { isNative } from "@/renderer/ipc/api";
import { useStore } from "@/renderer/store";
import {
  defaultGameSetting,
  GameSetting,
  validateGameSetting,
  validateGameSettingForWeb,
} from "@/common/settings/game";
import { showModalDialog } from "@/renderer/helpers/dialog.js";
import * as uri from "@/common/uri.js";
import { readInputAsNumber } from "@/renderer/helpers/form.js";
import { IconType } from "@/renderer/assets/icons";
import Icon from "@/renderer/view/primitive/Icon.vue";
import PlayerSelector from "@/renderer/view/dialog/PlayerSelector.vue";
import { PlayerSetting } from "@/common/settings/player";
import {
  installHotKeyForDialog,
  uninstallHotKeyForDialog,
} from "@/renderer/keyboard/hotkey";
import ToggleButton from "../primitive/ToggleButton.vue";

const store = useStore();
const dialog = ref();
const hours = ref();
const minutes = ref();
const byoyomi = ref();
const increment = ref();
const startPosition = ref();
const enableEngineTimeout = ref(false);
const maxMoves = ref();
const repeat = ref();
const swapPlayers = ref(false);
const enableComment = ref(false);
const enableAutoSave = ref(false);
const humanIsFront = ref(false);
const gameSetting = ref(defaultGameSetting());
const engineSettings = ref(new USIEngineSettings());
const blackPlayerURI = ref("");
const whitePlayerURI = ref("");

let defaultValueLoaded = false;
let defaultValueApplied = false;
store.retainBussyState();

onMounted(async () => {
  try {
    gameSetting.value = await api.loadGameSetting();
    engineSettings.value = await api.loadUSIEngineSetting();
    blackPlayerURI.value = gameSetting.value.black.uri;
    whitePlayerURI.value = gameSetting.value.white.uri;
    showModalDialog(dialog.value);
    installHotKeyForDialog(dialog.value);
    defaultValueLoaded = true;
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

onUpdated(() => {
  if (!defaultValueLoaded || defaultValueApplied) {
    return;
  }
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
  enableEngineTimeout.value = gameSetting.value.enableEngineTimeout;
  maxMoves.value.value = gameSetting.value.maxMoves;
  repeat.value.value = gameSetting.value.repeat;
  swapPlayers.value = gameSetting.value.swapPlayers;
  enableComment.value = gameSetting.value.enableComment;
  enableAutoSave.value = gameSetting.value.enableAutoSave;
  humanIsFront.value = gameSetting.value.humanIsFront;
  defaultValueApplied = true;
});

const buildPlayerSetting = (playerURI: string): PlayerSetting => {
  if (uri.isUSIEngine(playerURI) && engineSettings.value.hasEngine(playerURI)) {
    const engine = engineSettings.value.getEngine(
      playerURI
    ) as USIEngineSetting;
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

const onStart = () => {
  const gameSetting: GameSetting = {
    black: buildPlayerSetting(blackPlayerURI.value),
    white: buildPlayerSetting(whitePlayerURI.value),
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
    enableEngineTimeout: enableEngineTimeout.value,
    maxMoves: readInputAsNumber(maxMoves.value),
    repeat: readInputAsNumber(repeat.value),
    swapPlayers: swapPlayers.value,
    enableComment: enableComment.value,
    enableAutoSave: enableAutoSave.value,
    humanIsFront: humanIsFront.value,
  };
  const error = isNative()
    ? validateGameSetting(gameSetting)
    : validateGameSettingForWeb(gameSetting);
  if (error) {
    store.pushError(error);
  } else {
    store.startGame(gameSetting);
  }
};

const onCancel = () => {
  store.closeModalDialog();
};

const onUpdatePlayerSetting = (settings: USIEngineSettings) => {
  engineSettings.value = settings;
};

const onSelectBlackPlayer = (uri: string) => {
  blackPlayerURI.value = uri;
};
const onSelectWhitePlayer = (uri: string) => {
  whitePlayerURI.value = uri;
};

const onSwapColor = () => {
  [blackPlayerURI.value, whitePlayerURI.value] = [
    whitePlayerURI.value,
    blackPlayerURI.value,
  ];
};
</script>

<style scoped>
.top-label {
  text-align: center;
}
.players {
  width: 580px;
}
.player {
  width: 280px;
}
.players-control {
  width: 100%;
}
.players-control > * {
  margin-top: 5px;
}
.time-limit {
  width: 265px;
}
input.time {
  text-align: right;
  width: 40px;
}
input.number {
  text-align: right;
  width: 80px;
}
.others {
  width: 280px;
}
</style>
