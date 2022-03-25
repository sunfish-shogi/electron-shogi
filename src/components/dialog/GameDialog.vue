<template>
  <div>
    <dialog ref="dialog">
      <div class="dialog-title">対局</div>
      <div class="dialog-form-area players">
        <div class="player">
          <div class="top-label">先手（下手）</div>
          <select
            class="player-select"
            size="1"
            ref="blackPlayerSelect"
            :value="defaultValues.black.type"
          >
            <option value="es://human">人</option>
            <option
              v-for="engine in engines"
              :key="engine.uri"
              :value="engine.uri"
            >
              {{ engine.name }}
            </option>
          </select>
        </div>
        <div class="player">
          <div class="top-label">後手（上手）</div>
          <select
            class="player-select"
            size="1"
            ref="whitePlayerSelect"
            :value="defaultValues.white.type"
          >
            <option value="es://human">人</option>
            <option
              v-for="engine in engines"
              :key="engine.uri"
              :value="engine.uri"
            >
              {{ engine.name }}
            </option>
          </select>
        </div>
      </div>
      <div class="dialog-form-areas-h">
        <div class="dialog-form-area time-limit">
          <div class="dialog-form-item">
            <div class="dialog-form-item-label">持ち時間</div>
            <input
              class="time-input"
              ref="hours"
              type="number"
              min="0"
              max="99"
              step="1"
              :value="defaultValues.timeLimit.hours"
            />
            <div class="dialog-form-item-unit">時間</div>
            <input
              class="time-input"
              ref="minutes"
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
              class="time-input single"
              ref="byoyomi"
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
              class="time-input single"
              ref="increment"
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
              ref="enableEngineTimeout"
              type="checkbox"
              id="disable-engine-timeout"
              :checked="defaultValues.enableEngineTimeout"
            />
            <label for="disable-engine-timeout">エンジンの時間切れあり</label>
          </div>
        </div>
      </div>
      <!-- TODO: 人を手前に表示する -->
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
import { Action, Mutation, useStore } from "@/store";
import {
  defaultGameSetting,
  GameSetting,
  PlayerSetting,
  PlayerType,
  validateGameSetting,
} from "@/settings/game";
import { showModalDialog } from "@/helpers/dialog";

export default defineComponent({
  name: "GameDialog",
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
    const gameSetting = ref(defaultGameSetting());
    const engineSetting = ref(new USIEngineSettings());

    store.commit(Mutation.RETAIN_BUSSY_STATE);

    onMounted(async () => {
      showModalDialog(dialog.value);
      try {
        gameSetting.value = await loadGameSetting();
        engineSetting.value = await loadUSIEngineSetting();
        store.commit(Mutation.RELEASE_BUSSY_STATE);
      } catch (e) {
        store.commit(Mutation.PUSH_ERROR, e);
        store.commit(Mutation.CLOSE_DIALOG);
      }
    });

    const buildPlayerSetting = (uri: string): PlayerSetting => {
      if (uri === "es://human") {
        return {
          name: "人",
          type: PlayerType.HUMAN,
        };
      }
      const engine = engineSetting.value.getEngine(uri);
      return {
        name: engine.name,
        type: PlayerType.USI,
        usi: engine,
      };
    };

    const onStart = () => {
      const gameSetting: GameSetting = {
        black: buildPlayerSetting(blackPlayerSelect.value.value),
        white: buildPlayerSetting(whitePlayerSelect.value.value),
        timeLimit: {
          timeSeconds: (hours.value.value * 60 + minutes.value.value) * 60,
          byoyomi: Number(byoyomi.value.value),
          increment: Number(increment.value.value),
        },
        startPosition:
          startPosition.value.value !== "current"
            ? startPosition.value.value
            : undefined,
        enableEngineTimeout: enableEngineTimeout.value.checked,
      };
      const error = validateGameSetting(gameSetting);
      if (error) {
        store.commit(Mutation.PUSH_ERROR, error);
      } else {
        store.dispatch(Action.START_GAME, gameSetting);
      }
    };

    const onCancel = () => {
      store.commit(Mutation.CLOSE_DIALOG);
    };

    const defaultValues = computed(() => {
      return {
        black: {
          type:
            gameSetting.value.black.type === PlayerType.HUMAN
              ? "es://human"
              : gameSetting.value.black.usi?.uri,
        },
        white: {
          type:
            gameSetting.value.white.type === PlayerType.HUMAN
              ? "es://human"
              : gameSetting.value.white.usi?.uri,
        },
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
      };
    });

    const engines = computed(() => engineSetting.value.engineList);

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
      defaultValues,
      engines,
      onStart,
      onCancel,
    };
  },
});
</script>

<style scoped>
.top-label {
  text-align: center;
}
.dialog-form-area.players {
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
  width: 480px;
}
.player {
  width: 220px;
}
.player-select {
  width: 200px;
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
