<template>
  <div>
    <dialog ref="dialog">
      <BoardView
        class="board"
        :piece-image-type="appSetting.pieceImage"
        :board-image-type="appSetting.boardImage"
        :piece-stand-image-type="appSetting.pieceStandImage"
        :board-label-type="appSetting.boardLabelType"
        :custom-board-image-url="appSetting.boardImageFileURL"
        :custom-piece-stand-image-url="appSetting.pieceStandImageFileURL"
        :max-size="maxSize"
        :position="record.position"
        :last-move="lastMove"
        :flip="flip"
      >
        <template #right-control>
          <div class="full column">
            <div class="row control-row">
              <button
                class="control-item"
                data-hotkey="Control+t"
                @click="doFlip"
              >
                <Icon :icon="IconType.FLIP" />
              </button>
              <button
                class="control-item"
                autofocus
                data-hotkey="Escape"
                @click="close"
              >
                <Icon :icon="IconType.CLOSE" />
              </button>
            </div>
            <div class="row control-row">
              <button
                class="control-item"
                data-hotkey="ArrowLeft"
                @click="goBegin"
              >
                <Icon :icon="IconType.FIRST" />
              </button>
              <button
                class="control-item"
                data-hotkey="ArrowRight"
                @click="goEnd"
              >
                <Icon :icon="IconType.LAST" />
              </button>
            </div>
            <div class="row control-row">
              <button
                class="control-item"
                data-hotkey="ArrowUp"
                @click="goBack"
              >
                <Icon :icon="IconType.BACK" />
              </button>
              <button
                class="control-item"
                data-hotkey="ArrowDown"
                @click="goForward"
              >
                <Icon :icon="IconType.NEXT" />
              </button>
            </div>
          </div>
        </template>
      </BoardView>
      <div class="informations">
        <div v-for="(info, index) in infos" :key="index" class="information">
          {{ info }}
        </div>
        <div class="information">
          <span v-for="(move, index) in displayPV" :key="index">
            <span class="move-element" :class="{ selected: move.selected }"
              >&nbsp;{{ move.text }}&nbsp;</span
            >
          </span>
        </div>
      </div>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { ImmutablePosition, Move, Record } from "@/common/shogi";
import {
  onMounted,
  PropType,
  ref,
  reactive,
  watch,
  onBeforeUnmount,
} from "vue";
import BoardView from "@/renderer/view/primitive/BoardView.vue";
import Icon from "@/renderer/view/primitive/Icon.vue";
import { RectSize } from "@/common/graphics.js";
import { computed } from "vue";
import { showModalDialog } from "@/renderer/helpers/dialog.js";
import { IconType } from "@/renderer/assets/icons";
import {
  installHotKeyForDialog,
  uninstallHotKeyForDialog,
} from "@/renderer/keyboard/hotkey";
import { useAppSetting } from "@/renderer/store/setting";

const props = defineProps({
  position: {
    type: Object as PropType<ImmutablePosition>,
    required: true,
  },
  pv: {
    type: Array as PropType<Move[]>,
    required: true,
  },
  infos: {
    type: Array as PropType<string[]>,
    default: [] as string[],
    required: false,
  },
});

const emit = defineEmits(["close"]);

const appSetting = useAppSetting();
const dialog = ref();
const maxSize = reactive(new RectSize(0, 0));
const record = reactive(new Record());
const flip = ref(appSetting.boardFlipping);

const updateSize = () => {
  maxSize.width = window.innerWidth * 0.8;
  maxSize.height = window.innerHeight * 0.8 - 80;
};

const updateRecord = () => {
  record.clear(props.position);
  for (const move of props.pv) {
    record.append(move, { ignoreValidation: true });
  }
  record.goto(1);
};

onMounted(async () => {
  updateSize();
  updateRecord();
  window.addEventListener("resize", updateSize);
  showModalDialog(dialog.value);
  installHotKeyForDialog(dialog.value);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateSize);
  uninstallHotKeyForDialog(dialog.value);
});

watch([() => props.position, () => props.pv], () => {
  updateRecord();
  showModalDialog(dialog.value);
});

const close = () => {
  emit("close");
};

const goBegin = () => {
  record.goto(0);
};

const goEnd = () => {
  record.goto(Number.MAX_SAFE_INTEGER);
};

const goBack = () => {
  record.goBack();
};

const goForward = () => {
  record.goForward();
};

const doFlip = () => {
  flip.value = !flip.value;
};

const lastMove = computed(() =>
  record.current.move instanceof Move ? record.current.move : null
);

const displayPV = computed(() => {
  return record.moves.slice(1).map((move) => {
    return {
      text: move.displayText,
      selected: move.number === record.current.number,
    };
  });
});
</script>

<style scoped>
.board {
  margin-left: auto;
  margin-right: auto;
}
.control-row {
  width: 100%;
  height: 25%;
  margin: 0px;
}
.control-item {
  width: 50%;
  height: 100%;
  margin: 0px;
  font-size: 100%;
  padding: 0 5% 0 5%;
}
.control-row:not(:last-child) {
  margin-bottom: 2%;
}
.control-item:not(:last-child) {
  margin-right: 2%;
}
.control-item .icon {
  height: 80%;
  width: auto;
}
.informations {
  height: 120px;
  width: 80vw;
  overflow-y: scroll;
  margin-left: auto;
  margin-right: auto;
  margin-top: 5px;
  color: var(--text-color);
  background-color: var(--text-bg-color);
}
.information {
  font-size: 14px;
  margin: 2px;
  text-align: left;
}
.move-element.selected {
  background-color: var(--text-bg-color-selected);
}
</style>
