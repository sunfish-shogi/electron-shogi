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
                { label: '繁體中文', value: Language.ZH_TW },
                { label: 'Tiếng Việt', value: Language.VI },
              ]"
              @change="
                (value: string) => {
                  language = value as Language;
                }
              "
            />
          </div>
          <div class="form-group warning">
            <div class="note">
              {{ t.translationHelpNeeded }}
              {{ appSettings.language != Language.EN ? "We'd like your help to translate." : "" }}
            </div>
            <div class="note">
              {{ t.restartRequiredAfterLocaleChange }}
              {{
                appSettings.language != Language.EN
                  ? "You should restart this app to change the language."
                  : ""
              }}
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
                { label: t.darkGreen, value: Thema.DARK_GREEN },
                { label: t.dark, value: Thema.DARK },
              ]"
              @change="
                (value: string) => {
                  thema = value as Thema;
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
                (value: string) => {
                  backgroundImageType = value as BackgroundImageType;
                }
              "
            />
          </div>
          <div
            v-show="backgroundImageType !== BackgroundImageType.NONE"
            ref="backgroundImageSelector"
            class="form-item"
          >
            <div class="form-item-label-wide"></div>
            <ImageSelector
              class="image-selector"
              :default-url="appSettings.backgroundImageFileURL"
              @select="(url: string) => (backgroundImageFileURL = url)"
            />
          </div>
          <!-- 盤レイアウト -->
          <div class="form-item">
            <div class="form-item-label-wide">{{ t.boardLayout }}</div>
            <HorizontalSelector
              class="selector"
              :value="boardLayoutType"
              :items="[
                { label: t.standard, value: BoardLayoutType.STANDARD },
                { label: t.compact, value: BoardLayoutType.COMPACT },
                { label: t.portrait, value: BoardLayoutType.PORTRAIT },
              ]"
              @change="
                (value: string) => {
                  boardLayoutType = value as BoardLayoutType;
                }
              "
            />
          </div>
          <!-- 駒画像 -->
          <div class="form-item">
            <div class="form-item-label-wide">{{ t.piece }}</div>
            <HorizontalSelector
              class="selector"
              :value="pieceImage"
              :items="[
                { label: t.singleKanjiPiece, value: PieceImage.HITOMOJI },
                {
                  label: t.singleKanjiGothicPiece,
                  value: PieceImage.HITOMOJI_GOTHIC,
                },
                {
                  label: t.singleKanjiDarkPiece,
                  value: PieceImage.HITOMOJI_DARK,
                },
                {
                  label: t.singleKanjiGothicDarkPiece,
                  value: PieceImage.HITOMOJI_GOTHIC_DARK,
                },
                { label: t.customImage, value: PieceImage.CUSTOM_IMAGE },
              ]"
              @change="
                (value: string) => {
                  pieceImage = value as PieceImage;
                }
              "
            />
            <div
              v-show="pieceImage === PieceImage.CUSTOM_IMAGE"
              ref="pieceImageSelector"
              class="form-item"
            >
              <div class="form-item-label-wide"></div>
              <ImageSelector
                class="image-selector"
                :default-url="appSettings.pieceImageFileURL"
                @select="(url: string) => (pieceImageFileURL = url)"
              />
            </div>
            <div v-show="pieceImage === PieceImage.CUSTOM_IMAGE" class="form-item">
              <div class="form-item-label-wide"></div>
              <ToggleButton
                :label="t.imageHasMarginsRemoveForLargerDisplay"
                :value="deletePieceImageMargin"
                @change="(checked: boolean) => (deletePieceImageMargin = checked)"
              />
            </div>
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
                { label: t.resin, value: BoardImageType.RESIN },
                { label: t.resin + '2', value: BoardImageType.RESIN2 },
                { label: t.resin + '3', value: BoardImageType.RESIN3 },
                { label: t.green, value: BoardImageType.GREEN },
                {
                  label: t.cherryBlossom,
                  value: BoardImageType.CHERRY_BLOSSOM,
                },
                { label: t.autumn, value: BoardImageType.AUTUMN },
                { label: t.snow, value: BoardImageType.SNOW },
                { label: t.darkGreen, value: BoardImageType.DARK_GREEN },
                { label: t.dark, value: BoardImageType.DARK },
                { label: t.customImage, value: BoardImageType.CUSTOM_IMAGE },
              ]"
              @change="
                (value: string) => {
                  boardImage = value as BoardImageType;
                }
              "
            />
          </div>
          <div
            v-show="boardImage === BoardImageType.CUSTOM_IMAGE"
            ref="boardImageSelector"
            class="form-item"
          >
            <div class="form-item-label-wide"></div>
            <ImageSelector
              class="image-selector"
              :default-url="appSettings.boardImageFileURL"
              @select="(url: string) => (boardImageFileURL = url)"
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
                { label: t.green, value: PieceStandImageType.GREEN },
                {
                  label: t.cherryBlossom,
                  value: PieceStandImageType.CHERRY_BLOSSOM,
                },
                { label: t.autumn, value: PieceStandImageType.AUTUMN },
                { label: t.snow, value: PieceStandImageType.SNOW },
                { label: t.darkGreen, value: PieceStandImageType.DARK_GREEN },
                { label: t.dark, value: PieceStandImageType.DARK },
                {
                  label: t.customImage,
                  value: PieceStandImageType.CUSTOM_IMAGE,
                },
              ]"
              @change="
                (value: string) => {
                  pieceStandImage = value as PieceStandImageType;
                }
              "
            />
          </div>
          <div
            v-show="pieceStandImage === PieceStandImageType.CUSTOM_IMAGE"
            ref="pieceStandImageSelector"
            class="form-item"
          >
            <div class="form-item-label-wide"></div>
            <ImageSelector
              class="image-selector"
              :default-url="appSettings.pieceStandImageFileURL"
              @select="(url: string) => (pieceStandImageFileURL = url)"
            />
          </div>
          <!-- 透過表示 -->
          <div class="form-item">
            <div class="form-item-label-wide">{{ t.transparent }}</div>
            <ToggleButton
              :value="enableTransparent"
              @change="(checked: boolean) => (enableTransparent = checked)"
            />
          </div>
          <!-- 盤の不透明度 -->
          <div class="form-item">
            <div class="form-item-label-wide">{{ t.boardOpacity }}</div>
            <input
              ref="boardOpacity"
              :value="appSettings.boardOpacity * 100"
              :readonly="!enableTransparent"
              type="number"
              max="100"
              min="0"
            />
            <div class="form-item-small-label">%</div>
          </div>
          <!-- 駒台の不透明度 -->
          <div class="form-item">
            <div class="form-item-label-wide">{{ t.pieceStandOpacity }}</div>
            <input
              ref="pieceStandOpacity"
              :value="appSettings.pieceStandOpacity * 100"
              :readonly="!enableTransparent"
              type="number"
              max="100"
              min="0"
            />
            <div class="form-item-small-label">%</div>
          </div>
          <!-- 棋譜の不透明度 -->
          <div class="form-item">
            <div class="form-item-label-wide">{{ t.recordOpacity }}</div>
            <input
              ref="recordOpacity"
              :value="appSettings.recordOpacity * 100"
              :readonly="!enableTransparent"
              type="number"
              max="100"
              min="0"
            />
            <div class="form-item-small-label">%</div>
          </div>
          <!-- 段・筋の表示 -->
          <div class="form-item">
            <div class="form-item-label-wide">
              {{ t.showFileAndRank }}
            </div>
            <ToggleButton
              :value="displayBoardLabels"
              @change="(checked: boolean) => (displayBoardLabels = checked)"
            />
          </div>
          <!-- 左コントロールの表示 -->
          <div v-show="isNative()" class="form-item">
            <div class="form-item-label-wide">
              {{ t.showLeftControls }}
            </div>
            <ToggleButton
              :value="displayLeftSideControls"
              @change="(checked: boolean) => (displayLeftSideControls = checked)"
            />
          </div>
          <!-- 右コントロールの表示 -->
          <div v-show="isNative()" class="form-item">
            <div class="form-item-label-wide">
              {{ t.showRightControls }}
            </div>
            <ToggleButton
              :value="displayRightSideControls"
              @change="(checked: boolean) => (displayRightSideControls = checked)"
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
                (value: string) => {
                  tabPaneType = value as TabPaneType;
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
            <div class="form-item-label-wide">{{ t.pieceSoundVolume }}</div>
            <input
              ref="pieceVolume"
              :value="appSettings.pieceVolume"
              type="number"
              max="100"
              min="0"
            />
            <div class="form-item-small-label">%</div>
          </div>
          <!-- 時計音の大きさ -->
          <div class="form-item">
            <div class="form-item-label-wide">{{ t.clockSoundVolume }}</div>
            <input
              ref="clockVolume"
              :value="appSettings.clockVolume"
              type="number"
              max="100"
              min="0"
            />
            <div class="form-item-small-label">%</div>
          </div>
          <!-- 時計音の高さ -->
          <div class="form-item">
            <div class="form-item-label-wide">{{ t.clockSoundPitch }}</div>
            <input
              ref="clockPitch"
              :value="appSettings.clockPitch"
              type="number"
              max="880"
              min="220"
            />
            <div class="form-item-small-label">Hz ({{ t.between(220, 880) }})</div>
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
                (value: string) => {
                  clockSoundTarget = value as ClockSoundTarget;
                }
              "
            />
          </div>
        </div>
        <hr />
        <!-- ファイル -->
        <div class="section">
          <div class="section-title">{{ t.file }}</div>
          <!-- デフォルトの保存形式 -->
          <div class="form-item">
            <div class="form-item-label-wide">
              {{ t.defaultRecordFileFormat }}
            </div>
            <HorizontalSelector
              class="selector"
              :value="defaultRecordFileFormat"
              :items="[
                { label: '.kif (Shift_JIS)', value: RecordFileFormat.KIF },
                { label: '.kifu (UTF-8)', value: RecordFileFormat.KIFU },
                { label: '.ki2 (Shift_JIS)', value: RecordFileFormat.KI2 },
                { label: '.ki2u (UTF-8)', value: RecordFileFormat.KI2U },
                { label: '.csa', value: RecordFileFormat.CSA },
                { label: '.jkf', value: RecordFileFormat.JKF },
              ]"
              @change="
                (value: string) => {
                  defaultRecordFileFormat = value as RecordFileFormat;
                }
              "
            />
          </div>
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
                (value: string) => {
                  textDecodingRule = value as TextDecodingRule;
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
                (value: string) => {
                  returnCode = value;
                }
              "
            />
          </div>
          <!-- 自動保存先 -->
          <div class="form-item row">
            <div class="form-item-label-wide">
              {{ t.autoSavingDirectory }}
            </div>
            <input
              ref="autoSaveDirectory"
              class="file-path"
              :value="appSettings.autoSaveDirectory"
              type="text"
            />
            <button class="thin" @click="selectAutoSaveDirectory">
              {{ t.select }}
            </button>
            <button class="thin auxiliary" @click="onOpenAutoSaveDirectory">
              <Icon :icon="IconType.OPEN_FOLDER" />
            </button>
          </div>
          <!-- 棋譜ファイル名-->
          <div class="form-item row">
            <div class="form-item-label-wide">
              {{ t.recordFileName }}
            </div>
            <input
              ref="recordFileNameTemplate"
              class="file-path"
              :value="appSettings.recordFileNameTemplate"
              type="text"
            />
            <button class="thin auxiliary" @click="howToWriteFileNameTemplate">
              <Icon :icon="IconType.HELP" />
            </button>
          </div>
          <!-- CSA V3 で出力 -->
          <div class="form-item">
            <div class="form-item-label-wide">CSA V3 で出力</div>
            <ToggleButton :value="useCSAV3" @change="(checked: boolean) => (useCSAV3 = checked)" />
          </div>
          <!-- USI の局面表記 -->
          <div class="form-item row">
            <div class="form-item-label-wide">{{ t.positionOfUSIOutput }}</div>
            <HorizontalSelector
              class="selector"
              :value="String(enableUSIFileStartpos)"
              :items="[
                { label: t.onlySFEN, value: 'false' },
                { label: 'startpos / SFEN', value: 'true' },
              ]"
              @change="
                (value: string) => {
                  enableUSIFileStartpos = value === 'true';
                }
              "
            />
          </div>
          <!-- USI の指し手表記 -->
          <div class="form-item row">
            <div class="form-item-label-wide">{{ t.movesOfUSIOutput }}</div>
            <HorizontalSelector
              class="selector"
              :value="String(enableUSIFileResign)"
              :items="[
                { label: t.onlySFEN, value: 'false' },
                { label: 'SFEN / resign', value: 'true' },
              ]"
              @change="
                (value: string) => {
                  enableUSIFileResign = value === 'true';
                }
              "
            />
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
              @change="(checked: boolean) => (translateEngineOptionName = checked)"
            />
            <div class="form-item-small-label">({{ t.functionalOnJapaneseOnly }})</div>
          </div>
          <!-- 最大起動待ち時間 -->
          <div class="form-item">
            <div class="form-item-label-wide">
              {{ t.maxStartupTime }}
            </div>
            <input
              ref="engineTimeoutSeconds"
              :value="appSettings.engineTimeoutSeconds"
              type="number"
              max="300"
              min="1"
            />
            <div class="form-item-small-label">{{ t.secondsSuffix }} ({{ t.between(1, 300) }})</div>
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
                (value: string) => {
                  evaluationViewFrom = value as EvaluationViewFrom;
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
              :value="appSettings.coefficientInSigmoid"
              type="number"
              max="10000"
              min="1"
            />
            <div class="form-item-small-label">
              ({{ t.recommended }}: {{ t.between(600, 1500) }})
            </div>
          </div>
          <!-- 緩手の閾値 -->
          <div class="form-item">
            <div class="form-item-label-wide">{{ t.inaccuracyThreshold }}</div>
            <input
              ref="badMoveLevelThreshold1"
              :value="appSettings.badMoveLevelThreshold1"
              type="number"
              max="100"
              min="0"
            />
            <div class="form-item-small-label">%</div>
          </div>
          <!-- 疑問手の閾値 -->
          <div class="form-item">
            <div class="form-item-label-wide">{{ t.dubiousThreshold }}</div>
            <input
              ref="badMoveLevelThreshold2"
              :value="appSettings.badMoveLevelThreshold2"
              type="number"
              max="100"
              min="0"
            />
            <div class="form-item-small-label">%</div>
          </div>
          <!-- 悪手の閾値 -->
          <div class="form-item">
            <div class="form-item-label-wide">{{ t.mistakeThreshold }}</div>
            <input
              ref="badMoveLevelThreshold3"
              :value="appSettings.badMoveLevelThreshold3"
              type="number"
              max="100"
              min="0"
            />
            <div class="form-item-small-label">%</div>
          </div>
          <!-- 大悪手の閾値 -->
          <div class="form-item">
            <div class="form-item-label-wide">{{ t.blunderThreshold }}</div>
            <input
              ref="badMoveLevelThreshold4"
              :value="appSettings.badMoveLevelThreshold4"
              type="number"
              max="100"
              min="0"
            />
            <div class="form-item-small-label">%</div>
          </div>
        </div>
        <hr />
        <!-- アプリバージョン -->
        <div class="section">
          <div class="section-title">{{ t.appVersion }}</div>
          <div class="form-item">
            <div class="form-item-label-wide">{{ t.installed }}</div>
            {{ appInfo.appVersion }}
          </div>
          <div class="form-item">
            <div class="form-item-label-wide">{{ t.latest }}</div>
            {{ versionStatus.knownReleases?.latest.version ?? t.unknown }}
          </div>
          <div class="form-item">
            <div class="form-item-label-wide">{{ t.stable }}</div>
            {{ versionStatus.knownReleases?.stable.version ?? t.unknown }}
          </div>
          <div class="form-item">
            <div class="form-item-label-wide">{{ t.notification }}</div>
            <button class="thin" @click="sendTestNotification">{{ t.notificationTest }}</button>
          </div>
          <div class="form-group warning">
            <div class="note">
              {{ t.whenNewVersionIsAvailableItWillBeNotified }}
              {{ t.pleaseCheckMessageThisIsTestNotificationByAboveButton }}
              {{ t.ifNotWorkYouShouldAllowNotificationOnOSSetting }}
            </div>
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
              @change="(checked: boolean) => (enableAppLog = checked)"
            />
          </div>
          <!-- USI通信ログを出力 -->
          <div class="form-item">
            <div class="form-item-label-wide">{{ t.enableUSILog }}</div>
            <ToggleButton
              :value="enableUSILog"
              @change="(checked: boolean) => (enableUSILog = checked)"
            />
          </div>
          <!-- CSA通信ログを出力 -->
          <div class="form-item">
            <div class="form-item-label-wide">{{ t.enableCSALog }}</div>
            <ToggleButton
              :value="enableCSALog"
              @change="(checked: boolean) => (enableCSALog = checked)"
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
                (value: string) => {
                  logLevel = value as LogLevel;
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
  AppSettingsUpdate,
  Thema,
  BackgroundImageType,
  TextDecodingRule,
  ClockSoundTarget,
  AppSettings,
  KingPieceType,
} from "@/common/settings/app";
import ImageSelector from "@/renderer/view/dialog/ImageSelector.vue";
import ToggleButton from "@/renderer/view/primitive/ToggleButton.vue";
import { useStore } from "@/renderer/store";
import { ref, onMounted, onBeforeUnmount } from "vue";
import { readInputAsNumber } from "@/renderer/helpers/form.js";
import { showModalDialog } from "@/renderer/helpers/dialog.js";
import api, { appInfo, isNative } from "@/renderer/ipc/api";
import { installHotKeyForDialog, uninstallHotKeyForDialog } from "@/renderer/devices/hotkey";
import { useAppSettings } from "@/renderer/store/settings";
import { LogLevel } from "@/common/log";
import HorizontalSelector from "@/renderer/view/primitive/HorizontalSelector.vue";
import { RecordFileFormat } from "@/common/file/record";
import { IconType } from "@/renderer/assets/icons";
import Icon from "@/renderer/view/primitive/Icon.vue";
import { VersionStatus } from "@/background/version/types";
import { fileNameTemplateWikiPageURL } from "@/common/links/github";
import { useErrorStore } from "@/renderer/store/error";
import { useBusyState } from "@/renderer/store/busy";
import { BoardLayoutType } from "@/common/settings/layout";

enum PieceImage {
  HITOMOJI = "hitomoji",
  HITOMOJI_DARK = "hitomojiDark",
  HITOMOJI_GOTHIC = "hitomojiGothic",
  HITOMOJI_GOTHIC_DARK = "hitomojiGothicDark",
  CUSTOM_IMAGE = "custom-image",
}

function toPieceImage(settings: AppSettings): PieceImage {
  switch (settings.pieceImage) {
    case PieceImageType.HITOMOJI:
      return PieceImage.HITOMOJI;
    case PieceImageType.HITOMOJI_DARK:
      return PieceImage.HITOMOJI_DARK;
    case PieceImageType.HITOMOJI_GOTHIC:
      return PieceImage.HITOMOJI_GOTHIC;
    case PieceImageType.HITOMOJI_GOTHIC_DARK:
      return PieceImage.HITOMOJI_GOTHIC_DARK;
    case PieceImageType.CUSTOM_IMAGE:
      return PieceImage.CUSTOM_IMAGE;
  }
}

function pieceImageToSettings(pieceImage: PieceImage) {
  switch (pieceImage) {
    case PieceImage.HITOMOJI:
      return {
        pieceImage: PieceImageType.HITOMOJI,
        kingPieceType: KingPieceType.GYOKU_AND_OSHO,
      };
    case PieceImage.HITOMOJI_DARK:
      return {
        pieceImage: PieceImageType.HITOMOJI_DARK,
        kingPieceType: KingPieceType.GYOKU_AND_OSHO,
      };
    case PieceImage.HITOMOJI_GOTHIC:
      return {
        pieceImage: PieceImageType.HITOMOJI_GOTHIC,
        kingPieceType: KingPieceType.GYOKU_AND_OSHO,
      };
    case PieceImage.HITOMOJI_GOTHIC_DARK:
      return {
        pieceImage: PieceImageType.HITOMOJI_GOTHIC_DARK,
        kingPieceType: KingPieceType.GYOKU_AND_OSHO,
      };
    case PieceImage.CUSTOM_IMAGE:
      return {
        pieceImage: PieceImageType.CUSTOM_IMAGE,
        kingPieceType: KingPieceType.GYOKU_AND_OSHO,
      };
  }
}

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
const busyState = useBusyState();
const appSettings = useAppSettings();
const dialog = ref();
const language = ref(appSettings.language);
const thema = ref(appSettings.thema);
const backgroundImageType = ref(appSettings.backgroundImageType);
const backgroundImageSelector = ref();
const boardLayoutType = ref(appSettings.boardLayoutType);
const pieceImage = ref(toPieceImage(appSettings));
const deletePieceImageMargin = ref(appSettings.deletePieceImageMargin);
const boardImage = ref(appSettings.boardImage);
const boardImageSelector = ref();
const pieceStandImage = ref(appSettings.pieceStandImage);
const pieceStandImageSelector = ref();
const enableTransparent = ref(appSettings.enableTransparent);
const boardOpacity = ref();
const pieceStandOpacity = ref();
const recordOpacity = ref();
const displayBoardLabels = ref(appSettings.boardLabelType != BoardLabelType.NONE);
const displayLeftSideControls = ref(appSettings.leftSideControlType != LeftSideControlType.NONE);
const displayRightSideControls = ref(appSettings.rightSideControlType != RightSideControlType.NONE);
const tabPaneType = ref(appSettings.tabPaneType);
const pieceVolume = ref();
const clockVolume = ref();
const clockPitch = ref();
const clockSoundTarget = ref(appSettings.clockSoundTarget);
const defaultRecordFileFormat = ref(appSettings.defaultRecordFileFormat);
const textDecodingRule = ref(appSettings.textDecodingRule);
const returnCode = ref(returnCodeToName[appSettings.returnCode]);
const autoSaveDirectory = ref();
const recordFileNameTemplate = ref();
const useCSAV3 = ref(appSettings.useCSAV3);
const enableUSIFileStartpos = ref(appSettings.enableUSIFileStartpos);
const enableUSIFileResign = ref(appSettings.enableUSIFileResign);
const translateEngineOptionName = ref(appSettings.translateEngineOptionName);
const engineTimeoutSeconds = ref();
const evaluationViewFrom = ref(appSettings.evaluationViewFrom);
const coefficientInSigmoid = ref();
const badMoveLevelThreshold1 = ref();
const badMoveLevelThreshold2 = ref();
const badMoveLevelThreshold3 = ref();
const badMoveLevelThreshold4 = ref();
const enableAppLog = ref(appSettings.enableAppLog);
const enableUSILog = ref(appSettings.enableUSILog);
const enableCSALog = ref(appSettings.enableCSALog);
const logLevel = ref(appSettings.logLevel);
const backgroundImageFileURL = ref(appSettings.backgroundImageFileURL);
const croppedPieceImageBaseURL = ref(appSettings.croppedPieceImageBaseURL);
const pieceImageFileURL = ref(appSettings.pieceImageFileURL);
const boardImageFileURL = ref(appSettings.boardImageFileURL);
const pieceStandImageFileURL = ref(appSettings.pieceStandImageFileURL);
const versionStatus = ref({} as VersionStatus);

onMounted(() => {
  showModalDialog(dialog.value, cancel);
  installHotKeyForDialog(dialog.value);
  api.getVersionStatus().then((status) => {
    versionStatus.value = status;
  });
});

onBeforeUnmount(() => {
  uninstallHotKeyForDialog(dialog.value);
});

const saveAndClose = async () => {
  busyState.retain();
  try {
    const update: AppSettingsUpdate = {
      language: language.value,
      thema: thema.value,
      backgroundImageType: backgroundImageType.value,
      ...pieceImageToSettings(pieceImage.value),
      boardLayoutType: boardLayoutType.value,
      boardImage: boardImage.value,
      pieceImageFileURL: pieceImageFileURL.value,
      croppedPieceImageBaseURL: croppedPieceImageBaseURL.value,
      deletePieceImageMargin: deletePieceImageMargin.value,
      pieceStandImage: pieceStandImage.value,
      enableTransparent: enableTransparent.value,
      boardOpacity: readInputAsNumber(boardOpacity.value) / 100,
      pieceStandOpacity: readInputAsNumber(pieceStandOpacity.value) / 100,
      recordOpacity: readInputAsNumber(recordOpacity.value) / 100,
      boardLabelType: displayBoardLabels.value ? BoardLabelType.STANDARD : BoardLabelType.NONE,
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
      defaultRecordFileFormat: defaultRecordFileFormat.value,
      textDecodingRule: textDecodingRule.value,
      returnCode: nameToReturnCode[returnCode.value],
      autoSaveDirectory: autoSaveDirectory.value.value,
      recordFileNameTemplate: recordFileNameTemplate.value.value,
      useCSAV3: useCSAV3.value,
      enableUSIFileStartpos: enableUSIFileStartpos.value,
      enableUSIFileResign: enableUSIFileResign.value,
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
    if (update.pieceImage === PieceImageType.CUSTOM_IMAGE && pieceImageFileURL.value) {
      update.croppedPieceImageBaseURL = await api.cropPieceImage(
        pieceImageFileURL.value,
        deletePieceImageMargin.value,
      );
      update.pieceImageFileURL = pieceImageFileURL.value;
      update.deletePieceImageMargin = deletePieceImageMargin.value;
    }
    if (update.boardImage === BoardImageType.CUSTOM_IMAGE) {
      update.boardImageFileURL = boardImageFileURL.value;
    }
    if (update.pieceStandImage === PieceStandImageType.CUSTOM_IMAGE) {
      update.pieceStandImageFileURL = pieceStandImageFileURL.value;
    }

    await useAppSettings().updateAppSettings(update);
    store.closeAppSettingsDialog();
  } catch (e) {
    useErrorStore().add(e);
  } finally {
    busyState.release();
  }
};

const selectAutoSaveDirectory = async () => {
  busyState.retain();
  try {
    const path = await api.showSelectDirectoryDialog(autoSaveDirectory.value.value);
    if (path) {
      autoSaveDirectory.value.value = path;
    }
  } catch (e) {
    useErrorStore().add(e);
  } finally {
    busyState.release();
  }
};

const onOpenAutoSaveDirectory = () => {
  api.openExplorer(autoSaveDirectory.value.value);
};

const howToWriteFileNameTemplate = () => {
  api.openWebBrowser(fileNameTemplateWikiPageURL);
};

const sendTestNotification = () => {
  try {
    api.sendTestNotification();
  } catch (e) {
    useErrorStore().add(e);
  }
};

const cancel = () => {
  store.closeAppSettingsDialog();
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
button.auxiliary {
  margin-left: 5px;
  padding-left: 8px;
  padding-right: 8px;
}
</style>
