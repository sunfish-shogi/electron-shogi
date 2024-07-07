<template>
  <div>
    <BoardView
      :board-image-type="appSettings.boardImage"
      :piece-stand-image-type="appSettings.pieceStandImage"
      :board-label-type="appSettings.boardLabelType"
      :piece-image-url-template="getPieceImageURLTemplate(appSettings)"
      :king-piece-type="appSettings.kingPieceType"
      :custom-board-image-url="appSettings.boardImageFileURL"
      :custom-piece-stand-image-url="appSettings.pieceStandImageFileURL"
      :board-image-opacity="appSettings.enableTransparent ? appSettings.boardOpacity : 1"
      :piece-stand-image-opacity="appSettings.enableTransparent ? appSettings.pieceStandOpacity : 1"
      :max-size="maxSize"
      :position="store.record.position"
      :last-move="lastMove"
      :flip="appSettings.boardFlipping"
      :hide-clock="store.appState !== AppState.GAME && store.appState !== AppState.CSA_GAME"
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
        <ControlPane
          v-show="rightControlType !== RightSideControlType.NONE"
          :group="ControlGroup.Group1"
        />
      </template>
      <template #left-control>
        <ControlPane
          v-show="leftControlType !== LeftSideControlType.NONE"
          :group="ControlGroup.Group2"
        />
      </template>
    </BoardView>
  </div>
</template>

<script setup lang="ts">
import { t } from "@/common/i18n";
import { computed, PropType } from "vue";
import BoardView from "@/renderer/view/primitive/BoardView.vue";
import { Move, PositionChange, getBlackPlayerName, getWhitePlayerName } from "tsshogi";
import { RectSize } from "@/common/assets/geometry.js";
import { useStore } from "@/renderer/store";
import ControlPane, { ControlGroup } from "@/renderer/view/main/ControlPane.vue";
import { AppState } from "@/common/control/state.js";
import { humanPlayer } from "@/renderer/players/human";
import { CSAGameState } from "@/renderer/store/csa";
import { useAppSettings } from "@/renderer/store/settings";
import {
  RightSideControlType,
  LeftSideControlType,
  getPieceImageURLTemplate,
} from "@/common/settings/app";

defineProps({
  maxSize: {
    type: RectSize,
    required: true,
  },
  leftControlType: {
    type: String as PropType<LeftSideControlType>,
    required: false,
    default: LeftSideControlType.STANDARD,
  },
  rightControlType: {
    type: String as PropType<RightSideControlType>,
    required: false,
    default: RightSideControlType.STANDARD,
  },
});

const emit = defineEmits<{
  resize: [RectSize];
}>();

const store = useStore();
const appSettings = useAppSettings();

const onResize = (size: RectSize) => {
  emit("resize", size);
};

const onMove = (move: Move) => {
  if (store.appState === AppState.GAME || store.appState === AppState.CSA_GAME) {
    humanPlayer.doMove(move);
  } else {
    store.doMove(move);
  }
};

const onEdit = (change: PositionChange) => {
  store.editPosition(change);
};

const lastMove = computed(() => {
  const move = store.record.current.move;
  return move instanceof Move ? move : undefined;
});

const blackPlayerName = computed(() => getBlackPlayerName(store.record.metadata) || t.sente);
const whitePlayerName = computed(() => getWhitePlayerName(store.record.metadata) || t.gote);

const clock = computed(() => {
  if (store.appState === AppState.GAME || store.csaGameState === CSAGameState.GAME) {
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
</script>
