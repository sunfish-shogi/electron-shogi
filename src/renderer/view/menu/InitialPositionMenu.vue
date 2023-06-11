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
          <button @click="onStandard">
            <Icon :icon="IconType.GAME" />
            <div class="label">{{ t.nonHandicap }}</div>
          </button>
          <button @click="onHandicapLance">
            <Icon :icon="IconType.GAME" />
            <div class="label">{{ t.lanceHandicap }}</div>
          </button>
          <button @click="onHandicapRightLance">
            <Icon :icon="IconType.GAME" />
            <div class="label">{{ t.rightLanceHandicap }}</div>
          </button>
          <button @click="onHandicapBishop">
            <Icon :icon="IconType.GAME" />
            <div class="label">{{ t.bishopHandicap }}</div>
          </button>
          <button @click="onHandicapRook">
            <Icon :icon="IconType.GAME" />
            <div class="label">{{ t.rookHandicap }}</div>
          </button>
          <button @click="onHandicapRookLance">
            <Icon :icon="IconType.GAME" />
            <div class="label">{{ t.rookLanceHandicap }}</div>
          </button>
          <button @click="onHandicap2Pieces">
            <Icon :icon="IconType.GAME" />
            <div class="label">{{ t.twoPiecesHandicap }}</div>
          </button>
          <button @click="onHandicap4Pieces">
            <Icon :icon="IconType.GAME" />
            <div class="label">{{ t.fourPiecesHandicap }}</div>
          </button>
          <button @click="onHandicap6Pieces">
            <Icon :icon="IconType.GAME" />
            <div class="label">{{ t.sixPiecesHandicap }}</div>
          </button>
          <button @click="onHandicap8Pieces">
            <Icon :icon="IconType.GAME" />
            <div class="label">{{ t.eightPiecesHandicap }}</div>
          </button>
          <button @click="onHandicap10Pieces">
            <Icon :icon="IconType.GAME" />
            <div class="label">{{ t.tenPiecesHandicap }}</div>
          </button>
          <button @click="onTsumeShogi">
            <Icon :icon="IconType.QUIZ" />
            <div class="label">{{ t.tsumeShogi }}</div>
          </button>
          <button @click="onTsumeShogi2Kings">
            <Icon :icon="IconType.QUIZ" />
            <div class="label">{{ t.doubleKingTsumeShogi }}</div>
          </button>
        </div>
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
import { useStore } from "@/renderer/store";
import { InitialPositionType } from "@/common/shogi";

const emit = defineEmits(["close"]);

const store = useStore();
const dialog = ref();
const onClose = () => {
  emit("close");
};
onMounted(() => {
  showModalDialog(dialog.value, onClose);
});
const onStandard = () => {
  store.initializePosition(InitialPositionType.STANDARD);
  emit("close");
};
const onHandicapLance = () => {
  store.initializePosition(InitialPositionType.HANDICAP_LANCE);
  emit("close");
};
const onHandicapRightLance = () => {
  store.initializePosition(InitialPositionType.HANDICAP_RIGHT_LANCE);
  emit("close");
};
const onHandicapBishop = () => {
  store.initializePosition(InitialPositionType.HANDICAP_BISHOP);
  emit("close");
};
const onHandicapRook = () => {
  store.initializePosition(InitialPositionType.HANDICAP_ROOK);
  emit("close");
};
const onHandicapRookLance = () => {
  store.initializePosition(InitialPositionType.HANDICAP_ROOK_LANCE);
  emit("close");
};
const onHandicap2Pieces = () => {
  store.initializePosition(InitialPositionType.HANDICAP_2PIECES);
  emit("close");
};
const onHandicap4Pieces = () => {
  store.initializePosition(InitialPositionType.HANDICAP_4PIECES);
  emit("close");
};
const onHandicap6Pieces = () => {
  store.initializePosition(InitialPositionType.HANDICAP_6PIECES);
  emit("close");
};
const onHandicap8Pieces = () => {
  store.initializePosition(InitialPositionType.HANDICAP_8PIECES);
  emit("close");
};
const onHandicap10Pieces = () => {
  store.initializePosition(InitialPositionType.HANDICAP_10PIECES);
  emit("close");
};
const onTsumeShogi = () => {
  store.initializePosition(InitialPositionType.TSUME_SHOGI);
  emit("close");
};
const onTsumeShogi2Kings = () => {
  store.initializePosition(InitialPositionType.TSUME_SHOGI_2KINGS);
  emit("close");
};
</script>
