<template>
  <div>
    <dialog ref="dialog">
      <div class="content">
        <ButtonIcon class="icon" icon="question" />
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

export default defineComponent({
  name: "InfoMessage",
  components: {
    ButtonIcon,
  },
  setup() {
    const store = useStore();
    const dialog: Ref = ref(null);
    const message = computed(() => store.confirmation);

    onMounted(() => {
      showModalDialog(dialog.value);
    });

    const onOk = () => {
      store.confirmationOk();
    };

    const onClose = () => {
      store.confirmationCancel();
    };

    return {
      dialog,
      message,
      onOk,
      onClose,
    };
  },
});
</script>
