import { InitialPositionType } from "@/common/shogi";
import { PlayerSetting, defaultPlayerSetting } from "./player";
import { t } from "../i18n";

export type TimeLimitSetting = {
  timeSeconds: number;
  byoyomi: number;
  increment: number;
};

export function defaultTimeLimitSetting(): TimeLimitSetting {
  return {
    timeSeconds: 0,
    byoyomi: 30,
    increment: 0,
  };
}

export type GameSetting = {
  black: PlayerSetting;
  white: PlayerSetting;
  timeLimit: TimeLimitSetting;
  whiteTimeLimit?: TimeLimitSetting;
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
    black: defaultPlayerSetting(),
    white: defaultPlayerSetting(),
    timeLimit: defaultTimeLimitSetting(),
    enableEngineTimeout: false,
    humanIsFront: true,
    enableComment: true,
    enableAutoSave: true,
    repeat: 1,
    swapPlayers: false,
    maxMoves: 1000,
  };
}

export function normalizeGameSetting(setting: GameSetting): GameSetting {
  return {
    ...defaultGameSetting(),
    ...setting,
    black: {
      ...defaultPlayerSetting(),
      ...setting.black,
    },
    white: {
      ...defaultPlayerSetting(),
      ...setting.white,
    },
    timeLimit: {
      ...defaultTimeLimitSetting(),
      ...setting.timeLimit,
    },
  };
}

export function validateGameSetting(
  gameSetting: GameSetting,
): Error | undefined {
  if (
    gameSetting.timeLimit.timeSeconds === 0 &&
    gameSetting.timeLimit.byoyomi === 0
  ) {
    return new Error(t.bothTimeLimitAndByoyomiAreNotSet);
  }
  if (
    gameSetting.timeLimit.byoyomi !== 0 &&
    gameSetting.timeLimit.increment !== 0
  ) {
    return new Error(t.canNotUseByoyomiWithFischer);
  }
  if (
    gameSetting.whiteTimeLimit &&
    gameSetting.whiteTimeLimit.timeSeconds === 0 &&
    gameSetting.whiteTimeLimit.byoyomi === 0
  ) {
    return new Error(t.bothTimeLimitAndByoyomiAreNotSet);
  }
  if (
    gameSetting.whiteTimeLimit &&
    gameSetting.whiteTimeLimit.byoyomi !== 0 &&
    gameSetting.whiteTimeLimit.increment !== 0
  ) {
    return new Error(t.canNotUseByoyomiWithFischer);
  }
  return;
}

export function validateGameSettingForWeb(
  gameSetting: GameSetting,
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
