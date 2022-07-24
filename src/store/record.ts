import { secondsToMSS } from "@/helpers/time";
import { TimeLimitSetting } from "@/settings/game";
import { Color, Record } from "@/shogi";
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

  get empty(): boolean {
    return !this.evaluation;
  }

  updateScore(color: Color, sender: USIInfoSender, score: number): void {
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

export function restoreCustomData(record: Record): void {
  record.forEach((node) => {
    const data = new RecordCustomData(node.customData);
    const lines = node.comment.split("\n");
    for (const line of lines) {
      // TODO: 正規表現を改善する。
      const research = /^#評価値=([+-]?[.0-9]+)/.exec(line);
      if (research) {
        data.updateScore(
          Color.BLACK,
          USIInfoSender.RESEARCHER,
          Number(research[1])
        );
      }
      const player = /^\* *([+-]?[.0-9]+)/.exec(line);
      if (player) {
        if (node.nextColor === Color.WHITE) {
          data.updateScore(
            Color.BLACK,
            USIInfoSender.BLACK_PLAYER,
            Number(player[1])
          );
        } else {
          data.updateScore(
            Color.WHITE,
            USIInfoSender.WHITE_PLAYER,
            -Number(player[1])
          );
        }
      }
    }
    if (!data.empty) {
      node.customData = data.stringify();
    }
  });
}

export function formatTimeLimitCSA(setting: TimeLimitSetting): string {
  return (
    secondsToMSS(setting.timeSeconds) +
    "+" +
    String(setting.byoyomi).padStart(2, "0")
  );
}
