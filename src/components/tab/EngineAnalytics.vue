<template>
  <div>
    <div class="root">
      <EngineAnalyticsElement
        v-if="blackPlayer"
        :name="blackPlayer.name"
        :info="blackPlayer"
        :height="elementHeight"
      />
      <EngineAnalyticsElement
        v-if="whitePlayer"
        :name="whitePlayer.name"
        :info="whitePlayer"
        :height="elementHeight"
      />
      <EngineAnalyticsElement
        v-if="researcher"
        :name="researcher.name"
        :info="researcher"
        :height="elementHeight"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { useStore } from "@/store";
import { computed, defineComponent } from "vue";
import EngineAnalyticsElement from "@/components/tab/EngineAnalyticsElement.vue";
import { RectSize } from "@/components/primitive/Types";

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
