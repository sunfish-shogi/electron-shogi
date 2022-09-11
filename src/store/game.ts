import { LogLevel } from "@/ipc/log";
import api from "@/ipc/api";
import { GameResult, Player, SearchInfo } from "@/players/player";
import { defaultGameSetting, GameSetting } from "@/settings/game";
import { Color, Move, reverseColor, SpecialMove } from "@/shogi";
import {
  buildSearchComment,
  CommentBehavior,
  RecordManager,
  SearchEngineType,
} from "./record";
import { Clock } from "./clock";
import { PlayerBuilder } from "@/players/builder";

export interface GameHandlers {
  onSaveRecord(): Promise<void>;
  onGameEnd(specialMove?: SpecialMove): void;
  onPieceBeat(): void;
  onBeepShort(): void;
  onBeepUnlimited(): void;
  onStopBeep(): void;
  onError(e: unknown): void;
}

enum GameState {
  IDLE = "idle",
  ACTIVE = "active",
  PENDING = "pending",
  BUSSY = "bussy",
}

export class GameManager {
  private state: GameState;
  private _setting: GameSetting;
  private blackPlayer?: Player;
  private whitePlayer?: Player;
  private lastEventID: number;

  constructor(
    private recordManager: RecordManager,
    private blackClock: Clock,
    private whiteClock: Clock,
    private playerBuilder: PlayerBuilder,
    private handlers: GameHandlers
  ) {
    this.state = GameState.IDLE;
    this._setting = defaultGameSetting();
    this.lastEventID = 0;
  }

  get setting(): GameSetting {
    return this._setting;
  }

  async startGame(setting: GameSetting): Promise<void> {
    if (this.state !== GameState.IDLE) {
      throw Error(
        "GameManager#startGame: 前回の対局が正常に終了できていません。アプリを再起動してください。"
      );
    }
    if (setting.startPosition) {
      this.recordManager.reset(setting.startPosition);
    }
    this.recordManager.setGameStartMetadata({
      blackName: setting.black.name,
      whiteName: setting.white.name,
      timeLimit: setting.timeLimit,
    });
    const clockSetting = {
      timeMs: setting.timeLimit.timeSeconds * 1e3,
      byoyomi: setting.timeLimit.byoyomi,
      increment: setting.timeLimit.increment,
      onBeepShort: () => this.handlers.onBeepShort(),
      onBeepUnlimited: () => this.handlers.onBeepUnlimited(),
      onStopBeep: () => this.handlers.onStopBeep(),
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
    this._setting = setting;
    try {
      this.blackPlayer = await this.playerBuilder.build(setting.black, (info) =>
        this.recordManager.updateEnemySearchInfo(info)
      );
      this.whitePlayer = await this.playerBuilder.build(setting.white, (info) =>
        this.recordManager.updateEnemySearchInfo(info)
      );
    } catch (e) {
      try {
        await this.closePlayers();
      } catch (errorOnClose) {
        this.handlers.onError(errorOnClose);
      }
      throw e;
    }
    this.state = GameState.ACTIVE;
    setTimeout(() => this.next());
  }

  private next(): void {
    if (this.state !== GameState.ACTIVE) {
      this.handlers.onError(
        "GameManager#next: 予期せぬステータスです:" + this.state
      );
      return;
    }
    const color = this.recordManager.record.position.color;
    this.getActiveClock().start();
    const player = this.getPlayer(color);
    const ponderPlayer = this.getPlayer(reverseColor(color));
    if (!player || !ponderPlayer) {
      this.handlers.onError(
        "GameManager#next: プレイヤーが初期化されていません。"
      );
      return;
    }
    const eventID = this.issueEventID();
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
          onError: (e) => this.handlers.onError(e),
        }
      )
      .catch((e) => {
        this.handlers.onError(
          new Error(
            "GameManager#next: プレイヤーにコマンドを送信できませんでした: " + e
          )
        );
      });
    ponderPlayer
      .startPonder(
        this.recordManager.record,
        this.setting.timeLimit,
        this.blackClock.timeMs,
        this.whiteClock.timeMs
      )
      .catch((e) => {
        this.handlers.onError(
          new Error(
            "GameManager#next: プレイヤーにPonderコマンドを送信できませんでした: " +
              e
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
    if (!this.recordManager.record.position.isValidMove(move)) {
      this.handlers.onError("反則手: " + move.getDisplayText());
      this.endGame(SpecialMove.FOUL_LOSE);
      return;
    }
    this.getActiveClock().stop();
    this.recordManager.appendMove({
      move,
      moveOption: { ignoreValidation: true },
      elapsedMs: this.getActiveClock().elapsedMs,
    });
    if (info) {
      this.recordManager.updateSearchInfo(SearchEngineType.PLAYER, info);
    }
    if (info && this.setting.enableComment) {
      const comment = buildSearchComment(SearchEngineType.PLAYER, info);
      this.recordManager.appendComment(comment, CommentBehavior.APPEND);
    }
    this.handlers.onPieceBeat();
    const faulColor = this.recordManager.record.perpetualCheck;
    if (faulColor) {
      if (faulColor === this.recordManager.record.position.color) {
        this.endGame(SpecialMove.FOUL_LOSE);
        return;
      } else {
        this.endGame(SpecialMove.FOUL_WIN);
        return;
      }
    } else if (this.recordManager.record.repetition) {
      this.endGame(SpecialMove.REPETITION_DRAW);
      return;
    }
    this.next();
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

  private onTimeout(): void {
    if (this.state !== GameState.ACTIVE) {
      this.handlers.onError(
        "GameManager#onTimeout: 予期せぬステータスです: " + this.state
      );
      return;
    }
    this.endGame(SpecialMove.TIMEOUT);
  }

  private timeout(color: Color): void {
    this.handlers.onStopBeep();
    const player = this.getPlayer(color);
    if (player && player.isEngine() && !this.setting.enableEngineTimeout) {
      player.stop().catch((e) => {
        this.handlers.onError(
          new Error(
            "GameManager#timeout: プレイヤーにコマンドを送信できませんでした: " +
              e
          )
        );
      });
      return;
    }
    this.onTimeout();
  }

  endGame(specialMove?: SpecialMove): void {
    if (this.state !== GameState.ACTIVE && this.state !== GameState.PENDING) {
      return;
    }
    this.state = GameState.BUSSY;
    Promise.resolve()
      .then(() => {
        if (!specialMove) {
          return;
        }
        const color = this.recordManager.record.position.color;
        return this.sendGameResults(color, specialMove);
      })
      .then(() => {
        return this.closePlayers();
      })
      .then(() => {
        this.getActiveClock().pause();
        this.recordManager.appendMove({
          move: specialMove || SpecialMove.INTERRUPT,
          elapsedMs: this.getActiveClock().elapsedMs,
        });
        this.recordManager.setGameEndMetadata();
        this.state = GameState.IDLE;
      })
      .then(() => {
        if (this._setting.enableAutoSave) {
          return this.handlers.onSaveRecord();
        }
      })
      .then(() => {
        this.handlers.onGameEnd(specialMove);
      })
      .catch((e) => {
        this.handlers.onError(e);
        this.state = GameState.PENDING;
      });
  }

  private async sendGameResults(
    color: Color,
    specialMove: SpecialMove
  ): Promise<void> {
    if (this.blackPlayer) {
      const gameResult = this.getGameResult(color, Color.BLACK, specialMove);
      if (gameResult) {
        await this.blackPlayer.gameover(gameResult);
      }
    }
    if (this.whitePlayer) {
      const gameResult = this.getGameResult(color, Color.WHITE, specialMove);
      if (gameResult) {
        await this.whitePlayer.gameover(gameResult);
      }
    }
  }

  private getGameResult(
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
      case SpecialMove.DRAW:
      case SpecialMove.REPETITION_DRAW:
        return GameResult.DRAW;
    }
    return null;
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
