<template>
  <div>
    <div class="full column root" :class="{ paused }">
      <div v-if="canBePaused" class="overlay-control row reverse">
        <button v-if="paused" @click="onUnpause">
          <Icon :icon="IconType.RESUME" />
          <span>{{ t.resume }}</span>
        </button>
        <button v-else @click="onPause">
          <Icon :icon="IconType.PAUSE" />
          <span>{{ t.stop }}</span>
        </button>
      </div>
      <div class="row headers">
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
import { Color, Move, Position } from "electron-shogi-core";
import { useAppSetting } from "@/renderer/store/setting";
import { useStore } from "@/renderer/store";

const props = defineProps({
  historyMode: {
    type: Boolean,
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
  canBePaused: {
    type: Boolean,
    required: false,
    default: false,
  },
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
.list-header {
  height: 16px;
  width: 100%;
  font-size: 12px;
  background-color: var(--text-bg-color);
}
.paused .list-header {
  background-color: var(--text-bg-color-disabled);
}
.list {
  width: 100%;
  overflow-y: scroll;
  background-color: var(--text-bg-color);
}
.paused .list {
  background-color: var(--text-bg-color-disabled);
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
