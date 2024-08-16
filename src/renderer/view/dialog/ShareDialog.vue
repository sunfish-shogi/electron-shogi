<template>
  <div>
    <dialog ref="dialog">
      <div class="title">{{ t.share }}</div>
      <div class="form-group scroll">
        <div v-for="elem of list" :key="elem.label" class="form-item">
          <div class="form-item-label-wide">{{ elem.label }}</div>
          <input class="url" type="text" readonly :value="elem.url" />
          <button class="action" @click="copy(elem.url)">
            <Icon :icon="IconType.COPY" />
          </button>
          <button class="action" @click="api.openWebBrowser(elem.url)">
            <Icon :icon="IconType.LINK" />
          </button>
        </div>
      </div>
      <div class="main-buttons">
        <button autofocus data-hotkey="Escape" @click="onClose">
          {{ t.close }}
        </button>
      </div>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { t } from "@/common/i18n";
import { showModalDialog } from "@/renderer/helpers/dialog";
import { installHotKeyForDialog, uninstallHotKeyForDialog } from "@/renderer/devices/hotkey";
import { useStore } from "@/renderer/store";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { mobileWebAppURL } from "@/common/links/github";
import api from "@/renderer/ipc/api";
import { IconType } from "@/renderer/assets/icons";
import Icon from "@/renderer/view/primitive/Icon.vue";
import { shogiExtendSharedBoardURL } from "@/common/links/shogiextend";
import { shogiPlaygroundURL } from "@/common/links/mogproject";
import { useAppSettings } from "@/renderer/store/settings";
import { piyoShogiURL } from "@/common/links/piyoshogi";
import { kyokumenpediaURL } from "@/common/links/kyokumenpedia";

const store = useStore();
const appSettings = useAppSettings();
const dialog = ref();

onMounted(() => {
  showModalDialog(dialog.value, onClose);
  installHotKeyForDialog(dialog.value);
});

onBeforeUnmount(() => {
  uninstallHotKeyForDialog(dialog.value);
});

const list = computed(() => {
  return [
    {
      label: `${t.shogiHome}`,
      url: mobileWebAppURL(store.record),
    },
    {
      label: "Shogi Playground",
      url: shogiPlaygroundURL(store.record, appSettings.boardFlipping),
    },
    {
      label: "SHOGI-EXTEND",
      url: shogiExtendSharedBoardURL(store.record),
    },
    {
      label: "ぴよ将棋",
      url: piyoShogiURL(store.record),
    },
    {
      label: "局面ぺディア",
      url: kyokumenpediaURL(store.record.position),
    },
  ];
});

const copy = (url: string) => {
  navigator.clipboard.writeText(url);
};

const onClose = () => {
  store.closeModalDialog();
};
</script>

<style scoped>
input.url {
  width: 150px;
}
button.action {
  margin: 0 0 0 5px;
  padding: 2px 5px 2px 5px;
}
</style>
