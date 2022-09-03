import { USIInfoCommand } from "@/ipc/usi";
import { TimeLimitSetting } from "@/settings/game";
import { ImmutableRecord, Move } from "@/shogi";

export type MoveOption = {
  usiInfoCommand?: USIInfoCommand;
};

export enum GameResult {
  WIN = "win",
  LOSE = "lose",
  DRAW = "draw",
}

export interface SearchHandler {
  onMove: (move: Move, opt?: MoveOption) => void;
  onResign: () => void;
  onWin: () => void;
  onError: (e: unknown) => void;
}

export interface Player {
  isEngine(): boolean;
  startSearch(
    record: ImmutableRecord,
    timeLimit: TimeLimitSetting,
    blackTimeMs: number,
    whiteTimeMs: number,
    handler: SearchHandler
  ): Promise<void>;
  startPonder(
    record: ImmutableRecord,
    timeLimit: TimeLimitSetting,
    blackTimeMs: number,
    whiteTimeMs: number
  ): Promise<void>;
  stop(): Promise<void>;
  gameover(result: GameResult): Promise<void>;
  close(): Promise<void>;
}
