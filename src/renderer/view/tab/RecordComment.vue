<template>
  <div>
    <div class="root">
      <textarea
        ref="textarea"
        class="text"
        :value="comment"
        :readonly="!!readonly"
        @input="change"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { useStore } from "@/renderer/store";
import { AppState } from "@/common/control/state.js";
import { computed, defineComponent, onMounted, ref, Ref } from "vue";

export default defineComponent({
  name: "RecordComment",
  setup() {
    const store = useStore();
    const comment = computed(() => store.record.current.comment);
    const readonly = computed(
      () =>
        store.appState != AppState.NORMAL && store.appState != AppState.RESEARCH
    );
    const textarea: Ref = ref(null);

    const change = (event: Event) => {
      const comment = (event.target as HTMLTextAreaElement).value;
      store.updateRecordComment(comment);
    };

    onMounted(() => {
      textarea.value.addEventListener("copy", (event: ClipboardEvent) => {
        event.stopPropagation();
      });
      textarea.value.addEventListener("paste", (event: ClipboardEvent) => {
        event.stopPropagation();
      });
    });

    return {
      textarea,
      comment,
      readonly,
      change,
    };
  },
});
</script>

<style scoped>
.root {
  width: 100%;
  height: 100%;
  display: flex;
  flex: wrap;
}
.text {
  width: 100%;
  resize: none;
}
</style>
