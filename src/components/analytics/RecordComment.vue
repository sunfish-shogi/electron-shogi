<template>
  <div>
    <div class="root">
      <textarea
        ref="textarea"
        class="text"
        :value="comment"
        :readonly="!!readonly"
        @change="change"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Mutation, useStore } from "@/store";
import { Mode } from "@/store/mode";
import { computed, defineComponent, onMounted, ref, Ref } from "vue";

export default defineComponent({
  name: "RecordComment",
  setup() {
    const store = useStore();
    const comment = computed(() => store.state.record.current.comment);
    const readonly = computed(() => store.state.mode != Mode.NORMAL);
    const textarea: Ref = ref(null);

    const change = (event: Event) => {
      const comment = (event.target as HTMLTextAreaElement).value;
      store.commit(Mutation.UPDATE_RECORD_COMMENT, comment);
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
