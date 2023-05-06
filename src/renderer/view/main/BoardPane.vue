<template>
  <div>
    <BoardView
      :board-image-type="appSetting.boardImage"
      :piece-stand-image-type="appSetting.pieceStandImage"
      :board-label-type="appSetting.boardLabelType"
      :piece-image-base-url="getPieceImageBaseURL(appSetting)"
      :custom-board-image-url="appSetting.boardImageFileURL"
      :custom-piece-stand-image-url="appSetting.pieceStandImageFileURL"
      :max-size="maxSize"
      :position="store.record.position"
      :last-move="lastMove"
      :flip="appSetting.boardFlipping"
      :allow-move="store.isMovableByUser"
      :allow-edit="store.appState === AppState.POSITION_EDITING"
      :black-player-name="blackPlayerName"
      :white-player-name="whitePlayerName"
      :black-player-time="clock?.black.time"
      :black-player-byoyomi="clock?.black.byoyomi"
      :white-player-time="clock?.white.time"
      :white-player-byoyomi="clock?.white.byoyomi"
      :next-move-label="t.nextTurn"
      @resize="onResize"
      @move="onMove"
      @edit="onEdit"
    >
      <template #right-control>
        <div
          ref="rightControl"
          class="full column top-control"
          :class="{
            hidden:
              appSetting.rightSideControlType === RightSideControlType.NONE,
          }"
        >
          <button
            v-if="controlStates.game"
            class="control-item"
            @click="onGame"
          >
            <Icon :icon="IconType.GAME" />
            <span>{{ t.game }}</span>
          </button>
          <button
            v-if="controlStates.showGameResults"
            class="control-item"
            @click="onShowGameResults"
          >
            <Icon :icon="IconType.SCORE" />
            <span>{{ t.displayGameResults }}</span>
          </button>
          <button
            v-if="controlStates.stop"
            class="control-item"
            data-hotkey="Escape"
            @click="onStop"
          >
            <Icon :icon="IconType.STOP" />
            <span>{{ t.stopGame }}</span>
          </button>
          <button v-if="controlStates.win" class="control-item" @click="onWin">
            <Icon :icon="IconType.CALL" />
            <span>{{ t.declareWinning }}</span>
          </button>
          <button
            v-if="controlStates.resign"
            class="control-item"
            @click="onResign"
          >
            <Icon :icon="IconType.RESIGN" />
            <span>{{ t.resign }}</span>
          </button>
          <button
            v-if="controlStates.research"
            class="control-item"
            data-hotkey="Control+r"
            @click="onResearch"
          >
            <Icon :icon="IconType.RESEARCH" />
            <span>{{ t.research }}</span>
          </button>
          <button
            v-if="controlStates.endResearch"
            class="control-item"
            data-hotkey="Escape"
            @click="onEndResearch"
          >
            <Icon :icon="IconType.END" />
            <span>{{ t.endResearch }}</span>
          </button>
          <button
            v-if="controlStates.analysis"
            class="control-item"
            data-hotkey="Control+a"
            @click="onAnalysis"
          >
            <Icon :icon="IconType.ANALYSIS" />
            <span>{{ t.analysis }}</span>
          </button>
          <button
            v-if="controlStates.endAnalysis"
            class="control-item"
            data-hotkey="Escape"
            @click="onEndAnalysis"
          >
            <Icon :icon="IconType.STOP" />
            <span>{{ t.stopAnalysis }}</span>
          </button>
          <button
            v-if="controlStates.mateSearch"
            class="control-item"
            data-hotkey="Control+m"
            @click="onMateSearch"
          >
            <Icon :icon="IconType.MATE_SEARCH" />
            <span>{{ t.mateSearch }}</span>
          </button>
          <button
            v-if="controlStates.stopMateSearch"
            class="control-item"
            data-hotkey="Escape"
            @click="onStopMateSearch"
          >
            <Icon :icon="IconType.END" />
            <span>{{ t.stopMateSearch }}</span>
          </button>
          <button
            v-if="controlStates.startEditPosition"
            class="control-item"
            @click="onStartEditPosition"
          >
            <Icon :icon="IconType.EDIT" />
            <span>{{ t.setupPosition }}</span>
          </button>
          <button
            v-if="controlStates.endEditPosition"
            class="control-item"
            @click="onEndEditPosition"
          >
            <Icon :icon="IconType.CHECK" />
            <span>{{ t.completePositionSetup }}</span>
          </button>
          <button
            v-if="controlStates.initPosition"
            class="control-item"
            @click="onChangeTurn"
          >
            <Icon :icon="IconType.SWAP" />
            <span>{{ t.changeTurn }}</span>
          </button>
          <button
            v-if="controlStates.initPosition"
            class="control-item"
            @click="onInitPosition"
          >
            <span>{{ t.initializePosition }}</span>
          </button>
        </div>
      </template>
      <template #left-control>
        <div
          ref="leftControl"
          class="full column reverse bottom-control"
          :class="{
            hidden: appSetting.leftSideControlType === LeftSideControlType.NONE,
          }"
        >
          <button
            class="control-item"
            data-hotkey="Control+,"
            @click="onOpenAppSettings"
          >
            <Icon :icon="IconType.SETTINGS" />
            <span>{{ t.appSettings }}</span>
          </button>
          <button
            class="control-item"
            data-hotkey="Control+."
            :disabled="!controlStates.engineSettings"
            @click="onOpenEngineSettings"
          >
            <Icon :icon="IconType.ENGINE_SETTINGS" />
            <span>{{ t.engineSettings }}</span>
          </button>
          <button class="control-item" data-hotkey="Control+t" @click="onFlip">
            <Icon :icon="IconType.FLIP" />
            <span>{{ t.flipBoard }}</span>
          </button>
          <button class="control-item" @click="onFileAction">
            <Icon :icon="IconType.FILE" />
            <span>{{ t.file }}</span>
          </button>
          <button
            class="control-item"
            data-hotkey="Control+d"
            :disabled="!controlStates.removeCurrentMove"
            @click="onRemoveCurrentMove"
          >
            <Icon :icon="IconType.DELETE" />
            <span>{{ t.deleteMove }}</span>
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

<script setup lang="ts">
import { t } from "@/common/i18n";
import {
  computed,
  onUpdated,
  onBeforeUpdate,
  ref,
  onMounted,
  onBeforeUnmount,
} from "vue";
import BoardView from "@/renderer/view/primitive/BoardView.vue";
import { Move, PositionChange } from "@/common/shogi";
import { RectSize } from "@/common/graphics.js";
import { useStore } from "@/renderer/store";
import Icon from "@/renderer/view/primitive/Icon.vue";
import { AppState } from "@/common/control/state.js";
import { humanPlayer } from "@/renderer/players/human";
import { IconType } from "@/renderer/assets/icons";
import GameMenu from "@/renderer/view/menu/GameMenu.vue";
import FileMenu from "@/renderer/view/menu/FileMenu.vue";
import InitialPositionMenu from "@/renderer/view/menu/InitialPositionMenu.vue";
import { CSAGameState } from "@/renderer/store/csa";
import {
  installHotKeyForMainWindow,
  uninstallHotKeyForMainWindow,
} from "@/renderer/keyboard/hotkey";
import { useAppSetting } from "@/renderer/store/setting";
import {
  RightSideControlType,
  LeftSideControlType,
  getPieceImageBaseURL,
} from "@/common/settings/app";
import {
  getBlackPlayerName,
  getWhitePlayerName,
} from "@/common/helpers/metadata";

defineProps({
  maxSize: {
    type: RectSize,
    required: true,
  },
});

const emit = defineEmits(["resize"]);

const store = useStore();
const appSetting = useAppSetting();
const rightControl = ref();
const leftControl = ref();
const isGameMenuVisible = ref(false);
const isFileMenuVisible = ref(false);
const isInitialPositionMenuVisible = ref(false);

onMounted(() => {
  installHotKeyForMainWindow(rightControl.value);
  installHotKeyForMainWindow(leftControl.value);
});

onUpdated(() => {
  installHotKeyForMainWindow(rightControl.value);
  installHotKeyForMainWindow(leftControl.value);
});

onBeforeUpdate(() => {
  uninstallHotKeyForMainWindow(rightControl.value);
  uninstallHotKeyForMainWindow(leftControl.value);
});

onBeforeUnmount(() => {
  uninstallHotKeyForMainWindow(rightControl.value);
  uninstallHotKeyForMainWindow(leftControl.value);
});

const onResize = (size: RectSize) => {
  emit("resize", size);
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

const onShowGameResults = () => {
  store.showGameResults();
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

const onMateSearch = () => {
  store.showMateSearchDialog();
};

const onStopMateSearch = () => {
  store.stopMateSearch();
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
  appSetting.flipBoard();
};

const onFileAction = () => {
  isFileMenuVisible.value = true;
};

const onRemoveCurrentMove = () => {
  store.removeCurrentMove();
};

const lastMove = computed(() => {
  const move = store.record.current.move;
  return move instanceof Move ? move : undefined;
});

const blackPlayerName = computed(() =>
  getBlackPlayerName(store.record.metadata)
);
const whitePlayerName = computed(() =>
  getWhitePlayerName(store.record.metadata)
);

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
    showGameResults:
      store.appState === AppState.GAME && store.gameSetting.repeat >= 2,
    stop:
      store.appState === AppState.GAME || store.appState === AppState.CSA_GAME,
    win: store.appState === AppState.CSA_GAME && store.isMovableByUser,
    resign:
      (store.appState === AppState.GAME ||
        store.appState === AppState.CSA_GAME) &&
      store.isMovableByUser,
    research: store.appState === AppState.NORMAL,
    endResearch: store.appState === AppState.RESEARCH,
    analysis: store.appState === AppState.NORMAL,
    endAnalysis: store.appState === AppState.ANALYSIS,
    mateSearch: store.appState === AppState.NORMAL,
    stopMateSearch: store.appState === AppState.MATE_SEARCH,
    startEditPosition: store.appState === AppState.NORMAL,
    endEditPosition: store.appState === AppState.POSITION_EDITING,
    initPosition: store.appState === AppState.POSITION_EDITING,
    removeCurrentMove:
      store.appState === AppState.NORMAL ||
      store.appState === AppState.RESEARCH ||
      store.appState === AppState.MATE_SEARCH,
    engineSettings: store.appState === AppState.NORMAL,
  };
});
</script>

<style scoped>
.control-item {
  width: 100%;
  height: 19%;
  font-size: 100%;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: clip;
  line-height: 200%;
  padding: 0 5% 0 5%;
}
.top-control .control-item:not(:last-child) {
  margin-bottom: 1%;
}
.bottom-control .control-item:not(:last-child) {
  margin-top: 1%;
}
.control-item .icon {
  height: 68%;
}
</style>
