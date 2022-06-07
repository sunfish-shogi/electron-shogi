import { Color } from "@/shogi";
import { InfoCommand as USIInfoCommand, USIInfoSender } from "@/store/usi";

type Evaluation = {
  blackPlayer?: number;
  whitePlayer?: number;
  researcher?: number;
};

export const MATE_SCORE = 30000;

export class RecordCustomData {
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
      this.updateScore(color, sender, command.scoreCP);
    } else if (command.scoreMate) {
      this.updateScore(
        color,
        sender,
        command.scoreMate >= 0 ? MATE_SCORE : -MATE_SCORE
      );
    }
  }

  stringify(): string {
    return JSON.stringify(this);
  }
}
