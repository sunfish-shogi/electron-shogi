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
import { defaultPlayerBuilder, PlayerBuilder } from "@/players/builder";

export interface GameHandlers {
  onSaveRecord(): Promise<void>;
  onGameNext(): void;
  onGameEnd(gameResults: GameResults, specialMove: SpecialMove): void;
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
  private gameResults: GameResults = newGameResults("", "");
  private lastEventID: number;

  constructor(
    private recordManager: RecordManager,
    private blackClock: Clock,
    private whiteClock: Clock,
    private handlers: GameHandlers
  ) {
    this.state = GameState.IDLE;
    this._setting = defaultGameSetting();
    this.lastEventID = 0;
  }

  get setting(): GameSetting {
    return this._setting;
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
      this.startPly = this.recordManager.record.current.number;
    }
    this.gameResults = newGameResults(setting.black.name, setting.white.name);
    await this.nextGame();
  }

  private async nextGame(): Promise<void> {
    this.repeat++;
    if (this.setting.startPosition) {
      this.recordManager.reset(this.setting.startPosition);
    } else if (this.recordManager.record.current.number !== this.startPly) {
      this.recordManager.changePly(this.startPly);
      this.recordManager.removeNextMove();
    }
    this.recordManager.setGameStartMetadata({
      gameTitle:
        this.setting.repeat >= 2
          ? `連続対局 ${this.repeat}/${this.setting.repeat}`
          : undefined,
      blackName: this.setting.black.name,
      whiteName: this.setting.white.name,
      timeLimit: this.setting.timeLimit,
    });
    const clockSetting = {
      timeMs: this.setting.timeLimit.timeSeconds * 1e3,
      byoyomi: this.setting.timeLimit.byoyomi,
      increment: this.setting.timeLimit.increment,
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
    try {
      this.blackPlayer = await this.playerBuilder.build(
        this.setting.black,
        (info) => this.recordManager.updateEnemySearchInfo(info)
      );
      this.whitePlayer = await this.playerBuilder.build(
        this.setting.white,
        (info) => this.recordManager.updateEnemySearchInfo(info)
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
    this.handlers.onGameNext();
    setTimeout(() => this.nextMove());
  }

  private nextMove(): void {
    if (this.state !== GameState.ACTIVE) {
      this.handlers.onError(
        "GameManager#nextMove: 予期せぬステータスです:" + this.state
      );
      return;
    }
    if (
      this._setting.maxMoves &&
      this.recordManager.record.current.number >= this._setting.maxMoves
    ) {
      this.endGame(SpecialMove.IMPASS);
      return;
    }
    const color = this.recordManager.record.position.color;
    this.getActiveClock().start();
    const player = this.getPlayer(color);
    const ponderPlayer = this.getPlayer(reverseColor(color));
    if (!player || !ponderPlayer) {
      this.handlers.onError(
        "GameManager#nextMove: プレイヤーが初期化されていません。"
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
            "GameManager#nextMove: プレイヤーにコマンドを送信できませんでした: " +
              e
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
            "GameManager#nextMove: プレイヤーにPonderコマンドを送信できませんでした: " +
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

  endGame(specialMove: SpecialMove): void {
    if (this.state !== GameState.ACTIVE && this.state !== GameState.PENDING) {
      return;
    }
    this.state = GameState.BUSSY;
    const color = this.recordManager.record.position.color;
    Promise.resolve()
      .then(() => {
        return this.sendGameResults(color, specialMove);
      })
      .then(() => {
        return this.closePlayers();
      })
      .then(() => {
        this.getActiveClock().pause();
        this.recordManager.appendMove({
          move: specialMove,
          elapsedMs: this.getActiveClock().elapsedMs,
        });
        this.recordManager.setGameEndMetadata();
        this.updateGameResults(color, specialMove);
        this.state = GameState.IDLE;
      })
      .then(() => {
        if (this._setting.enableAutoSave) {
          return this.handlers.onSaveRecord();
        }
      })
      .then(() => {
        const complete =
          specialMove === SpecialMove.INTERRUPT ||
          this.repeat >= this.setting.repeat;
        if (complete) {
          this.handlers.onGameEnd(this.gameResults, specialMove);
          return;
        }
        if (this.setting.swapPlayers) {
          this.swapPlayers();
        }
        this.nextGame().catch((e) => {
          this.handlers.onError(e);
        });
      })
      .catch((e) => {
        this.handlers.onError(e);
        this.state = GameState.PENDING;
      });
  }

  private updateGameResults(color: Color, specialMove: SpecialMove): void {
    const gameResult = specialMoveToPlayerGameResult(
      color,
      Color.BLACK,
      specialMove
    );
    switch (gameResult) {
      case GameResult.WIN:
        this.gameResults.player1.win++;
        break;
      case GameResult.LOSE:
        this.gameResults.player2.win++;
        break;
      case GameResult.DRAW:
        this.gameResults.draw++;
        break;
      default:
        this.gameResults.invalid++;
        break;
    }
    this.gameResults.total++;
  }

  private swapPlayers(): void {
    this._setting = {
      ...this.setting,
      black: this.setting.white,
      white: this.setting.black,
    };
    this.gameResults = {
      ...this.gameResults,
      player1: this.gameResults.player2,
      player2: this.gameResults.player1,
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
