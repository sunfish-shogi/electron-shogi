import { getDateString, getDateTimeString } from "@/helpers/datetime";
import { secondsToMSS } from "@/helpers/time";
import { TimeLimitSetting } from "@/settings/game";
import {
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
import iconv from "iconv-lite";
import { getSituationText } from "./score";
import { SearchInfo } from "@/players/player";

export enum SearchEngineType {
  PLAYER,
  RESEARCHER,
}

export type RecordCustomData = {
  playerSearchInfo?: SearchInfo;
  enemySearchInfo?: SearchInfo;
  researchInfo?: SearchInfo;
};

function parsePlayerScoreComment(line: string): number | undefined {
  const matched = /^\*評価値=([+-]?[.0-9]+)/.exec(line);
  return matched ? Number(matched[1]) : undefined;
}

function parseResearchScoreComment(line: string): number | undefined {
  const matched = /^#評価値=([+-]?[.0-9]+)/.exec(line);
  return matched ? Number(matched[1]) : undefined;
}

function parseFloodgateScoreComment(line: string): number | undefined {
  const matched = /^\* *([+-]?[.0-9]+)/.exec(line);
  return matched ? Number(matched[1]) : undefined;
}

function restoreCustomData(record: Record): void {
  record.forEach((node) => {
    const data = (node.customData || {}) as RecordCustomData;
    const lines = node.comment.split("\n");
    for (const line of lines) {
      const playerScore =
        parsePlayerScoreComment(line) || parseFloodgateScoreComment(line);
      if (playerScore !== undefined) {
        data.playerSearchInfo = {
          usi: record.usi,
          score: playerScore,
        };
      }
      const researchScore = parseResearchScoreComment(line);
      if (researchScore !== undefined) {
        data.researchInfo = {
          usi: record.usi,
          score: researchScore,
        };
      }
    }
    node.customData = data;
  });
}

function searchCommentKeyPrefix(type: SearchEngineType): string {
  switch (type) {
    case SearchEngineType.PLAYER:
      return "*";
    case SearchEngineType.RESEARCHER:
      return "#";
  }
}

export function buildSearchComment(
  type: SearchEngineType,
  searchInfo: SearchInfo
): string {
  const prefix = searchCommentKeyPrefix(type);
  let comment = "";
  if (searchInfo.mate) {
    comment += `${Math.abs(searchInfo.mate)}手詰\n`;
  }
  if (searchInfo.score !== undefined) {
    comment += getSituationText(searchInfo.score) + "\n";
    comment += `${prefix}評価値=${searchInfo.score}\n`;
  }
  if (searchInfo.pv && searchInfo.pv.length !== 0) {
    comment += `${prefix}読み筋=`;
    for (const move of searchInfo.pv) {
      comment += `${move.getDisplayText({ legacy: true })}`;
    }
    comment += "\n";
  }
  return comment;
}

export enum CommentBehavior {
  NONE = "none",
  INSERT = "insert",
  APPEND = "append",
  OVERWRITE = "overwrite",
}

function formatTimeLimitCSA(setting: TimeLimitSetting): string {
  return (
    secondsToMSS(setting.timeSeconds) +
    "+" +
    String(setting.byoyomi).padStart(2, "0")
  );
}

type GameStartMetadata = {
  gameTitle?: string;
  blackName?: string;
  whiteName?: string;
  timeLimit?: TimeLimitSetting;
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
  private _record = new Record();
  private _recordFilePath?: string;
  private onChangePosition = (): void => {
    /* noop */
  };

  constructor() {
    this.setupHandler();
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

  importRecord(data: string, type?: RecordFormatType): Error | undefined {
    let recordOrError: Record | Error;
    if (!type) {
      type = detectRecordFormat(data);
    }
    switch (type) {
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
    this.setupHandler();
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
    this.setupHandler();
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

  changePly(ply: number): void {
    this._record.goto(ply);
  }

  changeBranch(index: number): boolean {
    return this._record.switchBranchByIndex(index);
  }

  removeCurrentMove(): void {
    this._record.removeCurrentMove();
  }

  removeNextMove(): void {
    this._record.removeNextMove();
  }

  updateComment(comment: string): void {
    this._record.current.comment = comment;
  }

  appendComment(add: string, behavior: CommentBehavior): void {
    if (!add) {
      return;
    }
    const org = this._record.current.comment;
    const sep = this.record.current.comment ? "\n" : "";
    switch (behavior) {
      case CommentBehavior.NONE:
        break;
      case CommentBehavior.INSERT:
        this._record.current.comment = add + sep + org;
        break;
      case CommentBehavior.APPEND:
        this._record.current.comment = org + sep + add;
        break;
      case CommentBehavior.OVERWRITE:
        this._record.current.comment = add;
        break;
    }
  }

  setGameStartMetadata(metadata: GameStartMetadata): void {
    if (metadata.gameTitle) {
      this._record.metadata.setStandardMetadata(
        RecordMetadataKey.TITLE,
        metadata.gameTitle
      );
    }
    if (metadata.blackName) {
      this._record.metadata.setStandardMetadata(
        RecordMetadataKey.BLACK_NAME,
        metadata.blackName
      );
    }
    if (metadata.whiteName) {
      this._record.metadata.setStandardMetadata(
        RecordMetadataKey.WHITE_NAME,
        metadata.whiteName
      );
    }
    this._record.metadata.setStandardMetadata(
      RecordMetadataKey.DATE,
      getDateString()
    );
    this._record.metadata.setStandardMetadata(
      RecordMetadataKey.START_DATETIME,
      getDateTimeString()
    );
    if (metadata.timeLimit) {
      this._record.metadata.setStandardMetadata(
        RecordMetadataKey.TIME_LIMIT,
        formatTimeLimitCSA(metadata.timeLimit)
      );
    }
  }

  setGameEndMetadata(): void {
    this._record.metadata.setStandardMetadata(
      RecordMetadataKey.END_DATETIME,
      getDateTimeString()
    );
  }

  updateSearchInfo(type: SearchEngineType, searchInfo: SearchInfo): void {
    const data = (this.record.current.customData || {}) as RecordCustomData;
    switch (type) {
      case SearchEngineType.PLAYER:
        data.playerSearchInfo = searchInfo;
        break;
      case SearchEngineType.RESEARCHER:
        data.researchInfo = searchInfo;
        break;
    }
    this._record.current.customData = data;
  }

  updateEnemySearchInfo(searchInfo: SearchInfo): void {
    const data = (this.record.current.customData || {}) as RecordCustomData;
    data.enemySearchInfo = searchInfo;
    this._record.current.customData = data;
  }

  appendMove(params: AppendMoveParams): boolean {
    const ok = this._record.append(params.move, params.moveOption);
    if (!ok) {
      return false;
    }
    if (params.elapsedMs !== undefined) {
      this._record.current.setElapsedMs(params.elapsedMs);
    }
    return true;
  }

  updateStandardMetadata(update: {
    key: RecordMetadataKey;
    value: string;
  }): void {
    this._record.metadata.setStandardMetadata(update.key, update.value);
  }

  on(event: "changePosition", handler: () => void): void;
  on(event: string, handler: unknown): void {
    switch (event) {
      case "changePosition":
        this.onChangePosition = handler as () => void;
        break;
    }
    this.setupHandler();
  }

  private setupHandler(): void {
    this._record.on("changePosition", this.onChangePosition);
  }
}
