import { Color } from "tsshogi";

export type CSAGameTimeConfig = {
  timeUnitMs: number;
  totalTime: number;
  byoyomi: number;
  delay: number;
  increment: number;
};

export type CSAGamePlayerConfig = {
  playerName?: string;
  time: CSAGameTimeConfig;
};

function emptyCSAGameTimeConfig(): CSAGameTimeConfig {
  return {
    timeUnitMs: 1e3,
    totalTime: 0,
    byoyomi: 0,
    delay: 0,
    increment: 0,
  };
}

export type CSAGameSummary = {
  id: string;
  players: {
    black: CSAGamePlayerConfig;
    white: CSAGamePlayerConfig;
  };
  myColor: Color.BLACK | Color.WHITE;
  toMove: Color.BLACK | Color.WHITE;
  position: string;
};

export function emptyCSAGameSummary(): CSAGameSummary {
  return {
    id: "",
    myColor: Color.BLACK,
    toMove: Color.BLACK,
    position: "",
    players: {
      black: {
        time: emptyCSAGameTimeConfig(),
      },
      white: {
        time: emptyCSAGameTimeConfig(),
      },
    },
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
