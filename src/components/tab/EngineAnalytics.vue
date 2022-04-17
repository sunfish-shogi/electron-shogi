<template>
  <div>
    <div class="root">
      <EngineAnalyticsElement
        v-if="infos.blackPlayer"
        :name="infos.blackPlayer.name"
        :info="infos.blackPlayer"
        :height="elementHeight"
      />
      <EngineAnalyticsElement
        v-if="infos.whitePlayer"
        :name="infos.whitePlayer.name"
        :info="infos.whitePlayer"
        :height="elementHeight"
      />
      <EngineAnalyticsElement
        v-if="infos.researcher"
        :name="infos.researcher.name"
        :info="infos.researcher"
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
    const infos = computed(() => store.state.usi);
    const elementHeight = computed(() => {
      const n =
        (store.state.usi.blackPlayer ? 1 : 0) +
        (store.state.usi.whitePlayer ? 1 : 0) +
        (store.state.usi.researcher ? 1 : 0);
      return n !== 0 ? props.size.height / n : 0;
    });
    return {
      infos,
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
