import { Language, t } from "@/common/i18n";
import { LogLevel } from "@/common/log";

export enum Thema {
  STANDARD = "standard",
  CHERRY_BLOSSOM = "cherry-blossom",
  AUTUMN = "autumn",
  SNOW = "snow",
  DARK = "dark",
}

export enum BackgroundImageType {
  NONE = "none",
  COVER = "cover",
  CONTAIN = "contain",
  TILE = "tile",
}

export enum PieceImageType {
  HITOMOJI = "hitomoji",
  HITOMOJI_DARK = "hitomojiDark",
  HITOMOJI_GOTHIC = "hitomojiGothic",
  HITOMOJI_GOTHIC_DARK = "hitomojiGothicDark",
  CUSTOM_IMAGE = "custom-image",
}

export enum BoardImageType {
  LIGHT = "light",
  WARM = "warm",
  RESIN = "resin",
  RESIN2 = "resin2",
  RESIN3 = "resin3",
  DARK = "dark",
  GREEN = "green",
  CHERRY_BLOSSOM = "cherry-blossom",
  CUSTOM_IMAGE = "custom-image",
}

export enum PieceStandImageType {
  STANDARD = "standard",
  DARK = "dark",
  GREEN = "green",
  CHERRY_BLOSSOM = "cherry-blossom",
  CUSTOM_IMAGE = "custom-image",
}

export enum BoardLabelType {
  NONE = "none",
  STANDARD = "standard",
}

export enum LeftSideControlType {
  NONE = "none",
  STANDARD = "standard",
}

export enum RightSideControlType {
  NONE = "none",
  STANDARD = "standard",
}

export enum TabPaneType {
  SINGLE = "single",
  DOUBLE = "double",
}

export enum Tab {
  RECORD_INFO = "recordInfo",
  COMMENT = "comment",
  SEARCH = "search",
  PV = "pv",
  CHART = "chart",
  PERCENTAGE_CHART = "percentageChart",
  INVISIBLE = "invisible", // Deprecated
}

export enum TextDecodingRule {
  STRICT = "strict",
  AUTO_DETECT = "autoDetect",
}

export enum EvaluationViewFrom {
  BLACK = "black",
  EACH = "each",
}

export enum ClockSoundTarget {
  ALL = "all",
  ONLY_USER = "onlyUser",
}

export enum PositionImageStyle {
  BOOK = "book",
  GAME = "game",
}

export type AppSetting = {
  language: Language;
  thema: Thema;
  backgroundImageType: BackgroundImageType;
  backgroundImageFileURL?: string;
  pieceImage: PieceImageType;
  boardImage: BoardImageType;
  pieceImageDirURL?: string;
  pieceImageFileURL?: string;
  boardImageFileURL?: string;
  pieceStandImage: PieceStandImageType;
  pieceStandImageFileURL?: string;
  boardLabelType: BoardLabelType;
  leftSideControlType: LeftSideControlType;
  rightSideControlType: RightSideControlType;
  pieceVolume: number;
  clockVolume: number;
  clockPitch: number;
  clockSoundTarget: ClockSoundTarget;
  boardFlipping: boolean;
  tabPaneType: TabPaneType;
  tab: Tab;
  tab2: Tab;
  topPaneHeightPercentage: number;
  topPanePreviousHeightPercentage: number;
  bottomLeftPaneWidthPercentage: number;
  textDecodingRule: TextDecodingRule;
  returnCode: string;
  autoSaveDirectory: string;
  translateEngineOptionName: boolean;
  engineTimeoutSeconds: number;
  evaluationViewFrom: EvaluationViewFrom;
  coefficientInSigmoid: number;
  badMoveLevelThreshold1: number;
  badMoveLevelThreshold2: number;
  badMoveLevelThreshold3: number;
  badMoveLevelThreshold4: number;
  showElapsedTimeInRecordView: boolean;
  showCommentInRecordView: boolean;
  enableAppLog: boolean;
  enableUSILog: boolean;
  enableCSALog: boolean;
  logLevel: LogLevel;
  positionImageStyle: PositionImageStyle;
  positionImageSize: number;
  positionImageHeader: string;
  lastRecordFilePath: string;
  lastUSIEngineFilePath: string;
  lastImageExportFilePath: string;
  lastOtherFilePath: string;
  emptyRecordInfoVisibility: boolean;
};

export type AppSettingUpdate = {
  language?: Language;
  thema?: Thema;
  backgroundImageType?: BackgroundImageType;
  backgroundImageFileURL?: string;
  pieceImage?: PieceImageType;
  pieceImageDirURL?: string;
  pieceImageFileURL?: string;
  boardImage?: BoardImageType;
  boardImageFileURL?: string;
  pieceStandImage?: PieceStandImageType;
  pieceStandImageFileURL?: string;
  boardLabelType?: BoardLabelType;
  leftSideControlType?: LeftSideControlType;
  rightSideControlType?: RightSideControlType;
  pieceVolume?: number;
  clockVolume?: number;
  clockPitch?: number;
  clockSoundTarget?: ClockSoundTarget;
  boardFlipping?: boolean;
  tabPaneType?: TabPaneType;
  tab?: Tab;
  tab2?: Tab;
  topPaneHeightPercentage?: number;
  topPanePreviousHeightPercentage?: number;
  bottomLeftPaneWidthPercentage?: number;
  textDecodingRule?: TextDecodingRule;
  returnCode?: string;
  autoSaveDirectory?: string;
  translateEngineOptionName?: boolean;
  engineTimeoutSeconds?: number;
  evaluationViewFrom?: EvaluationViewFrom;
  coefficientInSigmoid?: number;
  badMoveLevelThreshold1?: number;
  badMoveLevelThreshold2?: number;
  badMoveLevelThreshold3?: number;
  badMoveLevelThreshold4?: number;
  showElapsedTimeInRecordView?: boolean;
  showCommentInRecordView?: boolean;
  enableAppLog?: boolean;
  enableUSILog?: boolean;
  enableCSALog?: boolean;
  logLevel?: LogLevel;
  positionImageStyle?: PositionImageStyle;
  positionImageSize?: number;
  positionImageHeader?: string;
  lastRecordFilePath?: string;
  lastUSIEngineFilePath?: string;
  lastImageExportFilePath?: string;
  lastOtherFilePath?: string;
  emptyRecordInfoVisibility?: boolean;
};

export function buildUpdatedAppSetting(
  org: AppSetting,
  update: AppSettingUpdate
): AppSetting | Error {
  const updated = {
    ...org,
    ...update,
  };

  // カラム構成に合わせて選択可能なタブを制限する。
  switch (updated.tabPaneType) {
    case TabPaneType.DOUBLE:
      switch (updated.tab) {
        case Tab.COMMENT:
          updated.tab = Tab.RECORD_INFO;
          break;
        case Tab.CHART:
        case Tab.PERCENTAGE_CHART:
          updated.tab = Tab.PV;
          break;
      }
      break;
  }

  // 以前のサイズ比率を記憶する。
  if (
    org.topPaneHeightPercentage !== 0 &&
    org.topPaneHeightPercentage !== 100
  ) {
    updated.topPanePreviousHeightPercentage = org.topPaneHeightPercentage;
  }

  const error = validateAppSetting(updated);
  return error || updated;
}

export function defaultAppSetting(opt?: {
  returnCode?: string;
  autoSaveDirectory?: string;
}): AppSetting {
  return {
    language: Language.JA,
    thema: Thema.STANDARD,
    backgroundImageType: BackgroundImageType.NONE,
    pieceImage: PieceImageType.HITOMOJI,
    boardImage: BoardImageType.RESIN2,
    pieceStandImage: PieceStandImageType.STANDARD,
    boardLabelType: BoardLabelType.STANDARD,
    leftSideControlType: LeftSideControlType.STANDARD,
    rightSideControlType: RightSideControlType.STANDARD,
    pieceVolume: 30,
    clockVolume: 30,
    clockPitch: 500,
    clockSoundTarget: ClockSoundTarget.ONLY_USER,
    boardFlipping: false,
    tabPaneType: TabPaneType.DOUBLE,
    tab: Tab.RECORD_INFO,
    tab2: Tab.COMMENT,
    topPaneHeightPercentage: 60,
    topPanePreviousHeightPercentage: 60,
    bottomLeftPaneWidthPercentage: 60,
    textDecodingRule: TextDecodingRule.AUTO_DETECT,
    returnCode: opt?.returnCode || "\r\n",
    autoSaveDirectory: opt?.autoSaveDirectory || "",
    translateEngineOptionName: true,
    engineTimeoutSeconds: 10,
    evaluationViewFrom: EvaluationViewFrom.EACH,
    coefficientInSigmoid: 600,
    badMoveLevelThreshold1: 5,
    badMoveLevelThreshold2: 10,
    badMoveLevelThreshold3: 20,
    badMoveLevelThreshold4: 50,
    showElapsedTimeInRecordView: true,
    showCommentInRecordView: true,
    enableAppLog: false,
    enableUSILog: false,
    enableCSALog: false,
    logLevel: LogLevel.INFO,
    positionImageStyle: PositionImageStyle.BOOK,
    positionImageSize: 500,
    positionImageHeader: "",
    lastRecordFilePath: "",
    lastUSIEngineFilePath: "",
    lastImageExportFilePath: "",
    lastOtherFilePath: "",
    emptyRecordInfoVisibility: true,
  };
}

export function normalizeAppSetting(
  setting: AppSetting,
  opt?: {
    returnCode?: string;
    autoSaveDirectory?: string;
  }
): AppSetting {
  const result = {
    ...defaultAppSetting(opt),
    ...setting,
  };
  if (
    result.autoSaveDirectory.endsWith("\\") ||
    result.autoSaveDirectory.endsWith("/")
  ) {
    result.autoSaveDirectory = result.autoSaveDirectory.slice(0, -1);
  }
  // 旧バージョンでは盤画像に合わせて自動で駒台の色が選ばれていた。
  if (!setting.pieceStandImage) {
    switch (setting.boardImage) {
      default:
        result.pieceStandImage = PieceStandImageType.STANDARD;
        break;
      case BoardImageType.DARK:
        result.pieceStandImage = PieceStandImageType.DARK;
        break;
      case BoardImageType.GREEN:
        result.pieceStandImage = PieceStandImageType.GREEN;
        break;
      case BoardImageType.CHERRY_BLOSSOM:
        result.pieceStandImage = PieceStandImageType.CHERRY_BLOSSOM;
        break;
    }
  }
  // 旧バージョンではタブの最小化を Tab.INDISIBLE で表していたが廃止した。
  if (result.tab === Tab.INVISIBLE) {
    result.tab = Tab.RECORD_INFO;
  }
  return result;
}

export function validateAppSetting(setting: AppSetting): Error | undefined {
  if (
    setting.backgroundImageType !== BackgroundImageType.NONE &&
    !setting.backgroundImageFileURL
  ) {
    return new Error(t.backgroundImageFileNotSelected);
  }
  if (
    setting.pieceImage === PieceImageType.CUSTOM_IMAGE &&
    !setting.pieceImageDirURL
  ) {
    return new Error(t.pieceImageDirNotSelected);
  }
  if (
    setting.boardImage === BoardImageType.CUSTOM_IMAGE &&
    !setting.boardImageFileURL
  ) {
    return new Error(t.boardImageFileNotSelected);
  }
  if (
    setting.pieceStandImage === PieceStandImageType.CUSTOM_IMAGE &&
    !setting.pieceStandImageFileURL
  ) {
    return new Error(t.pieceStandImageFileNotSelected);
  }
  if (setting.pieceVolume < 0 || setting.pieceVolume > 100) {
    return new Error(t.pieceVolumeMustBe0To100Percent);
  }
  if (setting.clockVolume < 0 || setting.clockVolume > 100) {
    return new Error(t.clockVolumeMustBe0To100Percent);
  }
  if (setting.clockPitch < 220 || setting.clockPitch > 880) {
    return new Error(t.clockPitchMustBe220To880Hz);
  }
  if (setting.engineTimeoutSeconds < 1 || setting.engineTimeoutSeconds > 300) {
    return new Error(t.engineTimeoutMustBe1To300Seconds);
  }
  if (setting.coefficientInSigmoid <= 0) {
    return new Error(t.coefficientInSigmoidMustBeGreaterThan0);
  }
  if (
    setting.badMoveLevelThreshold1 < 1 ||
    setting.badMoveLevelThreshold1 > 100
  ) {
    return new Error(t.inaccuracyThresholdMustBe1To100Percent);
  }
  if (
    setting.badMoveLevelThreshold2 < 1 ||
    setting.badMoveLevelThreshold2 > 100
  ) {
    return new Error(t.dubiousThresholdMustBe1To100Percent);
  }
  if (
    setting.badMoveLevelThreshold3 < 1 ||
    setting.badMoveLevelThreshold3 > 100
  ) {
    return new Error(t.mistakeThresholdMustBe1To100Percent);
  }
  if (
    setting.badMoveLevelThreshold4 < 1 ||
    setting.badMoveLevelThreshold4 > 100
  ) {
    return new Error(t.blunderThresholdMustBe1To100Percent);
  }
  if (setting.badMoveLevelThreshold1 >= setting.badMoveLevelThreshold2) {
    return new Error(t.inaccuracyThresholdMustBeLessThanDubiousThreshold);
  }
  if (setting.badMoveLevelThreshold2 >= setting.badMoveLevelThreshold3) {
    return new Error(t.dubiousThresholdMustBeLessThanMistakeThreshold);
  }
  if (setting.badMoveLevelThreshold3 >= setting.badMoveLevelThreshold4) {
    return new Error(t.mistakeThresholdMustBeLessThanBlunderThreshold);
  }
}
