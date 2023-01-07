import { SearchInfo } from "@/renderer/players/player";
import { USIPlayer } from "@/renderer/players/usi";
import { AnalysisSetting } from "@/common/settings/analysis";
import { AppSetting } from "@/common/settings/app";
import { USIEngineSetting } from "@/common/settings/usi";
import { Color, Move, reverseColor } from "@/common/shogi";
import {
  buildSearchComment,
  RecordManager,
  SearchInfoSenderType,
} from "./record";
import { scoreToPercentage } from "./score";

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
  private lastSearchInfo?: SearchInfo;
  private searchInfo?: SearchInfo;
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
    const researcher = new USIPlayer(
      setting,
      this.appSetting.engineTimeoutSeconds,
      this.updateSearchInfo.bind(this)
    );
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

    this.actualMove = undefined;
    this.lastSearchInfo = this.searchInfo;
    this.searchInfo = undefined;
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

    this.recordManager.changePly(this.number);
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
    this.timerHandle = window.setTimeout(() => {
      this.onResult();
      this.next();
    }, this.setting.perMoveCriteria.maxSeconds * 1e3);
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
    if (!this.searchInfo || !this.lastSearchInfo) {
      return;
    }
    const sign = this.color === Color.BLACK ? 1 : -1;
    const negaScore =
      this.searchInfo.score !== undefined
        ? this.searchInfo.score * sign
        : undefined;
    const scoreDelta =
      this.searchInfo.score !== undefined &&
      this.lastSearchInfo.score !== undefined
        ? (this.searchInfo.score - this.lastSearchInfo.score) * sign
        : undefined;
    const isBestMove =
      this.actualMove && this.lastSearchInfo.pv
        ? this.actualMove.equals(this.lastSearchInfo.pv[0])
        : undefined;
    let comment = "";
    if (scoreDelta !== undefined && negaScore !== undefined && !isBestMove) {
      const text = getMoveAccuracyText(
        negaScore - scoreDelta,
        negaScore,
        this.appSetting
      );
      if (text) {
        comment += `【${text}】\n`;
      }
    }
    comment += buildSearchComment(
      SearchInfoSenderType.RESEARCHER,
      this.searchInfo
    );
    this.recordManager.appendComment(comment, this.setting.commentBehavior);
  }

  private async closeEngine(): Promise<void> {
    if (this.researcher) {
      this.researcher.close();
      this.researcher = undefined;
    }
  }

  updateSearchInfo(info: SearchInfo): void {
    this.recordManager.updateSearchInfo(SearchInfoSenderType.RESEARCHER, info);
    this.searchInfo = info;
  }
}

function getMoveAccuracyText(
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
