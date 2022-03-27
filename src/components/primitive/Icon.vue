<template>
  <img class="icon" :src="source" />
</template>

<script lang="ts">
import { Icon, iconSourceMap } from "@/assets/icons";
import { defineComponent, PropType } from "vue";

export default defineComponent({
  name: "Icon",
  props: {
    icon: {
      type: String as PropType<Icon>,
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
