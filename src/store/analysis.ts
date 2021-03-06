import { USIPlayer } from "@/players/usi";
import { AnalysisSetting, CommentBehavior } from "@/settings/analysis";
import { AppSetting } from "@/settings/app";
import { USIEngineSetting } from "@/settings/usi";
import {
  Color,
  ImmutablePosition,
  ImmutableRecord,
  Move,
  reverseColor,
} from "@/shogi";
import { getMoveAccuracyText, getSituationText } from "./score";
import { InfoCommand } from "./usi";

export interface AnalysisResult {
  number: number;
  score?: number;
  negaScore?: number;
  scoreDelta?: number;
  mate?: number;
  pv?: Move[];
  isBestMove?: boolean;
}

export interface AnalysisHandler {
  onResult(result: AnalysisResult): void;
  onNext(number: number): ImmutableRecord | null;
  onFinish(): void;
  onError(e: unknown): void;
}

export class AnalysisManager {
  private handler: AnalysisHandler;
  private researcher?: USIPlayer;
  private _setting: AnalysisSetting;
  private number?: number;
  private actualMove?: Move;
  private color: Color;
  private lastScore?: number;
  private score?: number;
  private mate?: number;
  private lastPV?: Move[];
  private pv?: Move[];
  private timerHandle?: number;

  constructor(setting: AnalysisSetting, handler: AnalysisHandler) {
    if (!setting.usi) {
      throw new Error("エンジンが設定されていません。");
    }
    this._setting = setting;
    this.handler = handler;
    this.color = Color.BLACK;
  }

  get setting(): AnalysisSetting {
    return this._setting;
  }

  async start(): Promise<void> {
    await this.setupEngine(this.setting.usi as USIEngineSetting);
    setTimeout(() => this.next());
  }

  private async setupEngine(setting: USIEngineSetting): Promise<void> {
    await this.closeEngine();
    const researcher = new USIPlayer(setting);
    await researcher.launch();
    this.researcher = researcher;
  }

  private finish(): void {
    this.handler.onFinish();
    this.close();
  }

  close(): void {
    this.clearTimer();
    this.closeEngine().catch((e) => {
      this.handler.onError(e);
    });
  }

  private next(): void {
    this.clearTimer();
    this.onResult();

    this.actualMove = undefined;
    this.lastScore = this.score;
    this.score = undefined;
    this.mate = undefined;
    this.lastPV = this.pv;
    this.pv = undefined;
    this.number =
      this.number !== undefined
        ? this.number + 1
        : this.setting.startCriteria.enableNumber
        ? this.setting.startCriteria.number - 1
        : 0;
    if (
      this.setting.endCriteria.enableNumber &&
      this.number >= this.setting.endCriteria.number
    ) {
      this.finish();
      return;
    }

    const record = this.handler.onNext(this.number);
    if (!record) {
      this.finish();
      return;
    }
    if (!record.current.next && !(record.current.move instanceof Move)) {
      this.finish();
      return;
    }
    this.actualMove =
      record.current.move instanceof Move ? record.current.move : undefined;
    this.color = reverseColor(record.position.color);
    this.timerHandle = window.setTimeout(
      () => this.next(),
      this.setting.perMoveCriteria.maxSeconds * 1e3
    );
    this.goAsync(record).catch((e) => {
      this.handler.onError(e);
    });
  }

  private clearTimer(): void {
    if (this.timerHandle) {
      clearTimeout(this.timerHandle);
      this.timerHandle = undefined;
    }
  }

  private onResult(): void {
    if (this.number === undefined) {
      return;
    }
    this.handler.onResult({
      number: this.number,
      score: this.score,
      negaScore: this.score
        ? this.color === Color.BLACK
          ? this.score
          : -this.score
        : undefined,
      scoreDelta:
        this.score !== undefined && this.lastScore !== undefined
          ? this.color === Color.BLACK
            ? this.score - this.lastScore
            : -(this.score - this.lastScore)
          : undefined,
      mate: this.mate,
      pv: this.pv,
      isBestMove:
        this.actualMove && this.lastPV
          ? this.actualMove.equals(this.lastPV[0])
          : undefined,
    });
  }

  async goAsync(record: ImmutableRecord): Promise<void> {
    if (this.researcher) {
      await this.researcher.startResearch(record);
    }
  }

  private async closeEngine(): Promise<void> {
    if (this.researcher) {
      this.researcher.close();
      this.researcher = undefined;
    }
  }

  updateUSIInfo(position: ImmutablePosition, info: InfoCommand): void {
    if (info.multipv !== undefined && info.multipv !== 1) {
      return;
    }
    if (info.scoreCP !== undefined) {
      this.score =
        position.color === Color.BLACK ? info.scoreCP : -info.scoreCP;
    }
    if (info.scoreMate) {
      this.mate = Math.abs(info.scoreMate);
    }
    if (info.pv && info.pv.length !== 0) {
      this.pv = [];
      const pos = position.clone();
      for (const sfen of info.pv) {
        const move = pos.createMoveBySFEN(sfen);
        if (!move || !pos.doMove(move)) {
          break;
        }
        this.pv.push(move);
      }
    } else if (info.currmove) {
      const move = position.createMoveBySFEN(info.currmove);
      if (move) {
        this.pv = [move];
      }
    }
  }
}

export function buildRecordComment(
  result: AnalysisResult,
  appSetting: AppSetting
): string {
  let comment = "";
  if (result.mate) {
    comment += `${result.mate}手詰\n`;
  }
  if (
    result.scoreDelta !== undefined &&
    result.negaScore !== undefined &&
    !result.isBestMove
  ) {
    const text = getMoveAccuracyText(
      result.negaScore - result.scoreDelta,
      result.negaScore,
      appSetting
    );
    if (text) {
      comment += `【${text}】\n`;
    }
  }
  if (result.score !== undefined) {
    comment += `#評価値=${result.score}\n`;
    comment += getSituationText(result.score) + "\n";
  }
  if (result.pv && result.pv.length !== 0) {
    for (const move of result.pv) {
      comment += `${move.getDisplayText()}`;
    }
    comment += "\n";
  }
  return comment;
}

export function loadScoreFromRecordComment(
  comment: string
): number | undefined {
  const lines = comment.split("\n");
  for (const line of lines) {
    const matched = /^#評価値=([+-.0-9]+)/.exec(line);
    if (matched) {
      return Number(matched[1]);
    }
  }
}

export function appendAnalysisComment(
  org: string,
  add: string,
  behavior: CommentBehavior
): string {
  const sep = org ? "\n" : "";
  switch (behavior) {
    case CommentBehavior.NONE:
      return org;
    case CommentBehavior.INSERT:
      return add + sep + org;
    case CommentBehavior.APPEND:
      return org + sep + add;
    case CommentBehavior.OVERWRITE:
      return add;
  }
}
