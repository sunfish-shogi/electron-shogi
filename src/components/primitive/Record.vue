<template>
  <div>
    <div class="frame">
      <div class="controller">
        <button
          class="control-button"
          @click="goBegin()"
          :disabled="!operational"
        >
          <img class="icon" src="icon/first_page_white_24dp.svg" />
        </button>
        <button
          class="control-button"
          @click="goBack()"
          :disabled="!operational"
        >
          <img class="icon" src="icon/chevron_left_white_24dp.svg" />
        </button>
        <button
          class="control-button"
          @click="goForward()"
          :disabled="!operational"
        >
          <img class="icon" src="icon/chevron_right_white_24dp.svg" />
        </button>
        <button
          class="control-button"
          @click="goEnd()"
          :disabled="!operational"
        >
          <img class="icon" src="icon/last_page_white_24dp.svg" />
        </button>
      </div>
      <select
        class="move-list"
        size="2"
        ref="moveList"
        @change="changeNumber()"
        :disabled="!operational"
      >
        <option
          v-for="move in moves"
          :key="move.number"
          :selected="move.selected"
          :value="move.number"
        >
          {{ move.number !== 0 ? move.number + " " : "" }}
          {{ move.text }} {{ move.hasBranch ? " 分岐" : "" }}
        </option>
      </select>
      <select
        class="branch-list"
        size="2"
        ref="branchList"
        @change="changeBranch()"
        :disabled="!operational"
      >
        <option
          v-for="branch in branches"
          :key="branch.index"
          :selected="branch.selected"
          :value="branch.index"
        >
          {{ branch.text }}
        </option>
      </select>
    </div>
  </div>
</template>

<script lang="ts">
import { Record, RecordEntry } from "@/shogi";
import { computed, ref, defineComponent, Ref } from "vue";

export default defineComponent({
  name: "Record",
  props: {
    record: {
      type: Record,
      required: true,
    },
    operational: {
      type: Boolean,
      required: false,
    },
  },
  emits: [
    "goBegin",
    "goBack",
    "goForward",
    "goEnd",
    "selectMove",
    "selectBranch",
  ],
  setup(props, context) {
    const moveList: Ref = ref(null);
    const branchList: Ref = ref(null);

    const goBegin = () => {
      context.emit("goBegin");
    };

    const goBack = () => {
      context.emit("goBack");
    };

    const goForward = () => {
      context.emit("goForward");
    };

    const goEnd = () => {
      context.emit("goEnd");
    };

    const changeNumber = () => {
      context.emit("selectMove", Number(moveList.value.value));
    };

    const changeBranch = () => {
      context.emit("selectBranch", Number(branchList.value.value));
    };

    const beginPosSelected = computed(() => props.record.current.number === 0);

    const moves = computed(() => {
      const ret: {
        text: string;
        number: number;
        hasBranch: boolean;
        selected: boolean;
      }[] = [];
      props.record.moves.forEach((elem) => {
        ret.push({
          number: elem.number,
          text: elem.displayText,
          hasBranch: elem.hasBranch,
          selected: elem === props.record.current,
        });
      });
      return ret;
    });

    const branches = computed(() => {
      if (!props.record.branchBegin?.branch) {
        return null;
      }
      const ret: {
        index: number;
        text: string;
        selected: boolean;
      }[] = [];
      let p: RecordEntry | null;
      for (p = props.record.branchBegin; p && p.move; p = p.branch) {
        ret.push({
          index: ret.length,
          text: p.displayMoveText,
          selected: p.activeBranch,
        });
      }
      return ret;
    });

    return {
      beginPosSelected,
      moves,
      branches,
      moveList,
      branchList,
      goBegin,
      goBack,
      goForward,
      goEnd,
      changeNumber,
      changeBranch,
    };
  },
});
</script>

<style scoped>
.frame {
  box-sizing: border-box;
  max-width: 400px;
  width: 100%;
  height: 100%;
  padding: 10px;
  display: flex;
  flex-direction: column;
}
.controller {
  width: 100%;
  height: 40px;
}
.control-button {
  height: 100%;
  width: 25%;
  padding: 0px;
}
.move-list {
  margin-top: 1px;
  width: 100%;
  height: 70%;
}
.branch-list {
  flex: auto;
  margin-top: 5px;
  width: 100%;
}
</style>
