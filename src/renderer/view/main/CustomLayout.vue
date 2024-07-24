<template>
  <div>
    <div
      v-for="c in components"
      :key="`${c.type}.${c.index}`"
      class="component"
      :style="{ ...c.rect.style, zIndex: 1e5 - c.index }"
    >
      <BoardPane
        v-if="c.type === 'Board'"
        :max-size="c.rect.size"
        :left-control-type="
          c.leftControlBox ? LeftSideControlType.STANDARD : LeftSideControlType.NONE
        "
        :right-control-type="
          c.rightControlBox ? RightSideControlType.STANDARD : RightSideControlType.NONE
        "
        :layout-type="c.layoutType"
      />
      <RecordPane
        v-else-if="c.type === 'Record'"
        :show-comment="!!c.showCommentColumn"
        :show-elapsed-time="!!c.showElapsedTimeColumn"
        :show-top-control="!!c.topControlBox"
        :show-bottom-control="false"
        :show-branches="!!c.branches"
      />
      <div v-else-if="c.type === 'Analytics'" class="full tab-content">
        <EngineAnalytics
          :size="c.rect.size"
          :history-mode="!!c.historyMode"
          :show-header="!!c.showHeader"
          :show-time-column="!!c.showTimeColumn"
          :show-multi-pv-column="!!c.showMultiPvColumn"
          :show-depth-column="!!c.showDepthColumn"
          :show-nodes-column="!!c.showNodesColumn"
          :show-score-column="!!c.showScoreColumn"
          :show-play-button="!!c.showPlayButton"
        />
      </div>
      <EvaluationChart
        v-else-if="c.type === 'Chart'"
        :size="c.rect.size"
        :type="c.chartType"
        :thema="appSettings.thema"
        :coefficient-in-sigmoid="appSettings.coefficientInSigmoid"
        :show-legend="!!c.showLegend"
      />
      <RecordComment
        v-else-if="c.type === 'Comment'"
        class="full"
        :show-bookmark="!!c.showBookmark"
      />
      <RecordInfo v-else-if="c.type === 'RecordInfo'" class="full" :size="c.rect.size" />
      <ControlPane v-else-if="c.type === 'ControlGroup1'" :group="ControlGroup.Group1" />
      <ControlPane v-else-if="c.type === 'ControlGroup2'" :group="ControlGroup.Group2" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { LayoutProfile } from "@/common/settings/layout";
import { computed } from "vue";
import { Rect } from "@/common/assets/geometry";
import { LeftSideControlType, RightSideControlType } from "@/common/settings/app";
import BoardPane from "./BoardPane.vue";
import RecordPane from "./RecordPane.vue";
import EngineAnalytics from "@/renderer/view/tab/EngineAnalytics.vue";
import EvaluationChart from "@/renderer/view/tab/EvaluationChart.vue";
import ControlPane, { ControlGroup } from "./ControlPane.vue";
import { useAppSettings } from "@/renderer/store/settings";
import RecordComment from "@/renderer/view/tab/RecordComment.vue";
import RecordInfo from "@/renderer/view/tab/RecordInfo.vue";

const props = defineProps<{ profile: LayoutProfile }>();

const appSettings = useAppSettings();

const components = computed(() => {
  return props.profile.components.map((c, i) => {
    return {
      ...c,
      index: i,
      rect: new Rect(c.left, c.top, c.width, c.height),
    };
  });
});
</script>

<style scoped>
.component {
  position: absolute;
}
.tab-content {
  color: var(--text-color);
  background-color: var(--tab-content-bg-color);
}
</style>
