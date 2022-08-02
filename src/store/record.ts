import { getDateString, getDateTimeString } from "@/helpers/datetime";
import { secondsToMSS } from "@/helpers/time";
import { TimeLimitSetting } from "@/settings/game";
import {
  Color,
  detectRecordFormat,
  DoMoveOption,
  exportCSA,
  exportKakinoki,
  ImmutableRecord,
  importCSA,
  importKakinoki,
  InitialPositionType,
  Move,
  Position,
  PositionChange,
  Record,
  RecordFormatType,
  RecordMetadataKey,
  reverseColor,
  SpecialMove,
} from "@/shogi";
import { InfoCommand as USIInfoCommand, USIInfoSender } from "@/store/usi";
import iconv from "iconv-lite";

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

function restoreCustomData(record: Record): void {
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

function formatTimeLimitCSA(setting: TimeLimitSetting): string {
  return (
    secondsToMSS(setting.timeSeconds) +
    "+" +
    String(setting.byoyomi).padStart(2, "0")
  );
}

type GameStartMetadata = {
  blackName: string;
  whiteName: string;
  timeLimit: TimeLimitSetting;
};

type AppendMoveParams = {
  move: Move | SpecialMove;
  moveOption?: DoMoveOption;
  elapsedMs?: number;
};

type ExportOptions = {
  returnCode?: string;
};

export class RecordManager {
  private _record: Record;
  private _recordFilePath?: string;

  constructor() {
    this._record = new Record();
  }

  get record(): ImmutableRecord {
    return this._record;
  }

  get recordFilePath(): string | undefined {
    return this._recordFilePath;
  }

  private updateRecordFilePath(recordFilePath: string): void {
    this._recordFilePath = recordFilePath;
  }

  private clearRecordFilePath(): void {
    this._recordFilePath = undefined;
  }

  reset(startPosition?: InitialPositionType): void {
    if (startPosition) {
      const position = new Position();
      position.reset(startPosition);
      this._record.clear(position);
    } else {
      this._record.clear();
    }
    this.clearRecordFilePath();
  }

  resetByCurrentPosition(): void {
    this._record.clear(this._record.position);
    this.clearRecordFilePath();
  }

  importRecord(data: string): Error | undefined {
    let recordOrError: Record | Error;
    switch (detectRecordFormat(data)) {
      case RecordFormatType.SFEN: {
        const position = Position.newBySFEN(data);
        recordOrError = position
          ? new Record(position)
          : new Error("局面を読み込めませんでした。");
        break;
      }
      case RecordFormatType.USI:
        recordOrError = Record.newByUSI(data);
        break;
      case RecordFormatType.KIF:
        recordOrError = importKakinoki(data);
        break;
      case RecordFormatType.CSA:
        recordOrError = importCSA(data);
        break;
      default:
        recordOrError = new Error("棋譜フォーマットの検出ができませんでした。");
        break;
    }
    if (recordOrError instanceof Error) {
      return recordOrError;
    }
    this._record = recordOrError;
    this.clearRecordFilePath();
    restoreCustomData(this._record);
    return;
  }

  importRecordFromBuffer(data: Buffer, path: string): Error | undefined {
    let recordOrError: Record | Error;
    if (path.match(/\.kif$/) || path.match(/\.kifu$/)) {
      const str = path.match(/\.kif$/)
        ? iconv.decode(data as Buffer, "Shift_JIS")
        : new TextDecoder().decode(data);
      recordOrError = importKakinoki(str);
    } else if (path.match(/\.csa$/)) {
      recordOrError = importCSA(new TextDecoder().decode(data));
    } else {
      recordOrError = new Error("不明なファイル形式: " + path);
    }
    if (recordOrError instanceof Error) {
      return recordOrError;
    }
    this._record = recordOrError;
    this._recordFilePath = path;
    restoreCustomData(this._record);
    return;
  }

  exportRecordAsBuffer(path: string, opt: ExportOptions): Buffer | Error {
    let data: Uint8Array;
    if (path.match(/\.kif$/) || path.match(/\.kifu$/)) {
      const str = exportKakinoki(this.record, opt);
      data = path.match(/\.kif$/)
        ? iconv.encode(str, "Shift_JIS")
        : new TextEncoder().encode(str);
    } else if (path.match(/\.csa$/)) {
      data = new TextEncoder().encode(exportCSA(this.record, opt));
    } else {
      return new Error("不明なファイル形式: " + path);
    }
    this.updateRecordFilePath(path);
    return data as Buffer;
  }

  swapNextTurn(): void {
    const position = this.record.position.clone();
    position.setColor(reverseColor(position.color));
    this._record.clear(position);
    this.clearRecordFilePath();
  }

  changePosition(change: PositionChange): void {
    const position = this.record.position.clone();
    position.edit(change);
    this._record.clear(position);
    this.clearRecordFilePath();
  }

  changeMoveNumber(number: number): void {
    this._record.goto(number);
  }

  changeBranch(index: number): boolean {
    return this._record.switchBranchByIndex(index);
  }

  removeAfter(): void {
    this._record.removeAfter();
  }

  updateComment(comment: string): void {
    this.record.current.comment = comment;
  }

  setGameStartMetadata(metadata: GameStartMetadata): void {
    this._record.metadata.setStandardMetadata(
      RecordMetadataKey.BLACK_NAME,
      metadata.blackName
    );
    this._record.metadata.setStandardMetadata(
      RecordMetadataKey.WHITE_NAME,
      metadata.whiteName
    );
    this._record.metadata.setStandardMetadata(
      RecordMetadataKey.DATE,
      getDateString()
    );
    this._record.metadata.setStandardMetadata(
      RecordMetadataKey.START_DATETIME,
      getDateTimeString()
    );
    this._record.metadata.setStandardMetadata(
      RecordMetadataKey.TIME_LIMIT,
      formatTimeLimitCSA(metadata.timeLimit)
    );
  }

  setGameEndMetadata(): void {
    this._record.metadata.setStandardMetadata(
      RecordMetadataKey.END_DATETIME,
      getDateTimeString()
    );
  }

  appendMove(params: AppendMoveParams): boolean {
    const ok = this._record.append(params.move, params.moveOption);
    if (!ok) {
      return false;
    }
    if (params.elapsedMs !== undefined) {
      this.record.current.setElapsedMs(params.elapsedMs);
    }
    return true;
  }

  updateStandardMetadata(update: {
    key: RecordMetadataKey;
    value: string;
  }): void {
    this._record.metadata.setStandardMetadata(update.key, update.value);
  }
}
