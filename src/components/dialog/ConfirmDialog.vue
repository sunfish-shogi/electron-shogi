<template>
  <div>
    <dialog ref="dialog">
      <div class="content">
        <ButtonIcon class="icon" icon="question" />
        <div class="message">{{ confirmation.message }}</div>
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
import { Action, useStore } from "@/store";
import { computed, defineComponent, onMounted, ref, Ref } from "vue";
import ButtonIcon from "@/components/primitive/ButtonIcon.vue";

export default defineComponent({
  name: "InfoMessage",
  components: {
    ButtonIcon,
  },
  setup() {
    const store = useStore();
    const dialog: Ref = ref(null);
    const confirmation = computed(() => store.state.confirmation.confirmation);

    onMounted(() => {
      showModalDialog(dialog.value);
    });

    const onOk = () => {
      store.dispatch(Action.CONFIRMATION_OK);
    };

    const onClose = () => {
      store.dispatch(Action.CONFIRMATION_CANCEL);
    };

    return {
      dialog,
      confirmation,
      onOk,
      onClose,
    };
  },
});
</script>
