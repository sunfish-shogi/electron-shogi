import api from "@/renderer/ipc/api";
import { parseUSIPV, USIInfoCommand } from "@/common/game/usi";
import { getUSIEngineOptionCurrentValue, USIEngineSetting, USIPonder } from "@/common/settings/usi";
import { Color, ImmutableRecord, Move, Position } from "electron-shogi-core";
import { Player, SearchInfo, SearchHandler, MateHandler } from "./player";
import { GameResult } from "@/common/game/result";
import { useStore } from "@/renderer/store";
import { TimeStates } from "@/common/game/time";

export class USIPlayer implements Player {
  private _sessionID = 0;
  private usi?: string;
  private position?: Position;
  private searchHandler?: SearchHandler;
  private mateHandler?: MateHandler;
  private ponder?: string;
  private inPonder = false;
  private info?: SearchInfo;
  private usiInfoTimeout?: number;

  constructor(
    private setting: USIEngineSetting,
    private timeoutSeconds: number,
    private onSearchInfo?: (info: SearchInfo) => void,
  ) {}

  get name(): string {
    return this.setting.name;
  }

  get sessionID(): number {
    return this._sessionID;
  }

  async launch(): Promise<void> {
    this._sessionID = await api.usiLaunch(this.setting, this.timeoutSeconds);
    usiPlayers[this.sessionID] = this;
  }

  isEngine(): boolean {
    return true;
  }

  async readyNewGame(): Promise<void> {
    await api.usiReady(this.sessionID);
  }

  async startSearch(
    record: ImmutableRecord,
    timeStates: TimeStates,
    handler: SearchHandler,
  ): Promise<void> {
    this.clearHandlers();
    this.searchHandler = handler;
    this.usi = record.usi;
    this.position = record.position.clone();
    if (this.inPonder && this.ponder === this.usi) {
      api.usiPonderHit(this.sessionID);
    } else {
      this.info = undefined;
      await api.usiGo(this.sessionID, this.usi, timeStates);
    }
    this.inPonder = false;
    this.ponder = undefined;
  }

  async startPonder(record: ImmutableRecord, timeStates: TimeStates): Promise<void> {
    // エンジンの USI_Ponder オプションが無効なら何もしない。
    const ponderSetting = getUSIEngineOptionCurrentValue(this.setting.options[USIPonder]);
    if (ponderSetting !== "true") {
      return;
    }
    // 現在局面までの USI が前方一致しているか確認する。
    const baseUSI = record.usi;
    if (!this.ponder || !this.ponder.startsWith(baseUSI)) {
      return;
    }
    // 予想した 1 手を取り出す。
    const ponderMove = record.position.createMoveByUSI(this.ponder.slice(baseUSI.length + 1));
    // 合法手かどうかをチェックする。
    if (!ponderMove || !record.position.isValidMove(ponderMove)) {
      return;
    }

    this.clearHandlers();
    this.usi = this.ponder;
    this.position = record.position.clone();
    this.position.doMove(ponderMove);
    this.info = undefined;
    this.inPonder = true;
    await api.usiGoPonder(this.sessionID, this.ponder, timeStates);
  }

  async startMateSearch(record: ImmutableRecord, handler: MateHandler): Promise<void> {
    this.clearHandlers();
    this.usi = record.usi;
    this.info = undefined;
    this.position = record.position.clone();
    this.mateHandler = handler;
    await api.usiGoMate(this.sessionID, this.usi);
  }

  async startResearch(record: ImmutableRecord): Promise<void> {
    this.clearHandlers();
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
    this.clearHandlers();
    await api.usiQuit(this.sessionID);
    delete usiPlayers[this.sessionID];
  }

  private clearHandlers(): void {
    this.searchHandler = undefined;
    this.mateHandler = undefined;
  }

  onBestMove(usi: string, usiMove: string, ponder?: string): void {
    const searchHandler = this.searchHandler;
    this.clearHandlers();
    if (!searchHandler || !this.position) {
      return;
    }
    if (usi !== this.usi) {
      return;
    }
    if (usiMove === "resign") {
      searchHandler.onResign();
      return;
    }
    if (usiMove === "win") {
      searchHandler.onWin();
      return;
    }
    const move = this.position.createMoveByUSI(usiMove);
    if (!move) {
      searchHandler.onError("エンジンから不明な指し手を受信しました:" + usiMove);
      searchHandler.onResign();
      return;
    }
    this.ponder = ponder && `${usi} ${usiMove} ${ponder}`;
    this.flushUSIInfo();
    if (this.info && this.info.pv && this.info.pv.length >= 1 && this.info.pv[0].equals(move)) {
      const info = {
        ...this.info,
        pv: this.info.pv.slice(1),
      };
      searchHandler.onMove(move, info);
    } else {
      searchHandler.onMove(move);
    }
  }

  onCheckmate(usi: string, usiMoves: string[]): void {
    if (usi !== this.usi || !this.position) {
      return;
    }
    const mateHandler = this.mateHandler;
    this.clearHandlers();
    if (!mateHandler) {
      return;
    }
    const position = this.position;
    const moves: Move[] = [];
    for (const usiMove of usiMoves) {
      const move = position.createMoveByUSI(usiMove);
      if (!move) {
        mateHandler.onError("エンジンから不明な指し手を受信しました:" + usiMove);
        return;
      }
      moves.push(move);
      if (!position.doMove(move)) {
        mateHandler.onError("エンジンから無効な指し手を受信しました:" + usiMove);
        return;
      }
    }
    mateHandler.onCheckmate(moves);
  }

  onCheckmateNotImplemented(): void {
    const mateHandler = this.mateHandler;
    this.clearHandlers();
    if (mateHandler) {
      mateHandler.onNotImplemented();
    }
  }

  onCheckmateTimeout(usi: string): void {
    if (usi !== this.usi || !this.position) {
      return;
    }
    const mateHandler = this.mateHandler;
    this.clearHandlers();
    if (mateHandler) {
      mateHandler.onTimeout();
    }
  }

  onNoMate(usi: string): void {
    if (usi !== this.usi || !this.position) {
      return;
    }
    const mateHandler = this.mateHandler;
    this.clearHandlers();
    if (mateHandler) {
      mateHandler.onNoMate();
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
    // Ponder 中はハンドラーを呼ばない。
    if (this.inPonder) {
      return;
    }
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

const usiPlayers: { [sessionID: number]: USIPlayer } = {};

export function onUSIBestMove(sessionID: number, usi: string, usiMove: string, ponder?: string) {
  const player = usiPlayers[sessionID];
  if (!player) {
    return;
  }
  player.onBestMove(usi, usiMove, ponder);
}

export function onUSICheckmate(sessionID: number, usi: string, usiMoves: string[]) {
  const player = usiPlayers[sessionID];
  if (!player) {
    return;
  }
  useStore().updateUSIInfo(sessionID, usi, player.name, {
    pv: usiMoves,
  });
  player.onCheckmate(usi, usiMoves);
}

export function onUSICheckmateNotImplemented(sessionID: number) {
  const player = usiPlayers[sessionID];
  if (!player) {
    return;
  }
  player.onCheckmateNotImplemented();
}

export function onUSICheckmateTimeout(sessionID: number, usi: string) {
  const player = usiPlayers[sessionID];
  if (!player) {
    return;
  }
  player.onCheckmateTimeout(usi);
}

export function onUSINoMate(sessionID: number, usi: string) {
  const player = usiPlayers[sessionID];
  if (!player) {
    return;
  }
  player.onNoMate(usi);
}

export function onUSIInfo(sessionID: number, usi: string, info: USIInfoCommand) {
  const player = usiPlayers[sessionID];
  if (!player) {
    return;
  }
  useStore().updateUSIInfo(sessionID, usi, player.name, info);
  player.onUSIInfo(usi, info);
}

export function onUSIPonderInfo(sessionID: number, usi: string, info: USIInfoCommand) {
  const player = usiPlayers[sessionID];
  if (!player) {
    return;
  }
  useStore().updateUSIPonderInfo(sessionID, usi, player.name, info);
  player.onUSIInfo(usi, info);
}
