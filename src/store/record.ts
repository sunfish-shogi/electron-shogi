import { Color } from "@/shogi";
import { InfoCommand as USIInfoCommand, USIInfoSender } from "@/usi/info";

type Evaluation = {
  blackPlayer?: number;
  whitePlayer?: number;
  researcher?: number;
};

export const MAX_SCORE = 2000;

export const MIN_SCORE = -MAX_SCORE;

export class RecordEntryCustomData {
  evaluation?: Evaluation;

  constructor(json?: string) {
    if (json) {
      const obj = JSON.parse(json);
      this.evaluation = obj.evaluation;
    }
  }

  private updateScore(
    color: Color,
    sender: USIInfoSender,
    score: number
  ): void {
    if (!this.evaluation) {
      this.evaluation = {};
    }
    switch (sender) {
      case USIInfoSender.BLACK_PLAYER:
        this.evaluation[USIInfoSender.BLACK_PLAYER] = score;
        break;
      case USIInfoSender.WHITE_PLAYER:
        this.evaluation[USIInfoSender.WHITE_PLAYER] = -score;
        break;
      case USIInfoSender.RESEARCHER:
        this.evaluation[USIInfoSender.RESEARCHER] =
          color === Color.BLACK ? score : -score;
        break;
    }
  }

  updateUSIInfo(
    color: Color,
    sender: USIInfoSender,
    command: USIInfoCommand
  ): void {
    if (command.multipv !== undefined && command.multipv !== 1) {
      return;
    }
    if (command.scoreCP) {
      this.updateScore(
        color,
        sender,
        Math.min(Math.max(command.scoreCP, MIN_SCORE), MAX_SCORE)
      );
    } else if (command.scoreMate) {
      this.updateScore(
        color,
        sender,
        command.scoreMate >= 0 ? MAX_SCORE : MIN_SCORE
      );
    }
  }

  stringify(): string {
    return JSON.stringify(this);
  }
}
