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
              :value="defaultValues.black.type"
            >
              <option
                v-for="player in players"
                :key="player.uri"
                :value="player.uri"
              >
                {{ player.name }}
              </option>
            </select>
          </div>
          <div class="player">
            <div class="top-label">後手（上手）</div>
            <select
              ref="whitePlayerSelect"
              class="player-select"
              size="1"
              :value="defaultValues.white.type"
            >
              <option
                v-for="player in players"
                :key="player.uri"
                :value="player.uri"
              >
                {{ player.name }}
              </option>
            </select>
          </div>
        </div>
        <div class="players-control">
          <button @click="onSwapColor">
            <ButtonIcon class="icon" icon="swap_h" />
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
              :value="defaultValues.timeLimit.hours"
            />
            <div class="dialog-form-item-unit">時間</div>
            <input
              ref="minutes"
              class="time-input"
              type="number"
              min="0"
              max="59"
              step="1"
              :value="defaultValues.timeLimit.minutes"
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
              :value="defaultValues.timeLimit.byoyomi"
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
              :value="defaultValues.timeLimit.increment"
            />
            <div class="dialog-form-item-unit">秒</div>
          </div>
        </div>
        <div class="dialog-form-area flags">
          <div class="dialog-form-item">
            <select ref="startPosition" :value="defaultValues.startPosition">
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
              :checked="defaultValues.enableEngineTimeout"
            />
            <label for="disable-engine-timeout">エンジンの時間切れあり</label>
          </div>
          <div class="dialog-form-item">
            <input
              id="human-is-front"
              ref="humanIsFront"
              type="checkbox"
              :checked="defaultValues.humanIsFront"
            />
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
</template>

<script lang="ts">
import { USIEngineSettings } from "@/settings/usi";
import { ref, onMounted, defineComponent, Ref, computed } from "vue";
import { loadGameSetting, loadUSIEngineSetting } from "@/ipc/renderer";
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

export default defineComponent({
  name: "GameDialog",
  components: {
    ButtonIcon,
  },
  setup() {
    const store = useStore();
    const dialog: Ref = ref(null);
    const blackPlayerSelect: Ref = ref(null);
    const whitePlayerSelect: Ref = ref(null);
    const hours: Ref = ref(null);
    const minutes: Ref = ref(null);
    const byoyomi: Ref = ref(null);
    const increment: Ref = ref(null);
    const startPosition: Ref = ref(null);
    const enableEngineTimeout: Ref = ref(null);
    const humanIsFront: Ref = ref(null);
    const gameSetting = ref(defaultGameSetting());
    const engineSetting = ref(new USIEngineSettings());

    store.retainBussyState();

    onMounted(async () => {
      showModalDialog(dialog.value);
      try {
        gameSetting.value = await loadGameSetting();
        engineSetting.value = await loadUSIEngineSetting();
        store.releaseBussyState();
      } catch (e) {
        store.pushError(e);
        store.closeDialog();
      }
    });

    const buildPlayerSetting = (playerURI: string): PlayerSetting => {
      if (uri.isUSIEngine(playerURI)) {
        const engine = engineSetting.value.getEngine(playerURI);
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
    };

    const defaultValues = computed(() => {
      return {
        black: { type: gameSetting.value.black.uri },
        white: { type: gameSetting.value.white.uri },
        timeLimit: {
          hours: Math.floor(gameSetting.value.timeLimit.timeSeconds / 3600),
          minutes:
            Math.floor(gameSetting.value.timeLimit.timeSeconds / 60) % 60,
          byoyomi: gameSetting.value.timeLimit.byoyomi,
          increment: gameSetting.value.timeLimit.increment,
        },
        startPosition:
          gameSetting.value.startPosition !== undefined
            ? gameSetting.value.startPosition
            : "current",
        enableEngineTimeout: gameSetting.value.enableEngineTimeout,
        humanIsFront: gameSetting.value.humanIsFront,
      };
    });

    const players = computed(() => {
      return [
        { name: "人", uri: uri.ES_HUMAN },
        ...engineSetting.value.engineList,
      ];
    });

    return {
      dialog,
      blackPlayerSelect,
      whitePlayerSelect,
      hours,
      minutes,
      byoyomi,
      increment,
      startPosition,
      enableEngineTimeout,
      humanIsFront,
      defaultValues,
      players,
      onStart,
      onCancel,
      onSwapColor,
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
