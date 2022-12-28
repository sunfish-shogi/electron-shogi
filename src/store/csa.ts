import api from "@/ipc/api";
import {
  CSAGameResult,
  CSAGameSummary,
  CSAPlayerStates,
  CSASpecialMove,
  emptyCSAGameSummary,
} from "@/ipc/csa";
import { defaultPlayerBuilder, PlayerBuilder } from "@/players/builder";
import { Player, SearchInfo } from "@/players/player";
import {
  CSAGameSetting,
  CSAProtocolVersion,
  defaultCSAGameSetting,
} from "@/settings/csa";
import {
  Color,
  RecordFormatType,
  parseCSAMove,
  formatCSAMove,
  SpecialMove,
  Move,
} from "@/shogi";
import { Clock } from "./clock";
import {
  buildSearchComment,
  CommentBehavior,
  RecordManager,
  SearchEngineType,
} from "./record";

export enum CSAGameState {
  OFFLINE,
  WAITING_LOGIN,
  READY,
  GAME,
}

export interface CSAGameHandlers {
  onSaveRecord(): Promise<void>;
  onGameNext(): void;
  onGameEnd(): void;
  onFlipBoard(flip: boolean): void;
  onPieceBeat(): void;
  onBeepShort(): void;
  onBeepUnlimited(): void;
  onStopBeep(): void;
  onError(e: unknown): void;
}

export class CSAGameManager {
  private _state = CSAGameState.OFFLINE;
  private _setting = defaultCSAGameSetting();
  private sessionID = 0;
  private repeat = 0;
  private player?: Player;
  private gameSummary = emptyCSAGameSummary();
  private searchInfo?: SearchInfo;
  private playerBuilder = defaultPlayerBuilder();

  constructor(
    private recordManager: RecordManager,
    private blackClock: Clock,
    private whiteClock: Clock,
    private handlers: CSAGameHandlers
  ) {}

  get state(): CSAGameState {
    return this._state;
  }

  get setting(): CSAGameSetting {
    return this._setting;
  }

  get isMyTurn(): boolean {
    const color = this.recordManager.record.position.color;
    return color === this.gameSummary.myColor;
  }

  login(setting: CSAGameSetting, playerBuilder: PlayerBuilder): Promise<void> {
    if (this.sessionID) {
      throw new Error("CSAGameManager#start: session already exists");
    }
    this._setting = setting;
    this.playerBuilder = playerBuilder;
    this.repeat = 0;
    return this.relogin();
  }

  private async relogin(): Promise<void> {
    this.repeat++;
    this._state = CSAGameState.WAITING_LOGIN;
    try {
      this.player = await this.playerBuilder.build(
        this._setting.player,
        (info) => this.recordManager.updateEnemySearchInfo(info)
      );
      this.sessionID = await api.csaLogin(this._setting.server);
      this._state = CSAGameState.READY;
      csaGameManagers[this.sessionID] = this;
      this.handlers.onGameNext();
    } catch (e) {
      this.close(true);
      throw e;
    }
  }

  stop(): void {
    if (this.sessionID) {
      api.csaStop(this.sessionID);
    }
  }

  logout(): void {
    this.close(true);
  }

  private close(doNotRepeat?: boolean): void {
    if (this._state === CSAGameState.OFFLINE) {
      return;
    }
    if (this.sessionID) {
      delete csaGameManagers[this.sessionID];
      api.csaLogout(this.sessionID).catch((e) => {
        this.handlers.onError(e);
      });
      this.sessionID = 0;
    }
    if (this.player) {
      this.player.close().catch((e) => {
        this.handlers.onError(e);
      });
      this.player = undefined;
    }
    this.blackClock.stop();
    this.whiteClock.stop();
    this._state = CSAGameState.OFFLINE;
    if (doNotRepeat || this.repeat >= this.setting.repeat) {
      this.handlers.onGameEnd();
      return;
    }
    this.relogin().catch((e) => {
      this.handlers.onError(e);
    });
  }

  onGameSummary(gameSummary: CSAGameSummary): void {
    this.gameSummary = gameSummary;
    api.csaAgree(this.sessionID, this.gameSummary.id);
  }

  onReject(): void {
    this.close();
  }

  onStart(playerStates: CSAPlayerStates): void {
    this.recordManager.importRecord(
      this.gameSummary.position,
      RecordFormatType.CSA
    );
    this.recordManager.setGameStartMetadata({
      gameTitle: this.gameSummary.id,
      blackName: this.gameSummary.blackPlayerName,
      whiteName: this.gameSummary.whitePlayerName,
      timeLimit: {
        timeSeconds:
          (this.gameSummary.totalTime * this.gameSummary.timeUnitMs) / 1e3,
        byoyomi: (this.gameSummary.byoyomi * this.gameSummary.timeUnitMs) / 1e3,
        increment:
          (this.gameSummary.increment * this.gameSummary.timeUnitMs) / 1e3,
      },
    });
    if (this.setting.autoFlip && this.handlers.onFlipBoard) {
      this.handlers.onFlipBoard(this.gameSummary.myColor === Color.WHITE);
    }
    this._state = CSAGameState.GAME;
    this.next(playerStates);
  }

  onMove(data: string, playerStates: CSAPlayerStates) {
    const isMyMove = this.isMyTurn;
    const move = parseCSAMove(this.recordManager.record.position, data);
    if (move instanceof Error) {
      this.handlers.onError(`解釈できない指し手 [${data}]: ${move.message}`);
      return;
    }
    const parsed = /^.*,T([0-9]+)$/.exec(data);
    const elapsedMs = parsed
      ? Number(parseInt(parsed[1])) * this.gameSummary.timeUnitMs
      : 0;
    this.recordManager.appendMove({
      move,
      moveOption: {
        ignoreValidation: true,
      },
      elapsedMs,
    });
    if (isMyMove && this.searchInfo) {
      this.recordManager.updateSearchInfo(
        SearchEngineType.PLAYER,
        this.searchInfo
      );
    }
    if (isMyMove && this.searchInfo && this.setting.enableComment) {
      const comment = buildSearchComment(
        SearchEngineType.PLAYER,
        this.searchInfo
      );
      this.recordManager.appendComment(comment, CommentBehavior.APPEND);
    }
    this.handlers.onPieceBeat();
    this.next(playerStates);
  }

  onGameResult(move: CSASpecialMove, gameResult: CSAGameResult): void {
    this.recordManager.appendMove({
      move: this.gameResultToSpecialMove(move, gameResult),
    });
    if (this.setting.enableAutoSave) {
      this.handlers.onSaveRecord().catch((e) => {
        this.handlers.onError(`棋譜の保存に失敗しました: ${e}`);
      });
    }
    this.close();
  }

  private gameResultToSpecialMove(
    move: CSASpecialMove,
    gameResult: CSAGameResult
  ): SpecialMove {
    const color = this.recordManager.record.position.color;
    switch (move) {
      case CSASpecialMove.RESIGN:
        return SpecialMove.RESIGN;
      case CSASpecialMove.SENNICHITE:
        return SpecialMove.REPETITION_DRAW;
      case CSASpecialMove.OUTE_SENNICHITE:
      case CSASpecialMove.ILLEGAL_MOVE:
      case CSASpecialMove.ILLEGAL_ACTION:
        switch (gameResult) {
          case CSAGameResult.WIN:
            return color === this.gameSummary.myColor
              ? SpecialMove.FOUL_WIN
              : SpecialMove.FOUL_LOSE;
          case CSAGameResult.LOSE:
            return color === this.gameSummary.myColor
              ? SpecialMove.FOUL_LOSE
              : SpecialMove.FOUL_WIN;
        }
        break;
      case CSASpecialMove.TIME_UP:
        return SpecialMove.TIMEOUT;
      case CSASpecialMove.JISHOGI:
        return SpecialMove.ENTERING_OF_KING;
      case CSASpecialMove.MAX_MOVES:
        return SpecialMove.IMPASS;
    }

    if (gameResult === CSAGameResult.DRAW) {
      return SpecialMove.DRAW;
    }
    return SpecialMove.INTERRUPT;
  }

  onClose(): void {
    this.close(true);
  }

  private next(playerStates: CSAPlayerStates): void {
    this.blackClock.stop();
    this.whiteClock.stop();
    const clockSetting = {
      byoyomi: (this.gameSummary.byoyomi * this.gameSummary.timeUnitMs) / 1e3,
      onBeepShort: () => this.handlers.onBeepShort(),
      onBeepUnlimited: () => this.handlers.onBeepUnlimited(),
      onStopBeep: () => this.handlers.onStopBeep(),
    };
    this.blackClock.setup({
      ...clockSetting,
      timeMs: playerStates.black.time * this.gameSummary.timeUnitMs,
    });
    this.whiteClock.setup({
      ...clockSetting,
      timeMs: playerStates.white.time * this.gameSummary.timeUnitMs,
    });
    const color = this.recordManager.record.position.color;
    if (color === Color.BLACK) {
      this.blackClock.start();
    } else {
      this.whiteClock.start();
    }
    if (!this.player) {
      this.handlers.onError(
        "想定されない問題が発生しました。CSA サーバーからデータを受信しましたが、プレイヤーが初期化されていません。"
      );
      return;
    }
    const timeLimit = {
      timeSeconds:
        (this.gameSummary.totalTime * this.gameSummary.timeUnitMs) / 1e3,
      byoyomi: (this.gameSummary.byoyomi * this.gameSummary.timeUnitMs) / 1e3,
      increment:
        (this.gameSummary.increment * this.gameSummary.timeUnitMs) / 1e3,
    };
    if (color === this.gameSummary.myColor) {
      this.player
        .startSearch(
          this.recordManager.record,
          timeLimit,
          playerStates.black.time * this.gameSummary.timeUnitMs,
          playerStates.white.time * this.gameSummary.timeUnitMs,
          {
            onMove: this.onPlayerMove.bind(this),
            onResign: this.onPlayerResign.bind(this),
            onWin: this.onPlayerWin.bind(this),
            onError: this.onPlayerError.bind(this),
          }
        )
        .catch((e) => {
          this.handlers.onError(
            new Error(
              "CSAGameManager#next: プレイヤーにコマンドを送信できませんでした: " +
                e
            )
          );
        });
    } else {
      this.player
        .startPonder(
          this.recordManager.record,
          timeLimit,
          this.blackClock.timeMs,
          this.whiteClock.timeMs
        )
        .catch((e) => {
          this.handlers.onError(
            new Error(
              "CSAGameManager#next: プレイヤーにPonderコマンドを送信できませんでした: " +
                e
            )
          );
        });
    }
  }

  private onPlayerMove(move: Move, info?: SearchInfo): void {
    this.searchInfo = info;
    let score: number | undefined = undefined;
    let pv: string | undefined = undefined;
    switch (this._setting.server.protocolVersion) {
      case CSAProtocolVersion.V121:
        break;
      case CSAProtocolVersion.V121_FLOODGATE:
        score = info?.score;
        if (info?.pv) {
          for (const move of info.pv) {
            pv = pv ? pv + " " : "";
            pv += formatCSAMove(move);
          }
        }
        break;
    }
    api.csaMove(this.sessionID, formatCSAMove(move), score, pv);
  }

  private onPlayerResign(): void {
    api.csaResign(this.sessionID);
  }

  private onPlayerWin(): void {
    api.csaWin(this.sessionID);
  }

  private onPlayerError(e: unknown): void {
    this.handlers.onError(e);
  }
}

const csaGameManagers: { [sessionID: number]: CSAGameManager } = {};

export function onCSAGameSummary(
  sessionID: number,
  gameSummary: CSAGameSummary
): void {
  const manager = csaGameManagers[sessionID];
  if (manager) {
    manager.onGameSummary(gameSummary);
  }
}

export function onCSAReject(sessionID: number): void {
  const manager = csaGameManagers[sessionID];
  if (manager) {
    manager.onReject();
  }
}

export function onCSAStart(
  sessionID: number,
  playerStates: CSAPlayerStates
): void {
  const manager = csaGameManagers[sessionID];
  if (manager) {
    manager.onStart(playerStates);
  }
}

export function onCSAMove(
  sessionID: number,
  move: string,
  playerStates: CSAPlayerStates
): void {
  const manager = csaGameManagers[sessionID];
  if (manager) {
    manager.onMove(move, playerStates);
  }
}

export function onCSAGameResult(
  sessionID: number,
  specialMove: CSASpecialMove,
  gameResult: CSAGameResult
) {
  const manager = csaGameManagers[sessionID];
  if (manager) {
    manager.onGameResult(specialMove, gameResult);
  }
}

export function onCSAClose(sessionID: number) {
  const manager = csaGameManagers[sessionID];
  if (manager) {
    manager.onClose();
  }
}
