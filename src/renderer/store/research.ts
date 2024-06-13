import { ResearchSetting, defaultResearchSetting } from "@/common/settings/research";
import { USIPlayer } from "@/renderer/players/usi";
import { SearchInfo } from "@/renderer/players/player";
import { ImmutableRecord } from "electron-shogi-core";
import { USIEngineSetting } from "@/common/settings/usi";
import { SearchInfoSenderType } from "./record";
import { useAppSetting } from "./setting";
import { Lazy } from "@/renderer/helpers/lazy";

function getSenderTypeByIndex(index: number): SearchInfoSenderType | undefined {
  switch (index) {
    case 0:
      return SearchInfoSenderType.RESEARCHER;
    case 1:
      return SearchInfoSenderType.RESEARCHER_2;
    case 2:
      return SearchInfoSenderType.RESEARCHER_3;
    case 3:
      return SearchInfoSenderType.RESEARCHER_4;
    default:
      return undefined;
  }
}

type UpdateSearchInfoCallback = (type: SearchInfoSenderType, info: SearchInfo) => void;

export class ResearchManager {
  private setting = defaultResearchSetting();
  private engines: USIPlayer[] = [];
  private ready: boolean = false;
  private onUpdateSearchInfo: UpdateSearchInfoCallback = () => {
    /* noop */
  };
  private onError: ErrorCallback = () => {
    /* noop */
  };
  private pausedEngineMap: { [sessionID: number]: boolean } = {};
  private record?: ImmutableRecord;
  private lazyPositionUpdate = new Lazy();
  private maxSecondsTimer?: NodeJS.Timeout;
  private synced = true;

  on(event: "updateSearchInfo", handler: UpdateSearchInfoCallback): this;
  on(event: "error", handler: ErrorCallback): this;
  on(event: string, handler: unknown): this {
    switch (event) {
      case "updateSearchInfo":
        this.onUpdateSearchInfo = handler as UpdateSearchInfoCallback;
        break;
      case "error":
        this.onError = handler as ErrorCallback;
        break;
    }
    return this;
  }

  async launch(setting: ResearchSetting) {
    this.setting = setting;

    // Validation
    if (setting.usi === undefined) {
      throw new Error("ResearchManager#launch: USIエンジンの設定は必須です。");
    }
    for (const s of setting.secondaries || []) {
      if (s.usi === undefined) {
        throw new Error("ResearchManager#launch: USIエンジンの設定は必須です。");
      }
    }
    if (this.engines.length > 0) {
      throw new Error(
        "ResearchManager#launch: 前回のエンジンが終了していません。数秒待ってからもう一度試してください。",
      );
    }

    // エンジンを設定する。
    const appSetting = useAppSetting();
    const engineSettings = [setting.usi, ...(setting.secondaries?.map((s) => s.usi) || [])];
    this.engines = engineSettings.map((usi, index) => {
      const type = getSenderTypeByIndex(index);
      return new USIPlayer(usi as USIEngineSetting, appSetting.engineTimeoutSeconds, (info) => {
        if (type !== undefined && this.synced) {
          this.onUpdateSearchInfo(type, info);
        }
      });
    });

    // エンジンを起動する。
    try {
      await Promise.all(this.engines.map((engine) => engine.launch()));
      await Promise.all(this.engines.map((engine) => engine.readyNewGame()));
      this.ready = true;
    } catch (e) {
      this.close();
      throw e;
    }
  }

  updatePosition(record: ImmutableRecord) {
    // 反映を遅延させるので同期済みフラグを下ろす。
    this.synced = false;
    // 200ms 以内に複数回更新されたら最後の 1 回だけを処理する。
    this.lazyPositionUpdate.after(() => {
      // 初期化処理が終わっていない場合は何もしない。
      if (!this.ready) {
        return;
      }
      // 一時停止中のエンジンを除いて探索を開始する。
      this.engines.forEach((engine) => {
        if (this.pausedEngineMap[engine.sessionID]) {
          return;
        }
        engine.startResearch(record.position, record.usi).catch((e) => {
          this.onError(e);
        });
      });
      // 同期済みフラグを立てる。
      this.synced = true;
      // 一時停止からの再開のために棋譜を覚えておく。
      this.record = record;
      // タイマーを初期化する。
      clearTimeout(this.maxSecondsTimer);
      if (this.setting.enableMaxSeconds && this.setting.maxSeconds > 0) {
        this.maxSecondsTimer = setTimeout(() => {
          this.stopAll();
        }, this.setting.maxSeconds * 1e3);
      }
    }, 200);
  }

  isPaused(sessionID: number): boolean {
    return this.pausedEngineMap[sessionID] || false;
  }

  pause(sessionID: number) {
    const engine = this.engines.find((engine) => engine.sessionID === sessionID);
    if (!engine) {
      return;
    }
    this.pausedEngineMap[sessionID] = true;
    engine.stop().catch((e) => {
      this.onError(e);
    });
  }

  unpause(sessionID: number) {
    const engine = this.engines.find((engine) => engine.sessionID === sessionID);
    if (!engine) {
      return;
    }
    this.pausedEngineMap[sessionID] = false;
    if (this.record) {
      engine.startResearch(this.record.position, this.record.usi).catch((e) => {
        this.onError(e);
      });
    }
  }

  isSessionExists(sessionID: number): boolean {
    return this.engines.some((engine) => engine.sessionID === sessionID);
  }

  private stopAll() {
    clearTimeout(this.maxSecondsTimer);
    Promise.all(this.engines.map((engine) => engine.stop())).catch((e) => {
      this.onError(e);
    });
  }

  close() {
    this.lazyPositionUpdate.clear();
    clearTimeout(this.maxSecondsTimer);
    Promise.allSettled(this.engines.map((engine) => engine.close()))
      .then(() => {
        this.engines = [];
        this.pausedEngineMap = {};
        this.ready = false;
      })
      .catch((e) => {
        this.onError(e);
      });
  }
}
