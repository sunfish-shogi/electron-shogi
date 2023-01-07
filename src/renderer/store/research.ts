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

export class ResearchManager {
  private engines: USIPlayer[];
  private onUpdateSearchInfo?: (
    type: SearchInfoSenderType,
    info: SearchInfo
  ) => void;

  constructor(setting: ResearchSetting, private appSetting: AppSetting) {
    const engineSettings = [
      setting.usi,
      ...(setting.secondaries?.map((s) => s.usi) || []),
    ].filter((usi) => !!usi);
    this.engines = engineSettings.map((usi, index) => {
      const type = getSenderTypeByIndex(index);
      return new USIPlayer(
        usi as USIEngineSetting,
        this.appSetting.engineTimeoutSeconds,
        (info) => {
          if (this.onUpdateSearchInfo && type !== undefined) {
            this.onUpdateSearchInfo(type, info);
          }
        }
      );
    });
  }

  on(
    event: "updateSearchInfo",
    callback: (type: SearchInfoSenderType, info: SearchInfo) => void
  ): void;
  on(event: string, callback: unknown): void {
    switch (event) {
      case "updateSearchInfo":
        this.onUpdateSearchInfo = callback as (
          type: SearchInfoSenderType,
          info: SearchInfo
        ) => void;
    }
  }

  launch() {
    return Promise.all(this.engines.map((engine) => engine.launch()));
  }

  updatePosition(record: ImmutableRecord) {
    this.engines.forEach((engine) => engine.startResearch(record));
  }

  close() {
    return Promise.allSettled(this.engines.map((engine) => engine.close()));
  }
}
