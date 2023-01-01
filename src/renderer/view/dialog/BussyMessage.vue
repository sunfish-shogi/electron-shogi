<template>
  <div>
    <dialog ref="dialog" class="bussy">
      <div class="message-box">
        <ButtonIcon class="icon" :icon="Icon.BUSSY" />
        <div class="message">処理中です。お待ち下さい。</div>
      </div>
    </dialog>
  </div>
</template>

<script lang="ts">
import { showModalDialog } from "@/renderer/helpers/dialog.js";
import { defineComponent, onMounted, ref, Ref } from "vue";
import ButtonIcon from "@/renderer/view/primitive/ButtonIcon.vue";
import { Icon } from "@/renderer/assets/icons";

export default defineComponent({
  name: "BussyMessage",
  components: {
    ButtonIcon,
  },
  setup() {
    const dialog: Ref = ref(null);
    onMounted(() => {
      showModalDialog(dialog.value);
    });
    return {
      dialog,
      Icon,
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
