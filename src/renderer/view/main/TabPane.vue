<template>
  <div>
    <div class="root" :style="{ width: `${size.width}px` }">
      <div class="tabs">
        <div
          v-for="tab in visibleTabs"
          :key="tab"
          class="tab"
          :class="{ selected: activeTab === tab }"
          @click="changeSelect(tab)"
        >
          <ButtonIcon class="icon" :icon="tabs[tab].icon" />
          <span>{{ tabs[tab].title }}</span>
        </div>
        <div v-if="displayMinimizeToggle" class="tab end" @click="minimize">
          <ButtonIcon class="icon" :icon="Icon.ARROW_DROP" />
          <span>{{ t.hideTabView }}</span>
        </div>
      </div>
      <div class="tab-contents">
        <RecordInfo
          v-if="activeTab === Tab.RECORD_INFO"
          class="tab-content"
          :size="contentSize"
        />
        <RecordComment v-if="activeTab === Tab.COMMENT" class="tab-content" />
        <EngineAnalytics
          v-if="activeTab === Tab.SEARCH"
          class="tab-content"
          :size="contentSize"
          :history-mode="true"
        />
        <EngineAnalytics
          v-if="activeTab === Tab.PV"
          class="tab-content"
          :size="contentSize"
          :history-mode="false"
        />
        <EvaluationChart
          v-if="activeTab === Tab.CHART"
          class="tab-content"
          :size="contentSize"
          :type="EvaluationChartType.RAW"
        />
        <EvaluationChart
          v-if="activeTab === Tab.PERCENTAGE_CHART"
          class="tab-content"
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
import ButtonIcon from "@/renderer/view/primitive/ButtonIcon.vue";
import { Tab } from "@/common/settings/app";
import { Icon } from "@/renderer/assets/icons";
import { t } from "@/common/i18n";

export const headerHeight = 30;

export default defineComponent({
  name: "TabPane",
  components: {
    RecordComment,
    EngineAnalytics,
    EvaluationChart,
    RecordInfo,
    ButtonIcon,
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
        icon: Icon.DESCRIPTION,
      },
      [Tab.COMMENT]: {
        title: t.comments,
        icon: Icon.COMMENT,
      },
      [Tab.SEARCH]: {
        title: t.searchLog,
        icon: Icon.BRAIN,
      },
      [Tab.PV]: {
        title: t.pv,
        icon: Icon.PV,
      },
      [Tab.CHART]: {
        title: t.evaluation,
        icon: Icon.CHART,
      },
      [Tab.PERCENTAGE_CHART]: {
        title: t.estimatedWinRate,
        icon: Icon.PERCENT,
      },
      [Tab.INVISIBLE]: {
        title: t.hideTabView,
        icon: Icon.ARROW_DROP,
      },
    };

    return {
      t,
      contentSize,
      changeSelect,
      minimize,
      tabs,
      Tab,
      Icon,
      EvaluationChartType,
    };
  },
});
</script>

<style scoped>
.root {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.tabs {
  width: 100%;
  display: flex;
  flex-direction: row;
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
.tab .icon {
  height: 100%;
  vertical-align: top;
}
.tab-contents {
  flex: 1;
}
.tab-contents .tab-content {
  color: var(--text-color);
  background-color: var(--tab-content-bg-color);
  width: 100%;
  height: 100%;
}
</style>
