import { getDateString, getDateTimeString } from "@/common/helpers/datetime";
import { secondsToMSS } from "@/common/helpers/time";
import { TimeLimitSetting } from "@/common/settings/game";
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
} from "@/common/shogi";
import iconv from "iconv-lite";
import { getSituationText } from "./score";
import { SearchInfo } from "@/renderer/players/player";
import { CommentBehavior } from "@/common/settings/analysis";

export enum SearchInfoSenderType {
  PLAYER,
  ENEMY,
  RESEARCHER,
  RESEARCHER_2,
  RESEARCHER_3,
  RESEARCHER_4,
}

export type RecordCustomData = {
  playerSearchInfo?: SearchInfo;
  enemySearchInfo?: SearchInfo;
  researchInfo?: SearchInfo;
  researchInfo2?: SearchInfo;
  researchInfo3?: SearchInfo;
  researchInfo4?: SearchInfo;
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

function searchCommentKeyPrefix(type: SearchInfoSenderType): string {
  switch (type) {
    case SearchInfoSenderType.PLAYER:
      return "*";
    default:
      return "#";
  }
}

export function buildSearchComment(
  type: SearchInfoSenderType,
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

type ChangeFilePathHandler = (path?: string) => void;
type ChangePositionHandler = () => void;

export class RecordManager {
  private _record = new Record();
  private _recordFilePath?: string;
  private onChangeFilePath: ChangeFilePathHandler = () => {
    /* noop */
  };
  private onChangePosition: ChangePositionHandler = () => {
    /* noop */
  };

  constructor() {
    this.setupRecordHandler();
  }

  get record(): ImmutableRecord {
    return this._record;
  }

  get recordFilePath(): string | undefined {
    return this._recordFilePath;
  }

  private updateRecordFilePath(recordFilePath: string): void {
    this._recordFilePath = recordFilePath;
    this.onChangeFilePath(recordFilePath);
  }

  private clearRecordFilePath(): void {
    this._recordFilePath = undefined;
    this.onChangeFilePath();
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
    this.setupRecordHandler();
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
    this.setupRecordHandler();
    this.updateRecordFilePath(path);
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

  swapWithNextBranch(): boolean {
    return this._record.swapWithNextBranch();
  }

  swapWithPreviousBranch(): boolean {
    return this._record.swapWithPreviousBranch();
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

  updateSearchInfo(type: SearchInfoSenderType, searchInfo: SearchInfo): void {
    const data = (this.record.current.customData || {}) as RecordCustomData;
    switch (type) {
      case SearchInfoSenderType.PLAYER:
        data.playerSearchInfo = searchInfo;
        break;
      case SearchInfoSenderType.ENEMY:
        data.enemySearchInfo = searchInfo;
        break;
      case SearchInfoSenderType.RESEARCHER:
        if ((searchInfo.depth || 0) >= (data.researchInfo?.depth || 0)) {
          data.researchInfo = searchInfo;
        }
        break;
      case SearchInfoSenderType.RESEARCHER_2:
        if ((searchInfo.depth || 0) >= (data.researchInfo2?.depth || 0)) {
          data.researchInfo2 = searchInfo;
        }
        break;
      case SearchInfoSenderType.RESEARCHER_3:
        if ((searchInfo.depth || 0) >= (data.researchInfo3?.depth || 0)) {
          data.researchInfo3 = searchInfo;
        }
        break;
      case SearchInfoSenderType.RESEARCHER_4:
        if ((searchInfo.depth || 0) >= (data.researchInfo4?.depth || 0)) {
          data.researchInfo4 = searchInfo;
        }
        break;
    }
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

  on(event: "changeFilePath", handler: ChangeFilePathHandler): void;
  on(event: "changePosition", handler: ChangePositionHandler): void;
  on(event: string, handler: unknown): void {
    switch (event) {
      case "changeFilePath":
        this.onChangeFilePath = handler as (path?: string) => void;
        break;
      case "changePosition":
        this.onChangePosition = handler as () => void;
        this.setupRecordHandler();
        break;
    }
  }

  private setupRecordHandler(): void {
    this._record.on("changePosition", this.onChangePosition);
  }
}
