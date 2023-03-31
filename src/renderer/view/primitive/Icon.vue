<template>
  <img class="icon" :src="source" draggable="false" />
</template>

<script lang="ts">
import { IconType, iconSourceMap } from "@/renderer/assets/icons";
import { defineComponent, PropType } from "vue";

export default defineComponent({
  name: "Icon",
  props: {
    icon: {
      type: String as PropType<IconType>,
      required: true,
    },
  },
  setup(props) {
    return {
      source: iconSourceMap[props.icon],
    };
  },
});
</script>
