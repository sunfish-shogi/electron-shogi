<template>
  <div class="full">
    <div class="full row">
      <div class="column">
        <BoardPane
          :max-size="boardPaneMaxSize"
          :layout-type="BoardLayoutType.PORTRAIT"
          @resize="onBoardPaneResize"
        />
        <div class="row controls" :style="{ height: `${controlPaneHeight}px` }">
          <button @click="store.changePly(0)">
            <Icon :icon="IconType.FIRST" />
          </button>
          <button @click="store.goBack()">
            <Icon :icon="IconType.BACK" />
          </button>
          <button @click="store.goForward()">
            <Icon :icon="IconType.NEXT" />
          </button>
          <button @click="store.changePly(Number.MAX_SAFE_INTEGER)">
            <Icon :icon="IconType.LAST" />
          </button>
          <button @click="store.removeCurrentMove()"><Icon :icon="IconType.DELETE" /></button>
          <button @click="isMobileMenuVisible = true">Menu</button>
        </div>
        <RecordPane
          v-if="showRecordViewOnBottom"
          class="auto"
          :style="{ width: `${windowSize.width}px`, height: `${bottomRecordViewSize.height}px` }"
          :show-top-control="false"
          :show-bottom-control="false"
          :show-branches="false"
          :show-elapsed-time="true"
          :show-comment="true"
        />
      </div>
      <RecordPane
        v-if="showRecordViewOnSide"
        :show-top-control="false"
        :show-bottom-control="false"
        :show-elapsed-time="true"
        :show-comment="true"
      />
    </div>
    <FileMenu v-if="isMobileMenuVisible" @close="isMobileMenuVisible = false" />
  </div>
</template>

<script setup lang="ts">
import { RectSize } from "@/common/assets/geometry";
import { BoardLayoutType } from "@/common/settings/layout";
import { IconType } from "@/renderer/assets/icons";
import { Lazy } from "@/renderer/helpers/lazy";
import { useStore } from "@/renderer/store";
import BoardPane from "@/renderer/view/main/BoardPane.vue";
import RecordPane from "@/renderer/view/main/RecordPane.vue";
import FileMenu from "@/renderer/view/menu/FileMenu.vue";
import Icon from "@/renderer/view/primitive/Icon.vue";
import { computed, onMounted, onUnmounted, reactive, ref } from "vue";

const lazyUpdateDelay = 80;
const minRecordViewWidth = 150;
const minRecordViewHeight = 100;

const store = useStore();
const isMobileMenuVisible = ref(false);
const windowSize = reactive(new RectSize(window.innerWidth, window.innerHeight));

const windowLazyUpdate = new Lazy();
const updateSize = () => {
  windowLazyUpdate.after(() => {
    windowSize.width = window.innerWidth;
    windowSize.height = window.innerHeight;
  }, lazyUpdateDelay);
};

const controlPaneHeight = computed(() =>
  Math.min(windowSize.height * 0.08, windowSize.width * 0.12),
);

const boardPaneMaxSize = computed(
  () => new RectSize(windowSize.width, windowSize.height - controlPaneHeight.value),
);
const boardPaneSize = ref(windowSize);
const onBoardPaneResize = (size: RectSize) => {
  boardPaneSize.value = size;
};

const showRecordViewOnSide = computed(() => {
  return windowSize.width >= boardPaneSize.value.width + minRecordViewWidth;
});
const showRecordViewOnBottom = computed(() => {
  return (
    !showRecordViewOnSide.value &&
    windowSize.height >= boardPaneSize.value.height + minRecordViewHeight
  );
});
const bottomRecordViewSize = computed(() => {
  return new RectSize(
    windowSize.width,
    windowSize.height - boardPaneSize.value.height - controlPaneHeight.value,
  );
});

onMounted(() => {
  window.addEventListener("resize", updateSize);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateSize);
});
</script>

<style scoped>
.controls button {
  font-size: 100%;
  width: 100%;
  height: 100%;
}
.controls button .icon {
  height: 68%;
}
</style>
