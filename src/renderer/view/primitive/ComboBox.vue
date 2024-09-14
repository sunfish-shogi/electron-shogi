<template>
  <div style="display: inline-block">
    <div class="row wrap">
      <select
        ref="select"
        size="1"
        @change="
          () => {
            free = select.value === '__FREE_TEXT__';
          }
        "
      >
        <option v-for="option in options" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
        <option value="__FREE_TEXT__">{{ freeTextLabel }}</option>
      </select>
      <input v-show="free" ref="input" type="text" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { PropType, Ref, ref } from "vue";

type Option = {
  value: string;
  label: string;
};

defineProps({
  options: {
    type: Array as PropType<Option[]>,
    required: true,
  },
  freeTextLabel: {
    type: String,
    default: "自由入力",
  },
});

const select = ref() as Ref<HTMLSelectElement>;
const input = ref() as Ref<HTMLInputElement>;
const free = ref(false);

const setValue = (value: string) => {
  for (const option of select.value.querySelectorAll("option")) {
    if (option.value === value) {
      option.selected = true;
      free.value = false;
      return;
    }
  }
  select.value.value = "__FREE_TEXT__";
  input.value.value = value;
  free.value = true;
};
const getValue = () => {
  const selected = Array.from(select.value.querySelectorAll("option")).find((option) => {
    if (option.selected) {
      return option.value;
    }
  });
  if (selected?.value === "__FREE_TEXT__") {
    return input.value.value;
  }
  return selected?.value || "";
};
defineExpose({ setValue, getValue });
</script>

<style scoped>
select {
  margin-right: 4px;
}
input {
  width: 150px;
}
</style>
