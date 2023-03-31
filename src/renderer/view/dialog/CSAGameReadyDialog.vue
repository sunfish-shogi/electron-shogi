<template>
  <div>
    <dialog ref="dialog" class="bussy">
      <div class="message-box">
        <Icon :icon="IconType.BUSSY" />
        <div class="message">
          <span v-if="store.csaGameState === CSAGameState.READY">
            対局の開始を待っています。
          </span>
          <span v-if="store.csaGameState === CSAGameState.LOGIN_RETRY_INTERVAL">
            CSAサーバーへのログインを{{ remainingSeconds }}秒後に再試行します。
          </span>
          <span v-if="store.csaGameState === CSAGameState.WAITING_LOGIN">
            CSAサーバーへの接続とログインを試みています。メッセージボックスが表示されている場合は閉じてください。
          </span>
        </div>
      </div>
      <div
        v-if="
          store.csaGameState === CSAGameState.READY ||
          store.csaGameState === CSAGameState.LOGIN_RETRY_INTERVAL
        "
        class="main-buttons"
      >
        <button autofocus data-hotkey="Escape" @click="onLogout()">
          対局をキャンセル
        </button>
      </div>
    </dialog>
  </div>
</template>

<script lang="ts">
import { showModalDialog } from "@/renderer/helpers/dialog.js";
import {
  defineComponent,
  onBeforeUnmount,
  onMounted,
  ref,
  Ref,
  watch,
} from "vue";
import Icon from "@/renderer/view/primitive/Icon.vue";
import { IconType } from "@/renderer/assets/icons";
import { useStore } from "@/renderer/store";
import {
  installHotKeyForDialog,
  uninstallHotKeyForDialog,
} from "@/renderer/keyboard/hotkey";
import { CSAGameState, loginRetryIntervalSeconds } from "@/renderer/store/csa";

export default defineComponent({
  name: "CSAGameReadyDialog",
  components: {
    Icon,
  },
  setup() {
    const store = useStore();
    const dialog: Ref = ref(null);
    const remainingSeconds = ref(0);
    let remainingTimer = 0;

    onMounted(() => {
      showModalDialog(dialog.value);
      installHotKeyForDialog(dialog.value);
    });

    onBeforeUnmount(() => {
      uninstallHotKeyForDialog(dialog.value);
      window.clearInterval(remainingTimer);
    });

    watch(
      () => store.csaGameState,
      (newState) => {
        window.clearInterval(remainingTimer);
        if (newState === CSAGameState.LOGIN_RETRY_INTERVAL) {
          remainingSeconds.value = loginRetryIntervalSeconds;
          remainingTimer = window.setInterval(() => {
            remainingSeconds.value--;
          }, 1000);
        }
      }
    );

    const onLogout = () => {
      store.cancelCSAGame();
    };

    return {
      dialog,
      IconType,
      store,
      CSAGameState,
      remainingSeconds,
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
