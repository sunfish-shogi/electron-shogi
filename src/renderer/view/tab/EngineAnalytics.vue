<template>
  <div>
    <div class="root">
      <EngineAnalyticsElement
        v-for="monitor in monitors"
        :key="monitor.sessionID"
        :history-mode="historyMode"
        :name="monitor.name"
        :info="monitor"
        :height="elementHeight"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { useStore } from "@/renderer/store";
import { computed, defineComponent } from "vue";
import EngineAnalyticsElement from "@/renderer/view/tab/EngineAnalyticsElement.vue";
import { RectSize } from "@/renderer/view/primitive/Types";

export default defineComponent({
  name: "EngineAnalytics",
  components: {
    EngineAnalyticsElement,
  },
  props: {
    size: {
      type: RectSize,
      required: true,
    },
    historyMode: {
      type: Boolean,
      required: true,
    },
  },
  setup(props) {
    const store = useStore();
    const monitors = computed(() => store.usiMonitors);
    const elementHeight = computed(() => {
      const rows = store.usiMonitors.length;
      return rows !== 0 ? props.size.height / rows : 0;
    });
    return {
      monitors,
      elementHeight,
    };
  },
});
</script>

<style scoped>
.root {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
