import { getDateString, getDateTimeString } from "@/common/helpers/datetime";
import { secondsToMSS } from "@/common/helpers/time";
import { TimeLimitSetting } from "@/common/settings/game";
import {
  detectRecordFormat,
  DoMoveOption,
  formatPV,
  ImmutablePosition,
  ImmutableRecord,
  importCSA,
  importKI2,
  importKIF,
  InitialPositionType,
  initialPositionTypeToSFEN,
  Move,
  parsePV,
  Position,
  PositionChange,
  Record,
  RecordFormatType,
  RecordMetadataKey,
  reverseColor,
  SpecialMove,
  SpecialMoveType,
} from "@/common/shogi";
import { getSituationText } from "./score";
import { CommentBehavior } from "@/common/settings/analysis";
import { t } from "@/common/i18n";
import { localizeError } from "@/common/i18n";
import {
  ExportOptions,
  ExportResult,
  detectRecordFileFormatByPath,
  exportRecordAsBuffer,
  importRecordFromBuffer,
} from "@/common/file";
import { SCORE_MATE_INFINITE } from "@/common/usi";

export enum SearchInfoSenderType {
  PLAYER,
  OPPONENT,
  RESEARCHER,
  RESEARCHER_2,
  RESEARCHER_3,
  RESEARCHER_4,
}

export type SearchInfo = {
  depth?: number; // 探索深さ
  score?: number; // 先手から見た評価値
  mate?: number; // 先手勝ちの場合に正の値、後手勝ちの場合に負の値
  pv?: Move[];
};

export type RecordCustomData = {
  playerSearchInfo?: SearchInfo;
  opponentSearchInfo?: SearchInfo;
  researchInfo?: SearchInfo;
  researchInfo2?: SearchInfo;
  researchInfo3?: SearchInfo;
  researchInfo4?: SearchInfo;
};

function parsePlayerMateScoreComment(line: string): number | undefined {
  const matched = /^\*詰み=(先手勝ち|後手勝ち)(?::([0-9]+)手)?/.exec(line);
  if (matched) {
    return Number(matched[2] || SCORE_MATE_INFINITE) * (matched[1] === "先手勝ち" ? 1 : -1);
  }
}

function parseResearchMateScoreComment(line: string): number | undefined {
  const matched = /^#詰み=(先手勝ち|後手勝ち)(?::([0-9]+)手)?/.exec(line);
  if (matched) {
    return Number(matched[2] || SCORE_MATE_INFINITE) * (matched[1] === "先手勝ち" ? 1 : -1);
  }
}

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
      const playerMateScore = parsePlayerMateScoreComment(line);
      if (playerMateScore !== undefined) {
        data.playerSearchInfo = {
          ...data.playerSearchInfo,
          mate: playerMateScore,
        };
      }
      const researchMateScore = parseResearchMateScoreComment(line);
      if (researchMateScore !== undefined) {
        data.researchInfo = {
          ...data.researchInfo,
          mate: researchMateScore,
        };
      }
      const playerScore = parsePlayerScoreComment(line) || parseFloodgateScoreComment(line);
      if (playerScore !== undefined) {
        data.playerSearchInfo = {
          ...data.playerSearchInfo,
          score: playerScore,
        };
      }
      const researchScore = parseResearchScoreComment(line);
      if (researchScore !== undefined) {
        data.researchInfo = {
          ...data.researchInfo,
          score: researchScore,
        };
      }
    }
    node.customData = data;
  });
}

function buildSearchComment(
  position: ImmutablePosition,
  type: SearchInfoSenderType,
  searchInfo: SearchInfo,
  options?: {
    engineName?: string;
  },
): string {
  const prefix = type === SearchInfoSenderType.PLAYER ? "*" : "#";
  let comment = "";
  if (searchInfo.mate) {
    const result = searchInfo.mate >= 0 ? "先手勝ち" : "後手勝ち";
    comment += `${prefix}詰み=${result}`;
    if (Math.abs(searchInfo.mate) !== SCORE_MATE_INFINITE) {
      comment += `:${Math.abs(searchInfo.mate)}手`;
    }
    comment += "\n";
  }
  if (searchInfo.score !== undefined) {
    comment += getSituationText(searchInfo.score) + "\n";
    comment += `${prefix}評価値=${searchInfo.score}\n`;
  }
  if (searchInfo.pv && searchInfo.pv.length !== 0) {
    comment += `${prefix}読み筋=${formatPV(position, searchInfo.pv)}\n`;
  }
  if (searchInfo.depth) {
    comment += `${prefix}深さ=${searchInfo.depth}\n`;
  }
  if (comment && options?.engineName) {
    comment += `${prefix}エンジン=${options.engineName}\n`;
  }
  return comment;
}

function getPVsFromSearchComment(position: ImmutablePosition, comment: string): Move[][] {
  return comment
    .split("\n")
    .filter((line) => line.match(/^[#*]読み筋=/))
    .map((line) => {
      return parsePV(position, line.split("=", 2)[1]);
    });
}

function formatTimeLimitCSA(setting: TimeLimitSetting): string {
  return secondsToMSS(setting.timeSeconds) + "+" + String(setting.byoyomi).padStart(2, "0");
}

type GameStartMetadata = {
  gameTitle?: string;
  blackName?: string;
  whiteName?: string;
  timeLimit?: TimeLimitSetting;
};

type AppendMoveParams = {
  move: Move | SpecialMove | SpecialMoveType;
  moveOption?: DoMoveOption;
  elapsedMs?: number;
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
    this.resetBySFEN(startPosition ? initialPositionTypeToSFEN(startPosition) : undefined);
  }

  resetBySFEN(sfen?: string): void {
    if (sfen) {
      const position = new Position();
      position.resetBySFEN(sfen);
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
        recordOrError = position ? new Record(position) : new Error(t.failedToParseSFEN);
        break;
      }
      case RecordFormatType.USI:
        recordOrError = Record.newByUSI(data);
        break;
      case RecordFormatType.KIF:
        recordOrError = importKIF(data);
        break;
      case RecordFormatType.KI2:
        recordOrError = importKI2(data);
        break;
      case RecordFormatType.CSA:
        recordOrError = importCSA(data);
        break;
      default:
        recordOrError = new Error(t.failedToDetectRecordFormat);
        break;
    }
    if (recordOrError instanceof Error) {
      return localizeError(recordOrError);
    }
    this._record = recordOrError;
    this.bindRecordHandlers();
    this.clearRecordFilePath();
    restoreCustomData(this._record);
    return;
  }

  importRecordFromBuffer(
    data: Uint8Array,
    path: string,
    option?: { autoDetect?: boolean },
  ): Error | undefined {
    const format = detectRecordFileFormatByPath(path);
    if (!format) {
      return new Error(`${t.unknownFileExtension}: ${path}`);
    }
    const recordOrError = importRecordFromBuffer(data, format, option);
    if (recordOrError instanceof Error) {
      return localizeError(recordOrError);
    }
    this._record = recordOrError;
    this.bindRecordHandlers();
    this.updateRecordFilePath(path);
    restoreCustomData(this._record);
    return;
  }

  exportRecordAsBuffer(path: string, opt: ExportOptions): ExportResult | Error {
    const format = detectRecordFileFormatByPath(path);
    if (!format) {
      return new Error(`${t.unknownFileExtension}: ${path}`);
    }
    const result = exportRecordAsBuffer(this._record, format, opt);
    this.updateRecordFilePath(path);
    return result;
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

  jumpToBookmark(bookmark: string): boolean {
    return this._record.jumpToBookmark(bookmark);
  }

  updateComment(comment: string): void {
    this._record.current.comment = comment;
  }

  updateBookmark(bookmark: string): void {
    this._record.current.bookmark = bookmark;
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

  appendSearchComment(
    type: SearchInfoSenderType,
    searchInfo: SearchInfo,
    behavior: CommentBehavior,
    options?: {
      header?: string;
      engineName?: string;
    },
  ): void {
    let comment = buildSearchComment(this.record.position, type, searchInfo, options);
    if (options?.header) {
      comment = options.header + "\n" + comment;
    }
    this.appendComment(comment, behavior);
  }

  get inCommentPVs(): Move[][] {
    return getPVsFromSearchComment(this.record.position, this.record.current.comment);
  }

  setGameStartMetadata(metadata: GameStartMetadata): void {
    if (metadata.gameTitle) {
      this._record.metadata.setStandardMetadata(RecordMetadataKey.TITLE, metadata.gameTitle);
    }
    if (metadata.blackName) {
      this._record.metadata.setStandardMetadata(RecordMetadataKey.BLACK_NAME, metadata.blackName);
    }
    if (metadata.whiteName) {
      this._record.metadata.setStandardMetadata(RecordMetadataKey.WHITE_NAME, metadata.whiteName);
    }
    this._record.metadata.setStandardMetadata(RecordMetadataKey.DATE, getDateString());
    this._record.metadata.setStandardMetadata(
      RecordMetadataKey.START_DATETIME,
      getDateTimeString(),
    );
    if (metadata.timeLimit) {
      this._record.metadata.setStandardMetadata(
        RecordMetadataKey.TIME_LIMIT,
        formatTimeLimitCSA(metadata.timeLimit),
      );
    }
  }

  setGameEndMetadata(): void {
    this._record.metadata.setStandardMetadata(RecordMetadataKey.END_DATETIME, getDateTimeString());
  }

  updateSearchInfo(type: SearchInfoSenderType, searchInfo: SearchInfo): void {
    const data = (this.record.current.customData || {}) as RecordCustomData;
    switch (type) {
      case SearchInfoSenderType.PLAYER:
        data.playerSearchInfo = searchInfo;
        break;
      case SearchInfoSenderType.OPPONENT:
        data.opponentSearchInfo = searchInfo;
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

  appendMovesSilently(moves: Move[], opt?: DoMoveOption): number {
    this.unbindRecordHandlers();
    try {
      let n = 0;
      const ply = this._record.current.ply;
      for (const move of moves) {
        if (!this._record.append(move, opt)) {
          break;
        }
        n++;
      }
      this._record.goto(ply);
      return n;
    } finally {
      this.bindRecordHandlers();
    }
  }

  updateStandardMetadata(update: { key: RecordMetadataKey; value: string }): void {
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
        this.bindRecordHandlers();
        break;
    }
  }

  private bindRecordHandlers(): void {
    this._record.on("changePosition", this.onChangePosition);
  }

  private unbindRecordHandlers(): void {
    this._record.on("changePosition", () => {
      /* noop */
    });
  }
}
