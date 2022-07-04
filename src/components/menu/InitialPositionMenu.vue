<template>
  <div>
    <dialog ref="dialog" class="background">
      <div class="groups">
        <div class="group">
          <button class="button" @click="onClose">
            <ButtonIcon class="icon" :icon="Icon.CLOSE" />
            <div class="label">戻る</div>
          </button>
        </div>
        <div class="group">
          <button class="button" @click="onStandard">
            <ButtonIcon class="icon" :icon="Icon.GAME" />
            <div class="label">平手</div>
          </button>
          <button class="button" @click="onHandicapLance">
            <ButtonIcon class="icon" :icon="Icon.GAME" />
            <div class="label">香落ち</div>
          </button>
          <button class="button" @click="onHandicapRightLance">
            <ButtonIcon class="icon" :icon="Icon.GAME" />
            <div class="label">右香落ち</div>
          </button>
          <button class="button" @click="onHandicapBishop">
            <ButtonIcon class="icon" :icon="Icon.GAME" />
            <div class="label">角落ち</div>
          </button>
          <button class="button" @click="onHandicapRook">
            <ButtonIcon class="icon" :icon="Icon.GAME" />
            <div class="label">飛車落ち</div>
          </button>
          <button class="button" @click="onHandicapRookLance">
            <ButtonIcon class="icon" :icon="Icon.GAME" />
            <div class="label">飛車香落ち</div>
          </button>
          <button class="button" @click="onHandicap2Pieces">
            <ButtonIcon class="icon" :icon="Icon.GAME" />
            <div class="label">2枚落ち</div>
          </button>
          <button class="button" @click="onHandicap4Pieces">
            <ButtonIcon class="icon" :icon="Icon.GAME" />
            <div class="label">4枚落ち</div>
          </button>
          <button class="button" @click="onHandicap6Pieces">
            <ButtonIcon class="icon" :icon="Icon.GAME" />
            <div class="label">6枚落ち</div>
          </button>
          <button class="button" @click="onHandicap8Pieces">
            <ButtonIcon class="icon" :icon="Icon.GAME" />
            <div class="label">8枚落ち</div>
          </button>
          <button class="button" @click="onTsumeShogi">
            <ButtonIcon class="icon" :icon="Icon.QUIZ" />
            <div class="label">詰め将棋</div>
          </button>
          <button class="button" @click="onTsumeShogi2Kings">
            <ButtonIcon class="icon" :icon="Icon.QUIZ" />
            <div class="label">双玉詰め将棋</div>
          </button>
        </div>
      </div>
    </dialog>
  </div>
</template>

<script lang="ts">
import { showModalDialog } from "@/helpers/dialog";
import { defineComponent, onMounted, ref, Ref } from "vue";
import ButtonIcon from "@/components/primitive/ButtonIcon.vue";
import { Icon } from "@/assets/icons";
import { useStore } from "@/store";
import { InitialPositionType } from "@/shogi";

export default defineComponent({
  name: "InitialPositionMenu",
  components: {
    ButtonIcon,
  },
  emits: ["close"],
  setup(_, context) {
    const store = useStore();
    const dialog: Ref = ref(null);
    onMounted(() => {
      showModalDialog(dialog.value);
    });
    const onClose = () => {
      context.emit("close");
    };
    const onStandard = () => {
      store.initializePosition(InitialPositionType.STANDARD);
      context.emit("close");
    };
    const onHandicapLance = () => {
      store.initializePosition(InitialPositionType.HANDICAP_LANCE);
      context.emit("close");
    };
    const onHandicapRightLance = () => {
      store.initializePosition(InitialPositionType.HANDICAP_RIGHT_LANCE);
      context.emit("close");
    };
    const onHandicapBishop = () => {
      store.initializePosition(InitialPositionType.HANDICAP_BISHOP);
      context.emit("close");
    };
    const onHandicapRook = () => {
      store.initializePosition(InitialPositionType.HANDICAP_ROOK);
      context.emit("close");
    };
    const onHandicapRookLance = () => {
      store.initializePosition(InitialPositionType.HANDICAP_ROOK_LANCE);
      context.emit("close");
    };
    const onHandicap2Pieces = () => {
      store.initializePosition(InitialPositionType.HANDICAP_2PIECES);
      context.emit("close");
    };
    const onHandicap4Pieces = () => {
      store.initializePosition(InitialPositionType.HANDICAP_4PIECES);
      context.emit("close");
    };
    const onHandicap6Pieces = () => {
      store.initializePosition(InitialPositionType.HANDICAP_6PIECES);
      context.emit("close");
    };
    const onHandicap8Pieces = () => {
      store.initializePosition(InitialPositionType.HANDICAP_8PIECES);
      context.emit("close");
    };
    const onTsumeShogi = () => {
      store.initializePosition(InitialPositionType.TSUME_SHOGI);
      context.emit("close");
    };
    const onTsumeShogi2Kings = () => {
      store.initializePosition(InitialPositionType.TSUME_SHOGI_2KINGS);
      context.emit("close");
    };
    return {
      dialog,
      Icon,
      onClose,
      onStandard,
      onHandicapLance,
      onHandicapRightLance,
      onHandicapBishop,
      onHandicapRook,
      onHandicapRookLance,
      onHandicap2Pieces,
      onHandicap4Pieces,
      onHandicap6Pieces,
      onHandicap8Pieces,
      onTsumeShogi,
      onTsumeShogi2Kings,
    };
  },
});
</script>

<style scoped>
dialog.background {
  border-style: none;
  background-color: transparent;
}
.groups {
  width: 80%;
  margin: auto;
  display: flex;
  flex-direction: column;
}
.group {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  margin: 10px 0px 10px 0px;
}
.button {
  width: 150px;
  margin: 5px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 5px 5px 5px darkgray;
}
.icon {
  height: 36px;
  width: 36px;
  display: block;
}
.label {
  display: block;
  font-size: 14px;
  margin-top: 0.5em;
}
</style>
