<template>
  <div>
    <div class="root">
      <div
        v-if="activeTab === 'invisible'"
        :style="`height: calc(100% - ${headerHeight}px);`"
      />
      <div class="tabs">
        <span
          class="tab"
          :class="{ selected: activeTab === Tab.RECORD_INFO }"
          @click="changeSelect(Tab.RECORD_INFO)"
        >
          <ButtonIcon class="icon" :icon="Icon.DESCRIPTION" />
          棋譜情報
        </span>
        <span
          class="tab"
          :class="{ selected: activeTab === Tab.COMMENT }"
          @click="changeSelect(Tab.COMMENT)"
        >
          <ButtonIcon class="icon" :icon="Icon.COMMENT" />
          コメント
        </span>
        <span
          class="tab"
          :class="{ selected: activeTab === Tab.SEARCH }"
          @click="changeSelect(Tab.SEARCH)"
        >
          <ButtonIcon class="icon" :icon="Icon.BRAIN" />
          思考
        </span>
        <span
          class="tab"
          :class="{ selected: activeTab === Tab.CHART }"
          @click="changeSelect(Tab.CHART)"
        >
          <ButtonIcon class="icon" :icon="Icon.CHART" />
          評価値
        </span>
        <span
          class="tab"
          :class="{ selected: activeTab === Tab.PERCENTAGE_CHART }"
          @click="changeSelect(Tab.PERCENTAGE_CHART)"
        >
          <ButtonIcon class="icon" :icon="Icon.PERCENT" />
          期待勝率
        </span>
        <span
          class="tab"
          :class="{ selected: activeTab === Tab.INVISIBLE }"
          @click="changeSelect(Tab.INVISIBLE)"
        >
          <ButtonIcon class="icon" :icon="Icon.ARROW_DROP" />
          最小化
        </span>
      </div>
      <div class="tab-border" />
      <div class="tab-contents">
        <RecordInfo
          class="tab-content"
          :class="{ selected: activeTab === Tab.RECORD_INFO }"
          :size="contentSize"
        />
        <RecordComment
          class="tab-content"
          :class="{ selected: activeTab === Tab.COMMENT }"
        />
        <EngineAnalytics
          class="tab-content"
          :class="{ selected: activeTab === Tab.SEARCH }"
          :size="contentSize"
        />
        <EvaluationChart
          class="tab-content"
          :class="{ selected: activeTab === Tab.CHART }"
          :size="contentSize"
          :type="EvaluationChartType.RAW"
        />
        <EvaluationChart
          class="tab-content"
          :class="{ selected: activeTab === Tab.PERCENTAGE_CHART }"
          :size="contentSize"
          :type="EvaluationChartType.WIN_RATE"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import RecordComment from "@/components/tab/RecordComment.vue";
import EngineAnalytics from "@/components/tab/EngineAnalytics.vue";
import EvaluationChart, {
  EvaluationChartType,
} from "@/components/tab/EvaluationChart.vue";
import RecordInfo from "@/components/tab/RecordInfo.vue";
import { useStore } from "@/store";
import { RectSize } from "@/components/primitive/Types";
import ButtonIcon from "@/components/primitive/ButtonIcon.vue";
import { Tab } from "@/settings/app";
import { Icon } from "@/assets/icons";
import api from "@/ipc/api";
import { LogLevel } from "@/ipc/log";
import { toString } from "@/helpers/string";

export const headerHeight = 30;

export const minHeight = 240 + headerHeight;

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
  },
  setup(props) {
    const store = useStore();
    const changeSelect = (id: Tab) => {
      store
        .updateAppSetting({
          tab: id,
        })
        .catch((e) => {
          api.log(LogLevel.WARN, toString(e));
        });
    };
    const activeTab = computed(() => store.appSetting.tab);
    const contentSize = computed(() =>
      props.size.reduce(new RectSize(0, headerHeight))
    );
    return {
      activeTab,
      contentSize,
      headerHeight,
      changeSelect,
      Icon,
      Tab,
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
  display: flex;
  flex-direction: row;
  user-select: none;
}
.tab {
  height: 24px;
  color: var(--inactive-tab-color);
  background-color: var(--inactive-tab-bg-color);
  border: solid 1px var(--inactive-tab-border-color);
  border-bottom: 0px;
  border-top-right-radius: 10px;
  padding: 0px 20px 0px 10px;
  line-height: 28px;
  font-size: 1rem;
  text-align: left;
}
.tab.selected {
  color: var(--active-tab-color);
  background-color: var(--active-tab-bg-color);
}
.tab .icon {
  height: 100%;
  vertical-align: top;
}
.tab-border {
  width: 100%;
  height: 4px;
  background-color: var(--active-tab-bg-color);
}
.tab-contents {
  flex: 1;
}
.tab-contents .tab-content {
  display: none;
  width: 100%;
  height: 100%;
}
.tab-contents .tab-content.selected {
  display: block;
}
</style>
