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
            <ButtonIcon class="icon" icon="game" />
            対局
          </button>
          <button v-if="controlStates.stop" @click="onStop">
            <ButtonIcon class="icon" icon="stop" />
            中断
          </button>
          <button v-if="controlStates.resign" @click="onResign">
            <ButtonIcon class="icon" icon="resign" />
            投了
          </button>
          <button v-if="controlStates.research" @click="onResearch">
            <ButtonIcon class="icon" icon="research" />
            検討
          </button>
          <button v-if="controlStates.endResearch" @click="onEndResearch">
            <ButtonIcon class="icon" icon="end" />
            検討終了
          </button>
          <button
            v-if="controlStates.startEditPosition"
            @click="onStartEditPosition"
          >
            <ButtonIcon class="icon" icon="edit" />
            局面編集
          </button>
          <button
            v-if="controlStates.endEditPosition"
            @click="onEndEditPosition"
          >
            <ButtonIcon class="icon" icon="check" />
            局面編集終了
          </button>
          <button v-if="controlStates.initPosition" @click="onChangeTurn">
            <ButtonIcon class="icon" icon="swap" />
            手番変更
          </button>
          <button
            v-if="controlStates.initPosition"
            @click="onInitPositionStandard"
          >
            平手
          </button>
          <button
            v-if="controlStates.initPosition"
            @click="onInitPositionTsumeShogi"
          >
            詰将棋
          </button>
        </div>
      </template>
      <template #left-control>
        <div class="control bottom">
          <button
            :disabled="!controlStates.appSettings"
            @click="onOpenAppSettings"
          >
            <ButtonIcon class="icon" icon="settings" />
            アプリ設定
          </button>
          <button
            :disabled="!controlStates.engineSettings"
            @click="onOpenEngineSettings"
          >
            <ButtonIcon class="icon" icon="engineSettings" />
            エンジン設定
          </button>
          <button @click="onFlip">
            <ButtonIcon class="icon" icon="flip" />
            盤面反転
          </button>
          <button :disabled="!controlStates.paste" @click="onPaste">
            <ButtonIcon class="icon" icon="paste" />
            棋譜貼り付け
          </button>
          <button @click="onCopy">
            <ButtonIcon class="icon" icon="copy" />
            棋譜コピー
          </button>
          <button :disabled="!controlStates.removeAfter" @click="onRemoveAfter">
            <ButtonIcon class="icon" icon="delete" />
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

    const onStartEditPosition = () => {
      store.startPositionEditing();
    };

    const onEndEditPosition = () => {
      store.endPositionEditing();
    };

    const onInitPositionStandard = () => {
      store.initializePosition(InitialPositionType.STANDARD);
    };

    const onInitPositionTsumeShogi = () => {
      store.initializePosition(InitialPositionType.TSUME_SHOGI);
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
      return move instanceof Move ? move : null;
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
        startEditPosition: store.mode === Mode.NORMAL,
        endEditPosition: store.mode === Mode.POSITION_EDITING,
        initPosition: store.mode === Mode.POSITION_EDITING,
        removeAfter: store.mode === Mode.NORMAL || store.mode === Mode.RESEARCH,
        paste: store.mode === Mode.NORMAL,
        appSettings: store.mode === Mode.NORMAL,
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
