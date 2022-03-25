<template>
  <div>
    <dialog class="bussy" ref="dialog">
      <div class="content">
        <img class="icon" src="icon/hourglass_empty_white_24dp.svg" />
        <div class="message">処理中です。お待ち下さい。</div>
      </div>
    </dialog>
  </div>
</template>

<script lang="ts">
import { showModalDialog } from "@/helpers/dialog";
import { defineComponent, onMounted, ref, Ref } from "vue";

export default defineComponent({
  name: "Bussy",
  setup() {
    const dialog: Ref = ref(null);
    onMounted(() => {
      showModalDialog(dialog.value);
    });
    return {
      dialog,
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
