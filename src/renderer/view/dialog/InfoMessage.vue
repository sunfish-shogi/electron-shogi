<template>
  <div>
    <dialog ref="dialog" class="info">
      <div class="message-box">
        <ButtonIcon class="icon" :icon="Icon.INFO" />
        <div class="message">{{ message.text }}</div>
      </div>
      <div
        v-for="(attachment, aidx) in message.attachments"
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
      <div class="dialog-main-buttons">
        <button autofocus data-hotkey="Escape" @click="onClose()">
          閉じる
        </button>
      </div>
    </dialog>
  </div>
</template>

<script lang="ts">
import { showModalDialog } from "@/renderer/helpers/dialog.js";
import { useStore } from "@/renderer/store";
import {
  computed,
  defineComponent,
  onBeforeUnmount,
  onMounted,
  ref,
  Ref,
} from "vue";
import ButtonIcon from "@/renderer/view/primitive/ButtonIcon.vue";
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

    onMounted(() => {
      showModalDialog(dialog.value);
      installHotKeyForDialog(dialog.value);
    });

    onBeforeUnmount(() => {
      uninstallHotKeyForDialog(dialog.value);
    });

    const message = computed(() => store.message);

    const onClose = () => {
      store.dequeueMessage();
    };

    return {
      dialog,
      message,
      onClose,
      Icon,
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
