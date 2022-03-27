<template>
  <div>
    <dialog class="bussy" ref="dialog">
      <div class="content">
        <Icon class="icon" icon="bussy" />
        <div class="message">処理中です。お待ち下さい。</div>
      </div>
    </dialog>
  </div>
</template>

<script lang="ts">
import { showModalDialog } from "@/helpers/dialog";
import { defineComponent, onMounted, ref, Ref } from "vue";
import Icon from "@/components/primitive/Icon.vue";

export default defineComponent({
  name: "Bussy",
  components: {
    Icon,
  },
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
