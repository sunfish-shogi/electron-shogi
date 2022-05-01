export class ErrorStore {
  private _queue: Error[];

  constructor() {
    this._queue = [];
  }

  get errors(): Error[] {
    return this._queue;
  }

  get hasError(): boolean {
    return this._queue.length !== 0;
  }

  push(e: unknown): void {
    if (e instanceof Error) {
      this._queue.push(e);
    } else {
      this._queue.push(new Error("" + e));
    }
  }

  clear(): void {
    this._queue = [];
  }
}
