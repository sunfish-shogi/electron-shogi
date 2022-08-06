import api from "@/ipc/api";
import { TimeLimitSetting } from "@/settings/game";
import {
  getUSIEngineOptionCurrentValue,
  USIEngineSetting,
  USIPonder,
} from "@/settings/usi";
import { ImmutableRecord, Position } from "@/shogi";
import { GameResult, Player, SearchHandler } from "./player";

export class USIPlayer implements Player {
  private sessionID = 0;
  private usi?: string;
  private position?: Position;
  private searchHandler?: SearchHandler;
  private ponder?: string;
  private inPonder = false;

  constructor(private setting: USIEngineSetting) {}

  async launch(): Promise<void> {
    this.sessionID = await api.usiLaunch(this.setting);
    usiPlayers[this.sessionID] = this;
  }

  isEngine(): boolean {
    return true;
  }

  async startSearch(
    record: ImmutableRecord,
    timeLimit: TimeLimitSetting,
    blackTimeMs: number,
    whiteTimeMs: number,
    handler: SearchHandler
  ): Promise<void> {
    this.searchHandler = handler;
    this.usi = record.usi;
    this.position = record.position.clone();
    if (this.inPonder && this.ponder === this.usi) {
      api.usiPonderHit(this.sessionID);
    } else {
      await api.usiGo(
        this.sessionID,
        this.usi,
        timeLimit,
        blackTimeMs,
        whiteTimeMs
      );
    }
    this.inPonder = false;
    this.ponder = undefined;
  }

  async startPonder(
    record: ImmutableRecord,
    timeLimit: TimeLimitSetting,
    blackTimeMs: number,
    whiteTimeMs: number
  ): Promise<void> {
    if (!this.ponder || !this.ponder.startsWith(record.usi)) {
      return;
    }
    const ponderSetting = getUSIEngineOptionCurrentValue(
      this.setting.options[USIPonder]
    );
    if (ponderSetting !== "true") {
      return;
    }
    this.inPonder = true;
    await api.usiGoPonder(
      this.sessionID,
      this.ponder,
      timeLimit,
      blackTimeMs,
      whiteTimeMs
    );
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

  onBestMove(usi: string, sfen: string, ponder?: string): void {
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
    this.ponder = ponder && `${usi} ${sfen} ${ponder}`;
    searchHandler.onMove(move);
  }
}

export const usiPlayers: { [sessionID: number]: USIPlayer } = {};

export function onUSIBestMove(
  sessionID: number,
  usi: string,
  sfen: string,
  ponder?: string
) {
  const player = usiPlayers[sessionID];
  if (!player) {
    return;
  }
  player.onBestMove(usi, sfen, ponder);
}
