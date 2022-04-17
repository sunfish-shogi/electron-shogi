import { BoardLayoutType } from "@/components/primitive/BoardLayout";

export enum InformationTab {
  RECORD_INFO = "recordInfo",
  COMMENT = "comment",
  SEARCH = "search",
  CHART = "chart",
  INVISIBLE = "invisible",
}

export enum ClockSoundTarget {
  ALL = "all",
  ONLY_USER = "onlyUser",
}

export type AppSetting = {
  boardLayout: BoardLayoutType;
  pieceVolume: number;
  clockVolume: number;
  clockPitch: number;
  clockSoundTarget: ClockSoundTarget;
  boardFlipping: boolean;
  informationTab: InformationTab;
  returnCode: string;
};

export type AppSettingUpdate = {
  boardLayout?: BoardLayoutType;
  pieceVolume?: number;
  clockVolume?: number;
  clockPitch?: number;
  clockSoundTarget?: ClockSoundTarget;
  boardFlipping?: boolean;
  informationTab?: InformationTab;
  returnCode?: string;
};

export function defaultAppSetting(returnCode?: string): AppSetting {
  return {
    boardLayout: BoardLayoutType.HITOMOJI,
    pieceVolume: 30,
    clockVolume: 30,
    clockPitch: 500,
    clockSoundTarget: ClockSoundTarget.ONLY_USER,
    boardFlipping: false,
    informationTab: InformationTab.RECORD_INFO,
    returnCode: returnCode || "\r\n",
  };
}
