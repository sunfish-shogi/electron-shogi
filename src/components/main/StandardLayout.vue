<template>
  <div>
    <div class="main">
      <div class="top-pane" ref="topPane">
        <BoardPane class="top-left-pane" :maxSize="boardPaneMaxSize" />
        <RecordPane class="top-right-pane" />
      </div>
      <InformationPane class="bottom-pane" :size="bottomPaneSize" />
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
  Ref,
  ref,
} from "vue";
import BoardPane from "./BoardPane.vue";
import RecordPane, { minWidth as minRecordWidth } from "./RecordPane.vue";
import InformationPane, {
  headerHeight as informationHeaderHeight,
  minHeight as minInformationHeight,
} from "./InformationPane.vue";
import { RectSize } from "@/layout/types";
import { useStore } from "@/store";
import { InformationTab } from "@/settings/app";

export default defineComponent({
  name: "StandardLayout",
  components: {
    BoardPane,
    RecordPane,
    InformationPane,
  },
  setup() {
    const store = useStore();
    const windowSize = reactive(new RectSize(0, 0));
    const topPaneHeight = ref(0);
    const topPane: Ref = ref(null);

    const updateSize = () => {
      windowSize.width = window.innerWidth;
      windowSize.height = window.innerHeight;
    };

    const topPaneResizeObserver = new ResizeObserver((entries) => {
      topPaneHeight.value = entries[0].contentRect.height;
    });

    onMounted(() => {
      updateSize();
      window.addEventListener("resize", updateSize);
      topPaneResizeObserver.observe(topPane.value);
    });

    onUnmounted(() => {
      window.removeEventListener("resize", updateSize);
      topPaneResizeObserver.disconnect();
    });

    const boardPaneMaxSize = computed(() => {
      const minInformationPaneHeight =
        store.state.appSetting.informationTab !== InformationTab.INVISIBLE
          ? minInformationHeight
          : informationHeaderHeight;
      return new RectSize(
        windowSize.width - minRecordWidth,
        windowSize.height - minInformationPaneHeight
      );
    });

    const bottomPaneSize = computed(() => {
      return new RectSize(
        windowSize.width,
        windowSize.height - topPaneHeight.value
      );
    });

    return {
      topPane,
      boardPaneMaxSize,
      bottomPaneSize,
    };
  },
});
</script>

<style scoped>
.main {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.top-pane {
  display: flex;
  flex-direction: row;
  width: 100%;
}
.bottom-pane {
  flex: 1;
  width: 100%;
}
.top-left-pane {
  height: 100%;
}
.top-right-pane {
  flex: 1;
  height: 100%;
}
</style>
