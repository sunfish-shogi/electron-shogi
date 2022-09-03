import { USIPlayer } from "@/players/usi";
import { AnalysisSetting, CommentBehavior } from "@/settings/analysis";
import { AppSetting } from "@/settings/app";
import { USIEngineSetting } from "@/settings/usi";
import { Color, ImmutablePosition, Move, reverseColor } from "@/shogi";
import { RecordManager } from "./record";
import { getSituationText, scoreToPercentage } from "./score";
import { USIInfoCommand } from "@/ipc/usi";

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
  // 終了した際に呼び出されます。
  onFinish(): void;
  // エラーを通知します。
  onError(e: unknown): void;
}

export class AnalysisManager {
  private researcher?: USIPlayer;
  private number?: number;
  private actualMove?: Move;
  private color = Color.BLACK;
  private lastScore?: number;
  private score?: number;
  private mate?: number;
  private lastPV?: Move[];
  private pv?: Move[];
  private timerHandle?: number;

  constructor(
    private recordManager: RecordManager,
    private _setting: AnalysisSetting,
    private appSetting: AppSetting,
    private handler: AnalysisHandler
  ) {
    if (!_setting.usi) {
      throw new Error("エンジンが設定されていません。");
    }
  }

  get setting(): AnalysisSetting {
    return this._setting;
  }

  async start(): Promise<void> {
    await this.setupEngine(this.setting.usi as USIEngineSetting);
    setTimeout(() => this.next());
  }

  close(): void {
    this.clearTimer();
    this.closeEngine().catch((e) => {
      this.handler.onError(e);
    });
  }

  private async setupEngine(setting: USIEngineSetting): Promise<void> {
    await this.closeEngine();
    const researcher = new USIPlayer(setting);
    await researcher.launch();
    this.researcher = researcher;
  }

  private next(): void {
    if (!this.researcher) {
      this.handler.onError(new Error("エンジンが初期化されていません。"));
      this.finish();
      return;
    }
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

    this.recordManager.changeMoveNumber(this.number);
    const record = this.recordManager.record;
    if (record.current.number !== this.number) {
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
    this.researcher.startResearch(record).catch((e) => {
      this.handler.onError(e);
    });
  }

  private finish(): void {
    this.handler.onFinish();
    this.close();
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
    const result = {
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
    };
    const comment = buildRecordComment(result, this.appSetting);
    if (!comment) {
      return;
    }
    this.recordManager.appendComment(comment, (org, add) => {
      return appendAnalysisComment(org, add, this.setting.commentBehavior);
    });
  }

  private async closeEngine(): Promise<void> {
    if (this.researcher) {
      this.researcher.close();
      this.researcher = undefined;
    }
  }

  updateUSIInfo(position: ImmutablePosition, info: USIInfoCommand): void {
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

export function getMoveAccuracyText(
  before: number,
  after: number,
  appSetting: AppSetting
): string | null {
  const loss =
    scoreToPercentage(before, appSetting.coefficientInSigmoid) -
    scoreToPercentage(after, appSetting.coefficientInSigmoid);
  if (loss >= appSetting.badMoveLevelThreshold4) {
    return "大悪手";
  } else if (loss >= appSetting.badMoveLevelThreshold3) {
    return "悪手";
  } else if (loss >= appSetting.badMoveLevelThreshold2) {
    return "疑問手";
  } else if (loss >= appSetting.badMoveLevelThreshold1) {
    return "緩手";
  }
  return null;
}
