import api from "@/ipc/api";
import { GameSetting } from "@/settings/game";
import { USIEngineSetting } from "@/settings/usi";
import { ImmutableRecord, Position } from "@/shogi";
import { GameResult, Player, SearchHandler } from "./player";

export class USIPlayer implements Player {
  private setting: USIEngineSetting;
  private sessionID: number;
  private usi?: string;
  private position?: Position;
  private searchHandler?: SearchHandler;

  constructor(setting: USIEngineSetting) {
    this.setting = setting;
    this.sessionID = 0;
  }

  async launch(): Promise<void> {
    this.sessionID = await api.usiLaunch(this.setting);
    usiPlayers[this.sessionID] = this;
  }

  isEngine(): boolean {
    return true;
  }

  async startSearch(
    record: ImmutableRecord,
    gameSetting: GameSetting,
    blackTimeMs: number,
    whiteTimeMs: number,
    handler: SearchHandler
  ): Promise<void> {
    this.searchHandler = handler;
    this.usi = record.usi;
    this.position = record.position.clone();
    api
      .usiGo(this.sessionID, this.usi, gameSetting, blackTimeMs, whiteTimeMs)
      .catch((e) => {
        handler.onError(e);
      });
  }

  async startResearch(record: ImmutableRecord): Promise<void> {
    this.searchHandler = undefined;
    this.usi = record.usi;
    await api.usiGoInfinite(this.sessionID, record.usi);
  }

  async stop(): Promise<void> {
    await api.usiStop(this.sessionID);
  }

  async gameover(result: GameResult): Promise<void> {
    await api.usiGameover(this.sessionID, result);
  }

  async close(): Promise<void> {
    this.searchHandler = undefined;
    await api.usiQuit(this.sessionID);
    delete usiPlayers[this.sessionID];
  }

  onBestMove(usi: string, sfen: string): void {
    const searchHandler = this.searchHandler;
    this.searchHandler = undefined;
    if (!searchHandler || !this.position) {
      return;
    }
    if (usi !== this.usi) {
      return;
    }
    if (sfen === "resign") {
      searchHandler.onResign();
      return;
    }
    if (sfen === "win") {
      searchHandler.onWin();
      return;
    }
    const move = this.position.createMoveBySFEN(sfen);
    if (!move) {
      searchHandler.onError("エンジンから不明な指し手を受信しました:" + sfen);
      searchHandler.onResign();
      return;
    }
    searchHandler.onMove(move);
  }
}

export const usiPlayers: { [sessionID: number]: USIPlayer } = {};

export function usiBestMove(sessionID: number, usi: string, sfen: string) {
  const player = usiPlayers[sessionID];
  if (!player) {
    return;
  }
  player.onBestMove(usi, sfen);
}
