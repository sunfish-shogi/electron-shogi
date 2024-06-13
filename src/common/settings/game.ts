import { InitialPositionType } from "electron-shogi-core";
import { PlayerSetting, defaultPlayerSetting } from "./player";
import { t } from "@/common/i18n";
import * as uri from "@/common/uri";

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

export enum JishogiRule {
  NONE = "none",
  GENERAL24 = "general24",
  GENERAL27 = "general27",
  TRY = "try",
}

export const DeclarableJishogiRules = [JishogiRule.GENERAL24, JishogiRule.GENERAL27];

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
  jishogiRule: JishogiRule;
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
    jishogiRule: JishogiRule.GENERAL27,
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

export function validateGameSetting(gameSetting: GameSetting): Error | undefined {
  if (gameSetting.timeLimit.timeSeconds === 0 && gameSetting.timeLimit.byoyomi === 0) {
    return new Error(t.bothTimeLimitAndByoyomiAreNotSet);
  }
  if (gameSetting.timeLimit.byoyomi !== 0 && gameSetting.timeLimit.increment !== 0) {
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
  if (gameSetting.repeat < 1) {
    return new Error("The number of repeats must be positive.");
  }
  const containsHuman =
    gameSetting.black.uri === uri.ES_HUMAN || gameSetting.white.uri === uri.ES_HUMAN;
  if (containsHuman && gameSetting.repeat > 1) {
    return new Error(t.repeatsMustBeOneIfHumanPlayerIncluded);
  }
  return;
}

export function validateGameSettingForWeb(gameSetting: GameSetting): Error | undefined {
  const result = validateGameSetting(gameSetting);
  if (result) {
    return result;
  }
  if (gameSetting.enableAutoSave) {
    return new Error("自動保存はWeb版で利用できません。");
  }
  return;
}
