<template>
  <div>
    <dialog ref="dialog">
      <div class="dialog-title">アプリ設定</div>
      <div class="dialog-form-area settings">
        <div class="dialog-form-item">
          <div class="dialog-form-item-label-wide">デザイン</div>
          <select :value="appSetting.boardLayout" ref="boardLayout">
            <option
              v-for="layout of boardLayouts"
              :key="layout"
              :value="layout.value"
            >
              {{ layout.name }}
            </option>
          </select>
        </div>
        <div class="dialog-form-item">
          <div class="dialog-form-item-label-wide">駒音の大きさ</div>
          <input
            :value="appSetting.pieceVolume"
            type="number"
            max="100"
            min="0"
            ref="pieceVolume"
          />
          <div class="dialog-form-item-unit">%</div>
        </div>
        <div class="dialog-form-item">
          <div class="dialog-form-item-label-wide">時計音の大きさ</div>
          <input
            :value="appSetting.clockVolume"
            type="number"
            max="100"
            min="0"
            ref="clockVolume"
          />
          <div class="dialog-form-item-unit">%</div>
        </div>
        <div class="dialog-form-item">
          <div class="dialog-form-item-label-wide">時計音の高さ</div>
          <input
            :value="appSetting.clockPitch"
            type="number"
            max="880"
            min="220"
            ref="clockPitch"
          />
          <div class="dialog-form-item-unit">Hz (220 ~ 880)</div>
        </div>
        <div class="dialog-form-item">
          <div class="dialog-form-item-label-wide">時計音の対象</div>
          <select :value="appSetting.clockSoundTarget" ref="clockSoundTarget">
            <option value="all">全ての手番</option>
            <option value="onlyUser">人の手番のみ</option>
          </select>
        </div>
      </div>
      <div class="dialog-main-buttons">
        <button class="dialog-button" @click="saveAndClose()">
          保存して閉じる
        </button>
        <button class="dialog-button" @click="cancel()">キャンセル</button>
      </div>
    </dialog>
  </div>
</template>

<script lang="ts">
import { BoardLayoutType } from "@/components/primitive/BoardLayout";
import { AppSettingUpdate } from "@/settings/app";
import { Action, Mutation, useStore } from "@/store";
import { ref, defineComponent, onMounted, Ref, computed } from "vue";
import { readInputAsNumber } from "@/helpers/form";
import { showModalDialog } from "@/helpers/dialog";

export default defineComponent({
  name: "AppSettingDialog",
  setup() {
    const store = useStore();
    const dialog: Ref = ref(null);
    const boardLayout: Ref = ref(null);
    const pieceVolume: Ref = ref(null);
    const clockVolume: Ref = ref(null);
    const clockPitch: Ref = ref(null);
    const clockSoundTarget: Ref = ref(null);

    onMounted(() => {
      showModalDialog(dialog.value);
    });

    const saveAndClose = () => {
      const update: AppSettingUpdate = {
        boardLayout: boardLayout.value.value,
        pieceVolume: readInputAsNumber(pieceVolume.value),
        clockVolume: readInputAsNumber(clockVolume.value),
        clockPitch: readInputAsNumber(clockPitch.value),
        clockSoundTarget: clockSoundTarget.value.value,
      };
      store.dispatch(Action.UPDATE_AND_SAVE_APP_SETTING, update).then(() => {
        store.commit(Mutation.CLOSE_DIALOG);
      });
    };

    const cancel = () => {
      store.commit(Mutation.CLOSE_DIALOG);
    };

    const appSetting = computed(() => store.state.appSetting);

    const boardLayouts = [
      { name: "一文字駒", value: BoardLayoutType.HITOMOJI },
      {
        name: "一文字駒（ゴシック体）",
        value: BoardLayoutType.HITOMOJI_GOTHIC,
      },
    ];

    return {
      dialog,
      boardLayout,
      pieceVolume,
      clockVolume,
      clockPitch,
      clockSoundTarget,
      appSetting,
      boardLayouts,
      saveAndClose,
      cancel,
    };
  },
});
</script>

<style scoped>
.settings {
  display: flex;
  flex-direction: column;
  width: 540px;
}
</style>
