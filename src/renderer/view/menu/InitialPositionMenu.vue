<template>
  <div>
    <dialog ref="dialog" class="menu">
      <div class="groups">
        <div class="group">
          <button class="close" @click="onClose">
            <ButtonIcon class="icon" :icon="Icon.CLOSE" />
            <div class="label">{{ t.back }}</div>
          </button>
        </div>
        <div class="group">
          <button @click="onStandard">
            <ButtonIcon class="icon" :icon="Icon.GAME" />
            <div class="label">{{ t.nonHandicap }}</div>
          </button>
          <button @click="onHandicapLance">
            <ButtonIcon class="icon" :icon="Icon.GAME" />
            <div class="label">{{ t.lanceHandicap }}</div>
          </button>
          <button @click="onHandicapRightLance">
            <ButtonIcon class="icon" :icon="Icon.GAME" />
            <div class="label">{{ t.rightLanceHandicap }}</div>
          </button>
          <button @click="onHandicapBishop">
            <ButtonIcon class="icon" :icon="Icon.GAME" />
            <div class="label">{{ t.bishopHandicap }}</div>
          </button>
          <button @click="onHandicapRook">
            <ButtonIcon class="icon" :icon="Icon.GAME" />
            <div class="label">{{ t.rookHandicap }}</div>
          </button>
          <button @click="onHandicapRookLance">
            <ButtonIcon class="icon" :icon="Icon.GAME" />
            <div class="label">{{ t.rookLanceHandicap }}</div>
          </button>
          <button @click="onHandicap2Pieces">
            <ButtonIcon class="icon" :icon="Icon.GAME" />
            <div class="label">{{ t.twoPiecesHandicap }}</div>
          </button>
          <button @click="onHandicap4Pieces">
            <ButtonIcon class="icon" :icon="Icon.GAME" />
            <div class="label">{{ t.fourPiecesHandicap }}</div>
          </button>
          <button @click="onHandicap6Pieces">
            <ButtonIcon class="icon" :icon="Icon.GAME" />
            <div class="label">{{ t.sixPiecesHandicap }}</div>
          </button>
          <button @click="onHandicap8Pieces">
            <ButtonIcon class="icon" :icon="Icon.GAME" />
            <div class="label">{{ t.eightPiecesHandicap }}</div>
          </button>
          <button @click="onTsumeShogi">
            <ButtonIcon class="icon" :icon="Icon.QUIZ" />
            <div class="label">{{ t.tsumeShogi }}</div>
          </button>
          <button @click="onTsumeShogi2Kings">
            <ButtonIcon class="icon" :icon="Icon.QUIZ" />
            <div class="label">{{ t.doubleKingTsumeShogi }}</div>
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
import ButtonIcon from "@/renderer/view/primitive/ButtonIcon.vue";
import { Icon } from "@/renderer/assets/icons";
import { useStore } from "@/renderer/store";
import { InitialPositionType } from "@/common/shogi";

export default defineComponent({
  name: "InitialPositionMenu",
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
      t,
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
