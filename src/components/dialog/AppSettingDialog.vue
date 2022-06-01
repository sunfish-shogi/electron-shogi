<template>
  <div>
    <dialog ref="dialog">
      <div class="dialog-title">アプリ設定</div>
      <div class="dialog-form-area settings">
        <div class="section">
          <div class="section-title">画像</div>
          <div class="dialog-form-item">
            <div class="dialog-form-item-label-wide">駒画像</div>
            <select ref="pieceImage" :value="appSetting.pieceImage">
              <option
                v-for="pieceImageType of pieceImageTypes"
                :key="pieceImageType.value"
                :value="pieceImageType.value"
              >
                {{ pieceImageType.name }}
              </option>
            </select>
          </div>
          <div class="dialog-form-item">
            <div class="dialog-form-item-label-wide">盤画像</div>
            <select ref="boardImage" :value="appSetting.boardImage">
              <option
                v-for="boardImageType of boardImageTypes"
                :key="boardImageType.value"
                :value="boardImageType.value"
              >
                {{ boardImageType.name }}
              </option>
            </select>
          </div>
        </div>
        <div class="section">
          <div class="section-title">音</div>
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
        </div>
        <div class="section">
          <div class="section-title">ファイル</div>
          <div class="dialog-form-item">
            <div class="dialog-form-item-label-wide">改行文字</div>
            <select ref="returnCode" :value="appSetting.returnCode">
              <option value="crlf">CR + LF (Windows)</option>
              <option value="lf">LF (UNIX/Mac)</option>
              <option value="cr">CR (90年代Mac)</option>
            </select>
          </div>
        </div>
        <div class="section">
          <div class="section-title">評価値・期待勝率</div>
          <div class="dialog-form-item">
            <div class="dialog-form-item-label-wide">勝率換算係数</div>
            <input
              ref="coefficientInSigmoid"
              :value="appSetting.coefficientInSigmoid"
              type="number"
              max="10000"
              min="1"
            />
            <div class="dialog-form-item-unit">(推奨: 600 から 1500 まで)</div>
          </div>
          <div class="dialog-form-item">
            <div class="dialog-form-item-label-wide">緩手の閾値</div>
            <input
              ref="badMoveLevelThreshold1"
              :value="appSetting.badMoveLevelThreshold1"
              type="number"
              max="100"
              min="0"
            />
            <div class="dialog-form-item-unit">%</div>
          </div>
          <div class="dialog-form-item">
            <div class="dialog-form-item-label-wide">疑問手の閾値</div>
            <input
              ref="badMoveLevelThreshold2"
              :value="appSetting.badMoveLevelThreshold2"
              type="number"
              max="100"
              min="0"
            />
            <div class="dialog-form-item-unit">%</div>
          </div>
          <div class="dialog-form-item">
            <div class="dialog-form-item-label-wide">悪手の閾値</div>
            <input
              ref="badMoveLevelThreshold3"
              :value="appSetting.badMoveLevelThreshold3"
              type="number"
              max="100"
              min="0"
            />
            <div class="dialog-form-item-unit">%</div>
          </div>
          <div class="dialog-form-item">
            <div class="dialog-form-item-label-wide">大悪手の閾値</div>
            <input
              ref="badMoveLevelThreshold4"
              :value="appSetting.badMoveLevelThreshold4"
              type="number"
              max="100"
              min="0"
            />
            <div class="dialog-form-item-unit">%</div>
          </div>
        </div>
        <div class="section">
          <div class="section-title">開発者向け</div>
          <div class="dialog-form-item">
            <div class="dialog-form-item-label-wide">アプリログを出力</div>
            <input
              ref="enableAppLog"
              class="toggle"
              :checked="appSetting.enableAppLog"
              type="checkbox"
            />
            <div v-if="isNative" class="dialog-form-item-unit">
              （再起動後に反映）
            </div>
            <div v-if="!isNative" class="dialog-form-item-unit">
              （ブラウザ版では機能しません）
            </div>
          </div>
          <div class="dialog-form-item">
            <div class="dialog-form-item-label-wide">USI通信ログを出力</div>
            <input
              ref="enableUSILog"
              class="toggle"
              :checked="appSetting.enableUSILog"
              type="checkbox"
            />
            <div v-if="isNative" class="dialog-form-item-unit">
              （再起動後に反映）
            </div>
            <div v-if="!isNative" class="dialog-form-item-unit">
              （ブラウザ版では機能しません）
            </div>
          </div>
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
import {
  PieceImageType,
  BoardImageType,
} from "@/components/primitive/BoardLayout";
import { AppSettingUpdate } from "@/settings/app";
import { useStore } from "@/store";
import { ref, defineComponent, onMounted, Ref, computed } from "vue";
import { readInputAsNumber } from "@/helpers/form";
import { showModalDialog } from "@/helpers/dialog";
import { isNative } from "@/ipc/api";

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
    const pieceImage: Ref = ref(null);
    const boardImage: Ref = ref(null);
    const pieceVolume: Ref = ref(null);
    const clockVolume: Ref = ref(null);
    const clockPitch: Ref = ref(null);
    const clockSoundTarget: Ref = ref(null);
    const returnCode: Ref = ref(null);
    const coefficientInSigmoid: Ref = ref(null);
    const badMoveLevelThreshold1: Ref = ref(null);
    const badMoveLevelThreshold2: Ref = ref(null);
    const badMoveLevelThreshold3: Ref = ref(null);
    const badMoveLevelThreshold4: Ref = ref(null);
    const enableAppLog: Ref = ref(null);
    const enableUSILog: Ref = ref(null);

    onMounted(() => {
      showModalDialog(dialog.value);
    });

    const saveAndClose = async () => {
      const update: AppSettingUpdate = {
        pieceImage: pieceImage.value.value,
        boardImage: boardImage.value.value,
        pieceVolume: readInputAsNumber(pieceVolume.value),
        clockVolume: readInputAsNumber(clockVolume.value),
        clockPitch: readInputAsNumber(clockPitch.value),
        clockSoundTarget: clockSoundTarget.value.value,
        returnCode: nameToReturnCode[returnCode.value.value],
        coefficientInSigmoid: readInputAsNumber(coefficientInSigmoid.value),
        badMoveLevelThreshold1: readInputAsNumber(badMoveLevelThreshold1.value),
        badMoveLevelThreshold2: readInputAsNumber(badMoveLevelThreshold2.value),
        badMoveLevelThreshold3: readInputAsNumber(badMoveLevelThreshold3.value),
        badMoveLevelThreshold4: readInputAsNumber(badMoveLevelThreshold4.value),
        enableAppLog: enableAppLog.value.checked,
        enableUSILog: enableUSILog.value.checked,
      };
      store.retainBussyState();
      try {
        await store.updateAppSetting(update);
        store.closeAppSettingDialog();
      } catch (e) {
        store.pushError(e);
      } finally {
        store.releaseBussyState();
      }
    };

    const cancel = () => {
      store.closeAppSettingDialog();
    };

    const appSetting = computed(() => {
      return {
        ...store.appSetting,
        returnCode: returnCodeToName[store.appSetting.returnCode],
      };
    });

    const pieceImageTypes = [
      {
        name: "一文字駒",
        value: PieceImageType.HITOMOJI,
      },
      {
        name: "一文字駒（ゴシック体）",
        value: PieceImageType.HITOMOJI_GOTHIC,
      },
    ];

    const boardImageTypes = [
      {
        name: "木目（明るい）",
        value: BoardImageType.LIGHT,
      },
      {
        name: "木目（暖かい）",
        value: BoardImageType.WARM,
      },
      {
        name: "塩化ビニル",
        value: BoardImageType.RESIN,
      },
    ];

    return {
      dialog,
      pieceImage,
      boardImage,
      pieceVolume,
      clockVolume,
      clockPitch,
      clockSoundTarget,
      returnCode,
      coefficientInSigmoid,
      badMoveLevelThreshold1,
      badMoveLevelThreshold2,
      badMoveLevelThreshold3,
      badMoveLevelThreshold4,
      enableAppLog,
      enableUSILog,
      appSetting,
      pieceImageTypes,
      boardImageTypes,
      isNative: isNative(),
      saveAndClose,
      cancel,
    };
  },
});
</script>

<style scoped>
.settings {
  width: 450px;
  height: 540px;
  padding: 10px;
  overflow: auto;
  display: flex;
  flex-direction: column;
}
.section {
  margin: 0px 0px 20px 0px;
}
.section-title {
  font-size: 1.1em;
}
input.toggle {
  height: 1rem;
  width: 1rem;
  margin-right: 10px;
}
</style>
