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
        <div class="full column">
          <div class="row">
            <BoardPane
              :style="boardPaneStyle"
              :max-size="boardPaneMaxSize"
              :left-control-type="appSetting.leftSideControlType"
              :right-control-type="appSetting.rightSideControlType"
              @resize="onBoardPaneResize"
            />
            <RecordPane
              :style="recordPaneStyle"
              :show-comment="appSetting.showCommentInRecordView"
              :show-elapsed-time="appSetting.showElapsedTimeInRecordView"
            />
          </div>
          <button
            v-if="!isBottomPaneVisible"
            class="unhide-tabview-button"
            @click="onUnhideTabView"
          >
            <Icon :icon="IconType.ARROW_UP" />
            <span>{{ t.expandTabView }}</span>
          </button>
        </div>
      </Pane>
      <Pane :size="bottomPaneHeightPercentage">
        <TabPane
          v-if="appSetting.tabPaneType === TabPaneType.SINGLE"
          class="full"
          :size="tabPaneSize"
          :visible-tabs="[
            Tab.RECORD_INFO,
            Tab.COMMENT,
            Tab.SEARCH,
            Tab.PV,
            Tab.CHART,
            Tab.PERCENTAGE_CHART,
            Tab.MONITOR,
          ]"
          :active-tab="appSetting.tab"
          :display-minimize-toggle="true"
          @on-change-tab="onChangeTab"
          @on-minimize="onMinimizeTab"
        />
        <Splitpanes
          v-else
          class="bottom-frame"
          vertical
          :dbl-click-splitter="false"
          @resize="onResizeBottom"
          @resized="onResizedBottom"
        >
          <Pane :size="bottomLeftPaneWidthPercentage">
            <TabPane
              class="full"
              :size="tabPaneSize"
              :visible-tabs="[Tab.RECORD_INFO, Tab.SEARCH, Tab.PV, Tab.MONITOR]"
              :active-tab="appSetting.tab"
              @on-change-tab="onChangeTab"
            />
          </Pane>
          <Pane>
            <TabPane
              class="full"
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

<script setup lang="ts">
import { t } from "@/common/i18n";
import { reactive, onMounted, onUnmounted, computed, ref } from "vue";
import BoardPane from "./BoardPane.vue";
import RecordPane, { minWidth as minRecordWidth } from "./RecordPane.vue";
import TabPane, { headerHeight as tabHeaderHeight } from "./TabPane.vue";
import { RectSize } from "@/common/assets/geometry";
import { AppSettingUpdate, Tab, TabPaneType } from "@/common/settings/app";
import api from "@/renderer/ipc/api";
import { LogLevel } from "@/common/log";
import { toString } from "@/common/helpers/string";
import { Lazy } from "@/renderer/helpers/lazy";
import { Splitpanes, Pane } from "splitpanes";
import "splitpanes/dist/splitpanes.css";
import { IconType } from "@/renderer/assets/icons";
import Icon from "@/renderer/view/primitive/Icon.vue";
import { useAppSetting } from "@/renderer/store/setting";

const splitterWidth = 8;
const margin = 10;
const lazyUpdateDelay = 100;

const appSetting = useAppSetting();
const windowSize = reactive(new RectSize(window.innerWidth, window.innerHeight));
const topPaneHeightPercentage = ref(appSetting.topPaneHeightPercentage);
const bottomLeftPaneWidthPercentage = ref(appSetting.bottomLeftPaneWidthPercentage);
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
  appSetting.updateAppSetting(update).catch((e) => {
    api.log(LogLevel.WARN, "StandardLayout: failed to update app setting: " + toString(e));
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
    appSetting.topPanePreviousHeightPercentage,
    ((windowSize.height - tabHeaderHeight * 2 - splitterWidth) / windowSize.height) * 100,
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
  return (windowSize.height * bottomPaneHeightPercentage.value) / 100 >= tabHeaderHeight;
});

const boardPaneMaxSize = computed(() => {
  return new RectSize(
    Math.max(windowSize.width - minRecordWidth - margin * 2, 0),
    Math.max(
      (windowSize.height - splitterWidth) * (topPaneHeightPercentage.value / 100) -
        margin * 2 -
        (isBottomPaneVisible.value ? 0 : tabHeaderHeight),
      0,
    ),
  );
});

const boardPaneStyle = computed(() => {
  return {
    margin: `${margin}px`,
  };
});

const recordPaneStyle = computed(() => {
  const width = windowSize.width - boardPaneSize.width - margin * 3;
  const height = boardPaneSize.height;
  return {
    margin: `${margin}px ${margin}px ${margin}px 0`,
    width: `${width}px`,
    height: `${height}px`,
  };
});

const bottomPaneHeightPercentage = computed(() => {
  return 100 - topPaneHeightPercentage.value;
});

const tabPaneSize = computed(() => {
  return new RectSize(
    appSetting.tabPaneType === TabPaneType.SINGLE
      ? windowSize.width
      : (windowSize.width - splitterWidth) * (bottomLeftPaneWidthPercentage.value / 100),
    (windowSize.height - splitterWidth) * (bottomPaneHeightPercentage.value / 100),
  );
});

const tabPaneSize2 = computed(() => {
  return new RectSize(
    (windowSize.width - splitterWidth) * (1.0 - bottomLeftPaneWidthPercentage.value / 100),
    (windowSize.height - splitterWidth) * (bottomPaneHeightPercentage.value / 100),
  );
});
</script>

<style>
.main-frame.splitpanes--horizontal > .splitpanes__splitter {
  height: 8px;
  cursor: ns-resize;
}
.bottom-frame.splitpanes--vertical > .splitpanes__splitter {
  width: 8px;
  cursor: ew-resize;
}
.main-frame .splitpanes__splitter {
  background-color: transparent;
}
.main-frame .splitpanes__splitter:hover {
  background-color: #1e90ff;
}
.bottom-frame.splitpanes--vertical > .splitpanes__pane {
  box-shadow: 6px 0px 6px -3px var(--shadow-color);
}
</style>

<style scoped>
.unhide-tabview-button {
  width: 100%;
  height: 30px;
  font-size: 100%;
  text-align: center;
  line-height: 180%;
  padding: 0 5% 0 5%;
}
</style>
