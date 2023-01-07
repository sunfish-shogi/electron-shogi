import api from "@/renderer/ipc/api";
import {
  CSAGameResult,
  CSAGameSummary,
  CSAPlayerStates,
  CSASpecialMove,
  emptyCSAGameSummary,
} from "@/common/csa";
import {
  defaultPlayerBuilder,
  PlayerBuilder,
} from "@/renderer/players/builder";
import { Player, SearchInfo } from "@/renderer/players/player";
import {
  CSAGameSetting,
  CSAProtocolVersion,
  defaultCSAGameSetting,
} from "@/common/settings/csa";
import {
  Color,
  RecordFormatType,
  parseCSAMove,
  formatCSAMove,
  SpecialMove,
  Move,
} from "@/common/shogi";
import { Clock } from "./clock";
import { CommentBehavior } from "@/common/settings/analysis";
import {
  buildSearchComment,
  RecordManager,
  SearchInfoSenderType,
} from "./record";

export enum CSAGameState {
  OFFLINE,
  WAITING_LOGIN,
  READY,
  GAME,
}

export interface CSAGameHandlers {
  onSaveRecord(): void;
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
  private stopRequested = false;
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

  /**
   * CSA サーバーにログインする。
   */
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
    this._state = CSAGameState.WAITING_LOGIN;
    try {
      // プレイヤーを初期化する。
      this.player = await this.playerBuilder.build(
        this._setting.player,
        (info) =>
          this.recordManager.updateSearchInfo(SearchInfoSenderType.ENEMY, info)
      );
      // CSA サーバーにログインする。
      this.sessionID = await api.csaLogin(this._setting.server);
      // ステータスを更新する。
      this._state = CSAGameState.READY;
      entrySession(this.sessionID, this);
      this.handlers.onGameNext();
    } catch (e) {
      this.close(true);
      throw e;
    }
  }

  /**
   * CSA サーバーに中断を要求する。
   */
  stop(): void {
    if (this.sessionID) {
      this.stopRequested = true;
      api.csaStop(this.sessionID);
    }
  }

  /**
   * CSA サーバーからログアウトする。
   */
  logout(): void {
    this.close(true);
  }

  private close(doNotRepeat?: boolean): void {
    if (this._state === CSAGameState.OFFLINE) {
      return;
    }
    if (this.stopRequested) {
      doNotRepeat = true;
    }
    // CSA プロトコルのセッションが存在する場合は切断する。
    if (this.sessionID) {
      releaseSession(this.sessionID);
      api.csaLogout(this.sessionID).catch((e) => {
        this.handlers.onError(e);
      });
      this.sessionID = 0;
      this.stopRequested = false;
    }
    // プレイヤーが起動している場合は終了する。
    if (this.player) {
      this.player.close().catch((e) => {
        this.handlers.onError(e);
      });
      this.player = undefined;
    }
    // 時計を停止する。
    this.blackClock.stop();
    this.whiteClock.stop();
    // ステータスをオフラインに戻す。
    this._state = CSAGameState.OFFLINE;
    // 連続対局の条件を満たしていない場合はハンドラーを呼んで終了する。
    if (doNotRepeat || this.repeat >= this.setting.repeat) {
      this.handlers.onGameEnd();
      return;
    }
    // 連続対局の条件を満たしている場合は再ログインする。
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
    // 対局数をカウントアップする。
    this.repeat++;
    // 局面を初期化する。
    this.recordManager.importRecord(
      this.gameSummary.position,
      RecordFormatType.CSA
    );
    // 対局情報を初期化する。
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
    // 将棋盤の向きを調整する。
    if (this.setting.autoFlip && this.handlers.onFlipBoard) {
      this.handlers.onFlipBoard(this.gameSummary.myColor === Color.WHITE);
    }
    // ステータスを更新する。
    this._state = CSAGameState.GAME;
    // 次の処理を開始する。
    this.next(playerStates);
  }

  onMove(data: string, playerStates: CSAPlayerStates) {
    const isMyMove = this.isMyTurn;
    // 指し手を読み取る。
    const move = parseCSAMove(this.recordManager.record.position, data);
    if (move instanceof Error) {
      this.handlers.onError(
        `CSAGameManager#onMove: 解釈できない指し手 [${data}]: ${move.message}`
      );
      return;
    }
    // 消費時間を読み取る。
    const parsed = /^.*,T([0-9]+)$/.exec(data);
    const elapsedMs = parsed
      ? Number(parseInt(parsed[1])) * this.gameSummary.timeUnitMs
      : 0;
    // 局面を進める。
    this.recordManager.appendMove({
      move,
      moveOption: {
        ignoreValidation: true,
      },
      elapsedMs,
    });
    // 探索情報を記録する。
    if (isMyMove && this.searchInfo) {
      this.recordManager.updateSearchInfo(
        SearchInfoSenderType.PLAYER,
        this.searchInfo
      );
    }
    // コメントを記録する。
    if (isMyMove && this.searchInfo && this.setting.enableComment) {
      const comment = buildSearchComment(
        SearchInfoSenderType.PLAYER,
        this.searchInfo
      );
      this.recordManager.appendComment(comment, CommentBehavior.APPEND);
    }
    // 効果音を鳴らす。
    this.handlers.onPieceBeat();
    // 次の処理を開始する。
    this.next(playerStates);
  }

  onGameResult(move: CSASpecialMove, gameResult: CSAGameResult): void {
    // 終局理由を棋譜に記録する。
    this.recordManager.appendMove({
      move: this.gameResultToSpecialMove(move, gameResult),
    });
    // 自動保存が有効な場合は棋譜を保存する。
    if (this.setting.enableAutoSave) {
      this.handlers.onSaveRecord();
    }
    // セッションを終了する。
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
    this.close(!this.setting.autoRelogin);
  }

  private next(playerStates: CSAPlayerStates): void {
    // 時計を一時停止する。
    this.blackClock.stop();
    this.whiteClock.stop();
    // 時計をサーバーと同期する。
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
    // 時計をスタートする。
    const color = this.recordManager.record.position.color;
    if (color === Color.BLACK) {
      this.blackClock.start();
    } else {
      this.whiteClock.start();
    }
    // プレイヤーの状態を確認する。
    if (!this.player) {
      this.handlers.onError(
        "想定されない問題が発生しました。CSA サーバーからデータを受信しましたが、プレイヤーが初期化されていません。"
      );
      return;
    }
    // 次の指し手に適用される残り時間
    const timeLimit = {
      timeSeconds:
        (this.gameSummary.totalTime * this.gameSummary.timeUnitMs) / 1e3,
      byoyomi: (this.gameSummary.byoyomi * this.gameSummary.timeUnitMs) / 1e3,
      increment:
        (this.gameSummary.increment * this.gameSummary.timeUnitMs) / 1e3,
    };
    if (color === this.gameSummary.myColor) {
      // 自分の手番の場合は探索を開始する。
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
      // 相手の手番の場合は Ponder を開始する。
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
        // 通常の CSA プロトコルでは次の指し手のみを送信する。
        break;
      case CSAProtocolVersion.V121_FLOODGATE:
        // Floodgate 拡張では評価値と PV を送信する。
        score = info?.score;
        if (info?.pv) {
          for (const move of info.pv) {
            pv = pv ? pv + " " : "";
            pv += formatCSAMove(move);
          }
        }
        break;
    }
    // 指し手をサーバーに送信する。
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

function entrySession(sessionID: number, gameManager: CSAGameManager): void {
  csaGameManagers[sessionID] = gameManager;
}

function releaseSession(sessionID: number): void {
  delete csaGameManagers[sessionID];
}

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
