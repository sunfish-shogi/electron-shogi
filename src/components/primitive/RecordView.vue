<template>
  <div>
    <div class="frame">
      <div class="controller">
        <button
          class="control-button"
          :disabled="!operational"
          @click="goBegin()"
        >
          <ButtonIcon class="icon" :icon="Icon.FIRST" />
        </button>
        <button
          class="control-button"
          :disabled="!operational"
          @click="goBack()"
        >
          <ButtonIcon class="icon" :icon="Icon.BACK" />
        </button>
        <button
          class="control-button"
          :disabled="!operational"
          @click="goForward()"
        >
          <ButtonIcon class="icon" :icon="Icon.NEXT" />
        </button>
        <button
          class="control-button"
          :disabled="!operational"
          @click="goEnd()"
        >
          <ButtonIcon class="icon" :icon="Icon.LAST" />
        </button>
      </div>
      <select
        ref="moveList"
        class="move-list"
        size="2"
        :disabled="!operational"
        @change="changeNumber()"
      >
        <option
          v-for="move in moves"
          :key="move.number"
          :class="{ 'has-branch': move.hasBranch, selected: move.selected }"
          :selected="move.selected"
          :value="move.number"
        >
          {{ move.number !== 0 ? move.number : "" }}
          {{ move.number !== 0 ? " " : "" }}
          {{ move.text }}
          {{ showComment && move.comment ? "-- " + move.comment : "" }}
        </option>
      </select>
      <select
        ref="branchList"
        class="branch-list"
        size="2"
        :disabled="!operational"
        @change="changeBranch()"
      >
        <option
          v-for="branch in branches"
          :key="branch.index"
          :selected="branch.selected"
          :value="branch.index"
        >
          {{ branch.text }}
          {{ showComment && branch.comment ? "-- " + branch.comment : "" }}
        </option>
      </select>
    </div>
  </div>
</template>

<script lang="ts">
import { ImmutableRecord, RecordEntry } from "@/shogi";
import { computed, ref, defineComponent, Ref, PropType } from "vue";
import ButtonIcon from "@/components/primitive/ButtonIcon.vue";
import { Icon } from "@/assets/icons";

export default defineComponent({
  name: "RecordView",
  components: {
    ButtonIcon,
  },
  props: {
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
        comment: string;
        selected: boolean;
      }[] = [];
      props.record.moves.forEach((elem) => {
        ret.push({
          number: elem.number,
          text: props.showElapsedTime ? elem.displayText : elem.displayMoveText,
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
      let p: RecordEntry | null;
      for (p = props.record.branchBegin; p && p.move; p = p.branch) {
        ret.push({
          index: ret.length,
          text: p.displayMoveText,
          comment: p.comment,
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
      Icon,
    };
  },
});
</script>

<style scoped>
.frame {
  max-width: 600px;
  width: 100%;
  height: 100%;
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
.move-list .has-branch:not(.selected) {
  background-color: var(--text-bg-color-warning);
}
.branch-list {
  flex: auto;
  margin-top: 2px;
  width: 100%;
}
</style>
