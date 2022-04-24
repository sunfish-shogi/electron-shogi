import { defaultGameSetting, GameSetting } from "@/settings/game";
import { Color } from "@/shogi";

export type PlayerState = {
  timeMs: number;
  byoyomi: number;
};

type TimerHandlers = {
  timeout: () => void;
  onBeepShort: () => void;
  onBeepUnlimited: () => void;
};

export class GameState {
  private black: PlayerState;
  private white: PlayerState;
  private timerHandle: number;
  private timerStart: Date;
  private lastTimeMs: number;
  private _elapsedMs: number;
  private _setting: GameSetting;

  constructor() {
    this.black = { timeMs: 0, byoyomi: 0 };
    this.white = { timeMs: 0, byoyomi: 0 };
    this.timerHandle = 0;
    this.timerStart = new Date();
    this.lastTimeMs = 0;
    this._elapsedMs = 0;
    this._setting = defaultGameSetting();
  }

  get blackTimeMs(): number {
    return this.black.timeMs;
  }

  get blackByoyomi(): number {
    return this.black.byoyomi;
  }

  get whiteTimeMs(): number {
    return this.white.timeMs;
  }

  get whiteByoyomi(): number {
    return this.white.byoyomi;
  }

  get elapsedMs(): number {
    return this._elapsedMs;
  }

  get setting(): GameSetting {
    return this._setting;
  }

  setup(setting: GameSetting): void {
    this.black.timeMs = setting.timeLimit.timeSeconds * 1e3;
    this.black.byoyomi = setting.timeLimit.byoyomi;
    this.white.timeMs = setting.timeLimit.timeSeconds * 1e3;
    this.white.byoyomi = setting.timeLimit.byoyomi;
    this._setting = setting;
  }

  private getPlayerState(color: Color): PlayerState {
    switch (color) {
      case Color.BLACK:
        return this.black;
      case Color.WHITE:
        return this.white;
    }
  }

  startTimer(color: Color, handlers: TimerHandlers): void {
    const playerState = this.getPlayerState(color);
    this.timerStart = new Date();
    this.lastTimeMs = playerState.timeMs;
    playerState.byoyomi = this.setting.timeLimit.byoyomi;
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
        handlers.timeout();
        return;
      }
      const lastTime = Math.ceil(lastTimeMs / 1e3);
      const time = Math.ceil(playerState.timeMs / 1e3);
      const byoyomi = playerState.byoyomi;
      if (time === 0 && (lastTimeMs > 0 || byoyomi !== lastByoyomi)) {
        if (byoyomi <= 5) {
          handlers.onBeepUnlimited();
        } else if (byoyomi <= 10 || byoyomi % 10 === 0) {
          handlers.onBeepShort();
        }
      } else if (!this.setting.timeLimit.byoyomi && time !== lastTime) {
        if (time <= 5) {
          handlers.onBeepUnlimited();
        } else if (time <= 10 || time === 20 || time === 30 || time === 60) {
          handlers.onBeepShort();
        }
      }
    }, 100);
  }

  incrementTime(color: Color): void {
    this.getPlayerState(color).timeMs += this.setting.timeLimit.increment * 1e3;
  }

  clearTimer(): void {
    if (this.timerHandle) {
      window.clearInterval(this.timerHandle);
      this.timerHandle = 0;
    }
    this._elapsedMs = 0;
  }
}
