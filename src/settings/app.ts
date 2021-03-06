import {
  PieceImageType,
  BoardImageType,
  BoardLabelType,
} from "@/components/primitive/BoardLayout";

export enum Thema {
  STANDARD = "standard",
  CHERRY_BLOSSOM = "cherry-blossom",
  DARK = "dark",
}

export enum Tab {
  RECORD_INFO = "recordInfo",
  COMMENT = "comment",
  SEARCH = "search",
  PV = "pv",
  CHART = "chart",
  PERCENTAGE_CHART = "percentageChart",
  INVISIBLE = "invisible",
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
  tab: Tab;
  returnCode: string;
  coefficientInSigmoid: number;
  badMoveLevelThreshold1: number;
  badMoveLevelThreshold2: number;
  badMoveLevelThreshold3: number;
  badMoveLevelThreshold4: number;
  showElapsedTimeInRecordView: boolean;
  showCommentInRecordView: boolean;
  enableAppLog: boolean;
  enableUSILog: boolean;
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
  tab?: Tab;
  returnCode?: string;
  coefficientInSigmoid?: number;
  badMoveLevelThreshold1?: number;
  badMoveLevelThreshold2?: number;
  badMoveLevelThreshold3?: number;
  badMoveLevelThreshold4?: number;
  showElapsedTimeInRecordView?: boolean;
  showCommentInRecordView?: boolean;
  enableAppLog?: boolean;
  enableUSILog?: boolean;
};

export function defaultAppSetting(returnCode?: string): AppSetting {
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
    tab: Tab.RECORD_INFO,
    returnCode: returnCode || "\r\n",
    coefficientInSigmoid: 600,
    badMoveLevelThreshold1: 5,
    badMoveLevelThreshold2: 10,
    badMoveLevelThreshold3: 20,
    badMoveLevelThreshold4: 50,
    showElapsedTimeInRecordView: true,
    showCommentInRecordView: true,
    enableAppLog: false,
    enableUSILog: false,
  };
}

export function validateAppSetting(setting: AppSetting): Error | undefined {
  if (setting.pieceVolume < 0 || setting.pieceVolume > 100) {
    return new Error("????????????????????????0%???100%????????????????????????????????????");
  }
  if (setting.clockVolume < 0 || setting.clockVolume > 100) {
    return new Error("???????????????????????????0%???100%????????????????????????????????????");
  }
  if (setting.clockPitch < 220 || setting.clockPitch > 880) {
    return new Error("????????????????????????220Hz???880Hz????????????????????????????????????");
  }
  if (setting.coefficientInSigmoid <= 0) {
    return new Error("????????????????????????0????????????????????????????????????????????????");
  }
  if (
    setting.badMoveLevelThreshold1 < 1 ||
    setting.badMoveLevelThreshold1 > 100
  ) {
    return new Error("????????????1%???100%????????????????????????????????????");
  }
  if (
    setting.badMoveLevelThreshold2 < 1 ||
    setting.badMoveLevelThreshold2 > 100
  ) {
    return new Error("???????????????1%???100%????????????????????????????????????");
  }
  if (
    setting.badMoveLevelThreshold3 < 1 ||
    setting.badMoveLevelThreshold3 > 100
  ) {
    return new Error("????????????1%???100%???????????????????????????????????????");
  }
  if (
    setting.badMoveLevelThreshold4 < 1 ||
    setting.badMoveLevelThreshold4 > 100
  ) {
    return new Error("???????????????1%???100%????????????????????????????????????");
  }
  if (setting.badMoveLevelThreshold1 >= setting.badMoveLevelThreshold2) {
    return new Error("?????????????????????????????????????????????????????????????????????");
  }
  if (setting.badMoveLevelThreshold2 >= setting.badMoveLevelThreshold3) {
    return new Error("?????????????????????????????????????????????????????????????????????");
  }
  if (setting.badMoveLevelThreshold3 >= setting.badMoveLevelThreshold4) {
    return new Error("?????????????????????????????????????????????????????????????????????");
  }
}
