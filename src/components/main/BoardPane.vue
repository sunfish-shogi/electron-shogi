<template>
  <div>
    <Board
      :layoutType="layout"
      :maxSize="maxSize"
      :position="position"
      :lastMove="lastMove"
      :flip="flip"
      :allowMove="allowMove"
      :allowEdit="allowEdit"
      :blackPlayerName="blackPlayerName"
      :whitePlayerName="whitePlayerName"
      :blackPlayerTimeMs="blackPlayerTimeMs"
      :blackPlayerByoyomi="blackPlayerByoyomi"
      :whitePlayerTimeMs="whitePlayerTimeMs"
      :whitePlayerByoyomi="whitePlayerByoyomi"
      @move="onMove"
      @edit="onEdit"
    >
      <template v-slot:right-control>
        <div class="control top">
          <button @click="onGame" v-if="controlStates.game">
            <img class="icon" src="icon/sports_esports_white_24dp.svg" />
            対局
          </button>
          <button @click="onStop" v-if="controlStates.stop">
            <img class="icon" src="icon/block_white_24dp.svg" />
            中断
          </button>
          <button @click="onResign" v-if="controlStates.resign">
            <img class="icon" src="icon/flag_white_24dp.svg" />
            投了
          </button>
          <button @click="onResearch" v-if="controlStates.research">
            <img class="icon" src="icon/science_white_24dp.svg" />
            検討
          </button>
          <button @click="onEndResearch" v-if="controlStates.endResearch">
            <img class="icon" src="icon/do_disturb_on_white_24dp.svg" />
            検討終了
          </button>
          <button
            @click="onStartEditPosition"
            v-if="controlStates.startEditPosition"
          >
            <img class="icon" src="icon/app_registration_white_24dp.svg" />
            局面編集
          </button>
          <button
            @click="onEndEditPosition"
            v-if="controlStates.endEditPosition"
          >
            <img class="icon" src="icon/check_circle_white_24dp.svg" />
            局面編集終了
          </button>
          <button @click="onChangeTurn" v-if="controlStates.initPosition">
            <img class="icon" src="icon/swap_vert_white_24dp.svg" />
            手番変更
          </button>
          <button
            @click="onInitPositionStandard"
            v-if="controlStates.initPosition"
          >
            平手
          </button>
          <button
            @click="onInitPositionTsumeShogi"
            v-if="controlStates.initPosition"
          >
            詰将棋
          </button>
        </div>
      </template>
      <template v-slot:left-control>
        <div class="control bottom">
          <button
            @click="onOpenAppSettings"
            :disabled="!controlStates.appSettings"
          >
            <img class="icon" src="icon/settings_white_24dp.svg" />
            アプリ設定
          </button>
          <button
            @click="onOpenEngineSettings"
            :disabled="!controlStates.engineSettings"
          >
            <img
              class="icon"
              src="icon/settings_input_component_white_24dp.svg"
            />
            エンジン設定
          </button>
          <button @click="onFlip">
            <img class="icon" src="icon/flip_camera_android_white_24dp.svg" />
            盤面反転
          </button>
          <button @click="onPaste" :disabled="!controlStates.paste">
            <img class="icon" src="icon/content_paste_white_24dp.svg" />
            棋譜貼り付け
          </button>
          <button @click="onCopy">
            <img class="icon" src="icon/content_copy_white_24dp.svg" />
            棋譜コピー
          </button>
          <button @click="onRemoveAfter">
            <img class="icon" src="icon/backspace_white_24dp.svg" />
            指し手削除
          </button>
        </div>
      </template>
    </Board>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import Board from "@/components/primitive/Board.vue";
import {
  InitialPositionType,
  Move,
  PositionChange,
  RecordMetadataKey,
} from "@/shogi";
import { RectSize } from "@/layout/types";
import { Action, Mutation, useStore } from "@/store";
import { Mode } from "@/store/state";

export default defineComponent({
  name: "BoardPane",
  props: {
    maxSize: {
      type: RectSize,
      required: true,
    },
  },
  components: {
    Board,
  },
  setup() {
    const store = useStore();

    const onMove = (move: Move) => {
      store.dispatch(Action.DO_MOVE_BY_USER, move);
    };

    const onEdit = (change: PositionChange) => {
      store.commit(Mutation.EDIT_POSITION, change);
    };

    const onGame = () => {
      store.commit(Mutation.SHOW_GAME_DIALOG);
    };

    const onStop = () => {
      store.dispatch(Action.STOP_GAME);
    };

    const onResign = () => {
      store.dispatch(Action.RESIGN_BY_USER);
    };

    const onResearch = () => {
      store.commit(Mutation.SHOW_RESEARCH_DIALOG);
    };

    const onEndResearch = () => {
      store.dispatch(Action.STOP_RESEARCH);
    };

    const onStartEditPosition = () => {
      store.dispatch(Action.START_POSITION_EDITING);
    };

    const onEndEditPosition = () => {
      store.dispatch(Action.END_POSITION_EDITING);
    };

    const onInitPositionStandard = () => {
      store.commit(Mutation.INITIALIZE_POSITION, InitialPositionType.STANDARD);
    };

    const onInitPositionTsumeShogi = () => {
      store.commit(
        Mutation.INITIALIZE_POSITION,
        InitialPositionType.TSUME_SHOGI
      );
    };

    const onChangeTurn = () => {
      store.commit(Mutation.CHANGE_TURN);
    };

    const onOpenAppSettings = () => {
      store.commit(Mutation.OPEN_APP_SETTING_DIALOG);
    };

    const onOpenEngineSettings = () => {
      store.commit(Mutation.OPEN_USI_ENGINE_MANAGEMENT_DIALOG);
    };

    const onFlip = () => {
      store.commit(Mutation.FLIP_BOARD);
    };

    const onPaste = () => {
      store.commit(Mutation.SHOW_PASTE_DIALOG);
    };

    const onCopy = () => {
      store.dispatch(Action.COPY_RECORD);
    };

    const onRemoveAfter = () => {
      store.dispatch(Action.REMOVE_RECORD_AFTER);
    };

    const allowEdit = computed(
      () => store.state.mode === Mode.POSITION_EDITING
    );

    const allowMove = computed(() => store.getters.isMovableByUser);

    const position = computed(() => store.state.record.position);

    const lastMove = computed(() => {
      const move = store.state.record.current.move;
      return move instanceof Move ? move : null;
    });

    const layout = computed(() => store.state.appSetting.boardLayout);

    const flip = computed(() => store.state.appSetting.boardFlipping);

    const blackPlayerName = computed(() => {
      return store.state.record.metadata.getStandardMetadata(
        RecordMetadataKey.BLACK_NAME
      );
    });

    const whitePlayerName = computed(() => {
      return store.state.record.metadata.getStandardMetadata(
        RecordMetadataKey.WHITE_NAME
      );
    });

    const blackPlayerTimeMs = computed(() =>
      store.state.mode === Mode.GAME
        ? store.state.gameState.blackTimeMs
        : undefined
    );
    const blackPlayerByoyomi = computed(() =>
      store.state.mode === Mode.GAME
        ? store.state.gameState.blackByoyomi
        : undefined
    );
    const whitePlayerTimeMs = computed(() =>
      store.state.mode === Mode.GAME
        ? store.state.gameState.whiteTimeMs
        : undefined
    );
    const whitePlayerByoyomi = computed(() =>
      store.state.mode === Mode.GAME
        ? store.state.gameState.whiteByoyomi
        : undefined
    );

    const controlStates = computed(() => {
      return {
        game: store.state.mode === Mode.NORMAL,
        stop: store.state.mode === Mode.GAME,
        resign: store.state.mode === Mode.GAME,
        research: store.state.mode === Mode.NORMAL,
        endResearch: store.state.mode === Mode.RESEARCH,
        startEditPosition: store.state.mode === Mode.NORMAL,
        endEditPosition: store.state.mode === Mode.POSITION_EDITING,
        initPosition: store.state.mode === Mode.POSITION_EDITING,
        paste: store.state.mode === Mode.NORMAL,
        appSettings: store.state.mode === Mode.NORMAL,
        engineSettings: store.state.mode === Mode.NORMAL,
      };
    });

    return {
      layout,
      position,
      lastMove,
      flip,
      blackPlayerName,
      whitePlayerName,
      blackPlayerTimeMs,
      blackPlayerByoyomi,
      whitePlayerTimeMs,
      whitePlayerByoyomi,
      controlStates,
      onMove,
      onEdit,
      onGame,
      onStop,
      onResign,
      onResearch,
      onEndResearch,
      onStartEditPosition,
      onEndEditPosition,
      onInitPositionStandard,
      onInitPositionTsumeShogi,
      onChangeTurn,
      onOpenAppSettings,
      onOpenEngineSettings,
      onFlip,
      onPaste,
      onCopy,
      onRemoveAfter,
      allowEdit,
      allowMove,
    };
  },
});
</script>

<style scoped>
.board {
  position: absolute;
}
.board-image {
  width: 100%;
  height: 100%;
}
.piece {
  position: absolute;
}
.piece-image {
  width: 100%;
  height: 100%;
}
.control {
  width: 100%;
  height: 100%;
}
.control.top {
  display: flex;
  flex-direction: column;
}
.control.bottom {
  display: flex;
  flex-direction: column-reverse;
}
.control button {
  width: 100%;
  height: 15%;
  font-size: 100%;
  text-align: left;
  line-height: 200%;
  padding: 0 5% 0 5%;
}
.control.top button:not(:last-child) {
  margin-bottom: 2%;
}
.control.bottom button:not(:last-child) {
  margin-top: 2%;
}
.control button .icon {
  height: 80%;
  vertical-align: top;
}
</style>
