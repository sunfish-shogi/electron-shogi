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
      <div class="bottom-pane">
        <RecordComment v-if="leftCommentEnabled" class="comment-pane" />
        <TabPane class="tab-pane" :size="tabPaneSize" />
        <RecordComment v-if="rightCommentEnabled" class="comment-pane" />
      </div>
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
import { CommentLayoutType, Tab } from "@/common/settings/app";
import RecordComment from "../tab/RecordComment.vue";

export default defineComponent({
  name: "StandardLayout",
  components: {
    BoardPane,
    RecordPane,
    TabPane,
    RecordComment,
  },
  setup() {
    const store = useStore();
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
        store.appSetting.tab !== Tab.INVISIBLE
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

    const tabPaneSize = computed(() => {
      const ratio =
        store.appSetting.tab === Tab.INVISIBLE ||
        store.appSetting.commentLayoutType === CommentLayoutType.STANDARD
          ? 1.0
          : 0.6;
      return new RectSize(
        windowSize.width * ratio,
        windowSize.height - boardPaneSize.value.height
      );
    });

    const rightCommentEnabled = computed(
      () =>
        store.appSetting.tab !== Tab.INVISIBLE &&
        store.appSetting.commentLayoutType === CommentLayoutType.RIGHT
    );
    const leftCommentEnabled = computed(
      () =>
        store.appSetting.tab !== Tab.INVISIBLE &&
        store.appSetting.commentLayoutType === CommentLayoutType.LEFT
    );

    return {
      boardPaneMaxSize,
      recordPaneStyle,
      tabPaneSize,
      leftCommentEnabled,
      rightCommentEnabled,
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
  display: flex;
  flex-direction: row;
  width: 100vw;
}
.top-left-pane {
  height: 100%;
}
.top-right-pane {
  flex: 1;
  height: 100%;
}
.tab-pane {
  height: 100%;
}
.comment-pane {
  flex: 1;
  height: 100%;
}
</style>
