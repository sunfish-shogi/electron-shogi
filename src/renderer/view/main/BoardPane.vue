<template>
  <div>
    <BoardView
      :board-image-type="appSetting.boardImage"
      :piece-stand-image-type="appSetting.pieceStandImage"
      :board-label-type="appSetting.boardLabelType"
      :piece-image-url-template="getPieceImageURLTemplate(appSetting)"
      :king-piece-type="appSetting.kingPieceType"
      :custom-board-image-url="appSetting.boardImageFileURL"
      :custom-piece-stand-image-url="appSetting.pieceStandImageFileURL"
      :board-image-opacity="appSetting.enableTransparent ? appSetting.boardOpacity : 1"
      :piece-stand-image-opacity="appSetting.enableTransparent ? appSetting.pieceStandOpacity : 1"
      :max-size="maxSize"
      :position="store.record.position"
      :last-move="lastMove"
      :flip="appSetting.boardFlipping"
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
import { useAppSetting } from "@/renderer/store/setting";
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
const appSetting = useAppSetting();

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
