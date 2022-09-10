<template>
  <div>
    <BoardView
      :piece-image-type="appSetting.pieceImage"
      :board-image-type="appSetting.boardImage"
      :board-label-type="appSetting.boardLabelType"
      :max-size="maxSize"
      :position="position"
      :last-move="lastMove"
      :flip="appSetting.boardFlipping"
      :allow-move="allowMove"
      :allow-edit="allowEdit"
      :black-player-name="blackPlayerName"
      :white-player-name="whitePlayerName"
      :black-player-time="clock?.black.time"
      :black-player-byoyomi="clock?.black.byoyomi"
      :white-player-time="clock?.white.time"
      :white-player-byoyomi="clock?.white.byoyomi"
      @resize="onResize"
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
          <button v-if="controlStates.win" class="control-item" @click="onWin">
            <ButtonIcon class="icon" :icon="Icon.CALL" />
            勝ち宣言
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
          <button
            v-if="controlStates.initPosition"
            class="control-item"
            @click="onInitPosition"
          >
            局面の初期化
          </button>
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
          <button class="control-item" @click="onFileAction">
            <ButtonIcon class="icon" :icon="Icon.FILE" />
            ファイル
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
    <GameMenu v-if="isGameMenuVisible" @close="isGameMenuVisible = false" />
    <FileMenu v-if="isFileMenuVisible" @close="isFileMenuVisible = false" />
    <InitialPositionMenu
      v-if="isInitialPositionMenuVisible"
      @close="isInitialPositionMenuVisible = false"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from "vue";
import BoardView from "@/components/primitive/BoardView.vue";
import { Move, PositionChange, RecordMetadataKey } from "@/shogi";
import { RectSize } from "@/components/primitive/Types";
import { useStore } from "@/store";
import ButtonIcon from "@/components/primitive/ButtonIcon.vue";
import { AppState } from "@/store/state";
import { humanPlayer } from "@/players/human";
import { Icon } from "@/assets/icons";
import GameMenu from "@/components/menu/GameMenu.vue";
import FileMenu from "@/components/menu/FileMenu.vue";
import InitialPositionMenu from "@/components/menu/InitialPositionMenu.vue";
import { CSAGameState } from "@/store/csa";

export default defineComponent({
  name: "BoardPane",
  components: {
    BoardView,
    ButtonIcon,
    GameMenu,
    FileMenu,
    InitialPositionMenu,
  },
  props: {
    maxSize: {
      type: RectSize,
      required: true,
    },
  },
  emits: ["resize"],
  setup(_, context) {
    const store = useStore();
    const isGameMenuVisible = ref(false);
    const isFileMenuVisible = ref(false);
    const isInitialPositionMenuVisible = ref(false);

    const onResize = (size: RectSize) => {
      context.emit("resize", size);
    };

    const onMove = (move: Move) => {
      if (
        store.appState === AppState.GAME ||
        store.appState === AppState.CSA_GAME
      ) {
        humanPlayer.doMove(move);
      } else {
        store.doMove(move);
      }
    };

    const onEdit = (change: PositionChange) => {
      store.editPosition(change);
    };

    const onGame = () => {
      isGameMenuVisible.value = true;
    };

    const onStop = () => {
      store.stopGame();
    };

    const onWin = () => {
      humanPlayer.win();
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

    const onInitPosition = () => {
      isInitialPositionMenuVisible.value = true;
    };

    const onChangeTurn = () => {
      store.changeTurn();
    };

    const onOpenAppSettings = () => {
      store.showAppSettingDialog();
    };

    const onOpenEngineSettings = () => {
      store.showUsiEngineManagementDialog();
    };

    const onFlip = () => {
      useStore().flipBoard();
    };

    const onFileAction = () => {
      isFileMenuVisible.value = true;
    };

    const onRemoveAfter = () => {
      store.removeRecordAfter();
    };

    const allowEdit = computed(
      () => store.appState === AppState.POSITION_EDITING
    );

    const allowMove = computed(() => store.isMovableByUser);

    const appSetting = computed(() => store.appSetting);

    const position = computed(() => store.record.position);

    const lastMove = computed(() => {
      const move = store.record.current.move;
      return move instanceof Move ? move : undefined;
    });

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

    const clock = computed(() => {
      if (
        store.appState === AppState.GAME ||
        store.csaGameState === CSAGameState.GAME
      ) {
        return {
          black: {
            time: store.blackTime,
            byoyomi: store.blackByoyomi,
          },
          white: {
            time: store.whiteTime,
            byoyomi: store.whiteByoyomi,
          },
        };
      }
      return undefined;
    });

    const controlStates = computed(() => {
      return {
        game: store.appState === AppState.NORMAL,
        stop:
          store.appState === AppState.GAME ||
          store.appState === AppState.CSA_GAME,
        win: store.appState === AppState.CSA_GAME && store.isMovableByUser,
        resign:
          (store.appState === AppState.GAME ||
            store.appState === AppState.CSA_GAME) &&
          store.isMovableByUser,
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
        engineSettings: store.appState === AppState.NORMAL,
      };
    });

    return {
      isGameMenuVisible,
      isFileMenuVisible,
      isInitialPositionMenuVisible,
      appSetting,
      position,
      lastMove,
      blackPlayerName,
      whitePlayerName,
      clock,
      controlStates,
      onResize,
      onMove,
      onEdit,
      onGame,
      onStop,
      onWin,
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
      onFileAction,
      onRemoveAfter,
      allowEdit,
      allowMove,
      Icon,
    };
  },
});
</script>

<style scoped>
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
  height: 19%;
  font-size: 100%;
  text-align: left;
  line-height: 200%;
  padding: 0 5% 0 5%;
}
.control.top .control-item:not(:last-child) {
  margin-bottom: 1%;
}
.control.bottom .control-item:not(:last-child) {
  margin-top: 1%;
}
.control .control-item .icon {
  height: 68%;
  vertical-align: top;
}
.control select {
  width: 100%;
  height: 15%;
  color: var(--control-button-color);
  background-color: var(--control-button-bg-color);
}
</style>
