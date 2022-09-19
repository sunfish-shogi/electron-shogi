<template>
  <div>
    <dialog ref="dialog" class="confirm">
      <div class="message-box">
        <ButtonIcon class="icon" :icon="Icon.QUESTION" />
        <div class="message">{{ message }}</div>
      </div>
      <div class="dialog-main-buttons">
        <button class="dialog-button" @click="onOk()">OK</button>
        <button class="dialog-button" @click="onClose()">キャンセル</button>
      </div>
    </dialog>
  </div>
</template>

<script lang="ts">
import { showModalDialog } from "@/helpers/dialog";
import { computed, defineComponent, onMounted, ref, Ref } from "vue";
import ButtonIcon from "@/components/primitive/ButtonIcon.vue";
import { useStore } from "@/store";
import { Icon } from "@/assets/icons";

export default defineComponent({
  name: "InfoMessage",
  components: {
    ButtonIcon,
  },
  setup() {
    const store = useStore();
    const dialog: Ref = ref(null);
    const message = computed(() => store.confirmation);

    const onOk = () => {
      store.confirmationOk();
    };

    const onClose = () => {
      store.confirmationCancel();
    };

    onMounted(() => {
      showModalDialog(dialog.value, onClose);
    });

    return {
      dialog,
      message,
      onOk,
      onClose,
      Icon,
    };
  },
});
</script>

<style scoped>
dialog.confirm {
  color: var(--info-dialog-color);
  background-color: var(--info-dialog-bg-color);
  border: 3px solid var(--info-dialog-border-color);
}
</style>
