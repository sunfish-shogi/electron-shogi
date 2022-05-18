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
          <button v-if="controlStates.game" @click="onGame">
            <ButtonIcon class="icon" :icon="Icon.GAME" />
            対局
          </button>
          <button v-if="controlStates.stop" @click="onStop">
            <ButtonIcon class="icon" :icon="Icon.STOP" />
            対局中断
          </button>
          <button v-if="controlStates.resign" @click="onResign">
            <ButtonIcon class="icon" :icon="Icon.RESIGN" />
            投了
          </button>
          <button v-if="controlStates.research" @click="onResearch">
            <ButtonIcon class="icon" :icon="Icon.RESEARCH" />
            検討
          </button>
          <button v-if="controlStates.endResearch" @click="onEndResearch">
            <ButtonIcon class="icon" :icon="Icon.END" />
            検討終了
          </button>
          <button v-if="controlStates.analysis" @click="onAnalysis">
            <ButtonIcon class="icon" :icon="Icon.ANALYSIS" />
            解析
          </button>
          <button v-if="controlStates.endAnalysis" @click="onEndAnalysis">
            <ButtonIcon class="icon" :icon="Icon.STOP" />
            解析中断
          </button>
          <button
            v-if="controlStates.startEditPosition"
            @click="onStartEditPosition"
          >
            <ButtonIcon class="icon" :icon="Icon.EDIT" />
            局面編集
          </button>
          <button
            v-if="controlStates.endEditPosition"
            @click="onEndEditPosition"
          >
            <ButtonIcon class="icon" :icon="Icon.CHECK" />
            局面編集終了
          </button>
          <button v-if="controlStates.initPosition" @click="onChangeTurn">
            <ButtonIcon class="icon" :icon="Icon.SWAP" />
            手番変更
          </button>
          <select v-if="controlStates.initPosition" @change="onInitPosition">
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
          <button @click="onOpenAppSettings">
            <ButtonIcon class="icon" :icon="Icon.SETTINGS" />
            アプリ設定
          </button>
          <button
            :disabled="!controlStates.engineSettings"
            @click="onOpenEngineSettings"
          >
            <ButtonIcon class="icon" :icon="Icon.ENGINE_SETTINGS" />
            エンジン設定
          </button>
          <button @click="onFlip">
            <ButtonIcon class="icon" :icon="Icon.FLIP" />
            盤面反転
          </button>
          <button :disabled="!controlStates.paste" @click="onPaste">
            <ButtonIcon class="icon" :icon="Icon.PASTE" />
            棋譜貼り付け
          </button>
          <button @click="onCopy">
            <ButtonIcon class="icon" :icon="Icon.COPY" />
            棋譜コピー
          </button>
          <button :disabled="!controlStates.removeAfter" @click="onRemoveAfter">
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
import { Mode } from "@/store/mode";
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
      if (store.mode === Mode.GAME) {
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

    const allowEdit = computed(() => store.mode === Mode.POSITION_EDITING);

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
      store.mode === Mode.GAME ? store.blackTimeMs : undefined
    );
    const blackPlayerByoyomi = computed(() =>
      store.mode === Mode.GAME ? store.blackByoyomi : undefined
    );
    const whitePlayerTimeMs = computed(() =>
      store.mode === Mode.GAME ? store.whiteTimeMs : undefined
    );
    const whitePlayerByoyomi = computed(() =>
      store.mode === Mode.GAME ? store.whiteByoyomi : undefined
    );

    const controlStates = computed(() => {
      return {
        game: store.mode === Mode.NORMAL,
        stop: store.mode === Mode.GAME,
        resign: store.mode === Mode.GAME && store.isMovableByUser,
        research: store.mode === Mode.NORMAL,
        endResearch: store.mode === Mode.RESEARCH,
        analysis: store.mode === Mode.NORMAL,
        endAnalysis: store.mode === Mode.ANALYSIS,
        startEditPosition: store.mode === Mode.NORMAL,
        endEditPosition: store.mode === Mode.POSITION_EDITING,
        initPosition: store.mode === Mode.POSITION_EDITING,
        removeAfter: store.mode === Mode.NORMAL || store.mode === Mode.RESEARCH,
        paste: store.mode === Mode.NORMAL,
        engineSettings: store.mode === Mode.NORMAL,
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
.control select {
  width: 100%;
  height: 15%;
  color: var(--control-button-color);
  background-color: var(--control-button-bg-color);
}
</style>
