export enum CommandType {
  SEND = "send",
  RECEIVE = "receive",
  SYSTEM = "system",
}

export type Command = {
  type: CommandType;
  command: string;
  timeMs: number;
};
