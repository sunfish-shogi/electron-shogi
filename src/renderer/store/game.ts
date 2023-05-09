import { LogLevel } from "@/common/log";
import api from "@/renderer/ipc/api";
import { Player, SearchInfo } from "@/renderer/players/player";
import { defaultGameSetting, GameSetting } from "@/common/settings/game";
import {
  Color,
  getMoveDisplayText,
  Move,
  reverseColor,
  SpecialMove,
} from "@/common/shogi";
import { CommentBehavior } from "@/common/settings/analysis";
import { RecordManager, SearchInfoSenderType } from "./record";
import { Clock } from "./clock";
import {
  defaultPlayerBuilder,
  PlayerBuilder,
} from "@/renderer/players/builder";
import { GameResult } from "@/common/player";
import { t } from "@/common/i18n";

enum GameState {
  IDLE = "idle",
  ACTIVE = "active",
  PENDING = "pending",
  BUSSY = "bussy",
}

export type PlayerGameResults = {
  name: string;
  win: number;
};

export type GameResults = {
  player1: PlayerGameResults;
  player2: PlayerGameResults;
  draw: number;
  invalid: number;
  total: number;
};

type SaveRecordCallback = () => void;
type GameNextCallback = () => void;
type GameEndCallback = (results: GameResults, specialMove: SpecialMove) => void;
type PieceBeatCallback = () => void;
type BeepShortCallback = () => void;
type BeepUnlimitedCallback = () => void;
type StopBeepCallback = () => void;
type ErrorCallback = (e: unknown) => void;

function newGameResults(name1: string, name2: string): GameResults {
  return {
    player1: { name: name1, win: 0 },
    player2: { name: name2, win: 0 },
    draw: 0,
    invalid: 0,
    total: 0,
  };
}

export class GameManager {
  private state: GameState;
  private _setting: GameSetting;
  private startPly = 0;
  private repeat = 0;
  private blackPlayer?: Player;
  private whitePlayer?: Player;
  private playerBuilder = defaultPlayerBuilder();
  private _results: GameResults = newGameResults("", "");
  private lastEventID: number;
  private onSaveRecord: SaveRecordCallback = () => {
    /* noop */
  };
  private onGameNext: GameNextCallback = () => {
    /* noop */
  };
  private onGameEnd: GameEndCallback = () => {
    /* noop */
  };
  private onPieceBeat: PieceBeatCallback = () => {
    /* noop */
  };
  private onBeepShort: BeepShortCallback = () => {
    /* noop */
  };
  private onBeepUnlimited: BeepUnlimitedCallback = () => {
    /* noop */
  };
  private onStopBeep: StopBeepCallback = () => {
    /* noop */
  };
  private onError: ErrorCallback = () => {
    /* noop */
  };

  constructor(
    private recordManager: RecordManager,
    private blackClock: Clock,
    private whiteClock: Clock
  ) {
    this.state = GameState.IDLE;
    this._setting = defaultGameSetting();
    this.lastEventID = 0;
  }

  on(event: "saveRecord", handler: SaveRecordCallback): this;
  on(event: "gameNext", handler: GameNextCallback): this;
  on(event: "gameEnd", handler: GameEndCallback): this;
  on(event: "pieceBeat", handler: PieceBeatCallback): this;
  on(event: "beepShort", handler: BeepShortCallback): this;
  on(event: "beepUnlimited", handler: BeepUnlimitedCallback): this;
  on(event: "stopBeep", handler: StopBeepCallback): this;
  on(event: "error", handler: ErrorCallback): this;
  on(event: string, handler: unknown): this {
    switch (event) {
      case "saveRecord":
        this.onSaveRecord = handler as SaveRecordCallback;
        break;
      case "gameNext":
        this.onGameNext = handler as GameNextCallback;
        break;
      case "gameEnd":
        this.onGameEnd = handler as GameEndCallback;
        break;
      case "pieceBeat":
        this.onPieceBeat = handler as PieceBeatCallback;
        break;
      case "beepShort":
        this.onBeepShort = handler as BeepShortCallback;
        break;
      case "beepUnlimited":
        this.onBeepUnlimited = handler as BeepUnlimitedCallback;
        break;
      case "stopBeep":
        this.onStopBeep = handler as StopBeepCallback;
        break;
      case "error":
        this.onError = handler as ErrorCallback;
        break;
    }
    return this;
  }

  get setting(): GameSetting {
    return this._setting;
  }

  get results(): GameResults {
    return this._results;
  }

  async startGame(
    setting: GameSetting,
    playerBuilder: PlayerBuilder
  ): Promise<void> {
    if (this.state !== GameState.IDLE) {
      throw Error(
        "GameManager#startGame: 前回の対局が正常に終了できていません。アプリを再起動してください。"
      );
    }
    this._setting = setting;
    this.playerBuilder = playerBuilder;
    this.repeat = 0;
    if (!setting.startPosition) {
      // 連続対局用に何手目から開始するかを記憶する。
      this.startPly = this.recordManager.record.current.ply;
    }
    this._results = newGameResults(setting.black.name, setting.white.name);
    await this.nextGame();
  }

  private async nextGame(): Promise<void> {
    // 連続対局の回数をカウントアップする。
    this.repeat++;
    // 初期局面を設定する。
    if (this.setting.startPosition) {
      this.recordManager.reset(this.setting.startPosition);
    } else if (this.recordManager.record.current.ply !== this.startPly) {
      this.recordManager.changePly(this.startPly);
      this.recordManager.removeNextMove();
    }
    // 対局のメタデータを設定する。
    this.recordManager.setGameStartMetadata({
      gameTitle:
        this.setting.repeat >= 2
          ? `連続対局 ${this.repeat}/${this.setting.repeat}`
          : undefined,
      blackName: this.setting.black.name,
      whiteName: this.setting.white.name,
      timeLimit: this.setting.timeLimit,
    });
    // 対局時計を設定する。
    const clockSetting = {
      timeMs: this.setting.timeLimit.timeSeconds * 1e3,
      byoyomi: this.setting.timeLimit.byoyomi,
      increment: this.setting.timeLimit.increment,
      onBeepShort: () => this.onBeepShort(),
      onBeepUnlimited: () => this.onBeepUnlimited(),
      onStopBeep: () => this.onStopBeep(),
    };
    this.blackClock.setup({
      ...clockSetting,
      onTimeout: () => {
        this.timeout(Color.BLACK);
      },
    });
    this.whiteClock.setup({
      ...clockSetting,
      onTimeout: () => {
        this.timeout(Color.WHITE);
      },
    });
    // プレイヤーを初期化する。
    try {
      this.blackPlayer = await this.playerBuilder.build(
        this.setting.black,
        (info) =>
          this.recordManager.updateSearchInfo(
            SearchInfoSenderType.OPPONENT,
            info
          )
      );
      this.whitePlayer = await this.playerBuilder.build(
        this.setting.white,
        (info) =>
          this.recordManager.updateSearchInfo(
            SearchInfoSenderType.OPPONENT,
            info
          )
      );
    } catch (e) {
      try {
        await this.closePlayers();
      } catch (errorOnClose) {
        this.onError(errorOnClose);
      }
      throw e;
    }
    // State を更新する。
    this.state = GameState.ACTIVE;
    // ハンドラーを呼び出す。
    this.onGameNext();
    // 最初の手番へ移る。
    setTimeout(() => this.nextMove());
  }

  private nextMove(): void {
    if (this.state !== GameState.ACTIVE) {
      return;
    }
    // 最大手数に到達したら終了する。
    if (
      this._setting.maxMoves &&
      this.recordManager.record.current.ply >= this._setting.maxMoves
    ) {
      this.endGame(SpecialMove.IMPASS);
      return;
    }
    // 手番側の時計をスタートする。
    this.getActiveClock().start();
    // プレイヤーを取得する。
    const color = this.recordManager.record.position.color;
    const player = this.getPlayer(color);
    const ponderPlayer = this.getPlayer(reverseColor(color));
    if (!player || !ponderPlayer) {
      this.onError(
        new Error("GameManager#nextMove: プレイヤーが初期化されていません。")
      );
      return;
    }
    // イベント ID を発行する。
    const eventID = this.issueEventID();
    // 手番側のプレイヤーの思考を開始する。
    player
      .startSearch(
        this.recordManager.record,
        this.setting.timeLimit,
        this.blackClock.timeMs,
        this.whiteClock.timeMs,
        {
          onMove: (move, info) => this.onMove(eventID, move, info),
          onResign: () => this.onResign(eventID),
          onWin: () => this.onWin(eventID),
          onError: (e) => this.onError(e),
        }
      )
      .catch((e) => {
        this.onError(
          new Error(`GameManager#nextMove: ${t.failedToSendGoCommand}: ${e}`)
        );
      });
    // Ponder を開始する。
    ponderPlayer
      .startPonder(
        this.recordManager.record,
        this.setting.timeLimit,
        this.blackClock.timeMs,
        this.whiteClock.timeMs
      )
      .catch((e) => {
        this.onError(
          new Error(
            `GameManager#nextMove: ${t.failedToSendPonderCommand}: ${e}`
          )
        );
      });
  }

  private onMove(eventID: number, move: Move, info?: SearchInfo): void {
    if (eventID !== this.lastEventID) {
      api.log(LogLevel.ERROR, "GameManager#onMove: event ID already disabled");
      return;
    }
    if (this.state !== GameState.ACTIVE) {
      api.log(
        LogLevel.ERROR,
        "GameManager#onMove: invalid state: " + this.state
      );
      return;
    }
    // 合法手かどうかをチェックする。
    if (!this.recordManager.record.position.isValidMove(move)) {
      this.onError(
        "反則手: " +
          getMoveDisplayText(this.recordManager.record.position, move)
      );
      this.endGame(SpecialMove.FOUL_LOSE);
      return;
    }
    // 手番側の時計をストップする。
    this.getActiveClock().stop();
    // 指し手を追加して局面を進める。
    this.recordManager.appendMove({
      move,
      moveOption: { ignoreValidation: true },
      elapsedMs: this.getActiveClock().elapsedMs,
    });
    // 評価値を記録する。
    if (info) {
      this.recordManager.updateSearchInfo(SearchInfoSenderType.PLAYER, info);
    }
    // コメントを追加する。
    if (info && this.setting.enableComment) {
      this.recordManager.appendSearchComment(
        SearchInfoSenderType.PLAYER,
        info,
        CommentBehavior.APPEND
      );
    }
    // 駒音を鳴らす。
    this.onPieceBeat();
    // 千日手をチェックする。
    const faulColor = this.recordManager.record.perpetualCheck;
    if (faulColor) {
      // 連続王手の場合は王手した側を反則負けとする。
      if (faulColor === this.recordManager.record.position.color) {
        this.endGame(SpecialMove.FOUL_LOSE);
        return;
      } else {
        this.endGame(SpecialMove.FOUL_WIN);
        return;
      }
    } else if (this.recordManager.record.repetition) {
      // シンプルな千日手の場合は引き分けとする。
      this.endGame(SpecialMove.REPETITION_DRAW);
      return;
    }
    // 次の手番へ移る。
    this.nextMove();
  }

  private onResign(eventID: number): void {
    if (eventID !== this.lastEventID) {
      api.log(
        LogLevel.ERROR,
        "GameManager#onResign: event ID already disabled"
      );
      return;
    }
    if (this.state !== GameState.ACTIVE) {
      api.log(
        LogLevel.ERROR,
        "GameManager#onResign: invalid state: " + this.state
      );
      return;
    }
    this.endGame(SpecialMove.RESIGN);
  }

  private onWin(eventID: number): void {
    if (eventID !== this.lastEventID) {
      api.log(LogLevel.ERROR, "GameManager#onWin: event ID already disabled");
      return;
    }
    if (this.state !== GameState.ACTIVE) {
      api.log(
        LogLevel.ERROR,
        "GameManager#onWin: invalid state: " + this.state
      );
      return;
    }
    this.endGame(SpecialMove.ENTERING_OF_KING);
  }

  private timeout(color: Color): void {
    // 時計音を止める。
    this.onStopBeep();
    // エンジンの時間切れが無効の場合は通知を送って対局を継続する。
    const player = this.getPlayer(color);
    if (player && player.isEngine() && !this.setting.enableEngineTimeout) {
      player.stop().catch((e) => {
        this.onError(
          new Error(`GameManager#timeout: ${t.failedToSendStopCommand}: ${e}`)
        );
      });
      return;
    }
    // 時間切れ負けで対局を終了する。
    this.endGame(SpecialMove.TIMEOUT);
  }

  endGame(specialMove: SpecialMove): void {
    if (this.state !== GameState.ACTIVE && this.state !== GameState.PENDING) {
      return;
    }
    this.state = GameState.BUSSY;
    const color = this.recordManager.record.position.color;
    Promise.resolve()
      .then(() => {
        // プレイヤーに対局結果を通知する。
        return this.sendGameResults(color, specialMove);
      })
      .then(() => {
        // プレイヤーを解放する。
        return this.closePlayers();
      })
      .then(() => {
        // インクリメントせずに時計を停止する。
        this.getActiveClock().pause();
        // 終局理由を棋譜に記録する。
        this.recordManager.appendMove({
          move: specialMove,
          elapsedMs: this.getActiveClock().elapsedMs,
        });
        this.recordManager.setGameEndMetadata();
        // 連続対局の記録に追加する。
        this.addGameResults(color, specialMove);
        // State を更新する。
        this.state = GameState.IDLE;
        // 自動保存が有効な場合は棋譜を保存する。
        if (this._setting.enableAutoSave) {
          this.onSaveRecord();
        }
        // 連続対局の終了条件を満たしているか中断が要求されていれば終了する。
        const complete =
          specialMove === SpecialMove.INTERRUPT ||
          this.repeat >= this.setting.repeat;
        if (complete) {
          this.onGameEnd(this.results, specialMove);
          return;
        }
        // 連続対局時の手番入れ替えが有効ならプレイヤーを入れ替える。
        if (this.setting.swapPlayers) {
          this.swapPlayers();
        }
        // 次の対局を開始する。
        this.nextGame().catch((e) => {
          this.onError(e);
        });
      })
      .catch((e) => {
        this.onError(e);
        this.state = GameState.PENDING;
      });
  }

  private addGameResults(color: Color, specialMove: SpecialMove): void {
    const gameResult = specialMoveToPlayerGameResult(
      color,
      Color.BLACK,
      specialMove
    );
    switch (gameResult) {
      case GameResult.WIN:
        this._results.player1.win++;
        break;
      case GameResult.LOSE:
        this._results.player2.win++;
        break;
      case GameResult.DRAW:
        this._results.draw++;
        break;
      default:
        this._results.invalid++;
        break;
    }
    this._results.total++;
  }

  private swapPlayers(): void {
    this._setting = {
      ...this.setting,
      black: this.setting.white,
      white: this.setting.black,
    };
    this._results = {
      ...this.results,
      player1: this.results.player2,
      player2: this.results.player1,
    };
  }

  private async sendGameResults(
    color: Color,
    specialMove: SpecialMove
  ): Promise<void> {
    if (this.blackPlayer) {
      const gameResult = specialMoveToPlayerGameResult(
        color,
        Color.BLACK,
        specialMove
      );
      if (gameResult) {
        await this.blackPlayer.gameover(gameResult);
      }
    }
    if (this.whitePlayer) {
      const gameResult = specialMoveToPlayerGameResult(
        color,
        Color.WHITE,
        specialMove
      );
      if (gameResult) {
        await this.whitePlayer.gameover(gameResult);
      }
    }
  }

  private async closePlayers(): Promise<void> {
    if (this.blackPlayer) {
      await this.blackPlayer.close();
      this.blackPlayer = undefined;
    }
    if (this.whitePlayer) {
      await this.whitePlayer.close();
      this.whitePlayer = undefined;
    }
  }

  private getPlayer(color: Color): Player | undefined {
    switch (color) {
      case Color.BLACK:
        return this.blackPlayer;
      case Color.WHITE:
        return this.whitePlayer;
    }
  }

  private getActiveClock(): Clock {
    const color = this.recordManager.record.position.color;
    switch (color) {
      case Color.BLACK:
        return this.blackClock;
      case Color.WHITE:
        return this.whiteClock;
    }
  }

  private issueEventID(): number {
    this.lastEventID += 1;
    return this.lastEventID;
  }
}

function specialMoveToPlayerGameResult(
  currentColor: Color,
  playerColor: Color,
  specialMove: SpecialMove
): GameResult | null {
  switch (specialMove) {
    case SpecialMove.FOUL_WIN:
    case SpecialMove.ENTERING_OF_KING:
      return currentColor == playerColor ? GameResult.WIN : GameResult.LOSE;
    case SpecialMove.RESIGN:
    case SpecialMove.MATE:
    case SpecialMove.TIMEOUT:
    case SpecialMove.FOUL_LOSE:
      return currentColor == playerColor ? GameResult.LOSE : GameResult.WIN;
    case SpecialMove.IMPASS:
    case SpecialMove.REPETITION_DRAW:
      return GameResult.DRAW;
  }
  return null;
}
