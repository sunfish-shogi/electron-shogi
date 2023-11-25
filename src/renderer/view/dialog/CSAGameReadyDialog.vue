<template>
  <div>
    <dialog ref="dialog" class="bussy">
      <div class="message-box">
        <Icon :icon="IconType.BUSSY" />
        <div class="message">
          <span v-if="store.csaGameState === CSAGameState.READY">
            {{ t.waitingForNewGame }}
          </span>
          <span v-if="store.csaGameState === CSAGameState.LOGIN_RETRY_INTERVAL">
            {{ t.tryToReloginToCSAServerNSecondsLater(remainingSeconds) }}
          </span>
          <span v-if="store.csaGameState === CSAGameState.WAITING_LOGIN">
            {{ t.tryingToConnectAndLoginToCSAServer }}
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
          {{ t.cancelGame }}
        </button>
      </div>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { showModalDialog } from "@/renderer/helpers/dialog.js";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import Icon from "@/renderer/view/primitive/Icon.vue";
import { IconType } from "@/renderer/assets/icons";
import { useStore } from "@/renderer/store";
import { installHotKeyForDialog, uninstallHotKeyForDialog } from "@/renderer/devices/hotkey";
import { CSAGameState, loginRetryIntervalSeconds } from "@/renderer/store/csa";
import { t } from "@/common/i18n";

const store = useStore();
const dialog = ref();
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

const onCSAGameStateUpdated = (newState: CSAGameState) => {
  window.clearInterval(remainingTimer);
  if (newState === CSAGameState.LOGIN_RETRY_INTERVAL) {
    remainingSeconds.value = loginRetryIntervalSeconds;
    remainingTimer = window.setInterval(() => {
      remainingSeconds.value--;
    }, 1000);
  }
};
onCSAGameStateUpdated(store.csaGameState);
watch(() => store.csaGameState, onCSAGameStateUpdated);

const onLogout = () => {
  store.cancelCSAGame();
};
</script>

<style scoped>
dialog.bussy {
  color: var(--info-dialog-color);
  background-color: var(--info-dialog-bg-color);
  border: 3px solid var(--info-dialog-border-color);
}
</style>
