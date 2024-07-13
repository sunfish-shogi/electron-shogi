<template>
  <div ref="root" class="full">
    <div v-show="group === ControlGroup.Group1" class="full column control-box">
      <!-- 検討 -->
      <button
        v-show="store.researchState !== ResearchState.RUNNING"
        class="control-item"
        data-hotkey="Mod+r"
        @click="onResearch"
      >
        <Icon :icon="IconType.RESEARCH" />
        <span>{{ t.research }}</span>
      </button>
      <!-- 検討終了 -->
      <button
        v-show="store.researchState === ResearchState.RUNNING"
        class="control-item close"
        data-hotkey="Escape"
        @click="onEndResearch"
      >
        <Icon :icon="IconType.END" />
        <span>{{ t.endResearch }}</span>
      </button>
      <!-- 対局 -->
      <button v-show="store.appState === AppState.NORMAL" class="control-item" @click="onGame">
        <Icon :icon="IconType.GAME" />
        <span>{{ t.game }}</span>
      </button>
      <!-- 対局中断 -->
      <button
        v-show="store.appState === AppState.GAME || store.appState === AppState.CSA_GAME"
        class="control-item close"
        data-hotkey="Escape"
        @click="onStop"
      >
        <Icon :icon="IconType.STOP" />
        <span>{{ t.stopGame }}</span>
      </button>
      <!-- 勝ち宣言 -->
      <button
        v-show="
          store.isMovableByUser &&
          (store.appState === AppState.CSA_GAME ||
            (store.appState === AppState.GAME &&
              DeclarableJishogiRules.includes(store.gameSettings.jishogiRule)))
        "
        class="control-item close"
        @click="onWin"
      >
        <Icon :icon="IconType.CALL" />
        <span>{{ t.declareWinning }}</span>
      </button>
      <!-- 投了 -->
      <button
        v-show="
          (store.appState === AppState.GAME || store.appState === AppState.CSA_GAME) &&
          store.isMovableByUser
        "
        class="control-item close"
        @click="onResign"
      >
        <Icon :icon="IconType.RESIGN" />
        <span>{{ t.resign }}</span>
      </button>
      <!-- 持将棋の点数 -->
      <button
        v-show="store.appState === AppState.GAME || store.appState === AppState.CSA_GAME"
        class="control-item"
        @click="onJishogiPoints"
      >
        <Icon :icon="IconType.QUESTION" />
        <span>{{ t.jishogiPoints }}</span>
      </button>
      <!-- 戦績確認 -->
      <button
        v-show="store.appState === AppState.GAME && store.gameSettings.repeat >= 2"
        class="control-item"
        @click="onShowGameResults"
      >
        <Icon :icon="IconType.SCORE" />
        <span>{{ t.displayGameResults }}</span>
      </button>
      <!-- 解析 -->
      <button
        v-show="store.appState === AppState.NORMAL"
        class="control-item"
        data-hotkey="Mod+a"
        @click="onAnalysis"
      >
        <Icon :icon="IconType.ANALYSIS" />
        <span>{{ t.analysis }}</span>
      </button>
      <!-- 解析中断 -->
      <button
        v-show="store.appState === AppState.ANALYSIS"
        class="control-item close"
        data-hotkey="Escape"
        @click="onEndAnalysis"
      >
        <Icon :icon="IconType.STOP" />
        <span>{{ t.stopAnalysis }}</span>
      </button>
      <!-- 詰み探索 -->
      <button
        v-show="store.appState === AppState.NORMAL"
        class="control-item"
        data-hotkey="Mod+m"
        @click="onMateSearch"
      >
        <Icon :icon="IconType.MATE_SEARCH" />
        <span>{{ t.mateSearch }}</span>
      </button>
      <!-- 詰み探索終了 -->
      <button
        v-show="store.appState === AppState.MATE_SEARCH"
        class="control-item close"
        data-hotkey="Escape"
        @click="onStopMateSearch"
      >
        <Icon :icon="IconType.END" />
        <span>{{ t.stopMateSearch }}</span>
      </button>
      <!-- 局面編集 -->
      <button
        v-show="store.appState === AppState.NORMAL"
        class="control-item"
        @click="onStartEditPosition"
      >
        <Icon :icon="IconType.EDIT" />
        <span>{{ t.setupPosition }}</span>
      </button>
      <!-- 盤面編集終了 -->
      <button
        v-show="store.appState === AppState.POSITION_EDITING"
        class="control-item close"
        data-hotkey="Escape"
        @click="onEndEditPosition"
      >
        <Icon :icon="IconType.CHECK" />
        <span>{{ t.completePositionSetup }}</span>
      </button>
      <!-- 手番変更 -->
      <button
        v-show="store.appState === AppState.POSITION_EDITING"
        class="control-item"
        @click="onChangeTurn"
      >
        <Icon :icon="IconType.SWAP" />
        <span>{{ t.changeTurn }}</span>
      </button>
      <!-- 局面の初期化 -->
      <button
        v-show="store.appState === AppState.POSITION_EDITING"
        class="control-item"
        @click="onInitPosition"
      >
        <span>{{ t.initializePosition }}</span>
      </button>
      <!-- 駒の増減 -->
      <button
        v-show="store.appState === AppState.POSITION_EDITING"
        class="control-item"
        @click="onPieceSetChange"
      >
        <span>{{ t.changePieceSet }}</span>
      </button>
    </div>
    <div v-show="group === ControlGroup.Group2" class="full column control-box">
      <!-- 指し手削除 -->
      <button
        class="control-item"
        data-hotkey="Mod+d"
        :disabled="store.appState !== AppState.NORMAL"
        @click="onRemoveCurrentMove"
      >
        <Icon :icon="IconType.DELETE" />
        <span>{{ t.deleteMove }}</span>
      </button>
      <!-- ファイル -->
      <button class="control-item" @click="onFileAction">
        <Icon :icon="IconType.FILE" />
        <span>{{ t.file }}</span>
      </button>
      <!-- 盤面反転 -->
      <button class="control-item" data-hotkey="Mod+t" @click="onFlip">
        <Icon :icon="IconType.FLIP" />
        <span>{{ t.flipBoard }}</span>
      </button>
      <!-- エンジン設定 -->
      <button
        class="control-item"
        data-hotkey="Mod+."
        :disabled="store.appState !== AppState.NORMAL"
        @click="onOpenEngines"
      >
        <Icon :icon="IconType.ENGINE_SETTINGS" />
        <span>{{ t.manageEngines }}</span>
      </button>
      <!-- アプリ設定 -->
      <button class="control-item" data-hotkey="Mod+," @click="onOpenAppSettings">
        <Icon :icon="IconType.SETTINGS" />
        <span>{{ t.appSettings }}</span>
      </button>
    </div>
    <GameMenu v-if="isGameMenuVisible" @close="isGameMenuVisible = false" />
    <FileMenu v-if="isFileMenuVisible" @close="isFileMenuVisible = false" />
    <InitialPositionMenu
      v-if="isInitialPositionMenuVisible"
      @close="isInitialPositionMenuVisible = false"
    />
  </div>
</template>

<script lang="ts">
export enum ControlGroup {
  Group1,
  Group2,
}
</script>

<script setup lang="ts">
import { t } from "@/common/i18n";
import { useStore } from "@/renderer/store";
import { onBeforeUnmount, onMounted, PropType, ref } from "vue";
import Icon from "@/renderer/view/primitive/Icon.vue";
import { AppState, ResearchState } from "@/common/control/state.js";
import { IconType } from "@/renderer/assets/icons";
import GameMenu from "@/renderer/view/menu/GameMenu.vue";
import FileMenu from "@/renderer/view/menu/FileMenu.vue";
import { DeclarableJishogiRules } from "@/common/settings/game";
import InitialPositionMenu from "@/renderer/view/menu/InitialPositionMenu.vue";
import { humanPlayer } from "@/renderer/players/human";
import { useAppSettings } from "@/renderer/store/settings";
import {
  installHotKeyForMainWindow,
  uninstallHotKeyForMainWindow,
} from "@/renderer/devices/hotkey";
import { useConfirmationStore } from "@/renderer/store/confirm";

defineProps({
  group: {
    type: Number as PropType<ControlGroup>,
    required: true,
  },
});

const store = useStore();
const appSettings = useAppSettings();
const root = ref();
const isGameMenuVisible = ref(false);
const isFileMenuVisible = ref(false);
const isInitialPositionMenuVisible = ref(false);

onMounted(() => {
  installHotKeyForMainWindow(root.value);
});

onBeforeUnmount(() => {
  uninstallHotKeyForMainWindow(root.value);
});

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
  useConfirmationStore().show({
    message: t.areYouSureWantToDoDeclaration,
    onOk: () => {
      humanPlayer.win();
    },
  });
};

const onResign = () => {
  useConfirmationStore().show({
    message: t.areYouSureWantToResign,
    onOk: () => {
      humanPlayer.resign();
    },
  });
};

const onJishogiPoints = () => {
  store.showJishogiPoints();
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

const onPieceSetChange = () => {
  store.showPieceSetChangeDialog();
};

const onOpenAppSettings = () => {
  store.showAppSettingsDialog();
};

const onOpenEngines = () => {
  store.showUsiEngineManagementDialog();
};

const onFlip = () => {
  appSettings.flipBoard();
};

const onFileAction = () => {
  isFileMenuVisible.value = true;
};

const onRemoveCurrentMove = () => {
  store.removeCurrentMove();
};
</script>

<style scoped>
.control-item {
  width: 100%;
  height: 20%;
  font-size: 80%;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: clip;
  line-height: 200%;
  padding: 0 5% 0 5%;
}
.control-item .icon {
  height: 68%;
}
</style>
