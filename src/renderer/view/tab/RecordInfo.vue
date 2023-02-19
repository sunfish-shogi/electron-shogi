<template>
  <div>
    <div ref="root" class="root" :style="{ height: `${size.height}px` }">
      <div class="element">
        <div class="key">{{ t.file }}</div>
        <div class="value">
          {{ store.recordFilePath || t.newRecordWithBrackets }}
        </div>
      </div>
      <div v-for="element in list" :key="element.key" class="element">
        <div class="key">{{ element.displayName }}</div>
        <input
          class="value"
          :value="element.value"
          @input="change($event, element.key)"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { getRecordMetadataName, t } from "@/common/i18n";
import { RecordMetadataKey } from "@/common/shogi";
import { useStore } from "@/renderer/store";
import { computed, defineComponent, onMounted, Ref, ref } from "vue";
import { RectSize } from "@/renderer/view/primitive/Types";

export default defineComponent({
  name: "RecordComment",
  props: {
    size: {
      type: RectSize,
      required: true,
    },
  },
  setup() {
    const root: Ref = ref(null);
    const store = useStore();
    const list = computed(() => {
      return Object.values(RecordMetadataKey).map((key) => {
        const metadata = store.record.metadata;
        return {
          key: key,
          displayName: getRecordMetadataName(key),
          value: metadata.getStandardMetadata(key) || "",
        };
      });
    });

    onMounted(() => {
      root.value.addEventListener("copy", (event: ClipboardEvent) => {
        event.stopPropagation();
      });
      root.value.addEventListener("paste", (event: ClipboardEvent) => {
        event.stopPropagation();
      });
    });

    const change = (event: Event, key: RecordMetadataKey) => {
      const input = event.target as HTMLInputElement;
      store.updateStandardRecordMetadata({
        key,
        value: input.value,
      });
    };

    return {
      t,
      root,
      store,
      list,
      change,
    };
  },
});
</script>

<style scoped>
.root {
  width: 100%;
  height: 100%;
  background-color: var(--text-bg-color);
  overflow: auto;
  display: flex;
  flex-direction: column;
}
.element {
  margin: 3px;
  text-align: left;
  display: flex;
  flex-direction: row;
}
.key {
  width: 150px;
}
div.value {
  width: calc(100% - 150px);
}
input.value {
  width: min(500px, calc(100% - 200px));
}
</style>
