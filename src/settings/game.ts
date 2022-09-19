import { InitialPositionType } from "@/shogi";
import * as uri from "@/uri";
import { PlayerSetting } from "./player";

export type TimeLimitSetting = {
  timeSeconds: number;
  byoyomi: number;
  increment: number;
};

export type GameSetting = {
  black: PlayerSetting;
  white: PlayerSetting;
  timeLimit: TimeLimitSetting;
  startPosition?: InitialPositionType;
  enableEngineTimeout: boolean;
  humanIsFront: boolean;
  enableComment: boolean;
  enableAutoSave: boolean;
  repeat: number;
  swapPlayers: boolean;
  maxMoves: number;
};

export function defaultGameSetting(): GameSetting {
  return {
    black: {
      name: "人",
      uri: uri.ES_HUMAN,
    },
    white: {
      name: "人",
      uri: uri.ES_HUMAN,
    },
    timeLimit: {
      timeSeconds: 0,
      byoyomi: 30,
      increment: 0,
    },
    enableEngineTimeout: false,
    humanIsFront: true,
    enableComment: true,
    enableAutoSave: true,
    repeat: 1,
    swapPlayers: false,
    maxMoves: 1000,
  };
}

export function validateGameSetting(
  gameSetting: GameSetting
): Error | undefined {
  if (
    gameSetting.timeLimit.timeSeconds === 0 &&
    gameSetting.timeLimit.byoyomi === 0
  ) {
    return new Error("持ち時間と秒読みが両方とも0です。");
  }
  if (
    gameSetting.timeLimit.byoyomi !== 0 &&
    gameSetting.timeLimit.increment !== 0
  ) {
    return new Error("秒読みとフィッシャールールは併用できません。");
  }
  return;
}

export function validateGameSettingForWeb(
  gameSetting: GameSetting
): Error | undefined {
  const result = validateGameSetting(gameSetting);
  if (result) {
    return result;
  }
  if (gameSetting.enableAutoSave) {
    return new Error("自動保存はWeb版で利用できません。");
  }
  return;
}
