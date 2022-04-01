import { InitialPositionType } from "@/shogi/board";
import { USIEngineSetting } from "./usi";

export enum PlayerType {
  HUMAN = "human",
  USI = "usi",
}

export type PlayerSetting = {
  name: string;
  type: PlayerType;
  usi?: USIEngineSetting;
};

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
};

export function defaultGameSetting(): GameSetting {
  return {
    black: {
      name: "人",
      type: PlayerType.HUMAN,
    },
    white: {
      name: "人",
      type: PlayerType.HUMAN,
    },
    timeLimit: {
      timeSeconds: 0,
      byoyomi: 30,
      increment: 0,
    },
    enableEngineTimeout: false,
    humanIsFront: true,
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
