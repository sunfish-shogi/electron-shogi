<template>
  <div>
    <dialog ref="dialog" class="bussy">
      <div class="message-box">
        <Icon :icon="IconType.BUSSY" />
        <div class="message">{{ t.processingPleaseWait }}</div>
      </div>
    </dialog>
  </div>
</template>

<script lang="ts">
import { t } from "@/common/i18n";
import { showModalDialog } from "@/renderer/helpers/dialog.js";
import { defineComponent, onMounted, ref, Ref } from "vue";
import Icon from "@/renderer/view/primitive/Icon.vue";
import { IconType } from "@/renderer/assets/icons";

export default defineComponent({
  name: "BussyMessage",
  components: {
    Icon,
  },
  setup() {
    const dialog: Ref = ref(null);
    onMounted(() => {
      showModalDialog(dialog.value);
    });
    return {
      t,
      dialog,
      IconType,
    };
  },
});
</script>

<style scoped>
dialog.bussy {
  color: var(--bussy-dialog-color);
  background-color: var(--bussy-dialog-bg-color);
  border: 3px solid var(--bussy-dialog-border-color);
}
</style>
