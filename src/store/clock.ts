type ClockSetting = {
  timeMs: number;
  byoyomi: number;
  increment: number;
  onBeepShort?: () => void;
  onBeepUnlimited?: () => void;
  onStopBeep?: () => void;
  onTimeout?: () => void;
};

export class Clock {
  private _timeMs: number;
  private _byoyomi: number;
  private _elapsedMs: number;
  private timerHandle: number;
  private timerStart: number;
  private lastTimeMs: number;

  constructor(private setting: ClockSetting) {
    this._timeMs = this.setting.timeMs;
    this._byoyomi = this.setting.byoyomi;
    this._elapsedMs = 0;
    this.timerHandle = 0;
    this.timerStart = 0;
    this.lastTimeMs = 0;
  }

  get timeMs(): number {
    return this._timeMs;
  }

  get byoyomi(): number {
    return this._byoyomi;
  }

  get elapsedMs(): number {
    return this._elapsedMs;
  }

  start(): void {
    this.clearTimer();
    this.timerStart = Date.now();
    this.lastTimeMs = this._timeMs;
    this._byoyomi = this.setting.byoyomi;
    this._elapsedMs = 0;
    this.timerHandle = window.setInterval(() => {
      const lastTimeMs = this.timeMs;
      const lastByoyomi = this.byoyomi;
      this._elapsedMs = Date.now() - this.timerStart;
      const timeMs = this.lastTimeMs - this._elapsedMs;
      if (timeMs >= 0) {
        this._timeMs = timeMs;
      } else {
        this._timeMs = 0;
        this._byoyomi = Math.max(
          Math.ceil(this.setting.byoyomi + timeMs / 1e3),
          0
        );
      }
      if (this.timeMs === 0 && this.byoyomi === 0) {
        this.timeout();
        return;
      }
      this.fireBeep(lastTimeMs, lastByoyomi);
    }, 100);
  }

  private fireBeep(lastTimeMs: number, lastByoyomi: number): void {
    // 秒に切り上げる。
    let time = Math.ceil(this.timeMs / 1e3);
    let lastTime = Math.ceil(lastTimeMs / 1e3);
    // 持ち時間があって秒読みが付いていれば何もしない。
    if (time !== 0 && this.byoyomi !== 0) {
      return;
    }
    // 持ち時間がなくなった瞬間に短いビープを鳴らす。
    if (time === 0 && lastTime !== 0) {
      if (this.setting.onBeepShort) {
        this.setting.onBeepShort();
      }
      return;
    }
    // 秒読みがある場合はその値を使う。
    if (this.byoyomi !== 0) {
      time = this.byoyomi;
      lastTime = lastByoyomi;
    }
    // 前回から秒が変わっていなければ何もしない。
    if (time === lastTime) {
      return;
    }
    // 残り 5 秒で長音, 10 秒以下, 20, 30, 60 秒で単音を鳴らす。
    if (time <= 5) {
      if (this.setting.onBeepUnlimited) {
        this.setting.onBeepUnlimited();
      }
    } else if (time <= 10 || time === 20 || time === 30 || time === 60) {
      if (this.setting.onBeepShort) {
        this.setting.onBeepShort();
      }
    }
  }

  pause(): void {
    this.clearTimer();
  }

  stop(): void {
    this.clearTimer();
    this.incrementTime();
  }

  private timeout(): void {
    this.clearTimer();
    if (this.setting.onTimeout) {
      this.setting.onTimeout();
    }
  }

  private clearTimer(): void {
    if (this.timerHandle) {
      window.clearInterval(this.timerHandle);
      this.timerHandle = 0;
    }
    if (this.setting.onStopBeep) {
      this.setting.onStopBeep();
    }
  }

  private incrementTime(): void {
    this._timeMs += this.setting.increment * 1e3;
  }
}
