<template>
  <div>
    <div class="frame">
      <RecordView
        class="record"
        :record="record"
        :operational="isRecordOperational"
        :show-comment="showComment"
        :show-elapsed-time="showElapsedTime"
        @go-begin="goBegin"
        @go-back="goBack"
        @go-forward="goForward"
        @go-end="goEnd"
        @select-move="selectMove"
        @select-branch="selectBranch"
      />
      <div class="options">
        <div class="option">
          <input
            id="show-elapsed-time"
            type="checkbox"
            :checked="showElapsedTime"
            @change="onToggleElapsedTime"
          />
          <label for="show-elapsed-time">消費時間</label>
        </div>
        <div class="option">
          <input
            id="show-comment"
            type="checkbox"
            :checked="showComment"
            @change="onToggleComment"
          />
          <label for="show-comment">コメント</label>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import RecordView from "@/components/primitive/RecordView.vue";
import { useStore } from "@/store";
import { Mode } from "@/store/mode";

export const minWidth = 230;

export default defineComponent({
  name: "RecordPane",
  components: {
    RecordView,
  },
  setup() {
    const store = useStore();

    const goto = (number: number) => {
      store.changeMoveNumber(number);
    };

    const goBegin = () => {
      goto(0);
    };

    const goBack = () => {
      goto(store.record.current.number - 1);
    };

    const goForward = () => {
      goto(store.record.current.number + 1);
    };

    const goEnd = () => {
      goto(Number.MAX_SAFE_INTEGER);
    };

    const selectMove = (number: number) => {
      goto(number);
    };

    const selectBranch = (index: number) => {
      store.changeBranch(index);
    };

    const onToggleElapsedTime = (event: Event) => {
      const checkbox = event.target as HTMLInputElement;
      store.updateAppSetting({
        showElapsedTimeInRecordView: checkbox.checked,
      });
    };

    const onToggleComment = (event: Event) => {
      const checkbox = event.target as HTMLInputElement;
      store.updateAppSetting({
        showCommentInRecordView: checkbox.checked,
      });
    };

    const isRecordOperational = computed(() => {
      return store.mode === Mode.NORMAL || store.mode === Mode.RESEARCH;
    });
    const showComment = computed(
      () => store.appSetting.showCommentInRecordView
    );
    const showElapsedTime = computed(
      () => store.appSetting.showElapsedTimeInRecordView
    );

    const record = computed(() => store.record);

    return {
      isRecordOperational,
      showElapsedTime,
      showComment,
      record: record,
      goBegin,
      goBack,
      goForward,
      goEnd,
      selectMove,
      selectBranch,
      onToggleElapsedTime,
      onToggleComment,
    };
  },
});
</script>

<style scoped>
.frame {
  box-sizing: border-box;
  padding: 10px;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.record {
  width: 100%;
  flex: auto;
}
.options {
  width: 100%;
  height: 23px;
  margin-top: 2px;
  display: flex;
  flex-direction: row;
}
.option {
  padding: 0 10px 0 10px;
  color: white;
}
</style>
