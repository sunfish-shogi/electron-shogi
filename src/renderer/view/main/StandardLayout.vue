<template>
  <div>
    <div class="main">
      <div class="top-pane">
        <BoardPane
          class="top-left-pane"
          :max-size="boardPaneMaxSize"
          @resize="onBoardPaneResize"
        />
        <RecordPane class="top-right-pane" :style="recordPaneStyle" />
      </div>
      <TabPane class="bottom-pane" :size="bottomPaneSize" />
    </div>
  </div>
</template>

<script lang="ts">
import {
  reactive,
  onMounted,
  onUnmounted,
  defineComponent,
  computed,
  ref,
} from "vue";
import BoardPane from "./BoardPane.vue";
import RecordPane, { minWidth as minRecordWidth } from "./RecordPane.vue";
import TabPane, {
  headerHeight as informationHeaderHeight,
  minHeight as minTabHeight,
} from "./TabPane.vue";
import { RectSize } from "@/renderer/view/primitive/Types";
import { useStore } from "@/renderer/store";
import { Tab } from "@/common/settings/app";

export default defineComponent({
  name: "StandardLayout",
  components: {
    BoardPane,
    RecordPane,
    TabPane,
  },
  setup() {
    const windowSize = reactive(new RectSize(0, 0));
    const boardPaneSize = ref(new RectSize(0, 0));

    const updateSize = () => {
      windowSize.width = window.innerWidth;
      windowSize.height = window.innerHeight;
    };

    onMounted(() => {
      updateSize();
      window.addEventListener("resize", updateSize);
    });

    onUnmounted(() => {
      window.removeEventListener("resize", updateSize);
    });

    const onBoardPaneResize = (size: RectSize) => {
      boardPaneSize.value = size;
    };

    const boardPaneMaxSize = computed(() => {
      const minTabPaneHeight =
        useStore().appSetting.tab !== Tab.INVISIBLE
          ? minTabHeight
          : informationHeaderHeight;
      return new RectSize(
        windowSize.width - minRecordWidth,
        windowSize.height - minTabPaneHeight
      );
    });

    const recordPaneStyle = computed(() => {
      return {
        width: `${windowSize.width - boardPaneSize.value.width}px`,
        height: `${boardPaneSize.value.height}px`,
      };
    });

    const bottomPaneSize = computed(() => {
      return new RectSize(
        windowSize.width,
        windowSize.height - boardPaneSize.value.height
      );
    });

    return {
      boardPaneMaxSize,
      recordPaneStyle,
      bottomPaneSize,
      onBoardPaneResize,
    };
  },
});
</script>

<style scoped>
.main {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
}
.top-pane {
  display: flex;
  flex-direction: row;
  width: 100vw;
}
.bottom-pane {
  flex: 1;
  width: 100vw;
}
.top-left-pane {
  height: 100%;
}
.top-right-pane {
  flex: 1;
  height: 100%;
}
</style>
