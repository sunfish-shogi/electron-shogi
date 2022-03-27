<template>
  <div>
    <dialog class="messagebox" ref="dialog">
      <div class="content">
        <Icon src="info" />
        <div class="message">{{ message }}</div>
      </div>
      <div class="dialog-main-buttons">
        <button @click="onClose()">閉じる</button>
      </div>
    </dialog>
  </div>
</template>

<script lang="ts">
import { showModalDialog } from "@/helpers/dialog";
import { Mutation, useStore } from "@/store";
import { computed, defineComponent, onMounted, ref, Ref } from "vue";
import Icon from "@/components/primitive/Icon.vue";

export default defineComponent({
  name: "ErrorMessage",
  components: {
    Icon,
  },
  setup() {
    const store = useStore();
    const dialog: Ref = ref(null);

    onMounted(() => {
      showModalDialog(dialog.value);
    });

    const message = computed(() => store.state.messages[0]);

    const onClose = () => {
      store.commit(Mutation.SHIFT_MESSAGE);
    };

    return {
      dialog,
      message,
      onClose,
    };
  },
});
</script>

<style scoped>
dialog.messagebox {
  color: var(--messagebox-color);
  background-color: var(--messagebox-bg-color);
  border: 3px solid var(--messagebox-border-color);
}

dialog.messagebox button {
  color: var(--messagebox-button-color);
  background-color: var(--messagebox-button-bg-color);
}
dialog.messagebox button:hover {
  background-color: var(--hovered-messagebox-button-bg-color);
}
</style>
