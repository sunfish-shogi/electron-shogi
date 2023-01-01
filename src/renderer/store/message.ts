export type ListItem = {
  text: string;
  children?: string[];
};

export type List = {
  type: "list";
  items: ListItem[];
};

export type Attachment = List;

export type Message = {
  text: string;
  attachments?: Attachment[];
};

export class MessageStore {
  private _queue: Message[] = [];

  get message(): Message {
    return this._queue[0];
  }

  get hasMessage(): boolean {
    return this._queue.length !== 0;
  }

  enqueue(message: Message): void {
    this._queue.push(message);
  }

  dequeue(): void {
    this._queue.shift();
  }
}
