<template>
  <div>
    <BoardView
      :piece-image-type="pieceImageType"
      :board-image-type="boardImageType"
      :max-size="maxSize"
      :position="position"
      :last-move="lastMove"
      :flip="flip"
      :allow-move="allowMove"
      :allow-edit="allowEdit"
      :black-player-name="blackPlayerName"
      :white-player-name="whitePlayerName"
      :black-player-time-ms="blackPlayerTimeMs"
      :black-player-byoyomi="blackPlayerByoyomi"
      :white-player-time-ms="whitePlayerTimeMs"
      :white-player-byoyomi="whitePlayerByoyomi"
      @move="onMove"
      @edit="onEdit"
    >
      <template #right-control>
        <div class="control top">
          <button
            v-if="controlStates.game"
            class="control-item"
            @click="onGame"
          >
            <ButtonIcon class="icon" :icon="Icon.GAME" />
            対局
          </button>
          <button
            v-if="controlStates.stop"
            class="control-item"
            @click="onStop"
          >
            <ButtonIcon class="icon" :icon="Icon.STOP" />
            対局中断
          </button>
          <button
            v-if="controlStates.resign"
            class="control-item"
            @click="onResign"
          >
            <ButtonIcon class="icon" :icon="Icon.RESIGN" />
            投了
          </button>
          <button
            v-if="controlStates.research"
            class="control-item"
            @click="onResearch"
          >
            <ButtonIcon class="icon" :icon="Icon.RESEARCH" />
            検討
          </button>
          <button
            v-if="controlStates.endResearch"
            class="control-item"
            @click="onEndResearch"
          >
            <ButtonIcon class="icon" :icon="Icon.END" />
            検討終了
          </button>
          <button
            v-if="controlStates.analysis"
            class="control-item"
            @click="onAnalysis"
          >
            <ButtonIcon class="icon" :icon="Icon.ANALYSIS" />
            解析
          </button>
          <button
            v-if="controlStates.endAnalysis"
            class="control-item"
            @click="onEndAnalysis"
          >
            <ButtonIcon class="icon" :icon="Icon.STOP" />
            解析中断
          </button>
          <button
            v-if="controlStates.startEditPosition"
            class="control-item"
            @click="onStartEditPosition"
          >
            <ButtonIcon class="icon" :icon="Icon.EDIT" />
            局面編集
          </button>
          <button
            v-if="controlStates.endEditPosition"
            class="control-item"
            @click="onEndEditPosition"
          >
            <ButtonIcon class="icon" :icon="Icon.CHECK" />
            局面編集終了
          </button>
          <button
            v-if="controlStates.initPosition"
            class="control-item"
            @click="onChangeTurn"
          >
            <ButtonIcon class="icon" :icon="Icon.SWAP" />
            手番変更
          </button>
          <select
            v-if="controlStates.initPosition"
            class="control-item"
            @change="onInitPosition"
          >
            <option>局面の初期化</option>
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
            <option value="tsumeShogi">詰め将棋</option>
            <option value="tsumeShogi2Kings">双玉詰め将棋</option>
          </select>
        </div>
      </template>
      <template #left-control>
        <div class="control bottom">
          <button class="control-item" @click="onOpenAppSettings">
            <ButtonIcon class="icon" :icon="Icon.SETTINGS" />
            アプリ設定
          </button>
          <button
            class="control-item"
            :disabled="!controlStates.engineSettings"
            @click="onOpenEngineSettings"
          >
            <ButtonIcon class="icon" :icon="Icon.ENGINE_SETTINGS" />
            エンジン設定
          </button>
          <button class="control-item" @click="onFlip">
            <ButtonIcon class="icon" :icon="Icon.FLIP" />
            盤面反転
          </button>
          <button
            class="control-item"
            :disabled="!controlStates.paste"
            @click="onPaste"
          >
            <ButtonIcon class="icon" :icon="Icon.PASTE" />
            棋譜貼り付け
          </button>
          <button class="control-item" @click="onCopy">
            <ButtonIcon class="icon" :icon="Icon.COPY" />
            棋譜コピー
          </button>
          <button
            class="control-item"
            :disabled="!controlStates.removeAfter"
            @click="onRemoveAfter"
          >
            <ButtonIcon class="icon" :icon="Icon.DELETE" />
            指し手削除
          </button>
        </div>
      </template>
    </BoardView>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import BoardView from "@/components/primitive/BoardView.vue";
import {
  InitialPositionType,
  Move,
  PositionChange,
  RecordMetadataKey,
} from "@/shogi";
import { RectSize } from "@/components/primitive/Types";
import { useStore } from "@/store";
import ButtonIcon from "@/components/primitive/ButtonIcon.vue";
import { AppState } from "@/store/state";
import { humanPlayer } from "@/players/human";
import { Icon } from "@/assets/icons";

export default defineComponent({
  name: "BoardPane",
  components: {
    BoardView,
    ButtonIcon,
  },
  props: {
    maxSize: {
      type: RectSize,
      required: true,
    },
  },
  setup() {
    const store = useStore();

    const onMove = (move: Move) => {
      if (store.appState === AppState.GAME) {
        humanPlayer.doMove(move);
      } else {
        store.doMove(move);
      }
    };

    const onEdit = (change: PositionChange) => {
      store.editPosition(change);
    };

    const onGame = () => {
      store.showGameDialog();
    };

    const onStop = () => {
      store.stopGame();
    };

    const onResign = () => {
      humanPlayer.resign();
    };

    const onResearch = () => {
      store.showResearchDialog();
    };

    const onEndResearch = () => {
      store.stopResearch();
    };

    const onAnalysis = () => {
      store.showAnalysisDialog();
    };

    const onEndAnalysis = () => {
      store.stopAnalysis();
    };

    const onStartEditPosition = () => {
      store.startPositionEditing();
    };

    const onEndEditPosition = () => {
      store.endPositionEditing();
    };

    const onInitPosition = (event: Event) => {
      const select = event.target as HTMLSelectElement;
      if (select.value) {
        store.initializePosition(select.value as InitialPositionType);
      }
    };

    const onChangeTurn = () => {
      store.changeTurn();
    };

    const onOpenAppSettings = () => {
      store.openAppSettingDialog();
    };

    const onOpenEngineSettings = () => {
      store.openUsiEngineManagementDialog();
    };

    const onFlip = () => {
      useStore().flipBoard();
    };

    const onPaste = () => {
      store.showPasteDialog();
    };

    const onCopy = () => {
      store.copyRecordKIF();
    };

    const onRemoveAfter = () => {
      store.removeRecordAfter();
    };

    const allowEdit = computed(
      () => store.appState === AppState.POSITION_EDITING
    );

    const allowMove = computed(() => store.isMovableByUser);

    const position = computed(() => store.record.position);

    const lastMove = computed(() => {
      const move = store.record.current.move;
      return move instanceof Move ? move : undefined;
    });

    const pieceImageType = computed(() => store.appSetting.pieceImage);

    const boardImageType = computed(() => store.appSetting.boardImage);

    const flip = computed(() => store.appSetting.boardFlipping);

    const blackPlayerName = computed(() => {
      return store.record.metadata.getStandardMetadata(
        RecordMetadataKey.BLACK_NAME
      );
    });

    const whitePlayerName = computed(() => {
      return store.record.metadata.getStandardMetadata(
        RecordMetadataKey.WHITE_NAME
      );
    });

    const blackPlayerTimeMs = computed(() =>
      store.appState === AppState.GAME ? store.blackTimeMs : undefined
    );
    const blackPlayerByoyomi = computed(() =>
      store.appState === AppState.GAME ? store.blackByoyomi : undefined
    );
    const whitePlayerTimeMs = computed(() =>
      store.appState === AppState.GAME ? store.whiteTimeMs : undefined
    );
    const whitePlayerByoyomi = computed(() =>
      store.appState === AppState.GAME ? store.whiteByoyomi : undefined
    );

    const controlStates = computed(() => {
      return {
        game: store.appState === AppState.NORMAL,
        stop: store.appState === AppState.GAME,
        resign: store.appState === AppState.GAME && store.isMovableByUser,
        research: store.appState === AppState.NORMAL,
        endResearch: store.appState === AppState.RESEARCH,
        analysis: store.appState === AppState.NORMAL,
        endAnalysis: store.appState === AppState.ANALYSIS,
        startEditPosition: store.appState === AppState.NORMAL,
        endEditPosition: store.appState === AppState.POSITION_EDITING,
        initPosition: store.appState === AppState.POSITION_EDITING,
        removeAfter:
          store.appState === AppState.NORMAL ||
          store.appState === AppState.RESEARCH,
        paste: store.appState === AppState.NORMAL,
        engineSettings: store.appState === AppState.NORMAL,
      };
    });

    return {
      pieceImageType,
      boardImageType,
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
      onAnalysis,
      onEndAnalysis,
      onStartEditPosition,
      onEndEditPosition,
      onInitPosition,
      onChangeTurn,
      onOpenAppSettings,
      onOpenEngineSettings,
      onFlip,
      onPaste,
      onCopy,
      onRemoveAfter,
      allowEdit,
      allowMove,
      Icon,
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
.control .control-item {
  width: 100%;
  height: 15%;
  font-size: 100%;
  text-align: left;
  line-height: 200%;
  padding: 0 5% 0 5%;
}
.control.top .control-item:not(:last-child) {
  margin-bottom: 2%;
}
.control.bottom .control-item:not(:last-child) {
  margin-top: 2%;
}
.control .control-item .icon {
  height: 80%;
  vertical-align: top;
}
.control select {
  width: 100%;
  height: 15%;
  color: var(--control-button-color);
  background-color: var(--control-button-bg-color);
}
</style>
