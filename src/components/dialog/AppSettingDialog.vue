<template>
  <div>
    <dialog ref="dialog">
      <div class="dialog-title">アプリ設定</div>
      <div class="dialog-form-area settings">
        <div class="dialog-form-item">
          <div class="dialog-form-item-label-wide">デザイン</div>
          <select ref="boardLayout" :value="appSetting.boardLayout">
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
            ref="pieceVolume"
            :value="appSetting.pieceVolume"
            type="number"
            max="100"
            min="0"
          />
          <div class="dialog-form-item-unit">%</div>
        </div>
        <div class="dialog-form-item">
          <div class="dialog-form-item-label-wide">時計音の大きさ</div>
          <input
            ref="clockVolume"
            :value="appSetting.clockVolume"
            type="number"
            max="100"
            min="0"
          />
          <div class="dialog-form-item-unit">%</div>
        </div>
        <div class="dialog-form-item">
          <div class="dialog-form-item-label-wide">時計音の高さ</div>
          <input
            ref="clockPitch"
            :value="appSetting.clockPitch"
            type="number"
            max="880"
            min="220"
          />
          <div class="dialog-form-item-unit">Hz (220 ~ 880)</div>
        </div>
        <div class="dialog-form-item">
          <div class="dialog-form-item-label-wide">時計音の対象</div>
          <select ref="clockSoundTarget" :value="appSetting.clockSoundTarget">
            <option value="all">全ての手番</option>
            <option value="onlyUser">人の手番のみ</option>
          </select>
        </div>
        <div class="dialog-form-item">
          <div class="dialog-form-item-label-wide">改行文字</div>
          <select ref="returnCode" :value="appSetting.returnCode">
            <option value="crlf">CR + LF (Windows)</option>
            <option value="lf">LF (UNIX/Mac)</option>
            <option value="cr">CR (90年代Mac)</option>
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

const returnCodeToName: { [name: string]: string } = {
  "\r\n": "crlf",
  "\n": "lf",
  "\r": "cr",
};

const nameToReturnCode: { [name: string]: string } = {
  crlf: "\r\n",
  lf: "\n",
  cr: "\r",
};

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
    const returnCode: Ref = ref(null);

    onMounted(() => {
      showModalDialog(dialog.value);
    });

    const saveAndClose = async () => {
      const update: AppSettingUpdate = {
        boardLayout: boardLayout.value.value,
        pieceVolume: readInputAsNumber(pieceVolume.value),
        clockVolume: readInputAsNumber(clockVolume.value),
        clockPitch: readInputAsNumber(clockPitch.value),
        clockSoundTarget: clockSoundTarget.value.value,
        returnCode: nameToReturnCode[returnCode.value.value],
      };
      store.commit(Mutation.RETAIN_BUSSY_STATE);
      try {
        await store.dispatch(Action.UPDATE_APP_SETTING, update);
        store.commit(Mutation.CLOSE_DIALOG);
      } catch (e) {
        store.commit(Mutation.PUSH_ERROR, e);
      } finally {
        store.commit(Mutation.RELEASE_BUSSY_STATE);
      }
    };

    const cancel = () => {
      store.commit(Mutation.CLOSE_DIALOG);
    };

    const appSetting = computed(() => {
      return {
        ...store.state.appSetting,
        returnCode: returnCodeToName[store.state.appSetting.returnCode],
      };
    });

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
      returnCode,
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
