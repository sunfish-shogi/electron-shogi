<template>
  <div>
    <div class="full column" :style="{ width: `${size.width}px` }">
      <div class="row tabs">
        <div
          v-for="tab in visibleTabs"
          :key="tab"
          class="tab"
          :class="{ selected: activeTab === tab }"
          @click="changeSelect(tab)"
        >
          <Icon :icon="tabs[tab].icon" />
          <span>{{ tabs[tab].title }}</span>
        </div>
        <div v-if="displayMinimizeToggle" class="tab end" @click="minimize">
          <Icon :icon="IconType.ARROW_DROP" />
          <span>{{ t.hideTabView }}</span>
        </div>
      </div>
      <div class="tab-contents">
        <RecordInfo
          v-if="activeTab === Tab.RECORD_INFO"
          class="full tab-content"
          :size="contentSize"
        />
        <RecordComment
          v-if="activeTab === Tab.COMMENT"
          class="full tab-content"
        />
        <EngineAnalytics
          v-if="activeTab === Tab.SEARCH"
          class="full tab-content"
          :size="contentSize"
          :history-mode="true"
        />
        <EngineAnalytics
          v-if="activeTab === Tab.PV"
          class="full tab-content"
          :size="contentSize"
          :history-mode="false"
        />
        <EvaluationChart
          v-if="activeTab === Tab.CHART"
          class="full tab-content"
          :size="contentSize"
          :type="EvaluationChartType.RAW"
        />
        <EvaluationChart
          v-if="activeTab === Tab.PERCENTAGE_CHART"
          class="full tab-content"
          :size="contentSize"
          :type="EvaluationChartType.WIN_RATE"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { PropType, computed, defineComponent } from "vue";
import RecordComment from "@/renderer/view/tab/RecordComment.vue";
import EngineAnalytics from "@/renderer/view/tab/EngineAnalytics.vue";
import EvaluationChart, {
  EvaluationChartType,
} from "@/renderer/view/tab/EvaluationChart.vue";
import RecordInfo from "@/renderer/view/tab/RecordInfo.vue";
import { RectSize } from "@/common/graphics.js";
import Icon from "@/renderer/view/primitive/Icon.vue";
import { Tab } from "@/common/settings/app";
import { IconType } from "@/renderer/assets/icons";
import { t } from "@/common/i18n";

export const headerHeight = 30;

export default defineComponent({
  name: "TabPane",
  components: {
    RecordComment,
    EngineAnalytics,
    EvaluationChart,
    RecordInfo,
    Icon,
  },
  props: {
    size: {
      type: RectSize,
      required: true,
    },
    visibleTabs: {
      type: Array as PropType<Tab[]>,
      required: true,
    },
    activeTab: {
      type: String as PropType<Tab>,
      required: true,
    },
    displayMinimizeToggle: {
      type: Boolean,
      required: false,
    },
  },
  emits: ["onChangeTab", "onMinimize"],
  setup(props, { emit }) {
    const changeSelect = (tab: Tab) => emit("onChangeTab", tab);
    const minimize = () => emit("onMinimize");
    const contentSize = computed(() =>
      props.size.reduce(new RectSize(0, headerHeight))
    );

    const tabs = {
      [Tab.RECORD_INFO]: {
        title: t.recordProperties,
        icon: IconType.DESCRIPTION,
      },
      [Tab.COMMENT]: {
        title: t.comments,
        icon: IconType.COMMENT,
      },
      [Tab.SEARCH]: {
        title: t.searchLog,
        icon: IconType.BRAIN,
      },
      [Tab.PV]: {
        title: t.pv,
        icon: IconType.PV,
      },
      [Tab.CHART]: {
        title: t.evaluation,
        icon: IconType.CHART,
      },
      [Tab.PERCENTAGE_CHART]: {
        title: t.estimatedWinRate,
        icon: IconType.PERCENT,
      },
      [Tab.INVISIBLE]: {
        title: t.hideTabView,
        icon: IconType.ARROW_DROP,
      },
    };

    return {
      t,
      contentSize,
      changeSelect,
      minimize,
      tabs,
      Tab,
      IconType,
      EvaluationChartType,
    };
  },
});
</script>

<style scoped>
.tabs {
  width: 100%;
  user-select: none;
  background: linear-gradient(to top, var(--tab-bg-color) 80%, white 140%);
  padding-bottom: 2px;
}
.tab {
  height: 23px;
  color: var(--tab-color);
  border-bottom: solid 3px transparent;
  padding: 0px 20px 0px 10px;
  line-height: 28px;
  font-size: 1em;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tab.selected {
  border-bottom: solid 3px var(--tab-highlight-color);
}
.tab.end {
  margin-left: auto;
}
.tab-contents {
  flex: 1;
}
.tab-contents .tab-content {
  color: var(--text-color);
  background-color: var(--tab-content-bg-color);
}
</style>
