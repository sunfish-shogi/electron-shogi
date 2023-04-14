<template>
  <div>
    <dialog ref="dialog">
      <div class="title">{{ t.appSettings }}</div>
      <div class="form-group scroll settings">
        <!-- 表示 -->
        <div class="section">
          <div class="section-title">{{ t.view }}</div>
          <!-- 言語 -->
          <div class="form-item">
            <div class="form-item-label-wide">{{ t.language }}</div>
            <HorizontalSelector
              class="selector"
              :value="language"
              :items="[
                { label: '日本語', value: Language.JA },
                { label: 'English', value: Language.EN },
              ]"
              @change="
                (value) => {
                  language = value;
                }
              "
            />
          </div>
          <div class="form-group warning">
            <div class="note">
              翻訳の改善にご協力ください。 We'd like your help to translate.
            </div>
            <div class="note">
              言語の変更には再起動が必要です。 You should restart this app to
              change the language.
            </div>
          </div>
          <!-- テーマ -->
          <div class="form-item">
            <div class="form-item-label-wide">{{ t.theme }}</div>
            <HorizontalSelector
              class="selector"
              :value="thema"
              :items="[
                { label: t.green, value: Thema.STANDARD },
                { label: t.cherryBlossom, value: Thema.CHERRY_BLOSSOM },
                { label: t.autumn, value: Thema.AUTUMN },
                { label: t.snow, value: Thema.SNOW },
                { label: t.dark, value: Thema.DARK },
              ]"
              @change="
                (value) => {
                  thema = value;
                }
              "
            />
          </div>
          <!-- 背景画像 -->
          <div class="form-item">
            <div class="form-item-label-wide">{{ t.backgroundImage }}</div>
            <HorizontalSelector
              class="selector"
              :value="backgroundImageType"
              :items="[
                { label: t.none, value: BackgroundImageType.NONE },
                { label: t.bgCover, value: BackgroundImageType.COVER },
                { label: t.bgContain, value: BackgroundImageType.CONTAIN },
                { label: t.bgTile, value: BackgroundImageType.TILE },
              ]"
              @change="
                (value) => {
                  backgroundImageType = value;
                }
              "
            />
          </div>
          <div
            ref="backgroundImageSelector"
            class="form-item"
            :class="{
              hidden: backgroundImageType === BackgroundImageType.NONE,
            }"
          >
            <div class="form-item-label-wide"></div>
            <ImageSelector
              class="image-selector"
              :default-url="appSetting.backgroundImageFileURL"
              @select="(url) => (backgroundImageFileURL = url)"
            />
          </div>
          <!-- 駒画像 -->
          <div class="form-item">
            <div class="form-item-label-wide">{{ t.piece }}</div>
            <HorizontalSelector
              class="selector"
              :value="pieceImage"
              :items="[
                { label: t.singleKanjiPiece, value: PieceImageType.HITOMOJI },
                {
                  label: t.singleKanjiGothicPiece,
                  value: PieceImageType.HITOMOJI_GOTHIC,
                },
                {
                  label: t.singleKanjiDarkPiece,
                  value: PieceImageType.HITOMOJI_DARK,
                },
                {
                  label: t.singleKanjiGothicDarkPiece,
                  value: PieceImageType.HITOMOJI_GOTHIC_DARK,
                },
              ]"
              @change="
                (value) => {
                  pieceImage = value;
                }
              "
            />
          </div>
          <!-- 盤画像 -->
          <div class="form-item">
            <div class="form-item-label-wide">{{ t.board }}</div>
            <HorizontalSelector
              class="selector"
              :value="boardImage"
              :items="[
                { label: t.lightWoodyTexture, value: BoardImageType.LIGHT },
                { label: t.warmWoodTexture, value: BoardImageType.WARM },
                { label: t.regin, value: BoardImageType.RESIN },
                { label: t.regin + '2', value: BoardImageType.RESIN2 },
                { label: t.regin + '3', value: BoardImageType.RESIN3 },
                { label: t.dark, value: BoardImageType.DARK },
                { label: t.green, value: BoardImageType.GREEN },
                {
                  label: t.cherryBlossom,
                  value: BoardImageType.CHERRY_BLOSSOM,
                },
                { label: t.customImage, value: BoardImageType.CUSTOM_IMAGE },
              ]"
              @change="
                (value) => {
                  boardImage = value;
                }
              "
            />
          </div>
          <div
            ref="boardImageSelector"
            class="form-item"
            :class="{
              hidden: boardImage !== BoardImageType.CUSTOM_IMAGE,
            }"
          >
            <div class="form-item-label-wide"></div>
            <ImageSelector
              class="image-selector"
              :default-url="appSetting.boardImageFileURL"
              @select="(url) => (boardImageFileURL = url)"
            />
          </div>
          <!-- 駒台画像 -->
          <div class="form-item">
            <div class="form-item-label-wide">{{ t.pieceStand }}</div>
            <HorizontalSelector
              class="selector"
              :value="pieceStandImage"
              :items="[
                { label: t.standard, value: PieceStandImageType.STANDARD },
                { label: t.dark, value: PieceStandImageType.DARK },
                { label: t.green, value: PieceStandImageType.GREEN },
                {
                  label: t.cherryBlossom,
                  value: PieceStandImageType.CHERRY_BLOSSOM,
                },
                {
                  label: t.customImage,
                  value: PieceStandImageType.CUSTOM_IMAGE,
                },
              ]"
              @change="
                (value) => {
                  pieceStandImage = value;
                }
              "
            />
          </div>
          <div
            ref="pieceStandImageSelector"
            class="form-item"
            :class="{
              hidden: pieceStandImage !== PieceStandImageType.CUSTOM_IMAGE,
            }"
          >
            <div class="form-item-label-wide"></div>
            <ImageSelector
              class="image-selector"
              :default-url="appSetting.pieceStandImageFileURL"
              @select="(url) => (pieceStandImageFileURL = url)"
            />
          </div>
          <!-- 段・筋の表示 -->
          <div class="form-item">
            <div class="form-item-label-wide">
              {{ t.displayFileAndRank }}
            </div>
            <ToggleButton
              :value="displayBoardLabels"
              @change="(checked) => (displayBoardLabels = checked)"
            />
          </div>
          <!-- 左コントロールの表示 -->
          <div :class="{ hidden: !isNative() }" class="form-item">
            <div class="form-item-label-wide">
              {{ t.displayLeftControls }}
            </div>
            <ToggleButton
              :value="displayLeftSideControls"
              @change="(checked) => (displayLeftSideControls = checked)"
            />
          </div>
          <!-- 右コントロールの表示 -->
          <div :class="{ hidden: !isNative() }" class="form-item">
            <div class="form-item-label-wide">
              {{ t.displayRightControls }}
            </div>
            <ToggleButton
              :value="displayRightSideControls"
              @change="(checked) => (displayRightSideControls = checked)"
            />
          </div>
          <!-- タブビューの形式 -->
          <div class="form-item">
            <div class="form-item-label-wide">{{ t.tabViewStyle }}</div>
            <HorizontalSelector
              class="selector"
              :value="tabPaneType"
              :items="[
                { label: t.oneColumn, value: TabPaneType.SINGLE },
                { label: t.twoColumns, value: TabPaneType.DOUBLE },
              ]"
              @change="
                (value) => {
                  tabPaneType = value;
                }
              "
            />
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
            <HorizontalSelector
              class="selector"
              :value="clockSoundTarget"
              :items="[
                { label: t.anyTurn, value: ClockSoundTarget.ALL },
                { label: t.onlyHumanTurn, value: ClockSoundTarget.ONLY_USER },
              ]"
              @change="
                (value) => {
                  clockSoundTarget = value;
                }
              "
            />
          </div>
        </div>
        <hr />
        <!-- ファイル -->
        <div class="section">
          <div class="section-title">{{ t.file }}</div>
          <!-- 文字コード -->
          <div class="form-item">
            <div class="form-item-label-wide">
              {{ t.textEncoding }}
            </div>
            <HorizontalSelector
              class="selector"
              :value="textDecodingRule"
              :items="[
                { label: t.strict, value: TextDecodingRule.STRICT },
                { label: t.autoDetect, value: TextDecodingRule.AUTO_DETECT },
              ]"
              @change="
                (value) => {
                  textDecodingRule = value;
                }
              "
            />
          </div>
          <!-- 改行文字 -->
          <div class="form-item">
            <div class="form-item-label-wide">
              {{ t.newlineCharacter }}
            </div>
            <HorizontalSelector
              class="selector"
              :value="returnCode"
              :items="[
                { label: 'CRLF (Windows)', value: 'crlf' },
                { label: 'LF (UNIX/Mac)', value: 'lf' },
                { label: `CR (${t.old90sMac})`, value: 'cr' },
              ]"
              @change="
                (value) => {
                  returnCode = value;
                }
              "
            />
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
            <ToggleButton
              :value="translateEngineOptionName"
              @change="(checked) => (translateEngineOptionName = checked)"
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
            <HorizontalSelector
              class="selector"
              :value="evaluationViewFrom"
              :items="[
                { label: t.swapEachTurnChange, value: EvaluationViewFrom.EACH },
                {
                  label: t.alwaysSenteIsPositive,
                  value: EvaluationViewFrom.BLACK,
                },
              ]"
              @change="
                (value) => {
                  evaluationViewFrom = value;
                }
              "
            />
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
            <div class="form-item-label-wide">{{ t.inaccuracyThreshold }}</div>
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
            <div class="form-item-label-wide">{{ t.dubiousThreshold }}</div>
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
            <div class="form-item-label-wide">{{ t.mistakeThreshold }}</div>
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
            <div class="form-item-label-wide">{{ t.blunderThreshold }}</div>
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
            <div v-if="!isNative()" class="note">
              {{ t.inBrowserLogsOutputToConsoleAndIgnoreThisSetting }}
            </div>
            <div v-if="isNative()" class="note">
              {{ t.shouldRestartToApplyLogSettings }}
            </div>
            <div v-if="isNative()" class="note">
              {{ t.canOpenLogDirectoryFromMenu }}
            </div>
            <div v-if="isNative()" class="note">
              {{ t.hasNoOldLogCleanUpFeature }}
            </div>
          </div>
          <!-- アプリログを出力 -->
          <div class="form-item">
            <div class="form-item-label-wide">{{ t.enableAppLog }}</div>
            <ToggleButton
              :value="enableAppLog"
              @change="(checked) => (enableAppLog = checked)"
            />
          </div>
          <!-- USI通信ログを出力 -->
          <div class="form-item">
            <div class="form-item-label-wide">{{ t.enableUSILog }}</div>
            <ToggleButton
              :value="enableUSILog"
              @change="(checked) => (enableUSILog = checked)"
            />
          </div>
          <!-- CSA通信ログを出力 -->
          <div class="form-item">
            <div class="form-item-label-wide">{{ t.enableCSALog }}</div>
            <ToggleButton
              :value="enableCSALog"
              @change="(checked) => (enableCSALog = checked)"
            />
          </div>
          <!-- ログレベル -->
          <div class="form-item">
            <div class="form-item-label-wide">{{ t.logLevel }}</div>
            <HorizontalSelector
              class="selector"
              :value="logLevel"
              :items="[
                { label: 'DEBUG', value: LogLevel.DEBUG },
                { label: 'INFO', value: LogLevel.INFO },
                { label: 'WARN', value: LogLevel.WARN },
                { label: 'ERROR', value: LogLevel.ERROR },
              ]"
              @change="
                (value) => {
                  logLevel = value;
                }
              "
            />
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

<script setup lang="ts">
import { t, Language } from "@/common/i18n";
import {
  PieceImageType,
  BoardImageType,
  PieceStandImageType,
  BoardLabelType,
  LeftSideControlType,
  RightSideControlType,
  TabPaneType,
  EvaluationViewFrom,
  AppSettingUpdate,
  Thema,
  BackgroundImageType,
  TextDecodingRule,
  ClockSoundTarget,
} from "@/common/settings/app";
import ImageSelector from "@/renderer/view/dialog/ImageSelector.vue";
import ToggleButton from "@/renderer/view/primitive/ToggleButton.vue";
import { useStore } from "@/renderer/store";
import { ref, onMounted, onBeforeUnmount } from "vue";
import { readInputAsNumber } from "@/renderer/helpers/form.js";
import { showModalDialog } from "@/renderer/helpers/dialog.js";
import api, { isNative } from "@/renderer/ipc/api";
import {
  installHotKeyForDialog,
  uninstallHotKeyForDialog,
} from "@/renderer/keyboard/hotkey";
import { useAppSetting } from "@/renderer/store/setting";
import { LogLevel } from "@/common/log";
import HorizontalSelector from "../primitive/HorizontalSelector.vue";

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

const store = useStore();
const appSetting = useAppSetting();
const dialog = ref();
const language = ref(appSetting.language);
const thema = ref(appSetting.thema);
const backgroundImageType = ref(appSetting.backgroundImageType);
const backgroundImageSelector = ref();
const pieceImage = ref(appSetting.pieceImage);
const boardImage = ref(appSetting.boardImage);
const boardImageSelector = ref();
const pieceStandImage = ref(appSetting.pieceStandImage);
const pieceStandImageSelector = ref();
const displayBoardLabels = ref(
  appSetting.boardLabelType != BoardLabelType.NONE
);
const displayLeftSideControls = ref(
  appSetting.leftSideControlType != LeftSideControlType.NONE
);
const displayRightSideControls = ref(
  appSetting.rightSideControlType != RightSideControlType.NONE
);
const tabPaneType = ref(appSetting.tabPaneType);
const pieceVolume = ref();
const clockVolume = ref();
const clockPitch = ref();
const clockSoundTarget = ref(appSetting.clockSoundTarget);
const textDecodingRule = ref(appSetting.textDecodingRule);
const returnCode = ref(returnCodeToName[appSetting.returnCode]);
const autoSaveDirectory = ref();
const translateEngineOptionName = ref(appSetting.translateEngineOptionName);
const engineTimeoutSeconds = ref();
const evaluationViewFrom = ref(appSetting.evaluationViewFrom);
const coefficientInSigmoid = ref();
const badMoveLevelThreshold1 = ref();
const badMoveLevelThreshold2 = ref();
const badMoveLevelThreshold3 = ref();
const badMoveLevelThreshold4 = ref();
const enableAppLog = ref(appSetting.enableAppLog);
const enableUSILog = ref(appSetting.enableUSILog);
const enableCSALog = ref(appSetting.enableCSALog);
const logLevel = ref(appSetting.logLevel);
const backgroundImageFileURL = ref(appSetting.backgroundImageFileURL);
const boardImageFileURL = ref(appSetting.boardImageFileURL);
const pieceStandImageFileURL = ref(appSetting.pieceStandImageFileURL);

onMounted(() => {
  showModalDialog(dialog.value);
  installHotKeyForDialog(dialog.value);
});

onBeforeUnmount(() => {
  uninstallHotKeyForDialog(dialog.value);
});

const saveAndClose = async () => {
  const update: AppSettingUpdate = {
    language: language.value,
    thema: thema.value,
    backgroundImageType: backgroundImageType.value,
    pieceImage: pieceImage.value,
    boardImage: boardImage.value,
    pieceStandImage: pieceStandImage.value,
    boardLabelType: displayBoardLabels.value
      ? BoardLabelType.STANDARD
      : BoardLabelType.NONE,
    leftSideControlType: displayLeftSideControls.value
      ? LeftSideControlType.STANDARD
      : LeftSideControlType.NONE,
    rightSideControlType: displayRightSideControls.value
      ? RightSideControlType.STANDARD
      : RightSideControlType.NONE,
    tabPaneType: tabPaneType.value,
    pieceVolume: readInputAsNumber(pieceVolume.value),
    clockVolume: readInputAsNumber(clockVolume.value),
    clockPitch: readInputAsNumber(clockPitch.value),
    clockSoundTarget: clockSoundTarget.value,
    textDecodingRule: textDecodingRule.value,
    returnCode: nameToReturnCode[returnCode.value],
    autoSaveDirectory: autoSaveDirectory.value.value,
    translateEngineOptionName: translateEngineOptionName.value,
    engineTimeoutSeconds: readInputAsNumber(engineTimeoutSeconds.value),
    evaluationViewFrom: evaluationViewFrom.value,
    coefficientInSigmoid: readInputAsNumber(coefficientInSigmoid.value),
    badMoveLevelThreshold1: readInputAsNumber(badMoveLevelThreshold1.value),
    badMoveLevelThreshold2: readInputAsNumber(badMoveLevelThreshold2.value),
    badMoveLevelThreshold3: readInputAsNumber(badMoveLevelThreshold3.value),
    badMoveLevelThreshold4: readInputAsNumber(badMoveLevelThreshold4.value),
    enableAppLog: enableAppLog.value,
    enableUSILog: enableUSILog.value,
    enableCSALog: enableCSALog.value,
    logLevel: logLevel.value,
  };
  if (update.backgroundImageType !== BackgroundImageType.NONE) {
    update.backgroundImageFileURL = backgroundImageFileURL.value;
  }
  if (update.boardImage === BoardImageType.CUSTOM_IMAGE) {
    update.boardImageFileURL = boardImageFileURL.value;
  }
  if (update.pieceStandImage === PieceStandImageType.CUSTOM_IMAGE) {
    update.pieceStandImageFileURL = pieceStandImageFileURL.value;
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
</script>

<style scoped>
.settings {
  width: 590px;
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
.image-selector {
  display: inline-block;
  width: 200px;
}
.selector {
  max-width: 400px;
}
</style>
