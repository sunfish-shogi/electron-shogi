import {
  PieceImageType,
  BoardImageType,
} from "@/components/primitive/BoardLayout";

export enum Tab {
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
  pieceImage: PieceImageType;
  boardImage: BoardImageType;
  pieceVolume: number;
  clockVolume: number;
  clockPitch: number;
  clockSoundTarget: ClockSoundTarget;
  boardFlipping: boolean;
  tab: Tab;
  returnCode: string;
};

export type AppSettingUpdate = {
  pieceImage?: PieceImageType;
  boardImage?: BoardImageType;
  pieceVolume?: number;
  clockVolume?: number;
  clockPitch?: number;
  clockSoundTarget?: ClockSoundTarget;
  boardFlipping?: boolean;
  tab?: Tab;
  returnCode?: string;
};

export function defaultAppSetting(returnCode?: string): AppSetting {
  return {
    pieceImage: PieceImageType.HITOMOJI,
    boardImage: BoardImageType.LIGHT,
    pieceVolume: 30,
    clockVolume: 30,
    clockPitch: 500,
    clockSoundTarget: ClockSoundTarget.ONLY_USER,
    boardFlipping: false,
    tab: Tab.RECORD_INFO,
    returnCode: returnCode || "\r\n",
  };
}
