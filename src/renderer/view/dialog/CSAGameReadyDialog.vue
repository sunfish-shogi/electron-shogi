<template>
  <div>
    <dialog ref="dialog" class="bussy">
      <div class="message-box">
        <ButtonIcon class="icon" :icon="Icon.BUSSY" />
        <div class="message">対局の開始を待っています。</div>
      </div>
      <div class="dialog-main-buttons">
        <button autofocus data-hotkey="Escape" @click="onLogout()">
          ログアウト
        </button>
      </div>
    </dialog>
  </div>
</template>

<script lang="ts">
import { showModalDialog } from "@/renderer/helpers/dialog.js";
import { defineComponent, onBeforeUnmount, onMounted, ref, Ref } from "vue";
import ButtonIcon from "@/renderer/view/primitive/ButtonIcon.vue";
import { Icon } from "@/renderer/assets/icons";
import { useStore } from "@/renderer/store";
import {
  installHotKeyForDialog,
  uninstallHotKeyForDialog,
} from "@/renderer/keyboard/hotkey";

export default defineComponent({
  name: "CSAGameReadyDialog",
  components: {
    ButtonIcon,
  },
  setup() {
    const store = useStore();
    const dialog: Ref = ref(null);

    onMounted(() => {
      showModalDialog(dialog.value);
      installHotKeyForDialog(dialog.value);
    });

    onBeforeUnmount(() => {
      uninstallHotKeyForDialog(dialog.value);
    });

    const onLogout = () => {
      store.logoutCSAGame();
    };

    return {
      dialog,
      Icon,
      onLogout,
    };
  },
});
</script>

<style scoped>
dialog.bussy {
  color: var(--info-dialog-color);
  background-color: var(--info-dialog-bg-color);
  border: 3px solid var(--info-dialog-border-color);
}
</style>
