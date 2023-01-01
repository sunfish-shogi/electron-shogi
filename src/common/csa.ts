import { Color } from "@/common/shogi";

export type CSAGameSummary = {
  id: string;
  blackPlayerName?: string;
  whitePlayerName?: string;
  myColor: Color.BLACK | Color.WHITE;
  toMove: Color.BLACK | Color.WHITE;
  position: string;
  timeUnitMs: number;
  totalTime: number;
  byoyomi: number;
  delay: number;
  increment: number;
};

export function emptyCSAGameSummary(): CSAGameSummary {
  return {
    id: "",
    myColor: Color.BLACK,
    toMove: Color.BLACK,
    position: "",
    timeUnitMs: 1e3,
    totalTime: 0,
    byoyomi: 0,
    delay: 0,
    increment: 0,
  };
}

export type CSAPlayerState = {
  time: number;
};

export type CSAPlayerStates = {
  black: CSAPlayerState;
  white: CSAPlayerState;
};

export function emptyCSAPlayerStates(): CSAPlayerStates {
  return {
    black: { time: 0 },
    white: { time: 0 },
  };
}

export enum CSASpecialMove {
  UNKNOWN = "unknown",
  RESIGN = "resign",
  SENNICHITE = "sennichite",
  OUTE_SENNICHITE = "oute_sennichite",
  ILLEGAL_MOVE = "illegal_move",
  ILLEGAL_ACTION = "illegal_action",
  TIME_UP = "time_up",
  JISHOGI = "jishogi",
  MAX_MOVES = "max_moves",
}

export enum CSAGameResult {
  WIN = "win",
  LOSE = "lose",
  DRAW = "draw",
  CENSORED = "censored",
  CHUDAN = "chudan",
}
