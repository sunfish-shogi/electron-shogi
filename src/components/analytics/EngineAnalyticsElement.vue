<template>
  <div>
    <div class="root">
      <div class="headers">
        <div class="header">
          <span class="label">エンジン名: </span>
          <span class="value">{{ name }}</span>
        </div>
        <div class="header">
          <span class="label">最善手: </span>
          <span class="value">{{ info.currentMoveText || "---" }}</span>
        </div>
        <div class="header">
          <span class="label">秒間探索ノード(NPS): </span>
          <span class="value">{{ info.nps || "---" }}</span>
        </div>
        <div class="header">
          <span class="label">探索ノード数: </span>
          <span class="value">{{ info.nodes || "---" }}</span>
        </div>
        <div class="header">
          <span class="label">ハッシュ使用率: </span>
          <span class="value">
            {{ info.hashfull ? (info.hashfull * 100).toFixed(1) : "---" }} %
          </span>
        </div>
      </div>
      <div class="list-header">
        <div class="list-column time">経過時間</div>
        <div class="list-column multipv-index">順位</div>
        <div class="list-column depth">深さ</div>
        <div class="list-column score">評価値</div>
      </div>
      <div class="list" :style="`height:${height - 36}px`">
        <div
          v-for="(iterate, index) in info.iterates"
          :key="index"
          class="list-item"
        >
          <div class="list-column time">
            {{ iterate.timeMs ? (iterate.timeMs / 1e3).toFixed(1) + "s" : "" }}
          </div>
          <div class="list-column multipv-index">
            {{ iterate.multiPV || "" }}
          </div>
          <div class="list-column depth">
            {{ iterate.depth
            }}{{ iterate.selectiveDepth && iterate.depth ? "/" : ""
            }}{{ iterate.selectiveDepth }}
          </div>
          <div class="list-column score">
            {{ iterate.score }}
            {{ iterate.scoreMate ? iterate.scoreMate : "" }}
          </div>
          <div class="list-column score-flag">
            {{ iterate.lowerBound ? "++" : "" }}
            {{ iterate.upperBound ? "--" : "" }}
            {{ iterate.scoreMate ? "詰" : "" }}
          </div>
          <div class="list-column text">
            {{ iterate.text }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { USIPlayerMonitor } from "@/store/usi";
import { defineComponent } from "vue";

export default defineComponent({
  name: "EngineAnalyticsElement",
  props: {
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
.headers {
  width: 100%;
  height: 20px;
  text-align: left;
  display: flex;
  flex-direction: row;
  background-color: gray;
}
.header {
  margin: 2px 4px 0px 0px;
  padding: 0px 5px 0px 5px;
  background-color: white;
}
.label {
  font-size: 13px;
}
.value {
  font-size: 13px;
}
.list-header {
  height: 16px;
  width: 100%;
  font-size: 12px;
  background-color: white;
  display: flex;
  flex-direction: row;
}
.list {
  width: 100%;
  overflow-y: scroll;
  background-color: white;
}
.list-item {
  height: 16px;
  font-size: 12px;
  display: flex;
  flex-direction: row;
}
.list-column.multipv-index {
  height: 100%;
  width: 30px;
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
}
.list-column.depth {
  height: 100%;
  width: 44px;
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
}
.list-column.time {
  height: 100%;
  width: 52px;
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
}
.list-column.score {
  height: 100%;
  width: 52px;
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
}
.list-column.score-flag {
  height: 100%;
  width: 20px;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
}
.list-column.text {
  height: 100%;
  flex: 1;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
