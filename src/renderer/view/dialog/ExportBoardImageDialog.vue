<template>
  <div>
    <dialog ref="dialog">
      <div ref="board" class="board">
        <BoardView
          :piece-image-type="appSetting.pieceImage"
          :board-image-type="appSetting.boardImage"
          :board-label-type="appSetting.boardLabelType"
          :max-size="maxSize"
          :position="record.position"
          :last-move="lastMove"
          :flip="appSetting.boardFlipping"
        />
      </div>
      <div class="dialog-main-buttons">
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
  onMounted,
  onUnmounted,
  reactive,
  ref,
} from "vue";
import { t } from "@/common/i18n";
import BoardView from "@/renderer/view/primitive/BoardView.vue";
import ButtonIcon from "@/renderer/view/primitive/ButtonIcon.vue";
import { showModalDialog } from "@/renderer/helpers/dialog";
import { installHotKeyForDialog } from "@/renderer/keyboard/hotkey";
import { useAppSetting } from "@/renderer/store/setting";
import { Rect, RectSize } from "@/common/graphics";
import { Move, Record } from "@/common/shogi";
import { useStore } from "@/renderer/store";
import { Icon } from "@/renderer/assets/icons";
import api from "@/renderer/ipc/api";
import { Lazy } from "@/renderer/helpers/lazy";

const lazyUpdateDelay = 100;

export default defineComponent({
  name: "ExportBoardImageDialog",
  components: {
    BoardView,
    ButtonIcon,
  },
  setup() {
    const store = useStore();
    const appSetting = useAppSetting();
    const record = new Record(store.record.position);
    const lastMove =
      store.record.current.move instanceof Move
        ? store.record.current.move
        : null;
    const dialog: Ref = ref(null);
    const board: Ref = ref(null);
    const windowSize = reactive(
      new RectSize(window.innerWidth, window.innerHeight)
    );

    const windowLazyUpdate = new Lazy();
    const updateSize = () => {
      windowLazyUpdate.after(() => {
        windowSize.width = window.innerWidth;
        windowSize.height = window.innerHeight;
      }, lazyUpdateDelay);
    };

    onMounted(() => {
      showModalDialog(dialog.value);
      installHotKeyForDialog(dialog.value);
      window.addEventListener("resize", updateSize);
    });

    onUnmounted(() => {
      window.removeEventListener("resize", updateSize);
    });

    const maxSize = computed(
      () =>
        new RectSize(
          Math.min(750, windowSize.width - 100),
          Math.min(450, windowSize.height - 100)
        )
    );

    const getRect = () => {
      const elem = board.value as HTMLElement;
      const domRect = elem.getBoundingClientRect();
      return new Rect(domRect.x, domRect.y, domRect.width, domRect.height);
    };

    const saveAsPNG = () => {
      api.exportCaptureAsPNG(getRect());
    };

    const saveAsJPEG = () => {
      api.exportCaptureAsJPEG(getRect());
    };

    const close = () => {
      store.closeModalDialog();
    };

    return {
      t,
      Icon,
      dialog,
      board,
      appSetting,
      lastMove,
      maxSize,
      record,
      saveAsPNG,
      saveAsJPEG,
      close,
    };
  },
});
</script>

<style scoped>
.board {
  padding: 10px;
  background-color: white;
}
</style>
