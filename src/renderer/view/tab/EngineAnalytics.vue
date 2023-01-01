<template>
  <div>
    <div class="root">
      <EngineAnalyticsElement
        v-if="blackPlayer"
        :history-mode="historyMode"
        :name="blackPlayer.name"
        :info="blackPlayer"
        :height="elementHeight"
      />
      <EngineAnalyticsElement
        v-if="whitePlayer"
        :history-mode="historyMode"
        :name="whitePlayer.name"
        :info="whitePlayer"
        :height="elementHeight"
      />
      <EngineAnalyticsElement
        v-if="researcher"
        :history-mode="historyMode"
        :name="researcher.name"
        :info="researcher"
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
    const blackPlayer = computed(() => store.usiBlackPlayerMonitor);
    const whitePlayer = computed(() => store.usiWhitePlayerMonitor);
    const researcher = computed(() => store.usiResearcherMonitor);
    const elementHeight = computed(() => {
      const n =
        (store.usiBlackPlayerMonitor ? 1 : 0) +
        (store.usiWhitePlayerMonitor ? 1 : 0) +
        (store.usiResearcherMonitor ? 1 : 0);
      return n !== 0 ? props.size.height / n : 0;
    });
    return {
      blackPlayer,
      whitePlayer,
      researcher,
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
