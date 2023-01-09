<template>
  <div>
    <Splitpanes
      class="main-frame"
      horizontal
      :dbl-click-splitter="false"
      @resize="onResizeMain"
      @resized="onResizedMain"
    >
      <Pane :size="topPaneHeightPercentage">
        <div class="top-pane">
          <div class="top-pane-main">
            <BoardPane
              :style="boardPaneStyle"
              :max-size="boardPaneMaxSize"
              @resize="onBoardPaneResize"
            />
            <RecordPane class="top-right-pane" :style="recordPaneStyle" />
          </div>
          <button
            v-if="!isBottomPaneVisible"
            class="unhide-tabview-button"
            @click="onUnhideTabView"
          >
            <ButtonIcon class="icon" :icon="Icon.ARROW_UP" />
            タブビューを再表示
          </button>
        </div>
      </Pane>
      <Pane :size="bottomPaneHeightPercentage">
        <div
          v-if="appSetting.tabPaneType === TabPaneType.SINGLE"
          class="bottom-pane"
        >
          <TabPane
            class="tab-pane"
            :size="tabPaneSize"
            :visible-tabs="[
              Tab.RECORD_INFO,
              Tab.COMMENT,
              Tab.SEARCH,
              Tab.PV,
              Tab.CHART,
              Tab.PERCENTAGE_CHART,
            ]"
            :active-tab="appSetting.tab"
            :display-minimize-toggle="true"
            @on-change-tab="onChangeTab"
            @on-minimize="onMinimizeTab"
          />
        </div>
        <Splitpanes
          v-else
          vertical
          :dbl-click-splitter="false"
          class="bottom-frame"
          @resize="onResizeBottom"
          @resized="onResizedBottom"
        >
          <Pane :size="bottomLeftPaneWidthPercentage">
            <TabPane
              class="tab-pane"
              :size="tabPaneSize"
              :visible-tabs="[Tab.RECORD_INFO, Tab.SEARCH, Tab.PV]"
              :active-tab="appSetting.tab"
              @on-change-tab="onChangeTab"
            />
          </Pane>
          <Pane>
            <TabPane
              class="tab-pane"
              :size="tabPaneSize2"
              :visible-tabs="[Tab.COMMENT, Tab.CHART, Tab.PERCENTAGE_CHART]"
              :active-tab="appSetting.tab2"
              :display-minimize-toggle="true"
              @on-change-tab="onChangeTab2"
              @on-minimize="onMinimizeTab"
            />
          </Pane>
        </Splitpanes>
      </Pane>
    </Splitpanes>
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
import TabPane, { headerHeight as tabHeaderHeight } from "./TabPane.vue";
import { RectSize } from "@/renderer/view/primitive/Types";
import { useStore } from "@/renderer/store";
import { AppSettingUpdate, Tab, TabPaneType } from "@/common/settings/app";
import api from "@/renderer/ipc/api";
import { LogLevel } from "@/common/log";
import { toString } from "@/common/helpers/string";
import { Lazy } from "@/renderer/helpers/lazy";
import { Splitpanes, Pane } from "splitpanes";
import "splitpanes/dist/splitpanes.css";
import { Icon } from "@/renderer/assets/icons";
import ButtonIcon from "@/renderer/view/primitive/ButtonIcon.vue";

const splitterWidth = 8;
const margin = 10;
const lazyUpdateDelay = 100;

export default defineComponent({
  name: "StandardLayout",
  components: {
    BoardPane,
    RecordPane,
    TabPane,
    Splitpanes,
    Pane,
    ButtonIcon,
  },
  setup() {
    const store = useStore();
    const windowSize = reactive(
      new RectSize(window.innerWidth, window.innerHeight)
    );
    const topPaneHeightPercentage = ref(
      store.appSetting.topPaneHeightPercentage
    );
    const bottomLeftPaneWidthPercentage = ref(
      store.appSetting.bottomLeftPaneWidthPercentage
    );
    const boardPaneSize = reactive(new RectSize(0, 0));

    const windowLazyUpdate = new Lazy();
    const updateSize = () => {
      windowLazyUpdate.after(() => {
        windowSize.width = window.innerWidth;
        windowSize.height = window.innerHeight;
      }, lazyUpdateDelay);
    };

    onMounted(() => {
      window.addEventListener("resize", updateSize);
    });

    onUnmounted(() => {
      window.removeEventListener("resize", updateSize);
    });

    const onBoardPaneResize = (size: RectSize) => {
      boardPaneSize.width = size.width;
      boardPaneSize.height = size.height;
    };

    const updateAppSetting = (update: AppSettingUpdate) => {
      store.updateAppSetting(update).catch((e) => {
        api.log(
          LogLevel.WARN,
          "StandardLayout: failed to update app setting: " + toString(e)
        );
      });
    };

    const onChangeTab = (tab: Tab) => {
      updateAppSetting({ tab });
    };
    const onChangeTab2 = (tab2: Tab) => {
      updateAppSetting({ tab2 });
    };

    const onMinimizeTab = () => {
      topPaneHeightPercentage.value = 100;
      updateAppSetting({ topPaneHeightPercentage: 100 });
    };

    const onUnhideTabView = () => {
      const newValue = Math.min(
        store.appSetting.topPanePreviousHeightPercentage,
        ((windowSize.height - tabHeaderHeight * 2 - splitterWidth / 2) /
          windowSize.height) *
          100
      );
      topPaneHeightPercentage.value = newValue;
      updateAppSetting({ topPaneHeightPercentage: newValue });
    };

    const mainLazyUpdate = new Lazy();
    const onResizeMain = (panes: { size: number }[]) => {
      const newValue = panes[0].size;
      mainLazyUpdate.after(() => {
        topPaneHeightPercentage.value = newValue;
      }, lazyUpdateDelay);
    };
    const onResizedMain = (panes: { size: number }[]) => {
      mainLazyUpdate.clear();
      const newValue = panes[0].size;
      topPaneHeightPercentage.value = newValue;
      updateAppSetting({ topPaneHeightPercentage: newValue });
    };

    const bottomLazyUpdate = new Lazy();
    const onResizeBottom = (panes: { size: number }[]) => {
      const newValue = panes[0].size;
      bottomLazyUpdate.after(() => {
        bottomLeftPaneWidthPercentage.value = newValue;
      }, lazyUpdateDelay);
    };
    const onResizedBottom = (panes: { size: number }[]) => {
      bottomLazyUpdate.clear();
      const newValue = panes[0].size;
      bottomLeftPaneWidthPercentage.value = newValue;
      updateAppSetting({ bottomLeftPaneWidthPercentage: newValue });
    };

    const isBottomPaneVisible = computed(() => {
      return (
        (windowSize.height * bottomPaneHeightPercentage.value) / 100 >=
        tabHeaderHeight
      );
    });

    const boardPaneMaxSize = computed(() => {
      return new RectSize(
        Math.max(windowSize.width - minRecordWidth - margin * 2, 0),
        Math.max(
          Math.min(
            (windowSize.height * topPaneHeightPercentage.value) / 100 -
              splitterWidth / 2,
            windowSize.height - splitterWidth
          ) -
            margin -
            (isBottomPaneVisible.value ? 0 : tabHeaderHeight + margin),
          0
        )
      );
    });

    const boardPaneStyle = computed(() => {
      return {
        margin: `${margin}px ${margin}px 0 ${margin}px`,
      };
    });

    const recordPaneStyle = computed(() => {
      const width = windowSize.width - boardPaneSize.width - margin * 3;
      const height = boardPaneSize.height;
      return {
        margin: `${margin}px ${margin}px 0 0`,
        width: `${width}px`,
        height: `${height}px`,
      };
    });

    const bottomPaneHeightPercentage = computed(() => {
      return 100 - topPaneHeightPercentage.value;
    });

    const tabPaneSize = computed(() => {
      return new RectSize(
        store.appSetting.tabPaneType === TabPaneType.SINGLE
          ? windowSize.width
          : (windowSize.width * bottomLeftPaneWidthPercentage.value) / 100 -
            splitterWidth / 2,
        (windowSize.height * bottomPaneHeightPercentage.value) / 100
      );
    });

    const tabPaneSize2 = computed(() => {
      return new RectSize(
        windowSize.width * (1.0 - bottomLeftPaneWidthPercentage.value / 100),
        (windowSize.height * bottomPaneHeightPercentage.value) / 100
      );
    });

    const appSetting = computed(() => store.appSetting);

    return {
      topPaneHeightPercentage,
      bottomPaneHeightPercentage,
      bottomLeftPaneWidthPercentage,
      isBottomPaneVisible,
      boardPaneMaxSize,
      boardPaneStyle,
      recordPaneStyle,
      tabPaneSize,
      tabPaneSize2,
      appSetting,
      onBoardPaneResize,
      onChangeTab,
      onChangeTab2,
      onMinimizeTab,
      onUnhideTabView,
      onResizeMain,
      onResizedMain,
      onResizeBottom,
      onResizedBottom,
      TabPaneType,
      Tab,
      Icon,
    };
  },
});
</script>

<style>
.main-frame > .splitpanes__splitter {
  height: 8px;
  cursor: ns-resize;
}
.bottom-frame > .splitpanes__splitter {
  width: 8px;
  cursor: ew-resize;
}
.splitpanes__splitter {
  background-color: transparent;
}
.splitpanes__splitter:hover {
  background-color: #1e90ff;
}
</style>

<style scoped>
.top-pane {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}
.top-pane-main {
  display: flex;
  flex-direction: row;
  width: 100%;
  flex-grow: 1;
}
.top-right-pane {
  flex: 1;
}
.unhide-tabview-button {
  width: 100%;
  height: 30px;
  text-align: center;
}
.tab-pane {
  height: 100%;
}
button .icon {
  height: 100%;
  vertical-align: top;
}
</style>
