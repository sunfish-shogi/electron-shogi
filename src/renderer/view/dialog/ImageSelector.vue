<template>
  <div>
    <div class="container">
      <button class="thin select" @click="select">{{ t.select }}</button>
      <img v-if="url" ref="preview" class="preview" :src="url" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { t } from "@/common/i18n";
import { useStore } from "@/renderer/store";
import api from "@/renderer/ipc/api";

export default defineComponent({
  name: "ImageSelector",
  props: {
    defaultUrl: {
      type: String,
      default: "",
    },
  },
  emits: ["select"],
  setup(props, { emit }) {
    const store = useStore();
    const url = ref(props.defaultUrl);

    const select = async () => {
      store.retainBussyState();
      try {
        const newURL = await api.showSelectImageDialog(url.value);
        if (newURL) {
          url.value = newURL;
          emit("select", newURL);
        }
      } catch (e) {
        store.pushError(e);
      } finally {
        store.releaseBussyState();
      }
    };

    return {
      t,
      url,
      select,
    };
  },
});
</script>

<style scoped>
container {
  display: flex;
  flex-direction: column;
  align-items: center;
}
button.select {
  display: inline-block;
  margin: 0;
  width: 100%;
}
.preview {
  display: inline-block;
  max-width: 100%;
  height: auto;
}
</style>
