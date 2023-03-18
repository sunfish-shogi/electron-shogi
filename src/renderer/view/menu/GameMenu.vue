<template>
  <div>
    <dialog ref="dialog" class="menu">
      <div class="groups">
        <div class="group">
          <button class="close" @click="onClose">
            <Icon :icon="IconType.CLOSE" />
            <div class="label">{{ t.back }}</div>
          </button>
        </div>
        <div class="group">
          <button @click="onLocalGame">
            <Icon :icon="IconType.GAME" />
            <div class="label">{{ t.offlineGame }}</div>
          </button>
          <button @click="onCSAGame">
            <Icon :icon="IconType.INTERNET" />
            <div class="label">{{ t.csaOnlineGame }}</div>
          </button>
        </div>
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
import { useStore } from "@/renderer/store";

export default defineComponent({
  name: "GameMenu",
  components: {
    Icon,
  },
  emits: ["close"],
  setup(_, context) {
    const store = useStore();
    const dialog: Ref = ref(null);
    const onClose = () => {
      context.emit("close");
    };
    onMounted(() => {
      showModalDialog(dialog.value, onClose);
    });
    const onLocalGame = () => {
      store.showGameDialog();
      context.emit("close");
    };
    const onCSAGame = () => {
      store.showCSAGameDialog();
      context.emit("close");
    };
    return {
      t,
      dialog,
      IconType,
      onClose,
      onLocalGame,
      onCSAGame,
    };
  },
});
</script>
