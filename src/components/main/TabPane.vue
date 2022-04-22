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
          :class="{ selected: activeTab === 'recordInfo' }"
          @click="changeSelect('recordInfo')"
        >
          <ButtonIcon class="icon" icon="recordInfo" />
          棋譜情報
        </span>
        <span
          class="tab"
          :class="{ selected: activeTab === 'comment' }"
          @click="changeSelect('comment')"
        >
          <ButtonIcon class="icon" icon="comment" />
          指し手コメント
        </span>
        <span
          class="tab"
          :class="{ selected: activeTab === 'search' }"
          @click="changeSelect('search')"
        >
          <ButtonIcon class="icon" icon="brain" />
          思考
        </span>
        <span
          class="tab"
          :class="{ selected: activeTab === 'chart' }"
          @click="changeSelect('chart')"
        >
          <ButtonIcon class="icon" icon="chart" />
          形勢グラフ
        </span>
        <span
          class="tab"
          :class="{ selected: activeTab === 'invisible' }"
          @click="changeSelect('invisible')"
        >
          <ButtonIcon class="icon" icon="arrowDrop" />
          最小化
        </span>
      </div>
      <div class="tab-border" />
      <div class="tab-contents">
        <RecordInfo
          class="tab-content"
          :class="{ selected: activeTab === 'recordInfo' }"
          :size="contentSize"
        />
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
import RecordComment from "@/components/tab/RecordComment.vue";
import EngineAnalytics from "@/components/tab/EngineAnalytics.vue";
import EvaluationChart from "@/components/tab/EvaluationChart.vue";
import RecordInfo from "@/components/tab/RecordInfo.vue";
import { Action, useStore } from "@/store";
import { RectSize } from "@/components/primitive/Types";
import ButtonIcon from "@/components/primitive/ButtonIcon.vue";

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
    const changeSelect = (id: string) => {
      store.dispatch(Action.UPDATE_APP_SETTING, {
        tab: id,
      });
    };
    const activeTab = computed(() => store.state.appSetting.tab);
    const contentSize = computed(() =>
      props.size.reduce(new RectSize(0, headerHeight))
    );
    return {
      activeTab,
      contentSize,
      headerHeight,
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
