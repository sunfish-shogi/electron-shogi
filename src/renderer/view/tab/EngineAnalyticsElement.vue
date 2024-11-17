<template>
  <div>
    <div class="full column root" :class="{ paused }">
      <div v-if="showHeader && canBePaused" class="overlay-control row reverse">
        <button v-if="paused" @click="onUnpause">
          <Icon :icon="IconType.RESUME" />
          <span>{{ t.resume }}</span>
        </button>
        <button v-else @click="onPause">
          <Icon :icon="IconType.PAUSE" />
          <span>{{ t.stop }}</span>
        </button>
      </div>
      <div v-if="showHeader" class="row headers">
        <div class="header">
          <span>{{ t.name }}: </span>
          <span>{{ info.name }}</span>
        </div>
        <div class="header">
          <span>{{ t.prediction }}: </span>
          <span>
            {{ info.ponderMove ? info.ponderMove : "---" }}
          </span>
        </div>
        <div class="header">
          <span>{{ t.best }}: </span>
          <span>{{ info.currentMoveText || "---" }}</span>
        </div>
        <div class="header">
          <span>NPS: </span>
          <span>{{ info.nps || "---" }}</span>
        </div>
        <div class="header">
          <span>{{ t.nodes }}: </span>
          <span>{{ info.nodes || "---" }}</span>
        </div>
        <div class="header">
          <span>{{ t.hashUsage }}: </span>
          <span>{{ info.hashfull ? (info.hashfull * 100).toFixed(1) : "---" }} %</span>
        </div>
      </div>
      <div class="list-area" :style="{ height: `${height - (showHeader ? 22 : 0)}px` }">
        <table class="list">
          <thead>
            <tr class="list-header">
              <td v-if="showTimeColumn" class="time">{{ t.elapsed }}</td>
              <td v-if="showMultiPvColumn" class="multipv-index">{{ t.rank }}</td>
              <td v-if="showDepthColumn" class="depth">{{ t.depth }}</td>
              <td v-if="showNodesColumn" class="nodes">{{ t.nodes }}</td>
              <td v-if="showScoreColumn" class="score">{{ t.eval }}</td>
              <td v-if="showScoreColumn" class="score-flag"></td>
              <td class="text">{{ t.pv }}</td>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="iteration in historyMode ? info.iterations : info.latestIteration"
              :key="iteration.id"
              class="list-item"
              :class="{ highlight: enableHighlight && iteration.multiPV === 1 }"
            >
              <td v-if="showTimeColumn" class="time">
                {{ iteration.timeMs ? (iteration.timeMs / 1e3).toFixed(1) + "s" : "" }}
              </td>
              <td v-if="showMultiPvColumn" class="multipv-index">
                {{ iteration.multiPV || "" }}
              </td>
              <td v-if="showDepthColumn" class="depth">
                {{ iteration.depth
                }}{{
                  iteration.selectiveDepth !== undefined && iteration.depth !== undefined
                    ? "/"
                    : ""
                }}{{ iteration.selectiveDepth }}
              </td>
              <td v-if="showNodesColumn" class="nodes">
                {{ iteration.nodes }}
              </td>
              <td v-if="showScoreColumn" class="score">
                {{
                  iteration.scoreMate !== undefined
                    ? getDisplayScore(iteration.scoreMate, iteration.color, evaluationViewFrom)
                    : iteration.score !== undefined
                      ? getDisplayScore(iteration.score, iteration.color, evaluationViewFrom)
                      : ""
                }}
              </td>
              <td v-if="showScoreColumn" class="score-flag">
                {{ iteration.lowerBound ? "++" : "" }}
                {{ iteration.upperBound ? "--" : "" }}
                {{ iteration.scoreMate ? t.mateShort : "" }}
              </td>
              <td class="text">
                <button
                  v-if="
                    showPlayButton && iteration.pv && iteration.pv.length !== 0 && iteration.text
                  "
                  @click="showPreview(iteration)"
                >
                  <Icon :icon="IconType.PLAY" />
                  <span>{{ t.displayPVShort }}</span>
                </button>
                {{ iteration.text }}
              </td>
            </tr>
          </tbody>
        </table>
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
import { Color, Move, Position } from "tsshogi";
import { useAppSettings } from "@/renderer/store/settings";
import { useStore } from "@/renderer/store";

const props = defineProps({
  historyMode: { type: Boolean, required: true },
  info: { type: USIPlayerMonitor, required: true },
  height: { type: Number, required: true },
  showHeader: { type: Boolean, default: true },
  showTimeColumn: { type: Boolean, default: true },
  showMultiPvColumn: { type: Boolean, default: true },
  showDepthColumn: { type: Boolean, default: true },
  showNodesColumn: { type: Boolean, default: true },
  showScoreColumn: { type: Boolean, default: true },
  showPlayButton: { type: Boolean, default: true },
  canBePaused: { type: Boolean, required: false, default: false },
});

const store = useStore();

const paused = computed(() => {
  return store.isPausedResearchEngine(props.info.sessionID);
});

const enableHighlight = computed(() => {
  if (!props.historyMode) {
    return false;
  }
  return props.info.iterations.some((iteration) => iteration.multiPV && iteration.multiPV !== 1);
});

const evaluationViewFrom = computed(() => {
  return useAppSettings().evaluationViewFrom;
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

const onPause = () => {
  store.pauseResearchEngine(props.info.sessionID);
};

const onUnpause = () => {
  store.unpauseResearchEngine(props.info.sessionID);
};
</script>

<style scoped>
.root {
  position: relative;
  padding-bottom: 2px;
  background-color: var(--active-tab-bg-color);
}
.overlay-control {
  position: absolute;
  width: 100%;
  margin: 0px 0px 0px 0px;
}
.headers {
  width: 100%;
  height: 22px;
  text-align: left;
}
.header {
  margin: 0px 5px 0px 0px;
  padding: 0px 5px 0px 5px;
  background-color: var(--text-bg-color);
}
.paused .header {
  background-color: var(--text-bg-color-disabled);
}
.header span {
  font-size: 12px;
  white-space: nowrap;
}
.list-area {
  width: 100%;
  overflow-y: scroll;
  background-color: var(--text-bg-color);
}
.paused .list-area {
  background-color: var(--text-bg-color-disabled);
}
table.list {
  width: 100%;
  max-width: 100%;
  border-collapse: collapse;
}
tr.list-header > td {
  height: 16px;
  width: 100%;
  font-size: 12px;
  background-color: var(--text-bg-color);
  position: sticky;
  top: 0;
  left: 0;
}
.paused tr.list-header > td {
  background-color: var(--text-bg-color-disabled);
}
tr.list-item > td {
  height: 24px;
  font-size: 12px;
}
tr.list-item.highlight > td {
  background: var(--text-bg-color-warning);
  border-bottom: dashed var(--text-separator-color) 1px;
}
table.list td {
  border: 0;
  padding: 0;
  height: 100%;
  white-space: nowrap;
  overflow: hidden;
  padding-left: 4px;
}
table.list td.time {
  width: 0;
  text-align: right;
}
table.list td.multipv-index {
  width: 0;
  text-align: right;
}
table.list td.depth {
  width: 0;
  text-align: right;
}
table.list td.nodes {
  width: 0;
  text-align: right;
}
table.list td.score {
  width: 0;
  text-align: right;
}
table.list td.score-flag {
  width: 0;
  text-align: left;
}
table.list td.text {
  max-width: 0;
  text-align: left;
  text-overflow: ellipsis;
  overflow: hidden;
}
button {
  margin: 0px 0px 1px 0px;
  padding: 1px 5px 1px 2px;
  height: 22px;
  vertical-align: middle;
}
.icon {
  height: 18px;
}
button span {
  line-height: 19px;
}
</style>
