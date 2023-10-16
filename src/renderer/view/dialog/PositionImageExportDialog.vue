<template>
  <div>
    <dialog ref="dialog">
      <div class="row">
        <div ref="board" class="board" :class="appSetting.positionImageStyle">
          <div v-if="appSetting.positionImageStyle === PositionImageStyle.BOOK" class="book">
            <SimpleBoardView
              :max-size="maxSize"
              :position="record.position"
              :black-name="blackName"
              :white-name="whiteName"
              :hide-white-hand="
                appSetting.positionImageHandLabelType === PositionImageHandLabelType.TSUME_SHOGI
              "
              :header="header"
              :footer="record.current.comment"
              :last-move="lastMove"
              :typeface="appSetting.positionImageTypeface"
            />
          </div>
          <div v-else class="game">
            <BoardView
              :board-image-type="appSetting.boardImage"
              :piece-stand-image-type="appSetting.pieceStandImage"
              :board-label-type="appSetting.boardLabelType"
              :piece-image-base-url="getPieceImageBaseURL(appSetting)"
              :king-piece-type="appSetting.kingPieceType"
              :custom-board-image-url="appSetting.boardImageFileURL"
              :custom-piece-stand-image-url="appSetting.pieceStandImageFileURL"
              :max-size="maxSize"
              :position="record.position"
              :last-move="lastMove"
              :flip="appSetting.boardFlipping"
              :black-player-name="blackPlayerName"
              :white-player-name="whitePlayerName"
            />
          </div>
        </div>
        <div
          v-if="appSetting.positionImageStyle === PositionImageStyle.BOOK"
          class="side-controls column"
        >
          <div class="form-item">
            {{ t.typeface }}
            <HorizontalSelector
              :value="appSetting.positionImageTypeface"
              :items="[
                { value: PositionImageTypeface.GOTHIC, label: t.gothic },
                { value: PositionImageTypeface.MINCHO, label: t.mincho },
              ]"
              @change="changeTypeface"
            />
          </div>
          <div class="form-item">
            {{ t.handLabel }}
            <HorizontalSelector
              :value="appSetting.positionImageHandLabelType"
              :items="[
                { value: PositionImageHandLabelType.PLAYER_NAME, label: t.playerName },
                { value: PositionImageHandLabelType.SENTE_GOTE, label: '「先手｜後手」' },
                { value: PositionImageHandLabelType.MOCHIGOMA, label: '「持駒」' },
                { value: PositionImageHandLabelType.TSUME_SHOGI, label: t.tsumeShogi },
                { value: PositionImageHandLabelType.NONE, label: t.none },
              ]"
              @change="changeHandLabel"
            />
          </div>
          <div class="form-item">
            {{ t.header }}
            <input
              class="header"
              :value="appSetting.positionImageHeader"
              :placeholder="t.typeCustomTitleHere"
              @input="changeHeaderText"
            />
            <ToggleButton
              :value="appSetting.useBookmarkAsPositionImageHeader"
              :label="t.useBookmarkAsHeader"
              @change="changeWhetherToUseBookmark"
            />
          </div>
        </div>
      </div>
      <div>
        <div class="form-item center">
          <HorizontalSelector
            :value="appSetting.positionImageStyle"
            :items="[
              { value: PositionImageStyle.BOOK, label: t.bookStyle },
              { value: PositionImageStyle.GAME, label: t.gameStyle },
            ]"
            @change="changeType"
          />
          <input
            class="size"
            type="number"
            min="400"
            max="2000"
            :value="appSetting.positionImageSize"
            @input="changeSize"
          />
          <span class="form-item-unit">px</span>
        </div>
      </div>
      <div class="main-buttons">
        <button autofocus data-hotkey="Enter" @click="saveAsPNG">
          <Icon :icon="IconType.SAVE" />
          <span>PNG</span>
        </button>
        <button autofocus data-hotkey="Enter" @click="saveAsJPEG">
          <Icon :icon="IconType.SAVE" />
          <span>JPEG</span>
        </button>
        <button autofocus data-hotkey="Escape" @click="close">
          <Icon :icon="IconType.CLOSE" />
          <span>{{ t.close }}</span>
        </button>
      </div>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { t } from "@/common/i18n";
import BoardView from "@/renderer/view/primitive/BoardView.vue";
import SimpleBoardView from "@/renderer/view/primitive/SimpleBoardView.vue";
import Icon from "@/renderer/view/primitive/Icon.vue";
import { showModalDialog } from "@/renderer/helpers/dialog";
import { installHotKeyForDialog, uninstallHotKeyForDialog } from "@/renderer/keyboard/hotkey";
import { useAppSetting } from "@/renderer/store/setting";
import { Rect, RectSize } from "@/common/graphics";
import { Color, Move, formatMove } from "@/common/shogi";
import { useStore } from "@/renderer/store";
import { IconType } from "@/renderer/assets/icons";
import api from "@/renderer/ipc/api";
import { Lazy } from "@/renderer/helpers/lazy";
import {
  PositionImageHandLabelType,
  PositionImageStyle,
  PositionImageTypeface,
  getPieceImageBaseURL,
} from "@/common/settings/app";
import {
  getBlackPlayerName,
  getBlackPlayerNamePreferShort,
  getWhitePlayerName,
  getWhitePlayerNamePreferShort,
} from "@/common/helpers/metadata";
import HorizontalSelector from "../primitive/HorizontalSelector.vue";
import ToggleButton from "../primitive/ToggleButton.vue";

const lazyUpdateDelay = 100;
const marginHor = 150;
const marginVer = 200;
const aspectRatio = 16 / 9;

const store = useStore();
const appSetting = useAppSetting();
const blackPlayerName = computed(() => getBlackPlayerName(store.record.metadata) || t.sente);
const whitePlayerName = computed(() => getWhitePlayerName(store.record.metadata) || t.gote);
const record = store.record;
const lastMove = record.current.move instanceof Move ? record.current.move : null;
const dialog = ref();
const board = ref();
const windowSize = reactive(new RectSize(window.innerWidth, window.innerHeight));
const zoom = ref(window.devicePixelRatio);

const windowLazyUpdate = new Lazy();
const updateSize = () => {
  windowLazyUpdate.after(() => {
    windowSize.width = window.innerWidth;
    windowSize.height = window.innerHeight;
  }, lazyUpdateDelay);
  zoom.value = window.devicePixelRatio;
};

onMounted(() => {
  showModalDialog(dialog.value);
  installHotKeyForDialog(dialog.value);
  window.addEventListener("resize", updateSize);
});

onBeforeUnmount(() => {
  uninstallHotKeyForDialog(dialog.value);
  window.removeEventListener("resize", updateSize);
});

const maxSize = computed(() => {
  const height = appSetting.positionImageSize / zoom.value;
  const width = height * aspectRatio;
  const maxWidth = windowSize.width - marginHor;
  const maxHeight = windowSize.height - marginVer;
  return new RectSize(Math.min(width, maxWidth), Math.min(height, maxHeight));
});

const header = computed(() => {
  return (
    (appSetting.useBookmarkAsPositionImageHeader && record.current.bookmark) ||
    appSetting.positionImageHeader ||
    (lastMove
      ? `${record.current.ply}手目 ${formatMove(record.position, lastMove)}まで`
      : record.current.nextColor === Color.BLACK
      ? "先手番"
      : "後手番")
  );
});

const blackName = computed(() => {
  switch (appSetting.positionImageHandLabelType) {
    case PositionImageHandLabelType.PLAYER_NAME:
      return getBlackPlayerNamePreferShort(record.metadata) || "先手";
    case PositionImageHandLabelType.SENTE_GOTE:
      return "先手";
    case PositionImageHandLabelType.MOCHIGOMA:
    case PositionImageHandLabelType.TSUME_SHOGI:
      return "持駒";
    default:
      return undefined;
  }
});

const whiteName = computed(() => {
  switch (appSetting.positionImageHandLabelType) {
    case PositionImageHandLabelType.PLAYER_NAME:
      return getWhitePlayerNamePreferShort(record.metadata) || "後手";
    case PositionImageHandLabelType.SENTE_GOTE:
      return "後手";
    case PositionImageHandLabelType.MOCHIGOMA:
      return "持駒";
    default:
      return undefined;
  }
});

const changeSize = (e: Event) => {
  const elem = e.target as HTMLInputElement;
  appSetting.updateAppSetting({
    positionImageSize: parseInt(elem.value) || 400,
  });
};

const changeTypeface = (value: string) => {
  appSetting.updateAppSetting({ positionImageTypeface: value as PositionImageTypeface });
};

const changeHandLabel = (value: string) => {
  appSetting.updateAppSetting({ positionImageHandLabelType: value as PositionImageHandLabelType });
};

const changeHeaderText = (e: Event) => {
  const elem = e.target as HTMLInputElement;
  appSetting.updateAppSetting({
    positionImageHeader: elem.value,
  });
};

const changeWhetherToUseBookmark = (value: boolean) => {
  appSetting.updateAppSetting({
    useBookmarkAsPositionImageHeader: value,
  });
};

const changeType = (value: string) => {
  appSetting.updateAppSetting({ positionImageStyle: value as PositionImageStyle });
};

const getRect = () => {
  const elem = board.value as HTMLElement;
  const domRect = elem.getBoundingClientRect();
  return new Rect(domRect.x, domRect.y, domRect.width, domRect.height);
};

const saveAsPNG = () => {
  api.exportCaptureAsPNG(getRect()).catch((e) => {
    store.pushError(e);
  });
};

const saveAsJPEG = () => {
  api.exportCaptureAsJPEG(getRect()).catch((e) => {
    store.pushError(e);
  });
};

const close = () => {
  store.closeModalDialog();
};
</script>

<style scoped>
.board {
  padding: 5px;
  margin: auto;
}
.board.game {
  background-color: var(--main-bg-color);
}
.board.book {
  background-color: white;
}
.side-controls {
  margin-left: 10px;
  width: 300px;
}
.side-controls > .form-item {
  display: flex;
  flex-direction: column;
}
.side-controls > .form-item > :not(:first-child) {
  margin-top: 5px;
}
.form-item > * {
  vertical-align: middle;
}
input.size {
  width: 50px;
  text-align: right;
}
input.header {
  width: 100%;
}
</style>