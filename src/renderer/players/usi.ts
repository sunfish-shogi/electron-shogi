import api from "@/renderer/ipc/api";
import { parseUSIPV, USIInfoCommand } from "@/common/usi";
import { TimeLimitSetting } from "@/common/settings/game";
import {
  getUSIEngineOptionCurrentValue,
  USIEngineSetting,
  USIPonder,
} from "@/common/settings/usi";
import { Color, ImmutableRecord, Position } from "@/common/shogi";
import { Player, SearchInfo, SearchHandler } from "./player";
import { GameResult } from "@/common/player";

export class USIPlayer implements Player {
  private sessionID = 0;
  private usi?: string;
  private position?: Position;
  private searchHandler?: SearchHandler;
  private ponder?: string;
  private inPonder = false;
  private info?: SearchInfo;
  private usiInfoTimeout?: number;

  constructor(
    private setting: USIEngineSetting,
    private timeoutSeconds: number,
    private onSearchInfo?: (info: SearchInfo) => void
  ) {}

  async launch(): Promise<void> {
    this.sessionID = await api.usiLaunch(this.setting, this.timeoutSeconds);
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
      this.info = undefined;
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
    const baseUSI = record.usi;
    if (!this.ponder || !this.ponder.startsWith(baseUSI)) {
      return;
    }
    const ponderSetting = getUSIEngineOptionCurrentValue(
      this.setting.options[USIPonder]
    );
    if (ponderSetting !== "true") {
      return;
    }
    this.searchHandler = undefined;
    this.usi = this.ponder;
    this.position = record.position.clone();
    const ponderMove = this.position.createMoveByUSI(
      this.ponder.slice(baseUSI.length + 1)
    );
    if (!ponderMove) {
      return;
    }
    this.position.doMove(ponderMove);
    this.info = undefined;
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
    this.info = undefined;
    this.position = record.position.clone();
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
    const move = this.position.createMoveByUSI(sfen);
    if (!move) {
      searchHandler.onError("エンジンから不明な指し手を受信しました:" + sfen);
      searchHandler.onResign();
      return;
    }
    this.ponder = ponder && `${usi} ${sfen} ${ponder}`;
    this.flushUSIInfo();
    if (
      this.info &&
      this.info.pv &&
      this.info.pv.length >= 1 &&
      this.info.pv[0].equals(move)
    ) {
      const info = {
        ...this.info,
        pv: this.info.pv.slice(1),
      };
      searchHandler.onMove(move, info);
    } else {
      searchHandler.onMove(move);
    }
  }

  onUSIInfo(usi: string, infoCommand: USIInfoCommand) {
    if (usi !== this.usi || !this.position) {
      return;
    }
    if (infoCommand.multipv && infoCommand.multipv !== 1) {
      return;
    }
    const sign = this.position.color === Color.BLACK ? 1 : -1;
    const pv =
      infoCommand.pv && infoCommand.pv.length >= 1
        ? infoCommand.pv
        : infoCommand.currmove
        ? [infoCommand.currmove]
        : undefined;
    const info = {
      usi: usi,
      depth: infoCommand.depth,
      score: infoCommand.scoreCP && infoCommand.scoreCP * sign,
      mate: infoCommand.scoreMate && infoCommand.scoreMate * sign,
      pv: pv && parseUSIPV(this.position, pv),
    };
    this.updateUSIInfo(info);
  }

  private updateUSIInfo(info: SearchInfo) {
    this.info = info;
    // 高頻度でコマンドが送られてくると描画が追いつかないので、一定時間ごとに反映する。
    if (this.usiInfoTimeout) {
      return;
    }
    this.usiInfoTimeout = window.setTimeout(() => {
      this.flushUSIInfo();
    }, 500);
  }

  private flushUSIInfo() {
    if (this.usiInfoTimeout) {
      clearTimeout(this.usiInfoTimeout);
      this.usiInfoTimeout = undefined;
    }
    if (this.onSearchInfo && this.info) {
      this.onSearchInfo(this.info);
    }
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

export function onUSIInfo(
  sessionID: number,
  usi: string,
  info: USIInfoCommand
) {
  const player = usiPlayers[sessionID];
  if (!player) {
    return;
  }
  player.onUSIInfo(usi, info);
}
