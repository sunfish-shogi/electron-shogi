<template>
  <div>
    <dialog ref="dialog" class="confirm">
      <div class="message-box">
        <ButtonIcon class="icon" :icon="Icon.QUESTION" />
        <div class="message">{{ message }}</div>
      </div>
      <div class="dialog-main-buttons">
        <button
          data-hotkey="Enter"
          autofocus
          class="dialog-button"
          @click="onOk()"
        >
          OK
        </button>
        <button class="dialog-button" data-hotkey="Escape" @click="onClose()">
          キャンセル
        </button>
      </div>
    </dialog>
  </div>
</template>

<script lang="ts">
import { showModalDialog } from "@/renderer/helpers/dialog.js";
import {
  computed,
  defineComponent,
  onBeforeUnmount,
  onMounted,
  ref,
  Ref,
} from "vue";
import ButtonIcon from "@/renderer/view/primitive/ButtonIcon.vue";
import { useStore } from "@/renderer/store";
import { Icon } from "@/renderer/assets/icons";
import {
  installHotKeyForDialog,
  uninstallHotKeyForDialog,
} from "@/renderer/keyboard/hotkey";

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
      installHotKeyForDialog(dialog.value);
    });

    onBeforeUnmount(() => {
      uninstallHotKeyForDialog(dialog.value);
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
