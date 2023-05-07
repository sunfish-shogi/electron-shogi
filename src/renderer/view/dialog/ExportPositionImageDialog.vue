<template>
  <div>
    <dialog ref="dialog">
      <div ref="board" class="board" :class="appSetting.positionImageStyle">
        <SimpleBoardView
          v-if="appSetting.positionImageStyle === PositionImageStyle.BOOK"
          :max-size="maxSize"
          :position="record.position"
          :header="appSetting.positionImageHeader || defaultHeader"
          :footer="record.current.comment"
          :last-move="lastMove"
        />
        <BoardView
          v-else
          :board-image-type="appSetting.boardImage"
          :piece-stand-image-type="appSetting.pieceStandImage"
          :board-label-type="appSetting.boardLabelType"
          :piece-image-base-url="getPieceImageBaseURL(appSetting)"
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
      <div class="form-item center">
        <select :value="appSetting.positionImageStyle" @change="changeType">
          <option :value="PositionImageStyle.BOOK">{{ t.bookStyle }}</option>
          <option :value="PositionImageStyle.GAME">{{ t.gameStyle }}</option>
        </select>
        <input
          ref="imageSize"
          class="size"
          type="number"
          min="400"
          max="2000"
          @input="changeSize"
        />
        <span class="form-item-unit">px</span>
        <input
          ref="headerText"
          :class="{
            hidden: appSetting.positionImageStyle === PositionImageStyle.GAME,
          }"
          class="header"
          :placeholder="t.typeCustomTitleHere"
          @input="changeHeaderText"
        />
      </div>
      <div class="form-item center">
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
import {
  installHotKeyForDialog,
  uninstallHotKeyForDialog,
} from "@/renderer/keyboard/hotkey";
import { useAppSetting } from "@/renderer/store/setting";
import { Rect, RectSize } from "@/common/graphics";
import { Color, Move, getMoveDisplayText } from "@/common/shogi";
import { useStore } from "@/renderer/store";
import { IconType } from "@/renderer/assets/icons";
import api from "@/renderer/ipc/api";
import { Lazy } from "@/renderer/helpers/lazy";
import {
  PositionImageStyle,
  getPieceImageBaseURL,
} from "@/common/settings/app";
import {
  getBlackPlayerName,
  getWhitePlayerName,
} from "@/common/helpers/metadata";

const lazyUpdateDelay = 100;
const marginHor = 80;
const marginVer = 150;
const aspectRatio = 16 / 9;

const store = useStore();
const appSetting = useAppSetting();
const blackPlayerName = computed(
  () => getBlackPlayerName(store.record.metadata) || t.sente
);
const whitePlayerName = computed(
  () => getWhitePlayerName(store.record.metadata) || t.gote
);
const record = store.record;
const lastMove =
  record.current.move instanceof Move ? record.current.move : null;
const dialog = ref();
const board = ref();
const imageSize = ref();
const headerText = ref();
const windowSize = reactive(
  new RectSize(window.innerWidth, window.innerHeight)
);
const zoom = ref(window.devicePixelRatio);
const defaultHeader = lastMove
  ? `${record.current.number}手目 ${getMoveDisplayText(
      record.position,
      lastMove
    )}まで`
  : record.current.nextColor === Color.BLACK
  ? "先手番"
  : "後手番";

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
  imageSize.value.value = appSetting.positionImageSize;
  headerText.value.value = appSetting.positionImageHeader;
});

onBeforeUnmount(() => {
  uninstallHotKeyForDialog(dialog.value);
  window.removeEventListener("resize", updateSize);
});

const maxSize = computed(() => {
  const height = appSetting.positionImageSize / zoom.value;
  const width = height * aspectRatio;
  return new RectSize(
    Math.min(width, windowSize.width - marginHor),
    Math.min(height, windowSize.height - marginVer)
  );
});

const changeSize = (e: Event) => {
  const elem = e.target as HTMLInputElement;
  appSetting.updateAppSetting({
    positionImageSize: parseInt(elem.value) || 400,
  });
};

const changeHeaderText = (e: Event) => {
  const elem = e.target as HTMLInputElement;
  appSetting.updateAppSetting({
    positionImageHeader: elem.value,
  });
};

const changeType = (e: Event) => {
  const elem = e.target as HTMLSelectElement;
  appSetting.updateAppSetting({
    positionImageStyle: elem.value as PositionImageStyle,
  });
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
input.size {
  width: 50px;
  text-align: right;
}
input.header {
  width: 200px;
}
</style>
