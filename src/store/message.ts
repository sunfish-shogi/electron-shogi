export class MessageStore {
  private _queue: string[];

  constructor() {
    this._queue = [];
  }

  get message(): string {
    return this._queue[0];
  }

  get hasMessage(): boolean {
    return this._queue.length !== 0;
  }

  enqueue(message: string): void {
    this._queue.push(message);
  }

  dequeue(): void {
    this._queue.shift();
  }
}

export type MessageState = {
  queue: string[];
};
