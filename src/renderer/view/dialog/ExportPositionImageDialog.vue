<template>
  <div>
    <dialog ref="dialog">
      <div ref="board" class="board" :class="appSetting.positionImageStyle">
        <SimpleBoardView
          v-if="appSetting.positionImageStyle === PositionImageStyle.BOOK"
          :piece-image-type="appSetting.pieceImage"
          :board-image-type="appSetting.boardImage"
          :board-label-type="appSetting.boardLabelType"
          :max-size="maxSize"
          :position="record.position"
          :header="appSetting.positionImageHeader || defaultHeader"
          :footer="record.current.comment"
          :last-move="lastMove"
          :black-player-name="blackPlayerShortName"
          :white-player-name="whitePlayerShortName"
        />
        <BoardView
          v-else
          :piece-image-type="appSetting.pieceImage"
          :board-image-type="appSetting.boardImage"
          :board-label-type="appSetting.boardLabelType"
          :max-size="maxSize"
          :position="record.position"
          :last-move="lastMove"
          :flip="appSetting.boardFlipping"
          :black-player-name="blackPlayerName"
          :white-player-name="whitePlayerName"
        />
      </div>
      <div class="control-items">
        <div>
          <span class="dialog-form-item-label">{{ t.size }}</span>
          <input
            ref="imageSize"
            class="size"
            type="number"
            min="400"
            max="2000"
            @input="changeSize"
          />
          <span class="dialog-form-item-unit">px</span>
        </div>
        <div
          :class="{
            hidden: appSetting.positionImageStyle === PositionImageStyle.GAME,
          }"
        >
          <span class="dialog-form-item-label">{{ t.title }}</span>
          <input
            ref="headerText"
            class="header"
            :placeholder="t.typeCustomTitleHere"
            @input="changeHeaderText"
          />
        </div>
      </div>
      <div class="control-items">
        <select :value="appSetting.positionImageStyle" @change="changeType">
          <option :value="PositionImageStyle.BOOK">{{ t.bookStyle }}</option>
          <option :value="PositionImageStyle.GAME">{{ t.gameStyle }}</option>
        </select>
        <button
          class="dialog-button"
          autofocus
          data-hotkey="Enter"
          @click="saveAsPNG"
        >
          <ButtonIcon class="icon" :icon="Icon.SAVE" />
          <span>PNG</span>
        </button>
        <button
          class="dialog-button"
          autofocus
          data-hotkey="Enter"
          @click="saveAsJPEG"
        >
          <ButtonIcon class="icon" :icon="Icon.SAVE" />
          <span>JPEG</span>
        </button>
        <button
          class="dialog-button"
          autofocus
          data-hotkey="Escape"
          @click="close"
        >
          <ButtonIcon class="icon" :icon="Icon.CLOSE" />
          <span>{{ t.close }}</span>
        </button>
      </div>
    </dialog>
  </div>
</template>

<script lang="ts">
import {
  Ref,
  computed,
  defineComponent,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
} from "vue";
import { t } from "@/common/i18n";
import BoardView from "@/renderer/view/primitive/BoardView.vue";
import SimpleBoardView from "@/renderer/view/primitive/SimpleBoardView.vue";
import ButtonIcon from "@/renderer/view/primitive/ButtonIcon.vue";
import { showModalDialog } from "@/renderer/helpers/dialog";
import {
  installHotKeyForDialog,
  uninstallHotKeyForDialog,
} from "@/renderer/keyboard/hotkey";
import { useAppSetting } from "@/renderer/store/setting";
import { Rect, RectSize } from "@/common/graphics";
import {
  Color,
  Move,
  RecordMetadataKey,
  getMoveDisplayText,
} from "@/common/shogi";
import { useStore } from "@/renderer/store";
import { Icon } from "@/renderer/assets/icons";
import api from "@/renderer/ipc/api";
import { Lazy } from "@/renderer/helpers/lazy";
import { PositionImageStyle } from "@/common/settings/app";

const lazyUpdateDelay = 100;
const marginHor = 80;
const marginVer = 150;
const aspectRatio = 16 / 9;

export default defineComponent({
  name: "ExportBoardImageDialog",
  components: {
    BoardView,
    SimpleBoardView,
    ButtonIcon,
  },
  setup() {
    const store = useStore();
    const appSetting = useAppSetting();
    const blackPlayerName = store.record.metadata.getStandardMetadata(
      RecordMetadataKey.BLACK_NAME
    );
    const whitePlayerName = store.record.metadata.getStandardMetadata(
      RecordMetadataKey.WHITE_NAME
    );
    const blackPlayerShortName = store.record.metadata.getStandardMetadata(
      RecordMetadataKey.BLACK_SHORT_NAME
    );
    const whitePlayerShortName = store.record.metadata.getStandardMetadata(
      RecordMetadataKey.WHITE_SHORT_NAME
    );
    const record = store.record;
    const lastMove =
      record.current.move instanceof Move ? record.current.move : null;
    const dialog: Ref = ref(null);
    const board: Ref = ref(null);
    const imageSize: Ref = ref(null);
    const headerText: Ref = ref(null);
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

    return {
      PositionImageStyle,
      t,
      Icon,
      dialog,
      board,
      imageSize,
      headerText,
      appSetting,
      lastMove,
      defaultHeader,
      maxSize,
      blackPlayerName,
      whitePlayerName,
      blackPlayerShortName,
      whitePlayerShortName,
      record,
      changeSize,
      changeHeaderText,
      changeType,
      saveAsPNG,
      saveAsJPEG,
      close,
    };
  },
});
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
.control-items {
  display: flex;
  flex-direction: row;
  margin-top: 5px;
  margin-left: auto;
  margin-right: auto;
}
.control-items > * {
  margin: 0 5px;
}
.hidden {
  display: none;
}
input.size {
  width: 50px;
  text-align: right;
}
input.header {
  width: 200px;
}
</style>
