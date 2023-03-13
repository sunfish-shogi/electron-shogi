<template>
  <div>
    <dialog ref="dialog" class="info">
      <div class="message-box">
        <Icon :icon="IconType.INFO" />
        <div class="message">{{ store.message.text }}</div>
      </div>
      <div
        v-for="(attachment, aidx) in store.message.attachments"
        :key="aidx"
        class="attachment"
      >
        <ul v-if="attachment.type === 'list'" class="list">
          <li
            v-for="(item, iidx) in attachment.items"
            :key="iidx"
            class="list-item"
          >
            {{ item.text }}
            <ul>
              <li
                v-for="(child, cidx) in item.children"
                :key="cidx"
                class="list-child-item"
              >
                {{ child }}
              </li>
            </ul>
          </li>
        </ul>
      </div>
      <div class="main-buttons">
        <button autofocus data-hotkey="Escape" @click="onClose()">
          {{ t.close }}
        </button>
      </div>
    </dialog>
  </div>
</template>

<script lang="ts">
import { t } from "@/common/i18n";
import { showModalDialog } from "@/renderer/helpers/dialog.js";
import { useStore } from "@/renderer/store";
import { defineComponent, onBeforeUnmount, onMounted, ref, Ref } from "vue";
import Icon from "@/renderer/view/primitive/Icon.vue";
import { IconType } from "@/renderer/assets/icons";
import {
  installHotKeyForDialog,
  uninstallHotKeyForDialog,
} from "@/renderer/keyboard/hotkey";

export default defineComponent({
  name: "InfoMessage",
  components: {
    Icon,
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

    const onClose = () => {
      store.dequeueMessage();
    };

    return {
      t,
      dialog,
      store,
      onClose,
      IconType,
    };
  },
});
</script>

<style scoped>
dialog.info {
  color: var(--info-dialog-color);
  background-color: var(--info-dialog-bg-color);
  border: 3px solid var(--info-dialog-border-color);
}
.attachment {
  text-align: left;
}
</style>
