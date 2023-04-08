<template>
  <img class="icon" :src="iconSourceMap[icon]" draggable="false" />
</template>

<script setup lang="ts">
import { IconType, iconSourceMap } from "@/renderer/assets/icons";
import { PropType } from "vue";

defineProps({
  icon: {
    type: String as PropType<IconType>,
    required: true,
  },
});
</script>
