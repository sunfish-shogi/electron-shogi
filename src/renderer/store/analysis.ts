import { SearchInfo } from "@/renderer/players/player";
import { USIPlayer } from "@/renderer/players/usi";
import { AnalysisSetting, defaultAnalysisSetting } from "@/common/settings/analysis";
import { AppSetting } from "@/common/settings/app";
import { USIEngineSetting } from "@/common/settings/usi";
import { Color, Move, reverseColor } from "electron-shogi-core";
import { RecordManager, SearchInfoSenderType } from "./record";
import { scoreToPercentage } from "./score";
import { useAppSetting } from "./setting";
import { t } from "@/common/i18n";

type FinishCallback = () => void;
type ErrorCallback = (e: unknown) => void;

export class AnalysisManager {
  private researcher?: USIPlayer;
  private setting = defaultAnalysisSetting();
  private ply?: number;
  private actualMove?: Move;
  private lastSearchInfo?: SearchInfo;
  private searchInfo?: SearchInfo;
  private timerHandle?: number;
  private onFinish: FinishCallback = () => {
    /* noop */
  };
  private onError: ErrorCallback = () => {
    /* noop */
  };

  constructor(private recordManager: RecordManager) {}

  on(event: "finish", handler: FinishCallback): this;
  on(event: "error", handler: ErrorCallback): this;
  on(event: string, handler: unknown): this {
    switch (event) {
      case "finish":
        this.onFinish = handler as FinishCallback;
        break;
      case "error":
        this.onError = handler as ErrorCallback;
        break;
    }
    return this;
  }

  async start(setting: AnalysisSetting): Promise<void> {
    if (!setting.usi) {
      throw new Error("エンジンが設定されていません。");
    }
    await this.setupEngine(setting.usi as USIEngineSetting);
    this.setting = setting;
    this.ply = undefined;
    this.actualMove = undefined;
    this.lastSearchInfo = undefined;
    this.searchInfo = undefined;
    setTimeout(() => this.next());
  }

  close(): void {
    this.clearTimer();
    this.closeEngine().catch((e) => {
      this.onError(e);
    });
  }

  private async setupEngine(setting: USIEngineSetting): Promise<void> {
    if (this.researcher) {
      throw new Error(
        "AnalysisManager#setupEngine: 前回のエンジンが終了していません。数秒待ってからもう一度試してください。",
      );
    }
    const appSetting = useAppSetting();
    const researcher = new USIPlayer(
      setting,
      appSetting.engineTimeoutSeconds,
      this.updateSearchInfo.bind(this),
    );
    await researcher.launch();
    await researcher.readyNewGame();
    this.researcher = researcher;
  }

  private async closeEngine(): Promise<void> {
    if (this.researcher) {
      await this.researcher.close();
      this.researcher = undefined;
    }
  }

  private next(): void {
    // タイマーを解除する。
    this.clearTimer();
    // エンジンが初期化されていない場合は終了する。
    if (!this.researcher) {
      this.onError(new Error("エンジンが初期化されていません。"));
      this.finish();
      return;
    }
    // 探索情報をシフトする。
    this.lastSearchInfo = this.searchInfo;
    this.searchInfo = undefined;
    // 次の手数を決定する。
    if (this.ply !== undefined) {
      // 2 回目以降は 1 手ずつ進める。
      this.ply = this.ply + 1;
    } else if (this.setting.startCriteria.enableNumber) {
      // 開始手数が指定されている場合はそれに従う。
      this.ply = this.setting.startCriteria.number - 1;
    } else {
      // 開始手数が指定されていない場合は棋譜の先頭から開始する。
      this.ply = 0;
    }
    // 終了条件を満たしている場合はここで打ち切る。
    if (this.setting.endCriteria.enableNumber && this.ply >= this.setting.endCriteria.number) {
      this.finish();
      return;
    }
    // 対象の局面へ移動する。
    this.recordManager.changePly(this.ply);
    // 対象の局面が存在しない場合は終了する。
    const record = this.recordManager.record;
    if (record.current.ply !== this.ply) {
      this.finish();
      return;
    }
    // 最終局面の場合は終了する。
    if (!record.current.next && !(record.current.move instanceof Move)) {
      this.finish();
      return;
    }
    // 最後に指した手を取得する。
    this.actualMove = record.current.move instanceof Move ? record.current.move : undefined;
    // タイマーをセットする。
    this.setTimer();
    // 探索を開始する。
    this.researcher.startResearch(record).catch((e) => {
      this.onError(e);
    });
  }

  private finish(): void {
    this.onFinish();
    this.close();
  }

  private setTimer(): void {
    this.timerHandle = window.setTimeout(() => {
      this.onResult();
      this.next();
    }, this.setting.perMoveCriteria.maxSeconds * 1e3);
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
    const record = this.recordManager.record;
    const color = reverseColor(record.position.color);
    const sign = color === Color.BLACK ? 1 : -1;
    // 手番側から見た評価値
    const negaScore =
      this.searchInfo.score !== undefined ? this.searchInfo.score * sign : undefined;
    // 1 手前の局面からの評価値の変動
    const scoreDelta =
      this.searchInfo.score !== undefined && this.lastSearchInfo.score !== undefined
        ? (this.searchInfo.score - this.lastSearchInfo.score) * sign
        : undefined;
    // エンジンが示す最善手と一致しているかどうか
    const isBestMove =
      this.actualMove && this.lastSearchInfo.pv
        ? this.actualMove.equals(this.lastSearchInfo.pv[0])
        : undefined;
    // コメントの先頭に付与するヘッダーを作成する。
    const appSetting = useAppSetting();
    let header = "";
    if (scoreDelta !== undefined && negaScore !== undefined && !isBestMove) {
      const text = getMoveAccuracyText(negaScore - scoreDelta, negaScore, appSetting);
      if (text) {
        header = `【${text}】`;
      }
    }
    // コメントを書き込む。
    this.recordManager.appendSearchComment(
      SearchInfoSenderType.RESEARCHER,
      this.searchInfo,
      this.setting.commentBehavior,
      {
        header,
        engineName: this.setting.usi?.name,
      },
    );
  }

  updateSearchInfo(info: SearchInfo): void {
    this.recordManager.updateSearchInfo(SearchInfoSenderType.RESEARCHER, info);
    this.searchInfo = info;
  }
}

function getMoveAccuracyText(before: number, after: number, appSetting: AppSetting): string | null {
  const loss =
    scoreToPercentage(before, appSetting.coefficientInSigmoid) -
    scoreToPercentage(after, appSetting.coefficientInSigmoid);
  if (loss >= appSetting.badMoveLevelThreshold4) {
    return t.blunder;
  } else if (loss >= appSetting.badMoveLevelThreshold3) {
    return t.mistake;
  } else if (loss >= appSetting.badMoveLevelThreshold2) {
    return t.dubious;
  } else if (loss >= appSetting.badMoveLevelThreshold1) {
    return t.inaccuracy;
  }
  return null;
}
