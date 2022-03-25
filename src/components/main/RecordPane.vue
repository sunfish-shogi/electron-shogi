<template>
  <div>
    <Record
      class="record"
      :record="record"
      :operational="isRecordOperational"
      @goBegin="goBegin"
      @goBack="goBack"
      @goForward="goForward"
      @goEnd="goEnd"
      @selectMove="selectMove"
      @selectBranch="selectBranch"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import Record from "@/components/primitive/Record.vue";
import { Action, useStore } from "@/store";
import { Mode } from "@/store/state";

export const minWidth = 200;

export default defineComponent({
  name: "RecordPane",
  components: {
    Record,
  },
  setup() {
    const store = useStore();

    const goto = (number: number) => {
      store.dispatch(Action.CHANGE_MOVE_NUMBER, number);
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
      store.dispatch(Action.CHANGE_BRANCH, index);
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
