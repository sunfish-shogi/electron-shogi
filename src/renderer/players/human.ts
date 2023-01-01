import { TimeLimitSetting } from "@/common/settings/game";
import { ImmutableRecord, Move } from "@/common/shogi";
import { Player, SearchHandler } from "./player";

export class HumanPlayer implements Player {
  private searchHandler?: SearchHandler;

  isEngine(): boolean {
    return false;
  }

  async startSearch(
    record: ImmutableRecord,
    timeLimit: TimeLimitSetting,
    blackTimeMs: number,
    whiteTimeMs: number,
    handler: SearchHandler
  ): Promise<void> {
    this.searchHandler = handler;
  }

  async startPonder(): Promise<void> {
    // do nothing
  }

  async stop(): Promise<void> {
    // do nothing
  }

  async gameover(): Promise<void> {
    // do nothing
  }

  async close(): Promise<void> {
    this.searchHandler = undefined;
  }

  doMove(move: Move) {
    const searchHandler = this.searchHandler;
    this.searchHandler = undefined;
    if (searchHandler) {
      searchHandler.onMove(move);
    }
  }

  resign() {
    const searchHandler = this.searchHandler;
    this.searchHandler = undefined;
    if (searchHandler) {
      searchHandler.onResign();
    }
  }

  win() {
    const searchHandler = this.searchHandler;
    this.searchHandler = undefined;
    if (searchHandler) {
      searchHandler.onWin();
    }
  }
}

export const humanPlayer = new HumanPlayer();
