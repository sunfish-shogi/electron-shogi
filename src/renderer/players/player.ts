import { GameResult } from "@/common/game/result";
import { TimeStates } from "@/common/game/time";
import { ImmutableRecord, Move } from "electron-shogi-core";

export type SearchInfo = {
  usi: string; // 局面
  depth?: number; // 探索深さ
  score?: number; // 先手から見た評価値
  mate?: number; // 先手勝ちの場合に正の値、後手勝ちの場合に負の値
  pv?: Move[];
};

export interface SearchHandler {
  onMove: (move: Move, info?: SearchInfo) => void;
  onResign: () => void;
  onWin: () => void;
  onError: (e: unknown) => void;
}

export interface MateHandler {
  onCheckmate: (moves: Move[]) => void;
  onNotImplemented: () => void;
  onTimeout: () => void;
  onNoMate: () => void;
  onError: (e: unknown) => void;
}

export interface Player {
  isEngine(): boolean;
  readyNewGame(): Promise<void>;
  startSearch(
    record: ImmutableRecord,
    timeStates: TimeStates,
    handler: SearchHandler,
  ): Promise<void>;
  startPonder(record: ImmutableRecord, timeStates: TimeStates): Promise<void>;
  startMateSearch(record: ImmutableRecord, handler: MateHandler): Promise<void>;
  stop(): Promise<void>;
  gameover(result: GameResult): Promise<void>;
  close(): Promise<void>;
}
