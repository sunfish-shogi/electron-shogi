<template>
  <div style="display: inline-block">
    <div ref="container" class="row wrap container">
      <div v-for="item of items" :key="item.value" class="item">
        <input
          type="radio"
          :name="name"
          :checked="item.value === value"
          :value="item.value"
          @change="emit('change', item.value)"
        />
        <div class="button" :style="buttonStyle">
          <div class="label">{{ item.label }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { issueDOMID } from "@/renderer/helpers/unique";
import { PropType, Ref, computed, ref } from "vue";

type Item = {
  label: string;
  value: string;
};

const props = defineProps({
  value: {
    type: String,
    required: true,
  },
  items: {
    type: Array as PropType<Item[]>,
    required: true,
  },
  height: {
    type: Number,
    default: 28,
  },
});
const emit = defineEmits(["change"]);

const container = ref() as Ref<HTMLDivElement>;
const name = issueDOMID();
const buttonStyle = computed(() => {
  return {
    height: `${props.height}px`,
    minWidth: `${props.height * 2.5}px`,
    fontSize: `${props.height * 0.5}px`,
    borderRadius: `${props.height * 0.25}px`,
    paddingLeft: `${props.height * 0.25}px`,
    paddingRight: `${props.height * 0.25}px`,
  };
});

const setValue = (value: string) => {
  container.value.querySelectorAll("input").forEach((input) => {
    if (input.value === value) {
      input.checked = true;
      emit("change", value);
    }
  });
};
const getValue = () => {
  const checked = Array.from(container.value.querySelectorAll("input")).filter(
    (input) => {
      if (input.checked) {
        return input.value;
      }
    }
  );
  if (checked.length > 0) {
    return checked[0].value;
  }
  return props.value;
};
defineExpose({ setValue, getValue });
</script>

<style scoped>
div.container {
  align-items: center;
}
div.item {
  position: relative;
  margin-top: 1px;
  margin-bottom: 1px;
}
div.item:not(:last-child) {
  margin-right: 2px;
}
input {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
}
.button {
  pointer-events: none;
  left: 0;
  top: 0;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  border: 2px solid var(--selector-bg-color);
  color: var(--selector-color);
  background-color: var(--selector-bg-color);
  box-shadow: 1px 1px 3px 0 var(--control-shadow-color);
}
input:checked ~ .button {
  color: var(--pushed-selector-color);
  border: 2px solid var(--pushed-selector-bg-color);
  background-color: var(--pushed-selector-bg-color);
}
input:focus ~ .button {
  border: 2px solid white;
}
.label {
  pointer-events: none;
  text-align: center;
  width: 100%;
}
</style>
