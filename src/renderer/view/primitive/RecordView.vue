<template>
  <div class="full column record-view">
    <div class="row control">
      <button :disabled="!operational" data-hotkey="ArrowLeft" @click="goBegin">
        <Icon :icon="IconType.FIRST" />
      </button>
      <button :disabled="!operational" data-hotkey="ArrowUp" @click="goBack()">
        <Icon :icon="IconType.BACK" />
      </button>
      <button
        :disabled="!operational"
        data-hotkey="ArrowDown"
        @click="goForward"
      >
        <Icon :icon="IconType.NEXT" />
      </button>
      <button :disabled="!operational" data-hotkey="ArrowRight" @click="goEnd">
        <Icon :icon="IconType.LAST" />
      </button>
    </div>
    <div ref="moveList" class="move-list">
      <div
        v-for="move in moves"
        :key="move.number"
        class="row move-element"
        :class="{ 'has-branch': move.hasBranch, selected: move.selected }"
        :value="move.number"
        @click="changeNumber(move.number)"
      >
        <div class="move-number">
          {{ move.number !== 0 ? move.number : "" }}
        </div>
        <div class="move-text">{{ move.text }}</div>
        <div v-if="showElapsedTime" class="move-time">{{ move.time }}</div>
        <div v-if="showComment" class="move-comment">{{ move.comment }}</div>
      </div>
    </div>
    <div class="auto row branch-list-area">
      <div ref="branchList" class="auto branch-list">
        <div
          v-for="branch in branches"
          :key="branch.index"
          class="row move-element"
          :class="{ selected: branch.selected }"
          :value="branch.index"
          @click="changeBranch(branch.index)"
        >
          <div class="move-text">{{ branch.text }}</div>
          <div v-if="showComment" class="move-comment">
            {{ branch.comment }}
          </div>
        </div>
      </div>
      <div class="column branch-list-control">
        <button :disabled="!operational" @click="swapWithPreviousBranch()">
          <Icon :icon="IconType.ARROW_UP" />
        </button>
        <button :disabled="!operational" @click="swapWithNextBranch()">
          <Icon :icon="IconType.ARROW_DROP" />
        </button>
      </div>
    </div>
    <div class="row wrap options">
      <div class="option">
        <ToggleButton
          :label="elapsedTimeToggleLabel"
          :value="showElapsedTime"
          @change="(enabled) => emit('toggleShowElapsedTime', enabled)"
        />
      </div>
      <div class="option">
        <ToggleButton
          :label="commentToggleLabel"
          :value="showComment"
          @change="(enabled) => emit('toggleShowComment', enabled)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ImmutableRecord, ImmutableNode } from "@/common/shogi";
import { computed, ref, PropType, onUpdated } from "vue";
import Icon from "@/renderer/view/primitive/Icon.vue";
import { IconType } from "@/renderer/assets/icons";
import ToggleButton from "./ToggleButton.vue";

const props = defineProps({
  record: {
    type: Object as PropType<ImmutableRecord>,
    required: true,
  },
  operational: {
    type: Boolean,
    required: false,
  },
  showElapsedTime: {
    type: Boolean,
    required: false,
  },
  showComment: {
    type: Boolean,
    required: false,
  },
  elapsedTimeToggleLabel: {
    type: String,
    required: true,
  },
  commentToggleLabel: {
    type: String,
    required: true,
  },
});

const emit = defineEmits([
  "goBegin",
  "goBack",
  "goForward",
  "goEnd",
  "selectMove",
  "selectBranch",
  "swapWithPreviousBranch",
  "swapWithNextBranch",
  "toggleShowElapsedTime",
  "toggleShowComment",
]);

const moveList = ref(null as HTMLDivElement | null);
const branchList = ref();

const goBegin = () => {
  if (props.operational) {
    emit("goBegin");
  }
};

const goBack = () => {
  if (props.operational) {
    emit("goBack");
  }
};

const goForward = () => {
  if (props.operational) {
    emit("goForward");
  }
};

const goEnd = () => {
  if (props.operational) {
    emit("goEnd");
  }
};

const changeNumber = (number: number) => {
  if (props.operational) {
    emit("selectMove", Number(number));
  }
};

const changeBranch = (index: number) => {
  if (props.operational) {
    emit("selectBranch", Number(index));
  }
};

const swapWithPreviousBranch = () => {
  if (props.operational) {
    emit("swapWithPreviousBranch");
  }
};

const swapWithNextBranch = () => {
  if (props.operational) {
    emit("swapWithNextBranch");
  }
};

const moves = computed(() => {
  const ret: {
    number: number;
    text: string;
    time: string;
    hasBranch: boolean;
    comment: string;
    selected: boolean;
  }[] = [];
  props.record.moves.forEach((elem) => {
    ret.push({
      number: elem.number,
      text: elem.displayText,
      time: elem.number != 0 ? elem.timeText : "",
      hasBranch: elem.hasBranch,
      comment: elem.comment,
      selected: elem === props.record.current,
    });
  });
  return ret;
});

const branches = computed(() => {
  if (!props.record.branchBegin.branch) {
    return null;
  }
  const ret: {
    index: number;
    text: string;
    comment: string;
    selected: boolean;
  }[] = [];
  let p: ImmutableNode | null;
  for (p = props.record.branchBegin; p && p.move; p = p.branch) {
    ret.push({
      index: ret.length,
      text: p.displayText,
      comment: p.comment,
      selected: p.activeBranch,
    });
  }
  return ret;
});

onUpdated(() => {
  const moveListElement = moveList.value as HTMLElement;
  moveListElement.childNodes.forEach((elem) => {
    if (elem instanceof HTMLElement && elem.classList.contains("selected")) {
      elem.scrollIntoView({ behavior: "auto", block: "nearest" });
    }
  });
  const branchListElement = branchList.value as HTMLElement;
  branchListElement.childNodes.forEach((elem) => {
    if (elem instanceof HTMLElement && elem.classList.contains("selected")) {
      elem.scrollIntoView({ behavior: "auto", block: "nearest" });
    }
  });
});
</script>

<style scoped>
.record-view {
  max-width: 600px;
  user-select: none;
}
.control {
  width: 100%;
  height: 40px;
}
.control button {
  height: 100%;
  width: 25%;
  padding: 0px;
}
.move-list {
  margin-top: 1px;
  width: 100%;
  height: calc(70% - 50px);
  overflow-x: hidden;
  overflow-y: auto;
  color: var(--text-color);
  background-color: var(--text-bg-color);
}
.branch-list-area {
  margin-top: 2px;
  width: 100%;
}
.branch-list {
  width: auto;
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  color: var(--text-color);
  background-color: var(--text-bg-color);
}
.branch-list-control {
  width: 40px;
  height: 100%;
}
.branch-list-control button {
  height: 50%;
  width: 100%;
  padding: 0;
}
.branch-list-control button .icon {
  height: 40px;
}
.move-element {
  height: 1.4em;
  width: 100%;
  line-height: 1.4em;
  font-size: 0.85em;
}
.move-element.has-branch:not(.selected) {
  background-color: var(--text-bg-color-warning);
}
.move-element.selected {
  background-color: var(--text-bg-color-selected);
}
.move-number {
  min-width: 38px;
  height: 100%;
  padding-right: 5px;
  text-align: right;
  vertical-align: baseline;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: clip;
}
.move-text {
  min-width: 100px;
  height: 100%;
  padding-right: 5px;
  text-align: left;
  vertical-align: baseline;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: clip;
}
.move-time {
  min-width: 90px;
  height: 100%;
  padding-right: 5px;
  text-align: left;
  vertical-align: baseline;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: clip;
}
.move-comment {
  height: 100%;
  text-align: left;
  vertical-align: baseline;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.options {
  width: 100%;
  margin: 0;
  padding: 2px 0 0 0;
  color: var(--main-color);
  background-color: var(--main-bg-color);
}
.option {
  padding: 0 6px 0 6px;
  margin-right: 4px;
}
</style>
