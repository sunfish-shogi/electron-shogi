<template>
  <div>
    <div class="root">
      <div
        class="minimize-padding"
        :class="{ enabled: activeTab === 'invisible' }"
      />
      <div class="tabs">
        <span
          class="tab"
          :class="{ selected: activeTab === 'comment' }"
          @click="changeSelect('comment')"
        >
          <img class="icon" src="icon/edit_note_white_24dp.svg" />
          棋譜コメント
        </span>
        <span
          class="tab"
          :class="{ selected: activeTab === 'search' }"
          @click="changeSelect('search')"
        >
          <img class="icon" src="icon/psychology_white_24dp.svg" />
          思考
        </span>
        <span
          class="tab"
          :class="{ selected: activeTab === 'chart' }"
          @click="changeSelect('chart')"
        >
          <img class="icon" src="icon/show_chart_white_24dp.svg" />
          形勢グラフ
        </span>
        <span
          class="tab"
          :class="{ selected: activeTab === 'invisible' }"
          @click="changeSelect('invisible')"
        >
          <img class="icon" src="icon/arrow_drop_down_white_24dp.svg" />
          最小化
        </span>
      </div>
      <div class="tab-border" />
      <div class="tab-contents">
        <RecordComment
          class="tab-content"
          :class="{ selected: activeTab === 'comment' }"
        />
        <EngineAnalytics
          class="tab-content"
          :class="{ selected: activeTab === 'search' }"
          :size="contentSize"
        />
        <EvaluationChart
          class="tab-content"
          :class="{ selected: activeTab === 'chart' }"
          :size="contentSize"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import RecordComment from "@/components/analytics/RecordComment.vue";
import EngineAnalytics from "@/components/analytics/EngineAnalytics.vue";
import EvaluationChart from "@/components/analytics/EvaluationChart.vue";
import { Action, useStore } from "@/store";
import { RectSize } from "@/layout/types";

export const headerHeight = 30;

export const minHeight = 240 + headerHeight;

export default defineComponent({
  name: "InformationPane",
  components: {
    RecordComment,
    EngineAnalytics,
    EvaluationChart,
  },
  props: {
    size: {
      type: RectSize,
      required: true,
    },
  },
  setup(props) {
    const store = useStore();
    const changeSelect = (id: string) => {
      store.dispatch(Action.UPDATE_AND_SAVE_APP_SETTING_ON_BACKGROUND, {
        informationTab: id,
      });
    };
    const activeTab = computed(() => store.state.appSetting.informationTab);
    const contentSize = computed(() =>
      props.size.reduce(new RectSize(0, headerHeight))
    );
    return {
      activeTab,
      contentSize,
      changeSelect,
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
.minimize-padding.enabled {
  height: calc(100% - 28px);
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
