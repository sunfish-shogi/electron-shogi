<template>
  <div>
    <div ref="root" class="root" :style="{ height: `${size.height}px` }">
      <div class="element">
        <div class="key">ファイル</div>
        <div class="value">{{ filePath || "（新規棋譜）" }}</div>
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
import {
  getStandardMetadataDisplayName,
  RecordMetadataKey,
} from "@/common/shogi";
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
    const filePath = computed(() => store.recordFilePath);
    const list = computed(() => {
      return Object.values(RecordMetadataKey).map((key) => {
        const metadata = store.record.metadata;
        return {
          key: key,
          displayName: getStandardMetadataDisplayName(key),
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
      root,
      filePath,
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
  width: 100px;
}
div.value {
  width: calc(100% - 100px);
}
input.value {
  width: min(500px, calc(100% - 150px));
}
</style>
