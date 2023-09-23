<template>
  <div>
    <div class="full column root">
      <div class="row headers">
        <div class="header">
          <span class="label">{{ t.name }}: </span>
          <span class="value">{{ name }}</span>
        </div>
        <div class="header">
          <span class="label">{{ t.prediction }}: </span>
          <span class="value">
            {{ info.ponderMove ? info.ponderMove : "---" }}
          </span>
        </div>
        <div class="header">
          <span class="label">{{ t.best }}: </span>
          <span class="value">{{ info.currentMoveText || "---" }}</span>
        </div>
        <div class="header">
          <span class="label">NPS: </span>
          <span class="value">{{ info.nps || "---" }}</span>
        </div>
        <div class="header">
          <span class="label">{{ t.nodes }}: </span>
          <span class="value">{{ info.nodes || "---" }}</span>
        </div>
        <div class="header">
          <span class="label">{{ t.hashUsage }}: </span>
          <span class="value">
            {{ info.hashfull ? (info.hashfull * 100).toFixed(1) : "---" }} %
          </span>
        </div>
      </div>
      <div class="row list-header">
        <div class="list-column time">{{ t.elapsed }}</div>
        <div class="list-column multipv-index">{{ t.rank }}</div>
        <div class="list-column depth">{{ t.depth }}</div>
        <div class="list-column nodes">{{ t.nodes }}</div>
        <div class="list-column score">{{ t.eval }}</div>
      </div>
      <div class="list" :style="{ height: `${height - 37}px` }">
        <div
          v-for="iteration in historyMode ? info.iterations : info.latestIteration"
          :key="iteration.id"
          v-memo="[]"
          class="row list-item"
          :class="{ highlight: enableHighlight && iteration.multiPV === 1 }"
        >
          <div class="list-column time">
            {{ iteration.timeMs ? (iteration.timeMs / 1e3).toFixed(1) + "s" : "" }}
          </div>
          <div class="list-column multipv-index">
            {{ iteration.multiPV || "" }}
          </div>
          <div class="list-column depth">
            {{ iteration.depth }}{{ iteration.selectiveDepth && iteration.depth ? "/" : ""
            }}{{ iteration.selectiveDepth }}
          </div>
          <div class="list-column nodes">
            {{ iteration.nodes }}
          </div>
          <div class="list-column score">
            {{
              iteration.scoreMate !== undefined
                ? getDisplayScore(iteration.scoreMate, iteration.color, evaluationViewFrom)
                : iteration.score !== undefined
                ? getDisplayScore(iteration.score, iteration.color, evaluationViewFrom)
                : ""
            }}
          </div>
          <div class="list-column score-flag">
            {{ iteration.lowerBound ? "++" : "" }}
            {{ iteration.upperBound ? "--" : "" }}
            {{ iteration.scoreMate ? t.mateShort : "" }}
          </div>
          <div class="grow list-column text">
            <button
              v-if="iteration.pv && iteration.pv.length !== 0 && iteration.text"
              @click="showPreview(iteration)"
            >
              <Icon :icon="IconType.PLAY" />
              <span>{{ t.displayPVShort }}</span>
            </button>
            {{ iteration.text }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { t } from "@/common/i18n";
import { USIIteration, USIPlayerMonitor } from "@/renderer/store/usi";
import { computed } from "vue";
import { IconType } from "@/renderer/assets/icons";
import Icon from "@/renderer/view/primitive/Icon.vue";
import { EvaluationViewFrom } from "@/common/settings/app";
import { Color, Move, Position } from "@/common/shogi";
import { useAppSetting } from "@/renderer/store/setting";
import { useStore } from "@/renderer/store";

const props = defineProps({
  historyMode: {
    type: Boolean,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  info: {
    type: USIPlayerMonitor,
    required: true,
  },
  height: {
    type: Number,
    required: true,
  },
});

const enableHighlight = computed(() => {
  if (!props.historyMode) {
    return false;
  }
  for (const iteration of props.info.iterations) {
    if (iteration.multiPV && iteration.multiPV !== 1) {
      return true;
    }
  }
  return false;
});

const evaluationViewFrom = computed(() => {
  return useAppSetting().evaluationViewFrom;
});
const getDisplayScore = (score: number, color: Color, evaluationViewFrom: EvaluationViewFrom) => {
  return evaluationViewFrom === EvaluationViewFrom.EACH || color == Color.BLACK ? score : -score;
};

const showPreview = (ite: USIIteration) => {
  const position = Position.newBySFEN(ite.position);
  if (!position) {
    return;
  }
  const pos = position.clone();
  const pv: Move[] = [];
  for (const usiMove of ite.pv || []) {
    const move = pos.createMoveByUSI(usiMove);
    if (!move || !pos.doMove(move)) {
      break;
    }
    pv.push(move);
  }
  useStore().showPVPreviewDialog({
    position,
    multiPV: ite.multiPV,
    depth: ite.depth,
    selectiveDepth: ite.selectiveDepth,
    score: ite.score,
    mate: ite.scoreMate,
    lowerBound: ite.lowerBound,
    upperBound: ite.upperBound,
    pv,
  });
};
</script>

<style scoped>
.root {
  padding-bottom: 2px;
  background-color: var(--active-tab-bg-color);
}
.headers {
  width: 100%;
  height: 18px;
  text-align: left;
}
.header {
  margin: 0px 4px 0px 0px;
  padding: 0px 5px 0px 5px;
  background-color: var(--text-bg-color);
}
.label {
  font-size: 13px;
  white-space: nowrap;
}
.value {
  font-size: 13px;
  white-space: nowrap;
}
.list-header {
  height: 16px;
  width: 100%;
  font-size: 12px;
  background-color: var(--text-bg-color);
}
.list {
  width: 100%;
  overflow-y: scroll;
  background-color: var(--text-bg-color);
}
.list-item {
  height: 24px;
  font-size: 12px;
}
.list-item.highlight {
  background: var(--text-bg-color-warning);
  border-bottom: dashed var(--text-separator-color) 1px;
}
.list-column {
  height: 100%;
  white-space: nowrap;
  overflow: hidden;
  line-height: 22px;
}
.list-column.multipv-index {
  width: 30px;
  text-align: right;
}
.list-column.depth {
  width: 44px;
  text-align: right;
}
.list-column.nodes {
  width: 78px;
  text-align: right;
}
.list-column.time {
  width: 52px;
  text-align: right;
}
.list-column.score {
  width: 52px;
  text-align: right;
}
.list-column.score-flag {
  width: 20px;
  text-align: left;
}
.list-column.text {
  text-align: left;
  text-overflow: ellipsis;
}
.list-column button {
  margin: 0px 0px 1px 0px;
  padding: 1px 5px 1px 2px;
  height: 22px;
  vertical-align: middle;
}
.list-column .icon {
  height: 18px;
}
.list-column button span {
  line-height: 19px;
}
</style>
