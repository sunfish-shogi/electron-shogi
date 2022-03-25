<template>
  <div>
    <div class="root">
      <EngineAnalyticsElement
        v-if="infos.blackPlayer"
        :name="blackPlayerName"
        :info="infos.blackPlayer"
        :height="elementHeight"
      />
      <EngineAnalyticsElement
        v-if="infos.whitePlayer"
        :name="whitePlayerName"
        :info="infos.whitePlayer"
        :height="elementHeight"
      />
      <EngineAnalyticsElement
        v-if="infos.researcher"
        :name="researcherName"
        :info="infos.researcher"
        :height="elementHeight"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { useStore } from "@/store";
import { computed, defineComponent } from "vue";
import EngineAnalyticsElement from "@/components/analytics/EngineAnalyticsElement.vue";
import { RectSize } from "@/layout/types";

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
    const infos = computed(() => store.state.usiMonitor);
    const elementHeight = computed(() => {
      const infos = store.state.usiMonitor;
      const n =
        (infos.blackPlayer ? 1 : 0) +
        (infos.whitePlayer ? 1 : 0) +
        (infos.researcher ? 1 : 0);
      return n !== 0 ? props.size.height / n : 0;
    });
    const blackPlayerName = computed(() => store.state.gameSetting.black.name);
    const whitePlayerName = computed(() => store.state.gameSetting.white.name);
    const researcherName = computed(
      () => store.state.researchSetting.usi?.name
    );
    return {
      infos,
      blackPlayerName,
      whitePlayerName,
      researcherName,
      elementHeight,
    };
  },
});
</script>

<style scoped>
.root {
  width: 100%;
  height: 100%;
  background-color: lightgray;
  display: flex;
  flex-direction: column;
}
</style>
