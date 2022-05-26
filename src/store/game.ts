import { humanPlayer } from "@/players/human";
import { USIPlayer } from "@/players/usi";
import {
  defaultGameSetting,
  GameSetting,
  PlayerSetting,
} from "@/settings/game";
import { Color, ImmutableRecord, Move, Record, SpecialMove } from "@/shogi";
import * as uri from "@/uri";
import { GameResult, Player } from "../players/player";

export type PlayerState = {
  timeMs: number;
  byoyomi: number;
};

export interface GameHandlers {
  onMove(move: Move): ImmutableRecord;
  onEndGame(specialMove?: SpecialMove): void;
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
  private handlers: GameHandlers;
  private blackState: PlayerState;
  private whiteState: PlayerState;
  private timerHandle: number;
  private timerStart: Date;
  private lastTimeMs: number;
  private _elapsedMs: number;
  private _setting: GameSetting;
  private blackPlayer?: Player;
  private whitePlayer?: Player;
  private lastEventID: number;
  private record: ImmutableRecord;

  constructor(handlers: GameHandlers) {
    this.state = GameState.IDLE;
    this.handlers = handlers;
    this.blackState = { timeMs: 0, byoyomi: 0 };
    this.whiteState = { timeMs: 0, byoyomi: 0 };
    this.timerHandle = 0;
    this.timerStart = new Date();
    this.lastTimeMs = 0;
    this._elapsedMs = 0;
    this._setting = defaultGameSetting();
    this.lastEventID = 0;
    this.record = new Record();
  }

  get blackTimeMs(): number {
    return this.blackState.timeMs;
  }

  get blackByoyomi(): number {
    return this.blackState.byoyomi;
  }

  get whiteTimeMs(): number {
    return this.whiteState.timeMs;
  }

  get whiteByoyomi(): number {
    return this.whiteState.byoyomi;
  }

  get elapsedMs(): number {
    return this._elapsedMs;
  }

  get setting(): GameSetting {
    return this._setting;
  }

  async startGame(
    setting: GameSetting,
    record: ImmutableRecord
  ): Promise<void> {
    if (this.state !== GameState.IDLE) {
      throw Error(
        "前回の対局が正常に終了できていません。アプリを再起動してください。"
      );
    }
    this.blackState.timeMs = setting.timeLimit.timeSeconds * 1e3;
    this.blackState.byoyomi = setting.timeLimit.byoyomi;
    this.whiteState.timeMs = setting.timeLimit.timeSeconds * 1e3;
    this.whiteState.byoyomi = setting.timeLimit.byoyomi;
    this._setting = setting;
    this.record = record;
    try {
      this.blackPlayer = await this.buildPlayer(setting.black);
      this.whitePlayer = await this.buildPlayer(setting.white);
    } catch (e) {
      try {
        await this.closePlayers();
      } catch (errorOnClose) {
        this.handlers.onError(errorOnClose);
      }
      throw e;
    }
    this.state = GameState.ACTIVE;
    this.next();
  }

  private next(): void {
    if (this.state !== GameState.ACTIVE) {
      this.handlers.onError(
        "予期せぬステータスです: GameManager.next(): " + this.state
      );
      return;
    }
    const color = this.record.position.color;
    this.startTimer(color);
    const player = this.getPlayer(color);
    if (!player) {
      this.handlers.onError(
        "致命的なエラーが発生しました: GameManager.next(): player is undefined"
      );
      return;
    }
    const eventID = this.issueEventID();
    player
      .startSearch(
        this.record,
        this.setting,
        this.blackTimeMs,
        this.whiteTimeMs,
        {
          onMove: (move: Move): void => this.onMove(eventID, move),
          onResign: (): void => this.onResign(eventID),
          onWin: (): void => this.onWin(eventID),
        }
      )
      .catch((e) => {
        this.handlers.onError(
          new Error("プレイヤーにコマンドを送信できませんでした: " + e)
        );
      });
  }

  private onMove(eventID: number, move: Move): void {
    if (eventID !== this.lastEventID) {
      console.warn("指し手を受信しましたが既にイベントは無効です。");
      return;
    }
    if (this.state !== GameState.ACTIVE) {
      console.warn("指し手を受信しましたが既に対局中ではありません。");
      return;
    }
    if (!this.record.position.isValidMove(move)) {
      this.handlers.onError("反則手: " + move.getDisplayText());
      this.endGame(SpecialMove.FOUL_LOSE);
      return;
    }
    this.incrementTime(this.record.position.color);
    this.record = this.handlers.onMove(move);
    const faulColor = this.record.perpetualCheck;
    if (faulColor) {
      if (faulColor === this.record.position.color) {
        this.endGame(SpecialMove.FOUL_LOSE);
        return;
      } else {
        this.endGame(SpecialMove.FOUL_WIN);
        return;
      }
    } else if (this.record.repetition) {
      this.endGame(SpecialMove.REPETITION_DRAW);
      return;
    }
    this.next();
  }

  private onResign(eventID: number): void {
    if (eventID !== this.lastEventID) {
      console.warn("投了を受信しましたが既にイベントは無効です。");
      return;
    }
    if (this.state !== GameState.ACTIVE) {
      console.warn("投了を受信しましたが既に対局中ではありません。");
      return;
    }
    this.endGame(SpecialMove.RESIGN);
  }

  private onWin(eventID: number): void {
    if (eventID !== this.lastEventID) {
      console.warn("勝ち宣言を受信しましたが既にイベントは無効です。");
      return;
    }
    if (this.state !== GameState.ACTIVE) {
      console.warn("勝ち宣言を受信しましたが既に対局中ではありません。");
      return;
    }
    this.endGame(SpecialMove.ENTERING_OF_KING);
  }

  private onTimeout(): void {
    if (this.state !== GameState.ACTIVE) {
      this.handlers.onError(
        "予期せぬステータスです: GameManager.onTimeout(): " + this.state
      );
      return;
    }
    this.endGame(SpecialMove.TIMEOUT);
  }

  private startTimer(color: Color): void {
    this.stopTimer();
    const playerState = this.getPlayerState(color);
    this.timerStart = new Date();
    this.lastTimeMs = playerState.timeMs;
    playerState.byoyomi = this.setting.timeLimit.byoyomi;
    this._elapsedMs = 0;
    this.timerHandle = window.setInterval(() => {
      const lastTimeMs = playerState.timeMs;
      const lastByoyomi = playerState.byoyomi;
      const now = new Date();
      this._elapsedMs = now.getTime() - this.timerStart.getTime();
      const timeMs = this.lastTimeMs - this._elapsedMs;
      if (timeMs >= 0) {
        playerState.timeMs = timeMs;
      } else {
        playerState.timeMs = 0;
        playerState.byoyomi = Math.max(
          Math.ceil(this.setting.timeLimit.byoyomi + timeMs / 1e3),
          0
        );
      }
      if (playerState.timeMs === 0 && playerState.byoyomi === 0) {
        this.timeout(color);
        return;
      }
      const lastTime = Math.ceil(lastTimeMs / 1e3);
      const time = Math.ceil(playerState.timeMs / 1e3);
      const byoyomi = playerState.byoyomi;
      if (time === 0 && (lastTimeMs > 0 || byoyomi !== lastByoyomi)) {
        if (byoyomi <= 5) {
          this.handlers.onBeepUnlimited();
        } else if (byoyomi <= 10 || byoyomi % 10 === 0) {
          this.handlers.onBeepShort();
        }
      } else if (!this.setting.timeLimit.byoyomi && time !== lastTime) {
        if (time <= 5) {
          this.handlers.onBeepUnlimited();
        } else if (time <= 10 || time === 20 || time === 30 || time === 60) {
          this.handlers.onBeepShort();
        }
      }
    }, 100);
  }

  private timeout(color: Color): void {
    this.stopTimer();
    const player = this.getPlayer(color);
    if (player && player.isEngine() && !this.setting.enableEngineTimeout) {
      player.stop().catch((e) => {
        this.handlers.onError(
          new Error("プレイヤーにコマンドを送信できませんでした: " + e)
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
    this.stopTimer();
    this.endGameAsync(specialMove)
      .then(() => {
        this.state = GameState.IDLE;
      })
      .catch((e) => {
        this.handlers.onError(e);
        this.state = GameState.PENDING;
      });
  }

  private async endGameAsync(specialMove?: SpecialMove): Promise<void> {
    if (specialMove) {
      const color = this.record.position.color;
      await this.sendGameResults(color, specialMove);
    }
    await this.closePlayers();
    this.handlers.onEndGame(specialMove);
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

  private stopTimer(): void {
    this.handlers.onStopBeep();
    if (this.timerHandle) {
      window.clearInterval(this.timerHandle);
      this.timerHandle = 0;
    }
  }

  private incrementTime(color: Color): void {
    this.getPlayerState(color).timeMs += this.setting.timeLimit.increment * 1e3;
  }

  private async buildPlayer(playerSetting: PlayerSetting): Promise<Player> {
    if (playerSetting.uri === uri.ES_HUMAN) {
      return humanPlayer;
    } else if (uri.isUSIEngine(playerSetting.uri) && playerSetting.usi) {
      const player = new USIPlayer(playerSetting.usi);
      await player.launch();
      return player;
    }
    throw new Error("予期せぬプレイヤーURIです: " + playerSetting.uri);
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

  private getPlayerState(color: Color): PlayerState {
    switch (color) {
      case Color.BLACK:
        return this.blackState;
      case Color.WHITE:
        return this.whiteState;
    }
  }

  private issueEventID(): number {
    this.lastEventID += 1;
    return this.lastEventID;
  }
}
