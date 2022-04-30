<template>
  <div>
    <div class="root" :style="`height:${size.height}px`">
      <div v-for="element of list" :key="element.key" class="element">
        <div class="key">{{ element.displayName }}</div>
        <input
          class="value-input"
          :value="element.value"
          @input="change($event, element.key)"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { getStandardMetadataDisplayName, RecordMetadataKey } from "@/shogi";
import { useStore } from "@/store";
import { computed, defineComponent } from "vue";
import { RectSize } from "../primitive/Types";

export default defineComponent({
  name: "RecordComment",
  props: {
    size: {
      type: RectSize,
      required: true,
    },
  },
  setup() {
    const store = useStore();
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

    const change = (event: Event, key: RecordMetadataKey) => {
      const input = event.target as HTMLInputElement;
      store.updateStandardRecordMetadata({
        key,
        value: input.value,
      });
    };

    return {
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
  background-color: white;
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
.value-input {
  width: min(500px, calc(100% - 150px));
}
</style>
