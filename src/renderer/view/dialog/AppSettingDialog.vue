<template>
  <div>
    <dialog ref="dialog">
      <div class="title">{{ t.appSettings }}</div>
      <div class="form-group scroll settings">
        <!-- 表示 -->
        <div class="section">
          <div class="section-title">{{ t.view }}</div>
          <div class="form-group warning">
            <div class="note">
              翻訳の改善にご協力ください。 We'd like your help to translate.
            </div>
            <div class="note">
              言語の変更には再起動が必要です。 You should restart this app to
              change the language.
            </div>
          </div>
          <!-- 言語 -->
          <div class="form-item">
            <div class="form-item-label-wide">{{ t.language }}</div>
            <select ref="language" :value="appSetting.language">
              <option :value="Language.JA">日本語</option>
              <option :value="Language.EN">English</option>
            </select>
          </div>
          <div class="form-item">
            <div class="form-item-label-wide">{{ t.theme }}</div>
            <select ref="thema" :value="appSetting.thema">
              <option :value="Thema.STANDARD">{{ t.standardGreen }}</option>
              <option :value="Thema.CHERRY_BLOSSOM">
                {{ t.cherryBlossom }}
              </option>
              <option :value="Thema.AUTUMN">{{ t.autumn }}</option>
              <option :value="Thema.SNOW">{{ t.snow }}</option>
              <option :value="Thema.DARK">{{ t.dark }}</option>
            </select>
          </div>
          <!-- 駒画像 -->
          <div class="form-item">
            <div class="form-item-label-wide">{{ t.piece }}</div>
            <select ref="pieceImage" :value="appSetting.pieceImage">
              <option :value="PieceImageType.HITOMOJI">
                {{ t.singleKanjiPiece }}
              </option>
              <option :value="PieceImageType.HITOMOJI_GOTHIC">
                {{ t.singleKanjiGothicPiece }}
              </option>
              <option :value="PieceImageType.HITOMOJI_DARK">
                {{ t.singleKanjiDarkPiece }}
              </option>
              <option :value="PieceImageType.HITOMOJI_GOTHIC_DARK">
                {{ t.singleKanjiGothicDarkPiece }}
              </option>
            </select>
          </div>
          <!-- 盤画像 -->
          <div class="form-item">
            <div class="form-item-label-wide">{{ t.board }}</div>
            <select
              ref="boardImage"
              :value="appSetting.boardImage"
              @change="onChangeBoardImage"
            >
              <option :value="BoardImageType.LIGHT">
                {{ t.lightWoodyTexture }}
              </option>
              <option :value="BoardImageType.WARM">
                {{ t.warmWoodTexture }}
              </option>
              <option :value="BoardImageType.RESIN">{{ t.regin }}</option>
              <option :value="BoardImageType.RESIN2">{{ t.regin }}2</option>
              <option :value="BoardImageType.RESIN3">{{ t.regin }}3</option>
              <option :value="BoardImageType.DARK">{{ t.dark }}</option>
              <option :value="BoardImageType.GREEN">{{ t.green }}</option>
              <option :value="BoardImageType.CHERRY_BLOSSOM">
                {{ t.cherryBlossom }}
              </option>
              <option :value="BoardImageType.CUSTOM_IMAGE">
                {{ t.customImage }}
              </option>
            </select>
          </div>
          <div
            class="form-item"
            :class="{
              hidden: appSetting.boardImage !== BoardImageType.CUSTOM_IMAGE,
            }"
          >
            <div class="form-item-label-wide"></div>
            <input
              ref="boardImageFileURL"
              class="file-path"
              :value="appSetting.boardImageFileURL"
              type="text"
            />
            <button class="thin" @click="selectBoardImageFile">
              {{ t.select }}
            </button>
          </div>
          <!-- 駒台画像 -->
          <div class="form-item">
            <div class="form-item-label-wide">{{ t.pieceStand }}</div>
            <select
              ref="pieceStandImage"
              :value="appSetting.pieceStandImage"
              @change="onChangePieceStandImage"
            >
              <option :value="PieceStandImageType.STANDARD">
                {{ t.standard }}
              </option>
              <option :value="PieceStandImageType.DARK">
                {{ t.dark }}
              </option>
              <option :value="PieceStandImageType.GREEN">
                {{ t.green }}
              </option>
              <option :value="PieceStandImageType.CHERRY_BLOSSOM">
                {{ t.cherryBlossom }}
              </option>
              <option :value="PieceStandImageType.CUSTOM_IMAGE">
                {{ t.customImage }}
              </option>
            </select>
          </div>
          <div
            class="form-item"
            :class="{
              hidden:
                appSetting.pieceStandImage !== PieceStandImageType.CUSTOM_IMAGE,
            }"
          >
            <div class="form-item-label-wide"></div>
            <input
              ref="pieceStandImageFileURL"
              class="file-path"
              :value="appSetting.pieceStandImageFileURL"
              type="text"
            />
            <button class="thin" @click="selectPieceStandImageFile">
              {{ t.select }}
            </button>
          </div>
          <!-- 段・筋の表示 -->
          <div class="form-item">
            <div class="form-item-label-wide">
              {{ t.displayFileAndRank }}
            </div>
            <input
              ref="displayBoardLabels"
              class="toggle"
              :checked="appSetting.boardLabelType != BoardLabelType.NONE"
              type="checkbox"
            />
          </div>
          <!-- タブビューの形式 -->
          <div class="form-item">
            <div class="form-item-label-wide">{{ t.tabViewStyle }}</div>
            <select ref="tabPaneType" :value="appSetting.tabPaneType">
              <option :value="TabPaneType.SINGLE">{{ t.oneColumn }}</option>
              <option :value="TabPaneType.DOUBLE">{{ t.twoColumns }}</option>
            </select>
          </div>
        </div>
        <hr />
        <!-- 音 -->
        <div class="section">
          <div class="section-title">{{ t.sounds }}</div>
          <!-- 駒音の大きさ -->
          <div class="form-item">
            <div class="form-item-label-wide">{{ t.pieceLoudness }}</div>
            <input
              ref="pieceVolume"
              :value="appSetting.pieceVolume"
              type="number"
              max="100"
              min="0"
            />
            <div class="form-item-unit">%</div>
          </div>
          <!-- 時計音の大きさ -->
          <div class="form-item">
            <div class="form-item-label-wide">{{ t.clockLoudness }}</div>
            <input
              ref="clockVolume"
              :value="appSetting.clockVolume"
              type="number"
              max="100"
              min="0"
            />
            <div class="form-item-unit">%</div>
          </div>
          <!-- 時計音の高さ -->
          <div class="form-item">
            <div class="form-item-label-wide">{{ t.clockPitch }}</div>
            <input
              ref="clockPitch"
              :value="appSetting.clockPitch"
              type="number"
              max="880"
              min="220"
            />
            <div class="form-item-unit">Hz ({{ t.between(220, 880) }})</div>
          </div>
          <!-- 時計音の対象 -->
          <div class="form-item">
            <div class="form-item-label-wide">
              {{ t.clockSoundTarget }}
            </div>
            <select ref="clockSoundTarget" :value="appSetting.clockSoundTarget">
              <option value="all">{{ t.anyTurn }}</option>
              <option value="onlyUser">{{ t.onlyHumanTurn }}</option>
            </select>
          </div>
        </div>
        <hr />
        <!-- ファイル -->
        <div class="section">
          <div class="section-title">{{ t.file }}</div>
          <!-- 改行文字 -->
          <div class="form-item">
            <div class="form-item-label-wide">
              {{ t.newlineCharacter }}
            </div>
            <select
              ref="returnCode"
              :value="returnCodeToName[appSetting.returnCode]"
            >
              <option value="crlf">CR + LF (Windows)</option>
              <option value="lf">LF (UNIX/Mac)</option>
              <option value="cr">CR ({{ t.old90sMac }})</option>
            </select>
          </div>
          <!-- 自動保存先 -->
          <div class="form-item">
            <div class="form-item-label-wide">
              {{ t.autoSavingDirectory }}
            </div>
            <input
              ref="autoSaveDirectory"
              class="file-path"
              :value="appSetting.autoSaveDirectory"
              type="text"
            />
            <button class="thin" @click="selectAutoSaveDirectory">
              {{ t.select }}
            </button>
          </div>
        </div>
        <hr />
        <!-- USI プロトコル -->
        <div class="section">
          <div class="section-title">{{ t.usiProtocol }}</div>
          <!-- オプション名を翻訳 -->
          <div class="form-item">
            <div class="form-item-label-wide">
              {{ t.translateOptionName }}
            </div>
            <input
              ref="translateEngineOptionName"
              class="toggle"
              :checked="appSetting.translateEngineOptionName"
              type="checkbox"
            />
            <div class="form-item-unit">({{ t.functionalOnJapaneseOnly }})</div>
          </div>
          <!-- 最大起動待ち時間 -->
          <div class="form-item">
            <div class="form-item-label-wide">
              {{ t.maxStartupTime }}
            </div>
            <input
              ref="engineTimeoutSeconds"
              :value="appSetting.engineTimeoutSeconds"
              type="number"
              max="300"
              min="1"
            />
            <div class="form-item-unit">
              {{ t.secondsSuffix }} ({{ t.between(1, 300) }})
            </div>
          </div>
        </div>
        <hr />
        <!-- 評価値と推定勝率 -->
        <div class="section">
          <div class="section-title">{{ t.evaluationAndEstimatedWinRate }}</div>
          <!-- 評価値の符号 -->
          <div class="form-item">
            <div class="form-item-label-wide">
              {{ t.signOfEvaluation }}
            </div>
            <select
              ref="evaluationViewFrom"
              :value="appSetting.evaluationViewFrom"
            >
              <option :value="EvaluationViewFrom.EACH">
                {{ t.swapEachTurnChange }}
              </option>
              <option :value="EvaluationViewFrom.BLACK">
                {{ t.alwaysSenteIsPositive }}
              </option>
            </select>
          </div>
          <!-- 勝率換算係数 -->
          <div class="form-item">
            <div class="form-item-label-wide">
              {{ t.winRateCoefficient }}
            </div>
            <input
              ref="coefficientInSigmoid"
              :value="appSetting.coefficientInSigmoid"
              type="number"
              max="10000"
              min="1"
            />
            <div class="form-item-unit">
              ({{ t.recommended }}: {{ t.between(600, 1500) }})
            </div>
          </div>
          <!-- 緩手の閾値 -->
          <div class="form-item">
            <!-- TODO: Translate -->
            <div class="form-item-label-wide">緩手の閾値</div>
            <input
              ref="badMoveLevelThreshold1"
              :value="appSetting.badMoveLevelThreshold1"
              type="number"
              max="100"
              min="0"
            />
            <div class="form-item-unit">%</div>
          </div>
          <!-- 疑問手の閾値 -->
          <div class="form-item">
            <!-- TODO: Translate -->
            <div class="form-item-label-wide">疑問手の閾値</div>
            <input
              ref="badMoveLevelThreshold2"
              :value="appSetting.badMoveLevelThreshold2"
              type="number"
              max="100"
              min="0"
            />
            <div class="form-item-unit">%</div>
          </div>
          <!-- 悪手の閾値 -->
          <div class="form-item">
            <!-- TODO: Translate -->
            <div class="form-item-label-wide">悪手の閾値</div>
            <input
              ref="badMoveLevelThreshold3"
              :value="appSetting.badMoveLevelThreshold3"
              type="number"
              max="100"
              min="0"
            />
            <div class="form-item-unit">%</div>
          </div>
          <!-- 大悪手の閾値 -->
          <div class="form-item">
            <!-- TODO: Translate -->
            <div class="form-item-label-wide">大悪手の閾値</div>
            <input
              ref="badMoveLevelThreshold4"
              :value="appSetting.badMoveLevelThreshold4"
              type="number"
              max="100"
              min="0"
            />
            <div class="form-item-unit">%</div>
          </div>
        </div>
        <hr />
        <!-- 開発者向け -->
        <div class="section">
          <div class="section-title">{{ t.forDevelopers }}</div>
          <div class="form-group warning">
            <div v-if="!isNative" class="note">
              {{ t.inBrowserLogsOutputToConsoleAndIgnoreThisSetting }}
            </div>
            <div v-if="isNative" class="note">
              {{ t.shouldRestartToApplyLogSettings }}
            </div>
            <div v-if="isNative" class="note">
              {{ t.canOpenLogDirectoryFromMenu }}
            </div>
            <div v-if="isNative" class="note">
              {{ t.hasNoOldLogCleanUpFeature }}
            </div>
          </div>
          <!-- アプリログを出力 -->
          <div class="form-item">
            <div class="form-item-label-wide">{{ t.enableAppLog }}</div>
            <input
              ref="enableAppLog"
              class="toggle"
              :checked="appSetting.enableAppLog"
              type="checkbox"
            />
          </div>
          <!-- USI通信ログを出力 -->
          <div class="form-item">
            <div class="form-item-label-wide">{{ t.enableUSILog }}</div>
            <input
              ref="enableUSILog"
              class="toggle"
              :checked="appSetting.enableUSILog"
              type="checkbox"
            />
          </div>
          <!-- CSA通信ログを出力 -->
          <div class="form-item">
            <div class="form-item-label-wide">{{ t.enableCSALog }}</div>
            <input
              ref="enableCSALog"
              class="toggle"
              :checked="appSetting.enableCSALog"
              type="checkbox"
            />
          </div>
          <!-- ログレベル -->
          <div class="form-item">
            <div class="form-item-label-wide">{{ t.logLevel }}</div>
            <select ref="logLevel" :value="appSetting.logLevel">
              <option :value="LogLevel.DEBUG">DEBUG</option>
              <option :value="LogLevel.INFO">INFO</option>
              <option :value="LogLevel.WARN">WARN</option>
              <option :value="LogLevel.ERROR">ERROR</option>
            </select>
          </div>
        </div>
      </div>
      <div class="main-buttons">
        <button data-hotkey="Enter" autofocus @click="saveAndClose()">
          {{ t.saveAndClose }}
        </button>
        <button data-hotkey="Escape" @click="cancel()">
          {{ t.cancel }}
        </button>
      </div>
    </dialog>
  </div>
</template>

<script lang="ts">
import { t, Language } from "@/common/i18n";
import {
  PieceImageType,
  BoardImageType,
  PieceStandImageType,
  BoardLabelType,
  TabPaneType,
  EvaluationViewFrom,
  AppSettingUpdate,
  Thema,
} from "@/common/settings/app";
import { useStore } from "@/renderer/store";
import { ref, defineComponent, onMounted, Ref, onBeforeUnmount } from "vue";
import { readInputAsNumber } from "@/renderer/helpers/form.js";
import { showModalDialog } from "@/renderer/helpers/dialog.js";
import api, { isNative } from "@/renderer/ipc/api";
import {
  installHotKeyForDialog,
  uninstallHotKeyForDialog,
} from "@/renderer/keyboard/hotkey";
import { useAppSetting } from "@/renderer/store/setting";
import { LogLevel } from "@/common/log";

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
    const appSetting = useAppSetting();
    const dialog: Ref = ref(null);
    const language: Ref = ref(null);
    const thema: Ref = ref(null);
    const pieceImage: Ref = ref(null);
    const boardImage: Ref = ref(null);
    const boardImageFileURL: Ref = ref(null);
    const pieceStandImage: Ref = ref(null);
    const pieceStandImageFileURL: Ref = ref(null);
    const displayBoardLabels: Ref = ref(null);
    const tabPaneType: Ref = ref(null);
    const pieceVolume: Ref = ref(null);
    const clockVolume: Ref = ref(null);
    const clockPitch: Ref = ref(null);
    const clockSoundTarget: Ref = ref(null);
    const returnCode: Ref = ref(null);
    const autoSaveDirectory: Ref = ref(null);
    const translateEngineOptionName: Ref = ref(null);
    const engineTimeoutSeconds: Ref = ref(null);
    const evaluationViewFrom: Ref = ref(null);
    const coefficientInSigmoid: Ref = ref(null);
    const badMoveLevelThreshold1: Ref = ref(null);
    const badMoveLevelThreshold2: Ref = ref(null);
    const badMoveLevelThreshold3: Ref = ref(null);
    const badMoveLevelThreshold4: Ref = ref(null);
    const enableAppLog: Ref = ref(null);
    const enableUSILog: Ref = ref(null);
    const enableCSALog: Ref = ref(null);
    const logLevel: Ref = ref(null);

    onMounted(() => {
      showModalDialog(dialog.value);
      installHotKeyForDialog(dialog.value);
    });

    onBeforeUnmount(() => {
      uninstallHotKeyForDialog(dialog.value);
    });

    const saveAndClose = async () => {
      const update: AppSettingUpdate = {
        language: language.value.value,
        thema: thema.value.value,
        pieceImage: pieceImage.value.value,
        boardImage: boardImage.value.value,
        pieceStandImage: pieceStandImage.value.value,
        boardLabelType: displayBoardLabels.value.checked
          ? BoardLabelType.STANDARD
          : BoardLabelType.NONE,
        tabPaneType: tabPaneType.value.value,
        pieceVolume: readInputAsNumber(pieceVolume.value),
        clockVolume: readInputAsNumber(clockVolume.value),
        clockPitch: readInputAsNumber(clockPitch.value),
        clockSoundTarget: clockSoundTarget.value.value,
        returnCode: nameToReturnCode[returnCode.value.value],
        autoSaveDirectory: autoSaveDirectory.value.value,
        translateEngineOptionName: translateEngineOptionName.value.checked,
        engineTimeoutSeconds: readInputAsNumber(engineTimeoutSeconds.value),
        evaluationViewFrom: evaluationViewFrom.value.value,
        coefficientInSigmoid: readInputAsNumber(coefficientInSigmoid.value),
        badMoveLevelThreshold1: readInputAsNumber(badMoveLevelThreshold1.value),
        badMoveLevelThreshold2: readInputAsNumber(badMoveLevelThreshold2.value),
        badMoveLevelThreshold3: readInputAsNumber(badMoveLevelThreshold3.value),
        badMoveLevelThreshold4: readInputAsNumber(badMoveLevelThreshold4.value),
        enableAppLog: enableAppLog.value.checked,
        enableUSILog: enableUSILog.value.checked,
        enableCSALog: enableCSALog.value.checked,
        logLevel: logLevel.value.value,
      };
      if (update.boardImage === BoardImageType.CUSTOM_IMAGE) {
        update.boardImageFileURL = boardImageFileURL.value.value;
      }
      if (update.pieceStandImage === PieceStandImageType.CUSTOM_IMAGE) {
        update.pieceStandImageFileURL = pieceStandImageFileURL.value.value;
      }
      store.retainBussyState();
      try {
        await useAppSetting().updateAppSetting(update);
        store.closeAppSettingDialog();
      } catch (e) {
        store.pushError(e);
      } finally {
        store.releaseBussyState();
      }
    };

    const onChangeBoardImage = () => {
      const formItem = (boardImageFileURL.value as HTMLElement)
        .parentElement as HTMLElement;
      if (boardImage.value.value === BoardImageType.CUSTOM_IMAGE) {
        formItem.classList.remove("hidden");
      } else {
        formItem.classList.add("hidden");
      }
    };

    const selectBoardImageFile = async () => {
      store.retainBussyState();
      try {
        const path = await api.showSelectImageDialog(
          boardImageFileURL.value.value
        );
        if (path) {
          boardImageFileURL.value.value = path;
        }
      } catch (e) {
        store.pushError(e);
      } finally {
        store.releaseBussyState();
      }
    };

    const onChangePieceStandImage = () => {
      const formItem = (pieceStandImageFileURL.value as HTMLElement)
        .parentElement as HTMLElement;
      if (pieceStandImage.value.value === PieceStandImageType.CUSTOM_IMAGE) {
        formItem.classList.remove("hidden");
      } else {
        formItem.classList.add("hidden");
      }
    };

    const selectPieceStandImageFile = async () => {
      store.retainBussyState();
      try {
        const path = await api.showSelectImageDialog(
          pieceStandImageFileURL.value.value
        );
        if (path) {
          pieceStandImageFileURL.value.value = path;
        }
      } catch (e) {
        store.pushError(e);
      } finally {
        store.releaseBussyState();
      }
    };

    const selectAutoSaveDirectory = async () => {
      store.retainBussyState();
      try {
        const path = await api.showSelectDirectoryDialog(
          autoSaveDirectory.value.value
        );
        if (path) {
          autoSaveDirectory.value.value = path;
        }
      } catch (e) {
        store.pushError(e);
      } finally {
        store.releaseBussyState();
      }
    };

    const cancel = () => {
      store.closeAppSettingDialog();
    };

    return {
      t,
      Language,
      Thema,
      PieceImageType,
      BoardImageType,
      PieceStandImageType,
      BoardLabelType,
      TabPaneType,
      EvaluationViewFrom,
      LogLevel,
      dialog,
      language,
      thema,
      pieceImage,
      boardImage,
      boardImageFileURL,
      pieceStandImage,
      pieceStandImageFileURL,
      displayBoardLabels,
      tabPaneType,
      pieceVolume,
      clockVolume,
      clockPitch,
      clockSoundTarget,
      returnCode,
      autoSaveDirectory,
      translateEngineOptionName,
      engineTimeoutSeconds,
      evaluationViewFrom,
      coefficientInSigmoid,
      badMoveLevelThreshold1,
      badMoveLevelThreshold2,
      badMoveLevelThreshold3,
      badMoveLevelThreshold4,
      enableAppLog,
      enableUSILog,
      enableCSALog,
      logLevel,
      appSetting,
      returnCodeToName,
      isNative: isNative(),
      onChangeBoardImage,
      selectBoardImageFile,
      onChangePieceStandImage,
      selectPieceStandImageFile,
      selectAutoSaveDirectory,
      saveAndClose,
      cancel,
    };
  },
});
</script>

<style scoped>
.settings {
  width: 540px;
  height: 540px;
}
.section {
  margin: 20px 0px 20px 0px;
}
.section-title {
  font-size: 1.1em;
}
input.toggle {
  height: 1em;
  width: 1em;
  margin-right: 10px;
}
input.file-path {
  width: 250px;
}
</style>
