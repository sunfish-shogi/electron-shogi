<template>
  <div>
    <dialog ref="dialog" class="menu">
      <div class="groups">
        <div class="group">
          <button class="close" @click="onClose">
            <ButtonIcon class="icon" :icon="Icon.CLOSE" />
            <div class="label">戻る</div>
          </button>
        </div>
        <div class="group">
          <button @click="onLocalGame">
            <ButtonIcon class="icon" :icon="Icon.GAME" />
            <div class="label">ローカル対局</div>
          </button>
          <button @click="onCSAGame">
            <ButtonIcon class="icon" :icon="Icon.INTERNET" />
            <div class="label">通信対局（CSA）</div>
          </button>
        </div>
      </div>
    </dialog>
  </div>
</template>

<script lang="ts">
import { showModalDialog } from "@/renderer/helpers/dialog.js";
import { defineComponent, onMounted, ref, Ref } from "vue";
import ButtonIcon from "@/renderer/view/primitive/ButtonIcon.vue";
import { Icon } from "@/renderer/assets/icons";
import { useStore } from "@/renderer/store";

export default defineComponent({
  name: "GameMenu",
  components: {
    ButtonIcon,
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
      dialog,
      Icon,
      onClose,
      onLocalGame,
      onCSAGame,
    };
  },
});
</script>
