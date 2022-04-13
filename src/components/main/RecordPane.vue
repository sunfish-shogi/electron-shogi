<template>
  <div>
    <RecordView
      class="record"
      :record="record"
      :operational="isRecordOperational"
      @go-begin="goBegin"
      @go-back="goBack"
      @go-forward="goForward"
      @go-end="goEnd"
      @select-move="selectMove"
      @select-branch="selectBranch"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import RecordView from "@/components/primitive/RecordView.vue";
import { Mutation, useStore } from "@/store";
import { Mode } from "@/store/mode";

export const minWidth = 200;

export default defineComponent({
  name: "RecordPane",
  components: {
    RecordView,
  },
  setup() {
    const store = useStore();

    const goto = (number: number) => {
      store.commit(Mutation.CHANGE_MOVE_NUMBER, number);
    };

    const goBegin = () => {
      goto(0);
    };

    const goBack = () => {
      goto(store.state.record.current.number - 1);
    };

    const goForward = () => {
      goto(store.state.record.current.number + 1);
    };

    const goEnd = () => {
      goto(Number.MAX_SAFE_INTEGER);
    };

    const selectMove = (number: number) => {
      goto(number);
    };

    const selectBranch = (index: number) => {
      store.commit(Mutation.CHANGE_BRANCH, index);
    };

    const isRecordOperational = computed(() => {
      return (
        store.state.mode === Mode.NORMAL || store.state.mode === Mode.RESEARCH
      );
    });

    const record = computed(() => store.state.record);

    return {
      isRecordOperational,
      record: record,
      goBegin,
      goBack,
      goForward,
      goEnd,
      selectMove,
      selectBranch,
    };
  },
});
</script>

<style scoped>
.record {
  width: 100%;
  height: 100%;
}
</style>
