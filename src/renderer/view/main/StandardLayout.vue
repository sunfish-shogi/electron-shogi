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
          :minimized="appSetting.tabMinimized"
          :display-minimize-toggle="true"
          @on-change-tab="onChangeTab"
          @on-minimize="onMinimizeTab"
          @on-display="onDisplayTab"
        />
      </div>
      <div v-else class="bottom-pane">
        <TabPane
          class="tab-pane"
          :size="tabPaneSize"
          :visible-tabs="[Tab.RECORD_INFO, Tab.SEARCH, Tab.PV]"
          :active-tab="appSetting.tab"
          :minimized="appSetting.tabMinimized"
          @on-change-tab="onChangeTab"
        />
        <TabPane
          class="tab-pane"
          :size="tabPaneSize2"
          :visible-tabs="[Tab.COMMENT, Tab.CHART, Tab.PERCENTAGE_CHART]"
          :active-tab="appSetting.tab2"
          :minimized="appSetting.tabMinimized"
          :display-minimize-toggle="true"
          @on-change-tab="onChangeTab2"
          @on-minimize="onMinimizeTab"
          @on-display="onDisplayTab"
        />
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
import { AppSettingUpdate, Tab, TabPaneType } from "@/common/settings/app";
import api from "@/renderer/ipc/api";
import { LogLevel } from "@/common/log";
import { toString } from "@/common/helpers/string";

export default defineComponent({
  name: "StandardLayout",
  components: {
    BoardPane,
    RecordPane,
    TabPane,
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

    const updateAppSetting = (update: AppSettingUpdate) => {
      store.updateAppSetting(update).catch((e) => {
        api.log(
          LogLevel.WARN,
          "StandardLayout: failed to update app setting: " + toString(e)
        );
      });
    };

    const onChangeTab = (tab: Tab) => {
      updateAppSetting({ tab, tabMinimized: false });
    };

    const onChangeTab2 = (tab2: Tab) => {
      updateAppSetting({ tab2, tabMinimized: false });
    };

    const onMinimizeTab = () => {
      updateAppSetting({ tabMinimized: true });
    };

    const onDisplayTab = () => {
      updateAppSetting({ tabMinimized: false });
    };

    const boardPaneMaxSize = computed(() => {
      const minTabPaneHeight = !store.appSetting.tabMinimized
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
      return new RectSize(
        windowSize.width *
          (store.appSetting.tabPaneType === TabPaneType.SINGLE ? 1.0 : 0.6),
        windowSize.height - boardPaneSize.value.height
      );
    });

    const tabPaneSize2 = computed(() => {
      return new RectSize(
        windowSize.width * 0.4,
        windowSize.height - boardPaneSize.value.height
      );
    });

    const appSetting = computed(() => store.appSetting);

    return {
      boardPaneMaxSize,
      recordPaneStyle,
      tabPaneSize,
      tabPaneSize2,
      appSetting,
      onBoardPaneResize,
      onChangeTab,
      onChangeTab2,
      onMinimizeTab,
      onDisplayTab,
      TabPaneType,
      Tab,
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
</style>
