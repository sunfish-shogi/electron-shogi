import { ResearchSetting } from "@/common/settings/research";
import { USIPlayer } from "../players/usi";
import { AppSetting } from "@/common/settings/app";
import { SearchInfo } from "../players/player";
import { ImmutableRecord } from "@/common/shogi";
import { USIEngineSetting } from "@/common/settings/usi";
import { SearchInfoSenderType } from "./record";

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

type UpdateSearchInfoCallback = (
  type: SearchInfoSenderType,
  info: SearchInfo
) => void;

export class ResearchManager {
  private engines: USIPlayer[] = [];
  private onUpdateSearchInfo?: (
    type: SearchInfoSenderType,
    info: SearchInfo
  ) => void;

  on(event: "updateSearchInfo", callback: UpdateSearchInfoCallback): void;
  on(event: string, callback: unknown): void {
    switch (event) {
      case "updateSearchInfo":
        this.onUpdateSearchInfo = callback as UpdateSearchInfoCallback;
    }
  }

  async launch(setting: ResearchSetting, appSetting: AppSetting) {
    // Validation
    if (setting.usi === undefined) {
      throw new Error("ResearchManager#launch: USIエンジンの設定は必須です。");
    }
    for (const s of setting.secondaries || []) {
      if (s.usi === undefined) {
        throw new Error(
          "ResearchManager#launch: USIエンジンの設定は必須です。"
        );
      }
    }
    if (this.engines.length > 0) {
      throw new Error(
        "ResearchManager#launch: 前回のエンジンが終了していません。数秒待ってからもう一度試してください。"
      );
    }
    // エンジンを設定する。
    const engineSettings = [
      setting.usi,
      ...(setting.secondaries?.map((s) => s.usi) || []),
    ].filter((usi) => !!usi);
    this.engines = engineSettings.map((usi, index) => {
      const type = getSenderTypeByIndex(index);
      return new USIPlayer(
        usi as USIEngineSetting,
        appSetting.engineTimeoutSeconds,
        (info) => {
          if (this.onUpdateSearchInfo && type !== undefined) {
            this.onUpdateSearchInfo(type, info);
          }
        }
      );
    });
    // エンジンを起動する。
    try {
      await Promise.all(this.engines.map((engine) => engine.launch()));
    } catch (e) {
      this.close();
      throw e;
    }
  }

  updatePosition(record: ImmutableRecord) {
    this.engines.forEach((engine) => engine.startResearch(record));
  }

  async close() {
    await Promise.allSettled(this.engines.map((engine) => engine.close()));
    this.engines = [];
  }
}
