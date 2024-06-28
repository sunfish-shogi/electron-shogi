<template>
  <div>
    <dialog ref="dialog" class="busy">
      <div class="message-box">
        <Icon :icon="IconType.BUSY" />
        <div class="message">{{ t.processingPleaseWait }}</div>
      </div>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { t } from "@/common/i18n";
import { showModalDialog } from "@/renderer/helpers/dialog.js";
import { onMounted, ref } from "vue";
import Icon from "@/renderer/view/primitive/Icon.vue";
import { IconType } from "@/renderer/assets/icons";

const dialog = ref();
onMounted(() => {
  showModalDialog(dialog.value);
});
</script>

<style scoped>
dialog.busy {
  color: var(--busy-dialog-color);
  background-color: var(--busy-dialog-bg-color);
  border: 3px solid var(--busy-dialog-border-color);
}
</style>
