export enum Thema {
  STANDARD = "standard",
  CHERRY_BLOSSOM = "cherry-blossom",
  AUTUMN = "autumn",
  SNOW = "snow",
  DARK = "dark",
}

export enum PieceImageType {
  HITOMOJI = "hitomoji",
  HITOMOJI_DARK = "hitomojiDark",
  HITOMOJI_GOTHIC = "hitomojiGothic",
  HITOMOJI_GOTHIC_DARK = "hitomojiGothicDark",
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
}

export enum BoardLabelType {
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

export enum ClockSoundTarget {
  ALL = "all",
  ONLY_USER = "onlyUser",
}

export type AppSetting = {
  thema: Thema;
  pieceImage: PieceImageType;
  boardImage: BoardImageType;
  boardLabelType: BoardLabelType;
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
  returnCode: string;
  autoSaveDirectory: string;
  engineTimeoutSeconds: number;
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
};

export type AppSettingUpdate = {
  thema?: Thema;
  pieceImage?: PieceImageType;
  boardImage?: BoardImageType;
  boardLabelType?: BoardLabelType;
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
  returnCode?: string;
  autoSaveDirectory?: string;
  engineTimeoutSeconds?: number;
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
    thema: Thema.STANDARD,
    pieceImage: PieceImageType.HITOMOJI,
    boardImage: BoardImageType.LIGHT,
    boardLabelType: BoardLabelType.STANDARD,
    pieceVolume: 30,
    clockVolume: 30,
    clockPitch: 500,
    clockSoundTarget: ClockSoundTarget.ONLY_USER,
    boardFlipping: false,
    tabPaneType: TabPaneType.SINGLE,
    tab: Tab.RECORD_INFO,
    tab2: Tab.COMMENT,
    topPaneHeightPercentage: 60,
    topPanePreviousHeightPercentage: 60,
    bottomLeftPaneWidthPercentage: 60,
    returnCode: opt?.returnCode || "\r\n",
    autoSaveDirectory: opt?.autoSaveDirectory || "",
    engineTimeoutSeconds: 10,
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
  // 旧バージョンではタブの最小化を Tab.INDISIBLE で表していたが廃止した。
  if (result.tab === Tab.INVISIBLE) {
    result.tab = Tab.RECORD_INFO;
  }
  return result;
}

export function validateAppSetting(setting: AppSetting): Error | undefined {
  if (setting.pieceVolume < 0 || setting.pieceVolume > 100) {
    return new Error("駒音の大きさには0%～100%の値を指定してください。");
  }
  if (setting.clockVolume < 0 || setting.clockVolume > 100) {
    return new Error("時計音の大きさには0%～100%の値を指定してください。");
  }
  if (setting.clockPitch < 220 || setting.clockPitch > 880) {
    return new Error("時計音の高さには220Hz～880Hzの値を指定してください。");
  }
  if (setting.engineTimeoutSeconds < 1) {
    return new Error(
      "エンジンのタイムアウト時間は 1 秒以上の値を指定してください。"
    );
  }
  if (setting.engineTimeoutSeconds > 300) {
    return new Error(
      "エンジンのタイムアウト時間は 300 秒以下の値を指定してください。"
    );
  }
  if (setting.coefficientInSigmoid <= 0) {
    return new Error("勝率換算係数には0より大きい値を指定してください。");
  }
  if (
    setting.badMoveLevelThreshold1 < 1 ||
    setting.badMoveLevelThreshold1 > 100
  ) {
    return new Error("緩手には1%～100%の値を指定してください。");
  }
  if (
    setting.badMoveLevelThreshold2 < 1 ||
    setting.badMoveLevelThreshold2 > 100
  ) {
    return new Error("疑問手には1%～100%の値を指定してください。");
  }
  if (
    setting.badMoveLevelThreshold3 < 1 ||
    setting.badMoveLevelThreshold3 > 100
  ) {
    return new Error("悪手には1%～100%の閾値を指定してください。");
  }
  if (
    setting.badMoveLevelThreshold4 < 1 ||
    setting.badMoveLevelThreshold4 > 100
  ) {
    return new Error("大悪手には1%～100%の値を指定してください。");
  }
  if (setting.badMoveLevelThreshold1 >= setting.badMoveLevelThreshold2) {
    return new Error("緩手には疑問手より小さい値を指定してください。");
  }
  if (setting.badMoveLevelThreshold2 >= setting.badMoveLevelThreshold3) {
    return new Error("疑問手には悪手より小さい値を指定してください。");
  }
  if (setting.badMoveLevelThreshold3 >= setting.badMoveLevelThreshold4) {
    return new Error("悪手には大悪手より小さい値を指定してください。");
  }
}
