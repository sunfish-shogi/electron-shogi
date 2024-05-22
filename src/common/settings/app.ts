import { Language, t } from "@/common/i18n";
import { LogLevel, LogType } from "@/common/log";
import { RecordFileFormat } from "@/common/file/record";
import { defaultRecordFileNameTemplate } from "@/renderer/helpers/path";

export enum Thema {
  STANDARD = "standard",
  CHERRY_BLOSSOM = "cherry-blossom",
  AUTUMN = "autumn",
  SNOW = "snow",
  DARK_GREEN = "dark-green",
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

export enum KingPieceType {
  GYOKU_AND_OSHO = "gyokuAndOsho",
  GYOKU_AND_GYOKU = "gyokuAndGyoku",
}

export enum BoardImageType {
  LIGHT = "light",
  WARM = "warm",
  RESIN = "resin",
  RESIN2 = "resin2",
  RESIN3 = "resin3",
  GREEN = "green",
  CHERRY_BLOSSOM = "cherry-blossom",
  AUTUMN = "autumn",
  SNOW = "snow",
  DARK_GREEN = "dark-green",
  DARK = "dark",
  CUSTOM_IMAGE = "custom-image",
}

export enum PieceStandImageType {
  STANDARD = "standard",
  GREEN = "green",
  CHERRY_BLOSSOM = "cherry-blossom",
  AUTUMN = "autumn",
  SNOW = "snow",
  DARK_GREEN = "dark-green",
  DARK = "dark",
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
  MONITOR = "monitor",
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

export enum PositionImageTypeface {
  GOTHIC = "gothic",
  MINCHO = "mincho",
}

export enum PositionImageHandLabelType {
  PLAYER_NAME = "playerName",
  SENTE_GOTE = "senteGote",
  MOCHIGOMA = "mochigoma",
  TSUME_SHOGI = "tsumeShogi",
  NONE = "none",
}

export enum PositionImageFontWeight {
  W400 = "400",
  W400X = "400+",
  W700X = "700+",
}

export type AppSetting = {
  language: Language;
  thema: Thema;
  backgroundImageType: BackgroundImageType;
  backgroundImageFileURL?: string;
  pieceImage: PieceImageType;
  kingPieceType: KingPieceType;
  pieceImageFileURL?: string;
  croppedPieceImageBaseURL?: string;
  croppedPieceImageQuery?: string; // キャッシュ回避用のクエリ
  deletePieceImageMargin: boolean;
  boardImage: BoardImageType;
  boardImageFileURL?: string;
  pieceStandImage: PieceStandImageType;
  pieceStandImageFileURL?: string;
  enableTransparent: boolean;
  boardOpacity: number;
  pieceStandOpacity: number;
  recordOpacity: number;
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
  defaultRecordFileFormat: RecordFileFormat;
  textDecodingRule: TextDecodingRule;
  returnCode: string;
  autoSaveDirectory: string;
  recordFileNameTemplate: string;
  useCSAV3: boolean;
  enableUSIFileStartpos: boolean;
  enableUSIFileResign: boolean;
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
  positionImageTypeface: PositionImageTypeface;
  positionImageHandLabelType: PositionImageHandLabelType;
  useBookmarkAsPositionImageHeader: boolean;
  positionImageHeader: string;
  positionImageCharacterY: number;
  positionImageFontScale: number;
  positionImageFontWeight: PositionImageFontWeight;
  lastRecordFilePath: string;
  lastUSIEngineFilePath: string;
  lastImageExportFilePath: string;
  lastOtherFilePath: string;
  emptyRecordInfoVisibility: boolean;
};

export function isLogEnabled(type: LogType, appSetting: AppSetting): boolean {
  switch (type) {
    case LogType.APP:
      return appSetting.enableAppLog;
    case LogType.USI:
      return appSetting.enableUSILog;
    case LogType.CSA:
      return appSetting.enableCSALog;
  }
}

export type AppSettingUpdate = {
  language?: Language;
  thema?: Thema;
  backgroundImageType?: BackgroundImageType;
  backgroundImageFileURL?: string;
  pieceImage?: PieceImageType;
  kingPieceType?: KingPieceType;
  pieceImageFileURL?: string;
  croppedPieceImageBaseURL?: string;
  croppedPieceImageQuery?: string; // キャッシュ回避用のクエリ
  deletePieceImageMargin?: boolean;
  boardImage?: BoardImageType;
  boardImageFileURL?: string;
  pieceStandImage?: PieceStandImageType;
  pieceStandImageFileURL?: string;
  enableTransparent?: boolean;
  boardOpacity?: number;
  pieceStandOpacity?: number;
  recordOpacity?: number;
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
  defaultRecordFileFormat?: RecordFileFormat;
  textDecodingRule?: TextDecodingRule;
  returnCode?: string;
  autoSaveDirectory?: string;
  recordFileNameTemplate?: string;
  useCSAV3?: boolean;
  enableUSIFileStartpos?: boolean;
  enableUSIFileResign?: boolean;
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
  positionImageTypeface?: PositionImageTypeface;
  positionImageHandLabelType?: PositionImageHandLabelType;
  useBookmarkAsPositionImageHeader?: boolean;
  positionImageHeader?: string;
  positionImageCharacterY?: number;
  positionImageFontScale?: number;
  positionImageFontWeight?: PositionImageFontWeight;
  lastRecordFilePath?: string;
  lastUSIEngineFilePath?: string;
  lastImageExportFilePath?: string;
  lastOtherFilePath?: string;
  emptyRecordInfoVisibility?: boolean;
};

export function buildUpdatedAppSetting(
  org: AppSetting,
  update: AppSettingUpdate,
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
  if (org.topPaneHeightPercentage !== 0 && org.topPaneHeightPercentage !== 100) {
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
    kingPieceType: KingPieceType.GYOKU_AND_OSHO,
    deletePieceImageMargin: false,
    boardImage: BoardImageType.RESIN2,
    pieceStandImage: PieceStandImageType.STANDARD,
    enableTransparent: false,
    boardOpacity: 1.0,
    pieceStandOpacity: 1.0,
    recordOpacity: 1.0,
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
    defaultRecordFileFormat: RecordFileFormat.KIF,
    textDecodingRule: TextDecodingRule.AUTO_DETECT,
    returnCode: opt?.returnCode || "\r\n",
    autoSaveDirectory: opt?.autoSaveDirectory || "",
    recordFileNameTemplate: defaultRecordFileNameTemplate,
    useCSAV3: false,
    enableUSIFileStartpos: true,
    enableUSIFileResign: false,
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
    positionImageTypeface: PositionImageTypeface.GOTHIC,
    positionImageHandLabelType: PositionImageHandLabelType.PLAYER_NAME,
    useBookmarkAsPositionImageHeader: false,
    positionImageHeader: "",
    positionImageCharacterY: 0,
    positionImageFontScale: 1,
    positionImageFontWeight: PositionImageFontWeight.W400X,
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
  },
): AppSetting {
  const result = {
    ...defaultAppSetting(opt),
    ...setting,
  };
  if (result.autoSaveDirectory.endsWith("\\") || result.autoSaveDirectory.endsWith("/")) {
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
  // 旧バージョンではフォントの太さは設定項目になく、明朝体とゴシック体で違っていた。
  if (!setting.positionImageFontWeight) {
    switch (setting.positionImageTypeface) {
      default:
        result.positionImageFontWeight = PositionImageFontWeight.W400X;
        break;
      case PositionImageTypeface.MINCHO:
        result.positionImageFontWeight = PositionImageFontWeight.W700X;
        break;
    }
  }
  return result;
}

export function validateAppSetting(setting: AppSetting): Error | undefined {
  if (setting.backgroundImageType !== BackgroundImageType.NONE && !setting.backgroundImageFileURL) {
    return new Error(t.backgroundImageFileNotSelected);
  }
  if (
    setting.pieceImage === PieceImageType.CUSTOM_IMAGE &&
    (!setting.pieceImageFileURL || !setting.croppedPieceImageBaseURL)
  ) {
    return new Error(t.pieceImageFileNotSelected);
  }
  if (setting.boardImage === BoardImageType.CUSTOM_IMAGE && !setting.boardImageFileURL) {
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
  if (setting.badMoveLevelThreshold1 < 1 || setting.badMoveLevelThreshold1 > 100) {
    return new Error(t.inaccuracyThresholdMustBe1To100Percent);
  }
  if (setting.badMoveLevelThreshold2 < 1 || setting.badMoveLevelThreshold2 > 100) {
    return new Error(t.dubiousThresholdMustBe1To100Percent);
  }
  if (setting.badMoveLevelThreshold3 < 1 || setting.badMoveLevelThreshold3 > 100) {
    return new Error(t.mistakeThresholdMustBe1To100Percent);
  }
  if (setting.badMoveLevelThreshold4 < 1 || setting.badMoveLevelThreshold4 > 100) {
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

export function getPieceImageURLTemplate(setting: AppSetting): string {
  switch (setting.pieceImage) {
    case PieceImageType.HITOMOJI_DARK:
      return "./piece/hitomoji_dark/${piece}.png";
    case PieceImageType.HITOMOJI_GOTHIC:
      return "./piece/hitomoji_gothic/${piece}.png";
    case PieceImageType.HITOMOJI_GOTHIC_DARK:
      return "./piece/hitomoji_gothic_dark/${piece}.png";
    case PieceImageType.CUSTOM_IMAGE:
      if (setting.croppedPieceImageBaseURL) {
        const query = setting.croppedPieceImageQuery ? `?${setting.croppedPieceImageQuery}` : "";
        return setting.croppedPieceImageBaseURL + "/${piece}.png" + query;
      }
  }
  return "./piece/hitomoji/${piece}.png";
}
