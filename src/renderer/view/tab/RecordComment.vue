<template>
  <div>
    <div class="full column">
      <textarea
        ref="textarea"
        class="auto text"
        :value="comment"
        :readonly="readonly"
        @input="change"
      />
      <div v-if="pvs.length !== 0" class="row play-buttons">
        <button
          v-for="(pv, index) of pvs"
          :key="index"
          class="play"
          @click="play(pv)"
        >
          <Icon :icon="IconType.PLAY" />
          <span>{{ t.pv }}{{ pvs.length >= 2 ? " " + (index + 1) : "" }}</span>
        </button>
      </div>
      <div class="row bookmark-area">
        <div class="bookmark-label">{{ t.bookmark }}</div>
        <input
          type="text"
          class="auto"
          :value="bookmark"
          :readonly="readonly"
          @input="changeBookmark"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { t } from "@/common/i18n";
import { useStore } from "@/renderer/store";
import { AppState } from "@/common/control/state.js";
import { computed, onMounted, ref } from "vue";
import Icon from "@/renderer/view/primitive/Icon.vue";
import { IconType } from "@/renderer/assets/icons";
import { Move } from "@/common/shogi";

const store = useStore();
const readonly = computed(
  () => store.appState != AppState.NORMAL && store.appState != AppState.RESEARCH
);
const textarea = ref();
const comment = computed(() => store.record.current.comment);
const pvs = computed(() => store.inCommentPVs);
const bookmark = computed(() => store.record.current.bookmark);

const change = (event: Event) => {
  const comment = (event.target as HTMLTextAreaElement).value;
  store.updateRecordComment(comment);
};

const changeBookmark = (event: Event) => {
  const bookmark = (event.target as HTMLInputElement).value;
  store.updateRecordBookmark(bookmark);
};

const play = (pv: Move[]) => {
  store.showPVPreviewDialog({
    position: store.record.position,
    pv: pv,
  });
};

onMounted(() => {
  textarea.value.addEventListener("copy", (event: ClipboardEvent) => {
    event.stopPropagation();
  });
  textarea.value.addEventListener("paste", (event: ClipboardEvent) => {
    event.stopPropagation();
  });
});
</script>

<style scoped>
.text {
  width: 100%;
  resize: none;
  box-sizing: border-box;
}
.play-buttons {
  height: 28px;
}
button.play {
  height: 27px;
  line-height: 25px;
  font-size: 16px;
  padding-left: 5px;
  padding-right: 5px;
}
.bookmark-area {
  padding: 2px 5px 2px 5px;
  height: 24px;
  color: var(--main-color);
  background-color: var(--main-bg-color);
}
.bookmark-label {
  padding-right: 5px;
}
</style>
