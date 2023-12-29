import { Command } from "./command";

export enum PromptTarget {
  CSA = "csa",
  USI = "usi",
}

export type PromptHistory = {
  discarded: number;
  commands: (Command & { id: number })[];
};

export function addCommand(history: PromptHistory, command: Command, maxHistory: number) {
  history.commands.push({
    id: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER),
    ...command,
  });
  if (
    history.discarded !== 0
      ? history.commands.length > maxHistory
      : history.commands.length > maxHistory + 100
  ) {
    const discard = history.commands.length - maxHistory;
    history.discarded += discard;
    history.commands.splice(0, discard);
  }
}
